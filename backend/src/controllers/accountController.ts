import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { encrypt } from '../lib/encryption';
import { checkSPF, checkDKIM, checkDMARC } from '../lib/dns';
import { analyzeRisk } from '../lib/gemini';
import { addWarmupJob, mailgardQueue } from '../queues/warmupQueue';
import { logger } from '../lib/logger';
import { calculateAdaptiveState } from '../lib/trustEngine';

export const createAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { email, smtpHost, smtpPort, password } = req.body;
        const domain = email.split('@')[1];
        const port = parseInt(smtpPort);

        // STEP 1: SMTP Verification Gate (MANDATORY)
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: port,
            secure: port === 465,
            auth: {
                user: email,
                pass: password
            },
            connectTimeout: 10000 
        } as any);

        try {
            await transporter.verify();
        } catch (smtpError: any) {
            console.error('SMTP Verification Failed:', smtpError);
            
            let errorType = 'UNKNOWN_ERROR';
            let message = 'Failed to verify SMTP credentials';

            if (smtpError.code === 'EAUTH') {
                errorType = 'AUTH_FAILED';
                message = 'Invalid SMTP credentials. Please check your email and password.';
            } else if (smtpError.code === 'ETIMEDOUT' || smtpError.code === 'ECONNREFUSED') {
                errorType = 'CONNECTION_TIMEOUT';
                message = 'Could not connect to the SMTP server. Check host and port.';
            } else if (smtpError.message?.includes('SSL') || smtpError.message?.includes('TLS')) {
                errorType = 'SSL_ERROR';
                message = 'SSL/TLS handshake failed. Verify port and security settings.';
            } else if (smtpError.code === 'ENOTFOUND') {
                errorType = 'UNKNOWN_HOST';
                message = 'SMTP host not found. Please verify the server address.';
            }

            return res.status(400).json({ 
                error: message, 
                code: errorType,
                details: smtpError.message 
            });
        }

        // STEP 2: Encryption and Storage (ONLY ON SUCCESS)
        const encryptedPassword = JSON.stringify(encrypt(password));

        const account = await prisma.account.create({
            data: {
                userId: req.userId!,
                email,
                smtpHost,
                smtpPort: port,
                password: encryptedPassword,
                domain,
                status: 'PAUSED', // Start paused until diagnostics pass
                warmupState: {
                    create: {} 
                }
            }
        });

        // STEP 3: RUN DIAGNOSTICS ENGINE
        await runDiagnostics(account.id, domain, smtpHost);

        const updatedAccount = await prisma.account.findUnique({
            where: { id: account.id },
            include: { diagnostics: { take: 1, orderBy: { createdAt: 'desc' } } }
        });

        res.status(201).json(updatedAccount);
    } catch (error) {
        console.error('Account creation failed:', error);
        res.status(500).json({ error: 'System error during account creation' });
    }
};

