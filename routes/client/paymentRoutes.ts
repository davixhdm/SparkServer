import { Router } from 'express';
import * as paymentController from '../../controllers/client/paymentController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/initiate', paymentController.initiatePayment);
router.post('/confirm', paymentController.confirmManualPayment);
router.get('/activations', paymentController.getActivationStatus);
router.get('/history', paymentController.getPaymentHistory);

export default router;