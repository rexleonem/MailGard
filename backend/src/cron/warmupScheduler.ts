// @ts-ignore
import cron from 'node-cron';
import prisma from '../lib/prisma';
import { addWarmupJob } from '../queues/warmupQueue';

export function initCronJobs() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily warm-up reset...');
        
        try {
            // 1. Reset counts and increment day for all warm-up states
            await prisma.warmupState.updateMany({
                data: {
                    currentCount: 0,
                    dayNumber: { increment: 1 }
                }
            });

            // 2. Automatically queue the first job for all ACTIVE accounts
            const activeAccounts = await prisma.account.findMany({
                where: { status: 'ACTIVE' }
            });

            for (const account of activeAccounts) {
                // Initial delay for the first email of the day (10-30 mins)
                const initialDelay = Math.floor(Math.random() * (1800000 - 600000) + 600000);
                await addWarmupJob({ accountId: account.id, email: account.email }, initialDelay);
                console.log(`Queued initial warm-up for ${account.email}`);
            }

        } catch (error) {
            console.error('Daily warm-up reset failed:', error);
        }
    });

    console.log('Cron jobs initialized: Daily Reset at 00:00');
}
