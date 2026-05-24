import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { adminOnly, authenticate, pharmacistOrAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', pharmacistOrAdmin, employeeController.getAll);
router.get('/:id', pharmacistOrAdmin, employeeController.getById);
router.get('/:id/salary-history', pharmacistOrAdmin, employeeController.getSalaryHistory);
router.post('/', adminOnly, employeeController.create);
router.put('/:id', adminOnly, employeeController.update);
router.delete('/:id', adminOnly, employeeController.delete);
router.put('/:id/link-user', adminOnly, employeeController.linkUser);

export default router;
