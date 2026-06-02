import User from '../../models/client/User';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export async function getPrivacySettings(userId: string): Promise<any> {
  const user = await User.findById(userId).select('privacy privacyProfiles');
  if (!user || user.isDeleted) throw new NotFoundError('User not found');
  return { privacy: user.privacy, profiles: user.privacyProfiles };
}

export async function updatePrivacy(
  userId: string,
  updates: Record<string, any>,
): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  const allowedFields = [
    'lastSeen', 'profilePhoto', 'about', 'status',
    'readReceipts', 'typingIndicator', 'onlineStatus',
    'freezeLastSeen', 'hideBlueTicks', 'hideDoubleTicks',
    'hideTyping', 'hideRecording', 'antiDeleteMessages',
    'antiDeleteStatus', 'ghostMode',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      (user.privacy as any)[field] = updates[field];
    }
  }

  // Ghost mode disables other visibility
  if (user.privacy.ghostMode) {
    user.privacy.onlineStatus = false;
    user.privacy.readReceipts = false;
    user.privacy.typingIndicator = false;
  }

  await user.save();
  return user.privacy;
}

export async function toggleGhostMode(userId: string): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  user.privacy.ghostMode = !user.privacy.ghostMode;

  if (user.privacy.ghostMode) {
    user.privacy.onlineStatus = false;
    user.privacy.readReceipts = false;
    user.privacy.typingIndicator = false;
    user.privacy.hideBlueTicks = true;
    user.privacy.hideDoubleTicks = true;
    user.privacy.hideTyping = true;
    user.privacy.hideRecording = true;
    user.privacy.freezeLastSeen = true;
  }

  await user.save();
  return user.privacy.ghostMode;
}

export async function freezeLastSeen(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  user.privacy.freezeLastSeen = true;
  await user.save();
}

export async function unfreezeLastSeen(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  user.privacy.freezeLastSeen = false;
  user.lastSeen = new Date();
  await user.save();
}

export async function savePrivacyProfile(
  userId: string,
  name: string,
  config: Record<string, any>,
): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  const existingIndex = user.privacyProfiles.findIndex((p) => p.name === name);

  if (existingIndex >= 0) {
    user.privacyProfiles[existingIndex].config = config;
  } else {
    user.privacyProfiles.push({ name, config });
  }

  await user.save();
  return user.privacyProfiles;
}

export async function applyPrivacyProfile(userId: string, profileName: string): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  const profile = user.privacyProfiles.find((p) => p.name === profileName);
  if (!profile) throw new NotFoundError('Privacy profile not found');

  const allowedFields = [
    'lastSeen', 'profilePhoto', 'about', 'status',
    'readReceipts', 'typingIndicator', 'onlineStatus',
    'freezeLastSeen', 'hideBlueTicks', 'hideDoubleTicks',
    'hideTyping', 'hideRecording', 'antiDeleteMessages',
    'antiDeleteStatus', 'ghostMode',
  ];

  for (const field of allowedFields) {
    if (profile.config[field] !== undefined) {
      (user.privacy as any)[field] = profile.config[field];
    }
  }

  await user.save();
  return user.privacy;
}

export async function deletePrivacyProfile(userId: string, profileName: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  user.privacyProfiles = user.privacyProfiles.filter((p) => p.name !== profileName);
  await user.save();
}

export async function getPerContactPrivacy(userId: string, contactId: string): Promise<any> {
  const user = await User.findById(userId).select('privacy blockedContacts mutedChats');
  if (!user) throw new NotFoundError('User not found');

  return {
    isBlocked: user.blockedContacts.some((id) => id.toString() === contactId),
    privacy: user.privacy,
  };
}