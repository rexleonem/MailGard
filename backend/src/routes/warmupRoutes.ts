import { Router } from 'express';
import { getWarmupPool, addRecipient, toggleRecipient, deleteRecipient } from '../controllers/warmupController';

const router = Router();

router.get('/', getWarmupPool);
router.post('/', addRecipient);
router.patch('/:id', toggleRecipient);
router.delete('/:id', deleteRecipient);

export default router;
