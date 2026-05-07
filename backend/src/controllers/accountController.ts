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
import { z } from 'zod';

const CreateAccountSchema = z.object({
    email: z.string().email(),
    smtpHost: z.string().min(1),
    smtpPort: z.any(),
    password: z.string().min(1)
});

export const createAccount = async (req: AuthRequest, res: Response) => {
    try {
        const validated = CreateAccountSchema.parse(req.body);
        const { email, smtpHost, smtpPort, password } = validated;
        const domain = email.split('@')[1];
        const port = parseInt(smtpPort);

        await logger.log({
            type: 'SECURITY',
            severity: 'INFO',
            message: `Account creation attempt for ${email}`,
            userId: req.userId
        });

        // STEP 1: SMTP Verification Gate (MANDATORY)
        console.log(`[DEBUG] Verifying SMTP for ${email} on ${smtpHost}:${port}`);
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: port,
            secure: port === 465,
            auth: {
                user: email,
                pass: password
            },
            tls: {
                rejectUnauthorized: false, // Required for many shared hosting providers
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 20000,
            greetingTimeout: 20000,
            socketTimeout: 30000,
            debug: true // Enable for internal tracing
        } as any);

        try {
            await transporter.verify();
        } catch (smtpErr: any) {
            console.error(`[ERROR] SMTP Verification failed for ${email}:`, smtpErr);
            return res.status(400).json({ 
                error: 'SMTP Authentication Failed', 
                reason: smtpErr.message,
                code: smtpErr.code,
                command: smtpErr.command
            });
        }

        // STEP 2: Run Initial Diagnostics
        const spf = await checkSPF(domain);
        const dkim = await checkDKIM(domain);
        const dmarc = await checkDMARC(domain);

        // STEP 3: Initial AI Risk Assessment
        const aiDecision = await analyzeRisk({
            domain,
            spf,
            dkim,
            dmarc,
            ipScore: 100, // Starting default
            systemState: 'NEW'
        });

        // STEP 4: Encrypt and Store
        const encrypted = encrypt(password);
        
        const account = await prisma.account.create({
            data: {
                userId: req.userId!,
                email,
                smtpHost,
                smtpPort: port,
                password: JSON.stringify(encrypted),
                domain,
                status: aiDecision.risk === 'HIGH_RISK' ? 'RISK_BLOCKED' : 'ACTIVE',
                diagnostics: {
                    create: {
                        spf,
                        dkim,
                        dmarc,
                        ipScore: aiDecision.score,
                        rawData: aiDecision as any
                    }
                },
                warmupState: {
                    create: {
                        dayNumber: 1,
                        currentCount: 0,
                        trustLevel: 'NEW',
                        trustTrend: 0.0
                    } as any
                }
            }
        });

        await logger.log({
            type: 'SECURITY',
            severity: 'INFO',
            message: `Account created successfully: ${email}`,
            accountId: account.id,
            userId: req.userId
        });

        res.json(account);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.issues });
        }
        console.error('Account creation failed:', err);
        res.status(500).json({ error: 'Failed to create account' });
    }
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const account = await prisma.account.update({
            where: { id: String(id), userId: req.userId } as any,
            data: { status }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.account.delete({
            where: { id: String(id), userId: req.userId } as any
        });
        res.json({ message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

async function runDiagnostics(accountId: string, domain: string, smtpHost: string) {
    try {
        const spf = await checkSPF(domain);
        const dkim = await checkDKIM(domain);
        const dmarc = await checkDMARC(domain);

        const aiDecision = await analyzeRisk({
            domain,
            spf,
            dkim,
            dmarc,
            ipScore: 85, 
            systemState: 'ACTIVE'
        });

        await prisma.diagnostic.create({
            data: {
                accountId,
                spf,
                dkim,
                dmarc,
                ipScore: aiDecision.score,
                rawData: aiDecision as any
            }
        });

        if (aiDecision.risk === 'HIGH_RISK') {
            await prisma.account.update({
                where: { id: accountId },
                data: { status: 'RISK_BLOCKED' }
            });
            
            await logger.log({
                type: 'DIAGNOSTICS',
                severity: 'CRITICAL',
                message: `Domain ${domain} blocked due to high AI risk: ${aiDecision.reason}`,
                accountId
            });
        }
    } catch (err) {
        console.error('Diagnostics failed:', err);
        throw err;
    }
}

export const getSystemEvents = async (req: AuthRequest, res: Response) => {
    try {
        console.log(`[DEBUG] getSystemEvents: Fetching for userId: ${req.userId}`);
        const events = await (prisma as any).systemEvent.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        console.log(`[DEBUG] getSystemEvents: Found ${events.length} events`);
        res.json(events);
    } catch (error: any) {
        console.error('[ERROR] getSystemEvents failed:', error);
        res.status(500).json({ error: 'Failed to fetch events', details: error.message });
    }
};

export const getAlerts = async (req: AuthRequest, res: Response) => {
    try {
        console.log(`[DEBUG] getAlerts: Fetching...`);
        const alerts = await (prisma as any).alert.findMany({
            where: { resolved: false },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`[DEBUG] getAlerts: Found ${alerts.length} alerts`);
        res.json(alerts);
    } catch (error: any) {
        console.error('[ERROR] getAlerts failed:', error);
        res.status(500).json({ error: 'Failed to fetch alerts', details: error.message });
    }
};

export const getQueueStats = async (req: Request, res: Response) => {
    try {
        console.log(`[DEBUG] getQueueStats: Fetching counts...`);
        const [waiting, active, completed, failed] = await Promise.all([
            mailgardQueue.getWaitingCount(),
            mailgardQueue.getActiveCount(),
            mailgardQueue.getCompletedCount(),
            mailgardQueue.getFailedCount()
        ]);

        console.log(`[DEBUG] getQueueStats: W:${waiting} A:${active} C:${completed} F:${failed}`);
        res.json({
            waiting,
            active,
            completed,
            failed,
            workerStatus: 'ONLINE'
        });
    } catch (error: any) {
        console.error('[ERROR] getQueueStats failed:', error);
        res.status(500).json({ error: 'Failed to fetch queue stats', details: error.message });
    }
};

export const refreshDiagnostics = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.findFirst({
            where: { id: String(id), userId: req.userId } as any
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
        console.log(`[DEBUG] getAccounts: Fetching for userId: ${req.userId}`);
        const accounts = await prisma.account.findMany({
            where: { userId: req.userId } as any,
            include: { 
                diagnostics: { orderBy: { createdAt: 'desc' }, take: 1 },
                warmupState: true
            }
        });
        console.log(`[DEBUG] getAccounts: Found ${accounts.length} accounts`);
        res.json(accounts);
    } catch (error: any) {
        console.error('[ERROR] getAccounts failed:', error);
        await logger.log({
            type: 'SECURITY',
            severity: 'ERROR',
            message: `getAccounts failed: ${error.message}`,
            userId: req.userId
        });
        res.status(500).json({ error: 'Failed to fetch accounts', details: error.message });
    }
};

export const getAccountDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`[DEBUG] getAccountDetail: Searching for ID: ${id}, User: ${req.userId}`);
        
        const account = await prisma.account.findFirst({
            where: { 
                id: String(id), 
                userId: req.userId 
            } as any,
            include: {
                diagnostics: { orderBy: { createdAt: 'desc' } },
                warmupState: true,
                emailLogs: { orderBy: { createdAt: 'desc' }, take: 50 }
            }
        });

        if (!account) {
            console.log(`[DEBUG] getAccountDetail: NOT FOUND for ID: ${id}`);
            return res.status(404).json({ error: 'Account not found' });
        }
        
        console.log(`[DEBUG] getAccountDetail: Found account ${account.email}. Calculating adaptive state...`);
        const adaptive = await calculateAdaptiveState(account.id);
        
        res.json({ ...account, adaptive });
    } catch (error: any) {
        console.error('[ERROR] getAccountDetail failed:', error);
        res.status(500).json({ error: 'Failed to fetch account detail', details: error.message });
    }
};

export const triggerWarmup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.findUnique({
            where: { id: String(id) } as any,
            include: { diagnostics: { take: 1, orderBy: { createdAt: 'desc' } } }
        });

        if (!account) return res.status(404).json({ error: 'Account not found' });
        
        const diag = (account as any).diagnostics[0];
        if (!diag || !diag.spf || !diag.dkim) {
            return res.status(403).json({ error: 'Domain authentication failed. Cannot warm up.' });
        }

        const delay = Math.floor(Math.random() * 60000); 
        await addWarmupJob({
            accountId: account.id,
            email: account.email,
            recipient: 'test@mailgard.ai',
            subject: 'Warming up your deliverability',
            body: 'This is a MailGard automated warm-up email.'
        }, delay);

        res.json({ message: 'Warm-up job scheduled', scheduledIn: `${Math.round(delay/60000)} minutes` });
    } catch (error) {
        console.error('Trigger warmup failed:', error);
        res.status(500).json({ error: 'Failed to trigger warmup' });
    }
};

