import { Router } from 'express';
import * as paymentsController from '../../controllers/admin/paymentsController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireAdminOrAbove } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/activations', paymentsController.getPendingActivations);
router.get('/stats', paymentsController.getPaymentStats);
router.get('/', paymentsController.getAllPayments);
router.patch('/activations/:activationId/approve', requireAdminOrAbove, paymentsController.approveActivation);
router.patch('/activations/:activationId/reject', requireAdminOrAbove, paymentsController.rejectActivation);
router.post('/revoke/:userId', requireAdminOrAbove, paymentsController.revokeVerification);

export default router;