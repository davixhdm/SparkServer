import { Router } from 'express';
import * as usersController from '../../controllers/admin/usersController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireAdminOrAbove, requireSuperAdmin } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', usersController.getUsers);
router.get('/:userId', usersController.getUserDetail);
router.post('/:userId/ban', requireAdminOrAbove, usersController.banUser);
router.post('/:userId/unban', requireAdminOrAbove, usersController.unbanUser);
router.post('/:userId/force-logout', requireAdminOrAbove, usersController.forceLogout);
router.delete('/:userId/permanent', requireSuperAdmin, usersController.permanentlyDeleteUser);

export default router;