export const sendTestEmail = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { recipient, subject, body } = req.body;
        console.log(`[DEBUG] sendTestEmail: From ${id} to ${recipient}`);

        const account = await prisma.account.findFirst({
            where: { id: String(id), userId: req.userId } as any,
            include: { diagnostics: { take: 1, orderBy: { createdAt: 'desc' } } }
        });

        if (!account) {
            console.log(`[DEBUG] sendTestEmail: Account not found for ${id}`);
            return res.status(404).json({ error: 'Account not found' });
        }
        
        if (account.status === 'RISK_BLOCKED') {
            console.log(`[DEBUG] sendTestEmail: Account BLOCKED`);
            return res.status(403).json({ error: 'Account is blocked due to high risk' });
        }

        const diag = (account as any).diagnostics[0];
        if (!diag || !diag.spf || !diag.dkim) {
            console.log(`[DEBUG] sendTestEmail: Auth failure (SPF/DKIM)`);
            return res.status(403).json({ error: 'Domain authentication failed. Cannot send.' });
        }

        console.log(`[DEBUG] sendTestEmail: Creating log and queueing job...`);
        const emailLog = await prisma.emailLog.create({
            data: {
                accountId: account.id,
                recipient,
                subject,
                status: 'QUEUED' as any,
                domain: account.domain
            } as any
        });

        await addWarmupJob({
            accountId: account.id,
            email: account.email,
            recipient,
            subject,
            body,
            isTest: true,
            logId: emailLog.id
        });

        console.log(`[DEBUG] sendTestEmail: Success. LogId: ${emailLog.id}`);
        res.json({ message: 'Test email queued', logId: emailLog.id });
    } catch (error: any) {
        console.error('[ERROR] sendTestEmail failed:', error);
        res.status(500).json({ error: 'Failed to queue test email', details: error.message });
    }
};

