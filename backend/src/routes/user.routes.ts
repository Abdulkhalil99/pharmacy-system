import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { adminOnly, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/check-username', adminOnly, userController.checkUsername);
router.get('/', adminOnly, userController.getAll);
router.post('/', adminOnly, userController.create);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.delete('/:id', adminOnly, userController.delete);
router.put('/:id/reset-password', adminOnly, userController.resetPassword);
router.put('/:id/password', adminOnly, userController.resetPassword);
router.put('/:id/change-password', userController.changePassword);
router.put('/:id/toggle-active', adminOnly, userController.toggleActive);

export default router;
