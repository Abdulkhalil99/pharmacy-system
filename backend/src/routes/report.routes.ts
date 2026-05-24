import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { anyRole, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/daily', anyRole, reportController.getDailyReport);
router.get('/weekly', anyRole, reportController.getWeeklyReport);
router.get('/monthly', anyRole, reportController.getMonthlyReport);
router.get('/yearly', anyRole, reportController.getYearlyReport);
router.get('/medicines/inventory', anyRole, reportController.getInventoryReport);
router.get('/medicines/top-selling', anyRole, reportController.getTopSellingMedicines);
router.get('/medicines/least-selling', anyRole, reportController.getLeastSellingMedicines);
router.get('/profit', anyRole, reportController.getProfitReport);
router.get('/companies/accounts', anyRole, reportController.getCompanyAccountReport);
router.get('/customers/debts', anyRole, reportController.getCustomerDebtReport);
router.get('/cash-flow', anyRole, reportController.getCashFlowReport);
router.get('/expenses', anyRole, reportController.getExpenseReport);

export default router;
