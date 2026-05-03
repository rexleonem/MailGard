import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const emailQueue = new Queue('email_sending', { connection });
export const diagnosticQueue = new Queue('diagnostics', { connection });
export const riskQueue = new Queue('risk_assessment', { connection });

export const addWarmupJob = async (accountId: string, data: any) => {
    await emailQueue.add('warm_send', { accountId, ...data }, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000 * 60 * 5, // 5 minutes
        }
    });
};
