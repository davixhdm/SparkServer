import { Router } from 'express';
import * as reportsController from '../../controllers/admin/reportsController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireModeratorOrAbove } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireModeratorOrAbove);

router.get('/', reportsController.getReports);
router.get('/:reportId', reportsController.getReportDetail);
router.patch('/:reportId/assign', reportsController.assignReport);
router.patch('/:reportId/resolve', reportsController.resolveReport);
router.patch('/:reportId/dismiss', reportsController.dismissReport);

export default router;