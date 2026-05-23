import { Router } from 'express';
import { cashRegisterController } from '../controllers/cashregister.controller';
import {
  adminOnly,
  authenticate,
  cashierOrAdmin,
} from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/today', cashierOrAdmin, cashRegisterController.getTodayStatus);
router.post('/open', adminOnly, cashRegisterController.openRegister);
router.post('/close', adminOnly, cashRegisterController.closeRegister);
router.post('/transfer', cashierOrAdmin, cashRegisterController.transferCash);
router.get('/transfers', cashierOrAdmin, cashRegisterController.getTransfers);
router.get('/report/daily', cashierOrAdmin, cashRegisterController.getDailyReport);
router.get('/report/monthly', cashierOrAdmin, cashRegisterController.getMonthlyReport);

export default router;
