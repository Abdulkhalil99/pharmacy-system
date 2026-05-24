import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { anyRole, authenticate, pharmacistOrAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/customers/search', anyRole, saleController.searchCustomers);
router.get('/daily', anyRole, saleController.getDailySummary);
router.get('/weekly', anyRole, saleController.getWeeklySummary);
router.get('/monthly', anyRole, saleController.getMonthlySummary);
router.get('/yearly', anyRole, saleController.getYearlySummary);
router.get('/', anyRole, saleController.getAll);
router.get('/:id', anyRole, saleController.getById);
router.post('/prescription', pharmacistOrAdmin, saleController.createPrescription);
router.post('/return', pharmacistOrAdmin, saleController.returnMedicine);

export default router;
