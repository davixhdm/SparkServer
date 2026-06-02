import { Router } from 'express';
import * as statusController from '../../controllers/client/statusController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/feed', statusController.getStatusFeed);
router.post('/', statusController.createStatus);
router.post('/:statusId/view', statusController.viewStatus);
router.get('/:statusId/viewers', statusController.getStatusViewers);
router.post('/:statusId/react', statusController.reactToStatus);
router.post('/:statusId/reply', statusController.replyToStatus);
router.delete('/:statusId', statusController.deleteStatus);
router.patch('/mute/:userId', statusController.muteUserStatus);
router.patch('/unmute/:userId', statusController.unmuteUserStatus);

export default router;