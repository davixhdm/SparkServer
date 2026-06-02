import { Router } from 'express';
import * as notificationController from '../../controllers/client/notificationController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.delete('/', notificationController.deleteAllNotifications);

export default router;