import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { encrypt } from '../lib/encryption';
import { checkSPF, checkDKIM, checkDMARC } from '../lib/dns';
import { analyzeRisk } from '../lib/gemini';
import { addWarmupJob } from '../queues/warmupQueue';

export const createAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { email, smtpHost, smtpPort, password } = req.body;
        const domain = email.split('@')[1];

        // Encrypt password
        const encryptedPassword = JSON.stringify(encrypt(password));

        const account = await prisma.account.create({
            data: {
                userId: req.userId!,
                email,
                smtpHost,
                smtpPort: parseInt(smtpPort),
                password: encryptedPassword,
                domain,
                warmupState: {
                    create: {} // Default values
                }
            }
        });

        // Run initial diagnostics
        const spf = await checkSPF(domain);
        const dkim = await checkDKIM(domain);
        const dmarc = await checkDMARC(domain);

        const aiResult = await analyzeRisk({ domain, spf, dkim, dmarc });

        await prisma.diagnostic.create({
            data: {
                accountId: account.id,
                spf,
                dkim,
                dmarc,
                ipScore: aiResult?.score || 50,
                rawData: aiResult
            }
        });

        // If high risk, block
        if (aiResult?.riskLevel === 'CRITICAL' || aiResult?.riskLevel === 'HIGH') {
            await prisma.account.update({
                where: { id: account.id },
                data: { status: 'RISK_BLOCKED' }
            });
        }

        res.status(201).json(account);
    } catch (error) {
        console.error('Account creation failed:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
};

export const getAccounts = async (req: AuthRequest, res: Response) => {
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.userId },
            include: { 
                diagnostics: { orderBy: { createdAt: 'desc' }, take: 1 },
                warmupState: true
            }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};

export const getAccountDetail = async (req: AuthRequest, res: Response) => {
    try {
        const account = await prisma.account.findFirst({
            where: { id: req.params.id, userId: req.userId },
            include: {
                diagnostics: { orderBy: { createdAt: 'desc' } },
                warmupState: true,
                emailLogs: { orderBy: { createdAt: 'desc' }, take: 50 }
            }
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account detail' });
    }
};

export const triggerWarmup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.findFirst({
            where: { id, userId: req.userId }
        });
        
        if (!account) return res.status(404).json({ error: 'Account not found' });
        if (account.status !== 'ACTIVE') return res.status(400).json({ error: 'Account is not active' });

        // Add job with random delay within an hour for "human-like" behavior
        const delay = Math.floor(Math.random() * 3600000);
        await addWarmupJob(id as string, delay);

        res.json({ message: 'Warm-up job scheduled', scheduledIn: `${Math.round(delay/60000)} minutes` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger warmup' });
    }
};
