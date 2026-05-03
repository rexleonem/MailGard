import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma';
import { calculateDailyLimit } from '../modules/warmup';
import { emailQueue } from '../queues/emailQueue';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

// This scheduler runs every day at midnight to reset counts and adjust limits
export const resetDailyCounts = async () => {
    const accounts = await prisma.account.findMany({
        where: { status: 'ACTIVE' },
        include: { warmupState: true }
    });

    for (const account of accounts) {
        if (account.warmupState) {
            const newDay = account.warmupState.dayNumber + 1;
            // AI limit would be fetched here or kept from previous AI evaluation
            const newLimit = calculateDailyLimit(newDay, 20); // 20 is fallback shared cap
            
            await prisma.warmupState.update({
                where: { accountId: account.id },
                data: {
                    currentCount: 0,
                    dayNumber: newDay,
                    dailyLimit: newLimit
                }
            });
        }
    }
};

// This function adds send jobs throughout the day at random intervals
export const scheduleWarmupJobs = async () => {
    const accounts = await prisma.account.findMany({
        where: { status: 'ACTIVE' },
        include: { warmupState: true }
    });

    for (const account of accounts) {
        if (account.warmupState) {
            const remaining = account.warmupState.dailyLimit - account.warmupState.currentCount;
            if (remaining > 0) {
                // Add one job now
                await emailQueue.add('warm_send', {
                    accountId: account.id,
                    recipient: 'test@mailgard.ai', // In real app, this would be a list of safe recipients
                    subject: `Re: MailGard Warmup - ${new Date().toLocaleDateString()}`,
                    body: `Hello,\n\nThis is a controlled warm-up email from MailGard.\n\nRef: ${Math.random().toString(36).substring(7)}`
                }, {
                    delay: Math.floor(Math.random() * 1000 * 60 * 60 * 4) // Delay up to 4 hours to randomize
                });
            }
        }
    }
};
