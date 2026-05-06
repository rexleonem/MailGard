import { Router } from 'express';
import { createAccount, getAccounts, getAccountDetail, triggerWarmup } from '../controllers/accountController';

const router = Router();

router.get('/', getAccounts);
router.post('/', createAccount);
router.get('/:id', getAccountDetail);
router.post('/:id/warmup', triggerWarmup);

export default router;
