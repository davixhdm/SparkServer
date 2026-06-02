import Message from '../../models/client/Message';
import Status from '../../models/client/Status';
import User from '../../models/client/User';
import Warning from '../../models/admin/Warning';
import Ban from '../../models/admin/Ban';
import ModerationLog from '../../models/admin/ModerationLog';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';

export async function getFlaggedMessages(
  page: number = 1,
  limit: number = 20,
): Promise<any> {
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    isDeleted: false,
    deletedForEveryone: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'displayName phone')
    .populate('chatId', 'groupName isGroup')
    .lean();

  const total = await Message.countDocuments({ isDeleted: false, deletedForEveryone: false });

  return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function removeContent(
  adminId: string,
  contentType: 'message' | 'status',
  contentId: string,
  reason: string,
  ipAddress?: string,
): Promise<void> {
  if (contentType === 'message') {
    const message = await Message.findByIdAndUpdate(
      contentId,
      { deletedForEveryone: true },
      { new: true },
    );
    if (!message) throw new NotFoundError('Message not found');

    await ModerationLog.create({
      adminId,
      action: 'content_removed',
      targetType: 'message',
      targetId: contentId,
      details: reason,
      ipAddress: ipAddress || '',
    });
  } else if (contentType === 'status') {
    const status = await Status.findByIdAndUpdate(
      contentId,
      { isDeleted: true },
      { new: true },
    );
    if (!status) throw new NotFoundError('Status not found');

    await ModerationLog.create({
      adminId,
      action: 'content_removed',
      targetType: 'status',
      targetId: contentId,
      details: reason,
      ipAddress: ipAddress || '',
    });
  }
}

export async function bulkRemoveUserContent(
  adminId: string,
  userId: string,
  ipAddress?: string,
): Promise<void> {
  await Message.updateMany(
    { senderId: userId },
    { deletedForEveryone: true },
  );

  await Status.updateMany(
    { userId },
    { isDeleted: true },
  );

  await ModerationLog.create({
    adminId,
    action: 'content_removed',
    targetType: 'user',
    targetId: userId,
    details: 'Bulk content removal',
    ipAddress: ipAddress || '',
  });
}

export async function warnUser(
  adminId: string,
  userId: string,
  type: string,
  message: string,
  severity: 'low' | 'medium' | 'high' = 'medium',
  reportId?: string,
): Promise<any> {
  const warning = await Warning.create({
    userId,
    issuedBy: adminId,
    type,
    message,
    severity,
    relatedReportId: reportId || null,
  });

  await ModerationLog.create({
    adminId,
    action: 'warning_issued',
    targetType: 'user',
    targetId: userId,
    details: `[${severity}] ${type}: ${message}`,
  });

  return warning;
}

export async function getModerationLogs(
  page: number = 1,
  limit: number = 50,
  adminId?: string,
): Promise<any> {
  const skip = (page - 1) * limit;
  const query: any = {};
  if (adminId) query.adminId = adminId;

  const logs = await ModerationLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('adminId', 'displayName email')
    .lean();

  const total = await ModerationLog.countDocuments(query);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBlockedWords(): Promise<string[]> {
  // Stored in admin settings — return from Settings model
  const Settings = require('../../models/admin/Settings').default;
  const settings = await Settings.findOne().select('blockedWords').lean();
  return settings?.blockedWords || [];
}

export async function addBlockedWord(word: string): Promise<void> {
  const Settings = require('../../models/admin/Settings').default;
  await Settings.findOneAndUpdate(
    {},
    { $addToSet: { blockedWords: word.toLowerCase() } },
    { upsert: true },
  );
}

export async function removeBlockedWord(word: string): Promise<void> {
  const Settings = require('../../models/admin/Settings').default;
  await Settings.findOneAndUpdate(
    {},
    { $pull: { blockedWords: word.toLowerCase() } },
  );
}