import { Router } from 'express';
import * as backupController from '../../controllers/client/backupController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', backupController.getBackups);
router.post('/', backupController.createBackup);
router.get('/:backupId', backupController.getBackupById);
router.delete('/:backupId', backupController.deleteBackup);

export default router;