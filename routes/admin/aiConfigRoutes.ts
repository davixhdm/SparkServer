import { Router } from 'express';
import * as aiConfigController from '../../controllers/admin/aiConfigController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireSuperAdmin } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);

// @desc    AI configuration management
// @route   /api/v1/admin/ai/config
// @access  Private/Admin
router.get('/', aiConfigController.getAiConfig);
router.patch('/', requireSuperAdmin, aiConfigController.updateAiConfig);
router.get('/features', aiConfigController.getAiFeatureStatuses);
router.patch('/features/:featureName', requireSuperAdmin, aiConfigController.toggleAiFeature);
router.patch('/thresholds', requireSuperAdmin, aiConfigController.updateAiThresholds);
router.patch('/rate-limits', requireSuperAdmin, aiConfigController.updateAiRateLimits);
router.patch('/auto-moderation', requireSuperAdmin, aiConfigController.updateAutoModeration);
router.patch('/languages', requireSuperAdmin, aiConfigController.updateAiLanguages);
router.patch('/logging', requireSuperAdmin, aiConfigController.updateAiLogging);
router.post('/reset', requireSuperAdmin, aiConfigController.resetAiConfig);

export default router;