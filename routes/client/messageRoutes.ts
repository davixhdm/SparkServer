import { Router } from 'express';
import * as messageController from '../../controllers/client/messageController';
import { authMiddleware } from '../../middleware/client/authMiddleware';
import { messageLimiter } from '../../middleware/client/rateLimiterMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', messageLimiter, messageController.sendMessage);
router.get('/starred', messageController.getStarredMessages);
router.get('/search', messageController.searchMessages);
router.get('/:chatId', messageController.getMessages);
router.patch('/:messageId', messageController.editMessage);
router.delete('/:messageId', messageController.deleteMessage);
router.post('/:messageId/forward', messageController.forwardMessage);
router.post('/:messageId/react', messageController.reactToMessage);
router.patch('/:messageId/star', messageController.starMessage);

export default router;