import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const mailgardQueue = new Queue('mailgard-queue', { connection });

interface WarmupJobData {
    accountId: string;
    email: string;
    recipient?: string;
    subject?: string;
    body?: string;
    isTest?: boolean;
    logId?: string;
}

/**
 * Add a warm-up or test send job with exponential backoff retry strategy
 */
export async function addWarmupJob(data: WarmupJobData, delayMs: number = 0) {
    const type = data.isTest ? 'TEST_SEND' : 'WARM_SEND';
    
    await mailgardQueue.add(
        type, 
        { ...data, type }, 
        { 
            delay: delayMs,
            priority: data.isTest ? 1 : 10, // Higher priority for manual tests
            removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000 
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
        { priority: 5 }
    );
}