export const getEmailLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 20, search, status, domain } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {
            account: { userId: req.userId }
        };

        if (search) {
            (where as any).OR = [
                { recipient: { contains: String(search), mode: 'insensitive' } },
                { subject: { contains: String(search), mode: 'insensitive' } }
            ] as any;
        }

        if (status) (where as any).status = status as any;
        if (domain) (where as any).domain = domain as any;

        const [logs, total] = await Promise.all([
            prisma.emailLog.findMany({
                where: where as any,
                include: { account: { select: { email: true, domain: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.emailLog.count({ where: where as any })
        ]);

        res.json({
            logs,
            pagination: {
                total,
                pages: Math.ceil(total / Number(limit)),
                currentPage: Number(page)
            }
        });
    } catch (error) {
        console.error('getEmailLogs failed:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

export const getLogDetail = async (req: AuthRequest, res: Response) => {
    try {
        const log = await prisma.emailLog.findFirst({
            where: { id: String(req.params.id), account: { userId: req.userId } } as any,
            include: { account: { include: { diagnostics: { take: 1, orderBy: { createdAt: 'desc' } } } } }
        });
        if (!log) return res.status(404).json({ error: 'Log not found' });
        
        // Security: Redact sensitive info
        if ((log as any).account) {
            (log as any).account.password = undefined;
        }
        
        res.json(log);
    } catch (error) {
        console.error('getLogDetail failed:', error);
        res.status(500).json({ error: 'Failed to fetch log detail' });
    }
};
