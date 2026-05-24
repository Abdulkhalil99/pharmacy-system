import { Router } from 'express';
import { medicineController } from '../controllers/medicine.controller';
import { authenticate, adminOnly, pharmacistOrAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/low-stock',     medicineController.getLowStock);
router.get('/expiring-soon', medicineController.getExpiringSoon);
router.get('/summary',       medicineController.getSummary);
router.get('/',              medicineController.getAll);
router.get('/:id',           medicineController.getById);
router.post('/',             pharmacistOrAdmin, medicineController.create);
router.put('/:id',           pharmacistOrAdmin, medicineController.update);
router.delete('/:id',        adminOnly,         medicineController.delete);
router.post('/:id/return',   pharmacistOrAdmin, medicineController.returnStock);

export default router;
