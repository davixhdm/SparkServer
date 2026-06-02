import User from '../../models/client/User';
import Session from '../../models/client/Session';
import Contact from '../../models/client/Contact';
import Message from '../../models/client/Message';
import Chat from '../../models/client/Chat';
import Group from '../../models/client/Group';
import Status from '../../models/client/Status';
import Call from '../../models/client/Call';
import Payment from '../../models/client/Payment';
import PendingActivation from '../../models/client/PendingActivation';
import Backup from '../../models/client/Backup';
import Notification from '../../models/client/Notification';
import Report from '../../models/admin/Report';
import Ban from '../../models/admin/Ban';
import Warning from '../../models/admin/Warning';
import { deleteFile } from '../external/cloudinaryService';
import { logger } from '../../utils/logger';
import { NotFoundError, ConflictError } from '../../utils/errors';

export async function getUserById(userId: string): Promise<any> {
  const user = await User.findById(userId).select('-password');
  if (!user || user.isDeleted) throw new NotFoundError('User not found');
  return user;
}

export async function getUserByPhone(phone: string): Promise<any> {
  return User.findOne({ phone, isDeleted: false }).select('-password');
}

export async function getUserByUsername(username: string): Promise<any> {
  return User.findOne({ username: username.toLowerCase(), isDeleted: false }).select('-password');
}

export async function updateProfile(
  userId: string,
  updates: { displayName?: string; bio?: string; username?: string; email?: string; avatar?: string },
): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  if (updates.username) {
    const normalized = updates.username.toLowerCase();
    const existing = await User.findOne({ username: normalized, _id: { $ne: userId } });
    if (existing) throw new ConflictError('Username already taken');
    user.username = normalized;
  }

  if (updates.displayName) user.displayName = updates.displayName;
  if (updates.bio !== undefined) user.bio = updates.bio;
  if (updates.email) user.email = updates.email;
  if (updates.avatar) {
    if (user.avatar) {
      const publicId = extractPublicId(user.avatar);
      if (publicId) await deleteFile(publicId, 'image');
    }
    user.avatar = updates.avatar;
  }

  await user.save();
  return user.toJSON();
}

export async function updatePrivacySettings(userId: string, privacyUpdates: Record<string, any>): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  const allowedKeys = [
    'lastSeen', 'profilePhoto', 'about', 'status',
    'readReceipts', 'typingIndicator', 'onlineStatus',
    'freezeLastSeen', 'hideBlueTicks', 'hideDoubleTicks',
    'hideTyping', 'hideRecording', 'antiDeleteMessages',
    'antiDeleteStatus', 'ghostMode',
  ];

  for (const key of allowedKeys) {
    if (privacyUpdates[key] !== undefined) {
      (user.privacy as any)[key] = privacyUpdates[key];
    }
  }

  await user.save();
  return user.privacy;
}

export async function updatePresence(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
  await User.findByIdAndUpdate(userId, { status, lastSeen: new Date() });
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.phone = `deleted_${user._id}_${Date.now()}`;
  user.email = undefined;
  user.username = undefined;
  await user.save();

  await Session.updateMany({ userId, isActive: true }, { isActive: false, loggedOutAt: new Date() });
}

export async function permanentlyDeleteUser(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  await Promise.all([
    Message.deleteMany({ senderId: userId }),
    Chat.updateMany({ participants: userId }, { $pull: { participants: userId } }),
    Group.updateMany({ members: userId }, { $pull: { members: userId, admins: userId } }),
    Contact.deleteMany({ userId }),
    Contact.deleteMany({ contactUserId: userId }),
    Status.deleteMany({ userId }),
    Call.deleteMany({ $or: [{ callerId: userId }, { receiverId: userId }] }),
    Payment.deleteMany({ userId }),
    PendingActivation.deleteMany({ userId }),
    Backup.deleteMany({ userId }),
    Session.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    Report.deleteMany({ $or: [{ reporterId: userId }, { targetId: userId }] }),
    Ban.deleteMany({ userId }),
    Warning.deleteMany({ userId }),
  ]);

  if (user.avatar) {
    const publicId = extractPublicId(user.avatar);
    if (publicId) await deleteFile(publicId, 'image');
  }

  await User.findByIdAndDelete(userId);
  logger.info(`User permanently deleted: ${userId}`);
}

export async function getUserSessions(userId: string): Promise<any[]> {
  return Session.find({ userId, isActive: true })
    .sort({ lastActivity: -1 })
    .select('deviceInfo lastActivity createdAt');
}

export async function logoutSession(userId: string, sessionId: string): Promise<void> {
  await Session.findOneAndUpdate({ _id: sessionId, userId }, { isActive: false, loggedOutAt: new Date() });
}

function extractPublicId(url: string): string | null {
  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}