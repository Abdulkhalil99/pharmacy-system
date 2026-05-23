import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { adminOnly, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

router.get('/', userController.getAll);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);
router.put('/:id/password', userController.resetPassword);

export default router;
