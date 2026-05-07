import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { decrypt } from '../lib/encryption';
import { getRandomMessage } from '../lib/messages';
import { addWarmupJob } from '../queues/warmupQueue';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

/**
 * PRE-EXECUTION SAFETY GATE
 * Verifies domain health, AI risk, and limits before any action.
 */
async function validateSafety(accountId: string) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { 
            warmupState: true,
            diagnostics: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
    });

    if (!account) return { safe: false, reason: 'ACCOUNT_NOT_FOUND' };
    if (account.status !== 'ACTIVE') return { safe: false, reason: `ACCOUNT_STATUS_${account.status}` };

    const diag = account.diagnostics[0];
    const aiData = (diag?.rawData as any) || {};
    
    if (aiData.risk === 'HIGH_RISK' || aiData.action === 'PAUSE') {
        return { safe: false, reason: 'AI_RISK_BLOCK' };
    }

    if (account.warmupState && account.warmupState.currentCount >= (aiData.recommended_daily_limit || 0)) {
        return { safe: false, reason: 'DAILY_LIMIT_REACHED' };
    }

    return { safe: true, account };
}

export const mainWorker = new Worker('mailgard-queue', async (job: Job) => {
    const { type, accountId } = job.data;

    console.log(`[Worker] Processing ${type} for ${accountId}...`);

    // 1. SAFETY VALIDATION
    const safety = await validateSafety(accountId);
    if (!safety.safe && type !== 'DIAGNOSTICS_RUN' && type !== 'AI_RECHECK') {
        console.warn(`[Worker] Job ${type} aborted: ${safety.reason}`);
        return;
    }

    const { account } = safety;

    try {
        switch (type) {
            case 'WARM_SEND':
                await handleWarmSend(account!);
                break;
            case 'DIAGNOSTICS_RUN':
                // Handled by accountController logic or separate worker
                break;
            case 'AI_RECHECK':
                // Re-trigger Gemini analysis
                break;
            default:
                console.warn(`[Worker] Unknown job type: ${type}`);
        }
    } catch (error: any) {
        console.error(`[Worker] Job ${type} failed:`, error.message);
        
        // Handle recoverable vs non-recoverable errors
        const isRecoverable = error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET';
        
        if (!isRecoverable) {
            await prisma.account.update({
                where: { id: accountId },
                data: { status: 'PAUSED' }
            });
            console.warn(`[Worker] Critical failure. Domain ${accountId} paused.`);
            throw new Error(`Non-recoverable failure: ${error.message}`);
        }
        
        // Recoverable errors will be retried by BullMQ automatically
        throw error; 
    }
}, { 
    connection,
    limiter: { max: 10, duration: 1000 } // Throttle to 10 jobs per second system-wide
});

/**
 * Execution Logic for WARM_SEND
 */
async function handleWarmSend(account: any) {
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

    const { subject, body } = getRandomMessage();
    const recipient = 'warmup@ozgardenz.site';

    await transporter.sendMail({
        from: account.email,
        to: recipient,
        subject,
        text: body,
        headers: { 'X-Mailer': 'MailGard-Queue-Worker' }
    });

    await prisma.$transaction([
        prisma.emailLog.create({
            data: {
                accountId: account.id,
                recipient,
                subject,
                status: 'SENT'
            }
        }),
        prisma.warmupState.update({
            where: { accountId: account.id },
            data: {
                currentCount: { increment: 1 },
                lastSentAt: new Date()
            }
        })
    ]);

    // Reschedule next send if limits allow
    const diag = account.diagnostics[0];
    const aiData = (diag?.rawData as any) || {};
    if (account.warmupState.currentCount + 1 < aiData.recommended_daily_limit) {
        const nextDelay = Math.floor(Math.random() * (3600000 * 4 - 3600000) + 3600000);
        await addWarmupJob(account.id, nextDelay);
    }
}
