import { Router } from 'express';
import { alertsController } from '../controllers/alerts.controller';
import { anyRole, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', anyRole, alertsController.getAll);

export default router;
