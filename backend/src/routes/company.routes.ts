import { Router } from 'express';
import { companyController } from '../controllers/company.controller';
import { authenticate, pharmacistOrAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', companyController.getAll);
router.post('/', pharmacistOrAdmin, companyController.create);
router.get('/:id/transactions', companyController.getTransactions);
router.post('/:id/purchase', pharmacistOrAdmin, companyController.recordPurchase);
router.post('/:id/payment', pharmacistOrAdmin, companyController.recordPayment);
router.get('/:id/report', companyController.getReport);
router.get('/:id', companyController.getById);
router.put('/:id', pharmacistOrAdmin, companyController.update);

export default router;
