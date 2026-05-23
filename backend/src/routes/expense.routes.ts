import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import {
  adminOnly,
  authenticate,
  cashierOrAdmin,
} from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', cashierOrAdmin, expenseController.getAll);
router.post('/', cashierOrAdmin, expenseController.create);
router.get('/summary/daily', cashierOrAdmin, expenseController.getDailySummary);
router.get('/summary/monthly', cashierOrAdmin, expenseController.getMonthlySummary);
router.get('/summary/yearly', cashierOrAdmin, expenseController.getYearlySummary);
router.put('/:id', cashierOrAdmin, expenseController.update);
router.delete('/:id', adminOnly, expenseController.delete);

export default router;
