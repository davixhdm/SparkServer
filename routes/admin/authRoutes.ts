import { Router } from 'express';
import * as authController from '../../controllers/admin/authController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { authLimiter } from '../../middleware/client/rateLimiterMiddleware';

const router = Router();

router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', adminAuthMiddleware, authController.logout);

export default router;