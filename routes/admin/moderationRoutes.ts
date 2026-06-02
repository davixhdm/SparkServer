import { Router } from 'express';
import * as moderationController from '../../controllers/admin/moderationController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireModeratorOrAbove } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireModeratorOrAbove);

router.get('/messages', moderationController.getFlaggedMessages);
router.get('/logs', moderationController.getModerationLogs);
router.get('/blocked-words', moderationController.getBlockedWords);
router.post('/blocked-words', moderationController.addBlockedWord);
router.delete('/blocked-words/:word', moderationController.removeBlockedWord);
router.delete('/content/:contentId', moderationController.removeContent);
router.delete('/users/:userId/content', moderationController.bulkRemoveContent);
router.post('/users/:userId/warn', moderationController.warnUser);

export default router;