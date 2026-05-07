import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import prisma from './lib/prisma';
import { initCronJobs } from './cron/warmupScheduler';
import './workers/mainWorker';

import accountRoutes from './routes/accountRoutes';
import authRoutes from './routes/authRoutes';
import { authMiddleware } from './middleware/authMiddleware';

import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 4000;

// Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: { error: 'Too many login attempts, please try again after an hour.' }
});

initCronJobs();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/accounts', authMiddleware, accountRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Routes will be added here

app.listen(port, () => {
    console.log(`MailGard Backend running on port ${port}`);
});

import { mainWorker } from './workers/mainWorker';

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Cleaning up...');
    await mainWorker.close();
    await prisma.$disconnect();
    process.exit(0);
});
