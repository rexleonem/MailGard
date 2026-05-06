import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { decrypt } from '../lib/encryption';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const warmupWorker = new Worker('warmup-queue', async job => {
    const { accountId } = job.data;
    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { warmupState: true }
    });

    if (!account || account.status !== 'ACTIVE') return;

    try {
        const decryptedPassword = decrypt(JSON.parse(account.password));
        
        const transporter = nodemailer.createTransport({
            host: account.smtpHost,
            port: account.smtpPort,
            secure: account.smtpPort === 465,
            auth: {
                user: account.email,
                pass: decryptedPassword
            }
        });

        // Send to a test recipient (in production this could be a pool of accounts)
        const recipient = 'warmup@ozgardenz.site'; 
        
        await transporter.sendMail({
            from: account.email,
            to: recipient,
            subject: `Warm-up email ${new Date().toISOString()}`,
            text: 'This is an automated warm-up email to improve deliverability. Have a great day!',
            headers: {
                'X-Mailer': 'MailGard-Warmup'
            }
        });

        // Log success
        await prisma.emailLog.create({
            data: {
                accountId,
                recipient,
                subject: 'Warm-up Email',
                status: 'SENT'
            }
        });

        // Update warmup state
        await prisma.warmupState.update({
            where: { accountId },
            data: {
                currentCount: { increment: 1 },
                lastSentAt: new Date()
            }
        });

    } catch (error: any) {
        console.error(`Failed to send warmup for ${account.email}:`, error);
        await prisma.emailLog.create({
            data: {
                accountId,
                recipient: 'warmup@ozgardenz.site',
                subject: 'Warm-up Email',
                status: 'FAILED',
                error: error.message
            }
        });
    }
}, { connection });
