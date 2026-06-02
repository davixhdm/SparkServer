import Status from '../../models/client/Status';
import User from '../../models/client/User';
import Contact from '../../models/client/Contact';
import { deleteFile } from '../external/cloudinaryService';
import { logger } from '../../utils/logger';
import env from '../../config/env';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export async function createStatus(
  userId: string,
  options: {
    content?: string;
    media?: string;
    mediaUrl?: string;
    caption?: string;
    backgroundColor?: string;
    privacy?: 'all' | 'selected' | 'except';
    selectedContacts?: string[];
    exceptContacts?: string[];
  },
): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  const activeStatusCount = await Status.countDocuments({
    userId,
    expiresAt: { $gt: new Date() },
    isDeleted: false,
  });

  if (options.mediaUrl && activeStatusCount >= env.STATUS_MAX_IMAGES) {
    throw new BadRequestError(`Maximum ${env.STATUS_MAX_IMAGES} status updates allowed`);
  }

  const expiresAt = new Date(Date.now() + env.STATUS_EXPIRE_HOURS * 60 * 60 * 1000);

  const status = await Status.create({
    userId,
    content: options.content || '',
    media: options.media || '',
    mediaUrl: options.mediaUrl || '',
    caption: options.caption || '',
    backgroundColor: options.backgroundColor || '#1A73E8',
    privacy: options.privacy || 'all',
    selectedContacts: options.selectedContacts || [],
    exceptContacts: options.exceptContacts || [],
    expiresAt,
  });

  return status;
}

export async function getStatusFeed(userId: string): Promise<any[]> {
  const contacts = await Contact.find({ userId, isOnSpark: true }).select('contactUserId');
  const contactIds = contacts.map((c) => c.contactUserId).filter(Boolean);

  const relevantUserIds = [...new Set([userId, ...contactIds])];

  const statuses = await Status.find({
    userId: { $in: relevantUserIds },
    expiresAt: { $gt: new Date() },
    isDeleted: false,
  })
    .populate('userId', 'displayName avatar isHdmVerified status')
    .sort({ createdAt: -1 })
    .lean();

  const filteredStatuses = statuses.filter((status) => {
    if (status.userId._id.toString() === userId) return true;
    if (status.privacy === 'all') return true;
    if (status.privacy === 'selected') {
      return status.selectedContacts.some((id: any) => id.toString() === userId);
    }
    if (status.privacy === 'except') {
      return !status.exceptContacts.some((id: any) => id.toString() === userId);
    }
    return true;
  });

  const grouped: Record<string, any> = {};
  for (const status of filteredStatuses) {
    const uid = status.userId._id.toString();
    if (!grouped[uid]) {
      grouped[uid] = {
        user: status.userId,
        statuses: [],
      };
    }
    grouped[uid].statuses.push(status);
  }

  return Object.values(grouped);
}

export async function viewStatus(statusId: string, userId: string): Promise<{ viewerCount: number }> {
  const status = await Status.findById(statusId);
  if (!status || status.isDeleted) throw new NotFoundError('Status not found');

  // Don't record view if user is the owner
  if (status.userId.toString() !== userId) {
    if (!status.viewers.some((v) => v.toString() === userId)) {
      status.viewers.push(userId as any);
      await status.save();
    }
  }

  return { viewerCount: status.viewers.length };
}

export async function getStatusViewers(statusId: string, userId: string): Promise<any> {
  const status = await Status.findOne({ _id: statusId });
  if (!status) throw new NotFoundError('Status not found');

  // Only the status owner can see viewers
  const isOwner = status.userId.toString() === userId;
  
  if (!isOwner) {
    return {
      viewers: [],
      viewerCount: status.viewers.length,
      canView: false
    };
  }

  const populatedStatus = await Status.findById(statusId)
    .populate('viewers', 'displayName avatar phone isHdmVerified')
    .lean();

  return {
    viewers: populatedStatus?.viewers || [],
    viewerCount: populatedStatus?.viewers?.length || 0,
    canView: true
  };
}

export async function reactToStatus(statusId: string, userId: string, emoji: string): Promise<any> {
  const status = await Status.findById(statusId);
  if (!status || status.isDeleted) throw new NotFoundError('Status not found');

  const existingReaction = status.reactions.find((r) => r.userId.toString() === userId);
  if (existingReaction) {
    existingReaction.emoji = emoji;
  } else {
    status.reactions.push({ userId: userId as any, emoji, createdAt: new Date() });
  }

  await status.save();
  return status;
}

export async function replyToStatus(statusId: string, userId: string, message: string): Promise<any> {
  const status = await Status.findById(statusId);
  if (!status || status.isDeleted) throw new NotFoundError('Status not found');

  status.replies.push({ userId: userId as any, message, createdAt: new Date() });
  await status.save();
  return status;
}

export async function deleteStatus(statusId: string, userId: string): Promise<void> {
  const status = await Status.findOne({ _id: statusId, userId });
  if (!status) throw new NotFoundError('Status not found');

  if (status.mediaUrl) {
    const publicId = extractPublicId(status.mediaUrl);
    if (publicId) await deleteFile(publicId);
  }

  status.isDeleted = true;
  await status.save();
}

export async function muteUserStatus(userId: string, targetUserId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (!user.mutedStatuses.some((id) => id.toString() === targetUserId)) {
    user.mutedStatuses.push(targetUserId as any);
    await user.save();
  }
}

export async function unmuteUserStatus(userId: string, targetUserId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $pull: { mutedStatuses: targetUserId },
  });
}

function extractPublicId(url: string): string | null {
  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}