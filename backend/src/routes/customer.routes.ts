import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { anyRole, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', anyRole, customerController.getAll);
router.get('/debtors', anyRole, customerController.getDebtors);
router.post('/', anyRole, customerController.create);
router.get('/:id/transactions', anyRole, customerController.getTransactions);
router.post('/:id/payment', anyRole, customerController.recordPayment);
router.get('/:id/report', anyRole, customerController.getReport);
router.get('/:id', anyRole, customerController.getById);
router.put('/:id', anyRole, customerController.update);

export default router;
