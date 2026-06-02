import { Router } from 'express';
import * as settingsController from '../../controllers/admin/settingsController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireSuperAdmin } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', settingsController.getSettings);
router.patch('/', requireSuperAdmin, settingsController.updateSettings);
router.patch('/currency', requireSuperAdmin, settingsController.updateCurrency);
router.get('/ai', settingsController.getAiConfig);
router.patch('/ai', requireSuperAdmin, settingsController.updateAiConfig);
router.get('/sound-packs', settingsController.getSoundPacks);
router.post('/sound-packs', settingsController.createSoundPack);
router.patch('/sound-packs/:packId', settingsController.updateSoundPack);
router.delete('/sound-packs/:packId', settingsController.deleteSoundPack);

export default router;