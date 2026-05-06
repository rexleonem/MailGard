import { resetDailyCounts, scheduleWarmupJobs } from '../workers/scheduler';
import prisma from '../lib/prisma';

async function runCron() {
    console.log('--- Starting MailGard Cron Task ---');
    try {
        // 1. Reset daily counts if it's a new day (or run this specifically at midnight)
        // For simplicity, we can run resetDailyCounts once a day.
        // And scheduleWarmupJobs more frequently.
        
        const type = process.argv[2]; // 'reset' or 'schedule'

        if (type === 'reset') {
            await resetDailyCounts();
            console.log('Daily counts reset successfully.');
        } else {
            await scheduleWarmupJobs();
            console.log('Warmup jobs scheduled successfully.');
        }

    } catch (error) {
        console.error('Cron task failed:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

runCron();
