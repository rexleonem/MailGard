import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { decrypt } from '../lib/encryption';
import { getRandomMessage } from '../lib/messages';
import { addWarmupJob } from '../queues/warmupQueue';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const warmupWorker = new Worker('warmup-queue', async job => {
    const { accountId } = job.data;
    
    // 1. SAFETY GATE: Fetch account with latest diagnostics and state
    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { 
            warmupState: true,
            diagnostics: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
    });

    if (!account || !account.warmupState) return;

    // 2. STRICT ENFORCEMENT: Check status and risk
    if (account.status !== 'ACTIVE') {
        console.log(`Warm-up blocked for ${account.email}: Account status is ${account.status}`);
        return;
    }

    const latestDiag = account.diagnostics[0];
    const aiData = (latestDiag?.rawData as any) || {};
    const dailyLimit = aiData.recommended_daily_limit || 0;

    // 3. ADAPTIVE LIMITS: Check if daily quota is reached
    if (account.warmupState.currentCount >= dailyLimit) {
        console.log(`Warm-up limit reached for ${account.email}: ${account.warmupState.currentCount}/${dailyLimit}`);
        return;
    }

    try {
        // 4. PREPARE SMTP
        const decryptedPassword = decrypt(JSON.parse(account.password));
        const transporter = nodemailer.createTransport({
            host: account.smtpHost,
            port: account.smtpPort,
            secure: account.smtpPort === 465,
            auth: {
                user: account.email,
                pass: decryptedPassword
            },
            connectTimeout: 10000
        } as any);

        // 5. MESSAGE VARIATION
        const { subject, body } = getRandomMessage();
        const recipient = 'warmup@ozgardenz.site'; // Simulation recipient

        // 6. EXECUTE SEND
        await transporter.sendMail({
            from: account.email,
            to: recipient,
            subject,
            text: body,
            headers: { 'X-Mailer': 'MailGard-Adaptive-Warmup' }
        });

        // 7. LOG SUCCESS & UPDATE STATE
        await prisma.$transaction([
            prisma.emailLog.create({
                data: {
                    accountId,
                    recipient,
                    subject,
                    status: 'SENT'
                }
            }),
            prisma.warmupState.update({
                where: { accountId },
                data: {
                    currentCount: { increment: 1 },
                    lastSentAt: new Date()
                }
            })
        ]);

        console.log(`Warm-up email sent for ${account.email}. Total today: ${account.warmupState.currentCount + 1}`);

        // 8. SCHEDULE NEXT SEND (Controlled Ramp-up)
        // If not at limit, schedule another job with random delay (1-4 hours)
        if (account.warmupState.currentCount + 1 < dailyLimit) {
            const nextDelay = Math.floor(Math.random() * (4 * 3600000 - 3600000) + 3600000);
            await addWarmupJob(accountId, nextDelay);
            console.log(`Scheduled next warm-up for ${account.email} in ${Math.round(nextDelay/60000)} mins`);
        }

    } catch (error: any) {
        console.error(`Warm-up execution failed for ${account.email}:`, error);
        
        await prisma.emailLog.create({
            data: {
                accountId,
                recipient: 'warmup@ozgardenz.site',
                subject: 'Warm-up Failed',
                status: 'FAILED',
                error: error.message
            }
        });

        // Trigger safety pause if SMTP errors persist
        if (error.code === 'EAUTH' || error.code === 'ECONNREFUSED') {
            await prisma.account.update({
                where: { id: accountId },
                data: { status: 'PAUSED' }
            });
            console.warn(`Critical SMTP error. Paused warm-up for ${account.email}`);
        }
    }
}, { connection });
