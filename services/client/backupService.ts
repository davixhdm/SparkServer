import Backup from '../../models/client/Backup';
import User from '../../models/client/User';
import { logger } from '../../utils/logger';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import env from '../../config/env';

export async function createBackup(
  userId: string,
  options: {
    chatIds?: string[];
    includesMedia?: boolean;
    storageType?: 'local' | 'cloud';
    cloudProvider?: 'google_drive' | 'icloud' | 'hdm_cloud';
  },
): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  // Check storage limit
  const existingBackups = await Backup.find({ userId, status: 'completed' });
  let totalSize = existingBackups.reduce((sum, b) => sum + b.fileSize, 0);
  const maxSize = env.BACKUP_MAX_SIZE_MB * 1024 * 1024;

  if (totalSize >= maxSize) {
    throw new BadRequestError(`Backup storage limit of ${env.BACKUP_MAX_SIZE_MB}MB reached`);
  }

  const backup = await Backup.create({
    userId,
    fileName: `spark_backup_${userId}_${Date.now()}.json`,
    fileUrl: '',
    fileSize: 0,
    includesMedia: options.includesMedia ?? true,
    isEncrypted: env.BACKUP_ENCRYPTION_ENABLED,
    chatIds: options.chatIds || [],
    backupType: 'manual',
    storageType: options.storageType || 'local',
    cloudProvider: options.cloudProvider || null,
    status: 'pending',
    retentionDays: env.BACKUP_RETENTION_DAYS,
    expiresAt: new Date(Date.now() + env.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000),
  });

  return backup;
}

export async function getUserBackups(userId: string): Promise<any[]> {
  return Backup.find({ userId })
    .sort({ createdAt: -1 })
    .select('-__v')
    .lean();
}

export async function getBackupById(backupId: string, userId: string): Promise<any> {
  const backup = await Backup.findOne({ _id: backupId, userId });
  if (!backup) throw new NotFoundError('Backup not found');
  return backup;
}

export async function deleteBackup(backupId: string, userId: string): Promise<void> {
  const backup = await Backup.findOne({ _id: backupId, userId });
  if (!backup) throw new NotFoundError('Backup not found');

  await backup.deleteOne();
}

export async function updateBackupStatus(
  backupId: string,
  status: 'in_progress' | 'completed' | 'failed',
  fileUrl?: string,
  fileSize?: number,
  errorMessage?: string,
): Promise<any> {
  const backup = await Backup.findById(backupId);
  if (!backup) throw new NotFoundError('Backup not found');

  backup.status = status;
  if (fileUrl) backup.fileUrl = fileUrl;
  if (fileSize) backup.fileSize = fileSize;
  if (errorMessage) backup.errorMessage = errorMessage;

  await backup.save();
  return backup;
}