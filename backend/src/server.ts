import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import prisma from './lib/prisma';
import './workers/warmupWorker';

import accountRoutes from './routes/accountRoutes';
import authRoutes from './routes/authRoutes';
import { authMiddleware } from './middleware/authMiddleware';

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/accounts', authMiddleware, accountRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Routes will be added here

app.listen(port, () => {
    console.log(`MailGard Backend running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
