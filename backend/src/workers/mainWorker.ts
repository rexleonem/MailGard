import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { decrypt } from '../lib/encryption';
import { getRandomMessage } from '../lib/messages';
import { addWarmupJob } from '../queues/warmupQueue';
import { calculateAdaptiveState, getNaturalDelay } from '../lib/trustEngine';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

/**
 * ADVANCED SAFETY GATE
 * Consumes Adaptive Trust Model + AI Risk + System Rules
 */
async function validateSafety(accountId: string) {
    const adaptive = await calculateAdaptiveState(accountId);
    if (!adaptive) return { safe: false, reason: 'TRUST_STATE_MISSING' };

    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { diagnostics: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!account) return { safe: false, reason: 'ACCOUNT_NOT_FOUND' };
    if (account.status !== 'ACTIVE') return { safe: false, reason: `STATUS_${account.status}` };

    // Cooldown check
    if (adaptive.cooldownUntil && new Date() < new Date(adaptive.cooldownUntil)) {
        return { safe: false, reason: 'COOLDOWN_ACTIVE' };
    }

    // AI & Adaptive Limit check
    if (adaptive.currentCount >= adaptive.adaptiveLimit) {
        return { safe: false, reason: 'ADAPTIVE_LIMIT_REACHED' };
    }

    const diag = account.diagnostics[0];
    const aiData = (diag?.rawData as any) || {};
    if (aiData.risk === 'HIGH_RISK') return { safe: false, reason: 'AI_HIGH_RISK_BLOCK' };

    return { safe: true, account, adaptive };
}

export const mainWorker = new Worker('mailgard-queue', async (job: Job) => {
    const { type, accountId } = job.data;

    const safety = await validateSafety(accountId);
    if (!safety.safe && type === 'WARM_SEND') {
        console.warn(`[Adaptive Worker] ${type} blocked for ${accountId}: ${safety.reason}`);
        return;
    }

    const { account, adaptive } = safety;

    try {
        if (type === 'WARM_SEND') {
            await handleAdaptiveSend(account!, adaptive!);
        }
    } catch (error: any) {
        console.error(`[Adaptive Worker] ${type} failed:`, error.message);
        throw error; // Let BullMQ handle retries with backoff
    }
}, { connection });

async function handleAdaptiveSend(account: any, adaptive: any) {
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
        headers: { 'X-Mailer': 'MailGard-Adaptive-Engine' }
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

    // Adaptive Scheduling: Random delay based on trust
    if (adaptive.currentCount + 1 < adaptive.adaptiveLimit) {
        let delay = getNaturalDelay();
        
        // Slower spacing for DEGRADED or NEW accounts
        if (adaptive.trustLevel === 'DEGRADED' || adaptive.trustLevel === 'NEW') {
            delay *= 2; 
        }

        await addWarmupJob(account.id, delay);
        console.log(`[Adaptive] Next send for ${account.email} in ${Math.round(delay/60000)}m (Trust: ${adaptive.trustLevel})`);
    }
}
