import { Router } from 'express';
import * as authController from '../../controllers/client/authController';
import { authLimiter } from '../../middleware/client/rateLimiterMiddleware';

const router = Router();

router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

export default router;