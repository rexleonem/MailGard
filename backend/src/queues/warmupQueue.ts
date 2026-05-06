import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const warmupQueue = new Queue('warmup-queue', { connection });

export const addWarmupJob = async (accountId: string, delayMs: number) => {
    await warmupQueue.add('send-warmup-email', { accountId }, {
        delay: delayMs,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        }
    });
};
