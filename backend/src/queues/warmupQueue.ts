import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const mailgardQueue = new Queue('mailgard-queue', { connection });

/**
 * Add a warm-up send job with exponential backoff retry strategy
 */
export async function addWarmupJob(accountId: string, delayMs: number = 0) {
    await mailgardQueue.add(
        'WARM_SEND', 
        { type: 'WARM_SEND', accountId }, 
        { 
            delay: delayMs,
            removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000 // 1 min, then 2 min, then 4 min
            }
        }
    );
}

/**
 * Add a diagnostic refresh job
 */
export async function addDiagnosticJob(accountId: string) {
    await mailgardQueue.add(
        'DIAGNOSTICS_RUN',
        { type: 'DIAGNOSTICS_RUN', accountId },
        { priority: 10 } // Higher priority
    );
}
