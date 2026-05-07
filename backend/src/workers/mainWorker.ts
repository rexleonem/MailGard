import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { decrypt } from '../lib/encryption';
import { getRandomMessage } from '../lib/messages';
import { addWarmupJob } from '../queues/warmupQueue';
import { calculateAdaptiveState, getNaturalDelay } from '../lib/trustEngine';
import { logger } from '../lib/logger';
import os from 'os';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

const WORKER_ID = `${os.hostname()}-${process.pid}`;

async function validateSafety(accountId: string) {
    const adaptive = await calculateAdaptiveState(accountId);
    if (!adaptive) return { safe: false, reason: 'TRUST_STATE_MISSING' };

    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { diagnostics: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!account) return { safe: false, reason: 'ACCOUNT_NOT_FOUND' };
    if (account.status !== 'ACTIVE') return { safe: false, reason: `STATUS_${account.status}` };

    if (adaptive.cooldownUntil && new Date() < new Date(adaptive.cooldownUntil)) {
        return { safe: false, reason: 'COOLDOWN_ACTIVE' };
    }

    const diag = account.diagnostics[0];
    const aiData = (diag?.rawData as any) || {};
    if (aiData.risk === 'HIGH_RISK') return { safe: false, reason: 'AI_HIGH_RISK_BLOCK' };

    return { safe: true, account, adaptive };
}

export const mainWorker = new Worker('mailgard-queue', async (job: Job) => {
    const { type, accountId, logId, isTest } = job.data;

    await logger.log({
        type: 'QUEUE',
        severity: 'INFO',
        message: `Processing ${type} for ${accountId}`,
        accountId
    });

    // Update log status to PROCESSING if exists
    if (logId) {
        await prisma.emailLog.update({
            where: { id: logId },
            data: { status: 'PROCESSING', workerId: WORKER_ID, jobId: job.id }
        });
    }

    const safety = await validateSafety(accountId);
    
    // Safety check block (only for WARM_SEND, TEST_SEND is pre-validated in controller)
    if (!safety.safe && !isTest) {
        if (logId) {
            await prisma.emailLog.update({
                where: { id: logId },
                data: { status: 'BLOCKED', error: safety.reason }
            });
        }
        await logger.log({
            type: 'ADAPTIVE',
            severity: 'WARNING',
            message: `Send blocked: ${safety.reason}`,
            accountId,
            payload: { reason: safety.reason }
        });
        return;
    }

    const { account, adaptive } = safety;

    try {
        await handleEmailExecution(job.data, account!, adaptive!, job.id!);
        
        await logger.log({
            type: 'SMTP',
            severity: 'INFO',
            message: `Successfully executed ${type} for ${account?.email}`,
            accountId
        });
    } catch (error: any) {
        const errorMsg = error.message || 'Unknown SMTP error';
        if (logId) {
            await prisma.emailLog.update({
                where: { id: logId },
                data: { status: 'FAILED', error: errorMsg }
            });
        }
        await logger.log({
            type: 'SMTP',
            severity: 'ERROR',
            message: `SMTP failed for ${account?.email}: ${errorMsg}`,
            accountId,
            payload: { error: errorMsg, code: error.code }
        });
        throw error;
    }
}, { 
    connection,
    lockDuration: 30000,
    stalledInterval: 30000
});

async function handleEmailExecution(jobData: any, account: any, adaptive: any, jobId: string) {
    const { isTest, recipient: manualRecipient, subject: manualSubject, body: manualBody, logId } = jobData;

    // Determine content
    let recipient = manualRecipient;
    let subject = manualSubject;
    let body = manualBody;

    if (!isTest) {
        const randomMsg = getRandomMessage();
        recipient = 'warmup@ozgardenz.site';
        subject = randomMsg.subject;
        body = randomMsg.body;

        // Warmup-specific Idempotency
        const lastHourSend = await prisma.emailLog.findFirst({
            where: {
                accountId: account.id,
                recipient,
                createdAt: { gte: new Date(Date.now() - 5 * 60000) }
            }
        });
        if (lastHourSend) return;
    }

    const decryptedPassword = decrypt(JSON.parse(account.password));
    const transporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpPort === 465,
        auth: {
            user: account.email,
            pass: decryptedPassword
        }
    } as any);

    const info = await transporter.sendMail({
        from: account.email,
        to: recipient,
        subject,
        text: body,
        headers: { 'X-Mailer': 'MailGard-Adaptive-Engine' }
    });

    // Finalize logs and state
    const diag = account.diagnostics[0];
    const aiDecision = diag?.rawData;

    if (logId) {
        await prisma.emailLog.update({
            where: { id: logId },
            data: {
                status: 'SENT',
                smtpResponse: info.response,
                aiDecision: aiDecision as any,
                metadata: { messageId: info.messageId }
            }
        });
    } else if (!isTest) {
        // Create auto-warmup log
        await prisma.emailLog.create({
            data: {
                accountId: account.id,
                recipient,
                subject,
                status: 'SENT',
                smtpResponse: info.response,
                aiDecision: aiDecision as any,
                workerId: WORKER_ID,
                jobId: jobId,
                domain: account.domain
            }
        });
    }

    if (!isTest) {
        await prisma.warmupState.update({
            where: { accountId: account.id },
            data: {
                currentCount: { increment: 1 },
                lastSentAt: new Date()
            }
        });

        // Adaptive Scheduling
        if (adaptive.currentCount + 1 < adaptive.adaptiveLimit) {
            let delay = getNaturalDelay();
            if (adaptive.trustLevel === 'DEGRADED' || adaptive.trustLevel === 'NEW') delay *= 2; 
            await addWarmupJob({ accountId: account.id, email: account.email }, delay);
        }
    }
}

process.on('SIGTERM', async () => {
    await mainWorker.close();
});
