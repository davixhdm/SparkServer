import User from '../../models/client/User';
import Session from '../../models/client/Session';
import Payment from '../../models/client/Payment';
import Report from '../../models/admin/Report';
import Ban from '../../models/admin/Ban';
import ModerationLog from '../../models/admin/ModerationLog';
import { logger } from '../../utils/logger';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';

export async function getAllUsers(
  page: number = 1,
  limit: number = 20,
  filters?: { search?: string; isHdmVerified?: boolean; isDeleted?: boolean; status?: string },
): Promise<any> {
  const skip = (page - 1) * limit;
  const query: any = {};

  if (filters?.search) {
    query.$or = [
      { displayName: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
    ];
  }

  if (filters?.isHdmVerified !== undefined) query.isHdmVerified = filters.isHdmVerified;
  if (filters?.isDeleted !== undefined) query.isDeleted = filters.isDeleted;
  if (filters?.status) query.status = filters.status;

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-password -privacyProfiles')
    .lean();

  const total = await User.countDocuments(query);

  // Attach active ban status to each user
  const userIds = users.map((u) => u._id);
  const activeBans = await Ban.find({
    userId: { $in: userIds },
    isActive: true,
    $or: [{ expiresAt: { $gt: new Date() } }, { type: 'permanent' }],
  }).lean();

  const bannedUserIds = new Set(activeBans.map((b) => b.userId.toString()));

  const usersWithBanStatus = users.map((user) => ({
    ...user,
    isBanned: bannedUserIds.has(user._id.toString()),
    activeBan: activeBans.find((b) => b.userId.toString() === user._id.toString()) || null,
  }));

  return {
    users: usersWithBanStatus,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserDetail(userId: string): Promise<any> {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new NotFoundError('User not found');

  const [sessions, payments, reports, bans] = await Promise.all([
    Session.find({ userId, isActive: true }).sort({ lastActivity: -1 }).lean(),
    Payment.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    Report.find({ targetId: userId, targetType: 'user' }).sort({ createdAt: -1 }).limit(10).lean(),
    Ban.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  return { user: user.toJSON(), sessions, payments, reports, bans };
}

export async function banUser(
  adminId: string,
  userId: string,
  type: 'temporary' | 'permanent',
  reason: string,
  durationDays?: number,
  ipAddress?: string,
): Promise<any> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  // Check for existing active ban — return 409 Conflict
  const existingBan = await Ban.findOne({
    userId,
    isActive: true,
    $or: [{ expiresAt: { $gt: new Date() } }, { type: 'permanent' }],
  });

  if (existingBan) {
    throw new ConflictError('User is already banned. Remove the existing ban first.');
  }

  let expiresAt: Date | null = null;
  if (type === 'temporary' && durationDays) {
    expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  }

  const ban = await Ban.create({
    userId,
    bannedBy: adminId,
    type,
    reason,
    duration: durationDays || null,
    expiresAt,
    isActive: true,
  });

  await Session.updateMany({ userId, isActive: true }, { isActive: false, loggedOutAt: new Date() });

  await ModerationLog.create({
    adminId,
    action: 'user_banned',
    targetType: 'user',
    targetId: userId,
    details: `${type} ban: ${reason}`,
    ipAddress: ipAddress || '',
  });

  return ban;
}

export async function unbanUser(
  adminId: string,
  userId: string,
  reason?: string,
  ipAddress?: string,
): Promise<void> {
  const ban = await Ban.findOne({
    userId,
    isActive: true,
    $or: [{ expiresAt: { $gt: new Date() } }, { type: 'permanent' }],
  });

  if (!ban) throw new NotFoundError('No active ban found');

  ban.isActive = false;
  ban.liftedBy = adminId;
  ban.liftedAt = new Date();
  ban.liftReason = reason || '';
  await ban.save();

  await ModerationLog.create({
    adminId,
    action: 'user_unbanned',
    targetType: 'user',
    targetId: userId,
    details: reason || 'Ban lifted',
    ipAddress: ipAddress || '',
  });
}

export async function forceLogout(userId: string, adminId: string): Promise<void> {
  await Session.updateMany({ userId, isActive: true }, { isActive: false, loggedOutAt: new Date() });

  await ModerationLog.create({
    adminId,
    action: 'user_suspended',
    targetType: 'user',
    targetId: userId,
    details: 'Force logout all sessions',
  });
}

export async function permanentlyDeleteUser(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  await Promise.all([
    require('../../models/client/Message').default.deleteMany({ senderId: userId }),
    require('../../models/client/Chat').default.updateMany({ participants: userId }, { $pull: { participants: userId } }),
    require('../../models/client/Group').default.updateMany({ members: userId }, { $pull: { members: userId, admins: userId } }),
    require('../../models/client/Contact').default.deleteMany({ $or: [{ userId }, { contactUserId: userId }] }),
    require('../../models/client/Status').default.deleteMany({ userId }),
    require('../../models/client/Call').default.deleteMany({ $or: [{ callerId: userId }, { receiverId: userId }] }),
    Payment.deleteMany({ userId }),
    require('../../models/client/PendingActivation').default.deleteMany({ userId }),
    require('../../models/client/Backup').default.deleteMany({ userId }),
    Session.deleteMany({ userId }),
    require('../../models/client/Notification').default.deleteMany({ userId }),
    Report.deleteMany({ $or: [{ reporterId: userId }, { targetId: userId }] }),
    Ban.deleteMany({ userId }),
    require('../../models/admin/Warning').default.deleteMany({ userId }),
  ]);

  await User.findByIdAndDelete(userId);
  logger.info(`User permanently deleted: ${userId}`);
}