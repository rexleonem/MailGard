import { Router } from 'express';
import { 
    createAccount, getAccounts, getAccountDetail, triggerWarmup, 
    deleteAccount, updateAccount, refreshDiagnostics 
} from '../controllers/accountController';

const router = Router();

router.get('/', getAccounts);
router.post('/', createAccount);
router.get('/:id', getAccountDetail);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.post('/:id/warmup', triggerWarmup);
router.post('/:id/diagnostics', refreshDiagnostics);

export default router;
