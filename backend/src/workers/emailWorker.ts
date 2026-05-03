import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma';
import { createTransporter, sendMail } from '../modules/smtp';
import { LogStatus } from '@prisma/client';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const emailWorker = new Worker('email_sending', async (job: Job) => {
    const { accountId, recipient, subject, body } = job.data;

    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { warmupState: true }
    });

    if (!account || account.status !== 'ACTIVE') {
        throw new Error(`Account ${accountId} is not active or not found`);
    }

    // Safety Check: Check if daily limit reached
    if (account.warmupState && account.warmupState.currentCount >= account.warmupState.dailyLimit) {
        console.warn(`Daily limit reached for ${account.email}. Skipping send.`);
        return;
    }

    const transporter = createTransporter({
        host: account.smtpHost,
        port: account.smtpPort,
        user: account.email,
        pass: account.password
    });

    try {
        await sendMail(transporter, {
            from: account.email,
            to: recipient,
            subject: subject,
            text: body
        });

        // Log success
        await prisma.emailLog.create({
            data: {
                accountId,
                recipient,
                subject,
                status: 'SENT'
            }
        });

        // Update warmup count
        await prisma.warmupState.update({
            where: { accountId },
            data: {
                currentCount: { increment: 1 },
                lastSentAt: new Date()
            }
        });

    } catch (error: any) {
        console.error(`Failed to send email from ${account.email}:`, error);
        
        await prisma.emailLog.create({
            data: {
                accountId,
                recipient,
                subject,
                status: 'FAILED',
                error: error.message
            }
        });

        throw error; // Let BullMQ handle retry
    }
}, { connection });
