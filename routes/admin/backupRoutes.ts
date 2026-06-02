import { Router } from 'express';
import * as systemBackupController from '../../controllers/admin/systemBackupController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireSuperAdmin } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

// @desc    System backup management
// @route   /api/v1/admin/backups
// @access  Private/Admin
router.get('/', systemBackupController.getBackupHistory);
router.post('/', requireSuperAdmin, systemBackupController.createSystemBackup);
router.get('/:backupId', systemBackupController.getBackupById);
router.delete('/:backupId', requireSuperAdmin, systemBackupController.deleteBackup);
router.post('/:backupId/restore', requireSuperAdmin, systemBackupController.restoreFromBackup);

export default router;