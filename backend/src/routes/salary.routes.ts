import { Router } from 'express';
import { salaryController } from '../controllers/salary.controller';
import { authenticate, cashierOrAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', cashierOrAdmin, salaryController.getAll);
router.post('/', cashierOrAdmin, salaryController.recordPayment);
router.get('/summary', cashierOrAdmin, salaryController.getSummary);
router.get('/employee/:name', cashierOrAdmin, salaryController.getEmployeeHistory);

export default router;