async function runDiagnostics(accountId: string, domain: string, smtpHost: string) {
    try {
        // 1. DNS Authentication Checks
        const spf = await checkSPF(domain);
        const dkim = await checkDKIM(domain);
        const dmarc = await checkDMARC(domain);

        // 2. IP/SMTP Reputation Check (Simulated for now, can be extended with AbuseIPDB)
        const ipScore = Math.floor(Math.random() * 40) + 60; // 60-100 random score for demo

        // 3. AI Analysis (Gemini)
        const aiResult = await analyzeRisk({ 
            domain, 
            spf, 
            dkim, 
            dmarc, 
            ipScore,
            systemState: 'ACTIVE' // Contextual
        });

        await logger.log({
            type: 'AI',
            severity: aiResult.risk === 'HIGH_RISK' ? 'WARNING' : 'INFO',
            message: `AI Risk Assessment: ${aiResult.risk} (Score: ${aiResult.score})`,
            accountId,
            payload: aiResult
        });

        // 4. SCORING ENGINE (0-100)
        // System baseline score combined with AI score
        let healthScore = aiResult.score;

        // 5. RISK CLASSIFICATION
        const riskLevel = aiResult.risk;

        // 6. PERSIST DIAGNOSTIC DATA
        await prisma.diagnostic.create({
            data: {
                accountId,
                spf,
                dkim,
                dmarc,
                ipScore: healthScore,
                rawData: {
                    ...aiResult,
                    ipReputation: ipScore,
                    scoringBreakdown: {
                        dns: spf && dkim && dmarc ? 'PASS' : 'FAILED',
                        ip: ipScore >= 80 ? 'CLEAN' : 'CAUTION',
                        aiRefinedRisk: aiResult.risk,
                        systemOverride: aiResult.isOverridden
                    }
                }
            }
        });

        // 7. STRICT ENFORCEMENT
        let finalStatus: 'ACTIVE' | 'PAUSED' | 'RISK_BLOCKED' = 'ACTIVE';
        if (riskLevel === 'HIGH_RISK' || aiResult.action === 'PAUSE') {
            finalStatus = 'RISK_BLOCKED';
        } else if (riskLevel === 'CAUTION' || aiResult.action === 'SLOW_DOWN') {
            finalStatus = 'PAUSED'; 
        }

        await prisma.account.update({
            where: { id: accountId },
            data: { status: finalStatus }
        });

        await logger.log({
            type: 'DIAGNOSTICS',
            severity: healthScore < 50 ? 'WARNING' : 'INFO',
            message: `Diagnostics completed for ${domain}. Score: ${healthScore}`,
            accountId,
            payload: { spf, dkim, dmarc, ipScore, healthScore }
        });

        return { healthScore, riskLevel };
    } catch (err) {
        console.error('Diagnostics failed:', err);
        throw err;
    }
}

export const getSystemEvents = async (req: AuthRequest, res: Response) => {
    try {
        const events = await prisma.systemEvent.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(events);
    } catch (error) {
        console.error('getSystemEvents failed:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

export const getAlerts = async (req: AuthRequest, res: Response) => {
    try {
        const alerts = await prisma.alert.findMany({
            where: { resolved: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(alerts);
    } catch (error) {
        console.error('getAlerts failed:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};

export const getQueueStats = async (req: Request, res: Response) => {
    try {
        const [waiting, active, completed, failed] = await Promise.all([
            mailgardQueue.getWaitingCount(),
            mailgardQueue.getActiveCount(),
            mailgardQueue.getCompletedCount(),
            mailgardQueue.getFailedCount()
        ]);

        res.json({
            waiting,
            active,
            completed,
            failed,
            workerStatus: 'ONLINE'
        });
    } catch (error) {
        console.error('getQueueStats failed:', error);
        res.status(500).json({ error: 'Failed to fetch queue stats' });
    }
};

export const refreshDiagnostics = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.findFirst({
            where: { id: id as string, userId: req.userId }
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        await runDiagnostics(account.id, account.domain, account.smtpHost);
        
        const updated = await prisma.account.findUnique({
            where: { id: account.id },
            include: { diagnostics: { take: 1, orderBy: { createdAt: 'desc' } } }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to refresh diagnostics' });
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
        console.error('getAccounts failed:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};

export const getAccountDetail = async (req: AuthRequest, res: Response) => {
    try {
        const account = await prisma.account.findFirst({
            where: { id: req.params.id as string, userId: req.userId },
            include: {
                diagnostics: { orderBy: { createdAt: 'desc' } },
                warmupState: true,
                emailLogs: { orderBy: { createdAt: 'desc' }, take: 50 }
            }
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });
        
        // Calculate adaptive state for the UI
        const adaptive = await calculateAdaptiveState(account.id);
        
        res.json({ ...account, adaptive });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account detail' });
    }
};

export const triggerWarmup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.findFirst({
            where: { id: id as string, userId: req.userId }
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

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.account.delete({
            where: { id: id as string, userId: req.userId }
        });
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account failed:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, smtpHost, smtpPort } = req.body;
        
        const account = await prisma.account.update({
            where: { id: id as string, userId: req.userId },
            data: {
                status,
                smtpHost,
                smtpPort: smtpPort ? parseInt(smtpPort) : undefined
            }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account' });
    }
};
