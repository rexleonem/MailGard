import { Router } from 'express';
import { 
    createAccount, getAccounts, getAccountDetail, triggerWarmup, 
    deleteAccount, updateAccount, refreshDiagnostics, getQueueStats,
    getSystemEvents, getAlerts, sendTestEmail, getEmailLogs, getLogDetail
} from '../controllers/accountController';

const router = Router();

router.get('/', getAccounts);
router.post('/', createAccount);
router.get('/monitor/stats', getQueueStats);
router.get('/monitor/events', getSystemEvents);
router.get('/monitor/alerts', getAlerts);

// Email Logs & History
router.get('/logs', getEmailLogs);
router.get('/logs/:id', getLogDetail);

router.get('/:id', getAccountDetail);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.post('/:id/warmup', triggerWarmup);
router.post('/:id/diagnostics', refreshDiagnostics);
router.post('/:id/test-send', sendTestEmail);

export default router;
