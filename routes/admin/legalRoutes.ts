import { Router } from 'express';
import * as legalController from '../../controllers/admin/legalController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireAdminOrAbove } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', legalController.getAllLegal);
router.get('/:type', legalController.getLegal);
router.get('/:type/history', legalController.getHistory);
router.put('/:type', requireAdminOrAbove, legalController.saveLegal);

export default router;