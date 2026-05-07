import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getWarmupPool(req: Request, res: Response) {
    try {
        const pool = await prisma.warmupPool.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(pool);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch warmup pool' });
    }
}

export async function addRecipient(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const recipient = await prisma.warmupPool.create({
            data: { email }
        });
        res.status(201).json(recipient);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Recipient already exists' });
        }
        res.status(500).json({ error: 'Failed to add recipient' });
    }
}

export async function toggleRecipient(req: Request, res: Response) {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        const recipient = await prisma.warmupPool.update({
            where: { id: id as string },
            data: { isActive }
        });
        res.json(recipient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update recipient' });
    }
}

export async function deleteRecipient(req: Request, res: Response) {
    const { id } = req.params;

    try {
        await prisma.warmupPool.delete({
            where: { id: id as string }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete recipient' });
    }
}

