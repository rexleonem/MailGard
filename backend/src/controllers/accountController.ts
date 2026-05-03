import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { encrypt } from '../lib/encryption';
import { runDiagnostics } from '../modules/diagnostics';
import { evaluateRisk } from '../modules/gemini';

export const addAccount = async (req: Request, res: Response) => {
    const { email, smtpHost, smtpPort, password, domain } = req.body;

    try {
        const encryptedPass = encrypt(password);
        
        const account = await prisma.account.create({
            data: {
                email,
                smtpHost,
                smtpPort,
                password: JSON.stringify(encryptedPass),
                domain,
                warmupState: {
                    create: {
                        dailyLimit: 5,
                        dayNumber: 1
                    }
                }
            }
        });

        // Trigger initial diagnostics
        const diagResults = await runDiagnostics(domain);
        await prisma.diagnostic.create({
            data: {
                accountId: account.id,
                spf: diagResults.spf,
                dkim: diagResults.dkim,
                dmarc: diagResults.dmarc,
                ipScore: diagResults.ipScore,
                rawData: diagResults.rawData
            }
        });

        // Run AI evaluation
        const riskEval = await evaluateRisk({
            dnsResults: diagResults,
            ipScore: diagResults.ipScore,
            bounceRate: 0,
            sendingVolume: 0
        });

        // Update account based on AI
        if (riskEval.risk === 'HIGH_RISK') {
            await prisma.account.update({
                where: { id: account.id },
                data: { status: 'RISK_BLOCKED' }
            });
        }

        res.status(201).json({ account, diagResults, riskEval });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAccounts = async (req: Request, res: Response) => {
    const accounts = await prisma.account.findMany({
        include: {
            warmupState: true,
            diagnostics: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });
    res.json(accounts);
};
