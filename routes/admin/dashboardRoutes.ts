import { Router } from 'express';
import * as dashboardController from '../../controllers/admin/dashboardController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', dashboardController.getDashboardStats);
router.get('/activity', dashboardController.getRecentActivity);

export default router;