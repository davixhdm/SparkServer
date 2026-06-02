import { Router } from 'express';
import * as deeplinksController from '../../controllers/admin/deeplinksController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireAdminOrAbove } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', deeplinksController.getDeepLinks);
router.post('/', requireAdminOrAbove, deeplinksController.createDeepLink);
router.patch('/:deepLinkId', requireAdminOrAbove, deeplinksController.updateDeepLink);
router.delete('/:deepLinkId', requireAdminOrAbove, deeplinksController.deleteDeepLink);
router.patch('/:deepLinkId/toggle', requireAdminOrAbove, deeplinksController.toggleDeepLink);

export default router;