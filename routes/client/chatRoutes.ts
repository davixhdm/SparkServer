import { Router } from 'express';
import * as chatController from '../../controllers/client/chatController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', chatController.getChats);
router.get('/unread/total', chatController.getTotalUnreadCount);
router.post('/direct', chatController.createDirectChat);
router.patch('/read-all', chatController.markAllAsRead);
router.post('/bulk', chatController.bulkChatAction);
router.get('/:chatId', chatController.getChatById);
router.post('/:chatId/read', chatController.markChatAsRead);
router.patch('/:chatId/archive', chatController.archiveChat);
router.patch('/:chatId/unarchive', chatController.unarchiveChat);
router.patch('/:chatId/wallpaper', chatController.updateWallpaper);
router.delete('/:chatId/messages', chatController.clearChat);
router.delete('/:chatId', chatController.deleteChat);

export default router;