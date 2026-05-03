import { Router } from 'express';
import { addAccount, getAccounts } from '../controllers/accountController';

const router = Router();

router.post('/', addAccount);
router.get('/', getAccounts);

export default router;
