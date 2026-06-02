import Notification from '../../models/client/Notification';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';

export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 30,
  unreadOnly: boolean = false,
): Promise<any> {
  const skip = (page - 1) * limit;
  const filter: any = { userId };

  if (unreadOnly) {
    filter.isRead = false;
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    hasMore: skip + limit < total,
  };
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
  );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true },
  );
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  await Notification.findOneAndDelete({ _id: notificationId, userId });
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  await Notification.deleteMany({ userId });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, isRead: false });
}