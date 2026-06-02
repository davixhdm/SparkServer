import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import SystemBackup from '../../models/admin/SystemBackup';
import Settings from '../../models/admin/Settings';
import ModerationLog from '../../models/admin/ModerationLog';
import User from '../../models/client/User';
import Message from '../../models/client/Message';
import Chat from '../../models/client/Chat';
import Group from '../../models/client/Group';
import Status from '../../models/client/Status';
import Call from '../../models/client/Call';
import Payment from '../../models/client/Payment';
import Report from '../../models/admin/Report';
import Ticket from '../../models/admin/Ticket';
import { uploadDocument } from '../external/cloudinaryService';
import { logger } from '../../utils/logger';
import env from '../../config/env';
import { NotFoundError, BadRequestError } from '../../utils/errors';

const execAsync = promisify(exec);
const BACKUP_DIR = path.resolve(__dirname, '..', '..', 'backups');

function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function extractPublicId(url: string): string | null {
  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

export async function createSystemBackup(
  adminId: string,
  options: {
    backupType?: 'full' | 'incremental' | 'chats_only' | 'media_only';
    collections?: string[];
    includesMedia?: boolean;
    compressionType?: 'gzip' | 'zlib' | 'none';
    ipAddress?: string;
  } = {},
): Promise<any> {
  ensureBackupDir();

  const backupType = options.backupType || 'full';
  const compressionType = options.compressionType || 'gzip';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `spark_system_backup_${backupType}_${timestamp}.json`;

  const expiresAt = new Date(Date.now() + env.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const backup = await SystemBackup.create({
    fileName,
    fileUrl: '',
    fileSize: 0,
    backupType,
    collections: options.collections || [],
    includesMedia: options.includesMedia ?? true,
    isEncrypted: env.BACKUP_ENCRYPTION_ENABLED,
    status: 'in_progress',
    compressionType,
    checksum: '',
    startedAt: new Date(),
    retentionDays: env.BACKUP_RETENTION_DAYS,
    expiresAt,
    createdBy: adminId !== 'system' ? adminId : null,
    metadata: {
      totalUsers: 0,
      totalMessages: 0,
      totalChats: 0,
      totalGroups: 0,
      databaseSize: '0 MB',
    },
  });

  try {
    const [totalUsers, totalMessages, totalChats, totalGroups] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Message.countDocuments({ deletedForEveryone: false }),
      Chat.countDocuments({ isDeleted: false }),
      Group.countDocuments({ isDeleted: false }),
    ]);

    backup.metadata = {
      totalUsers,
      totalMessages,
      totalChats,
      totalGroups,
      databaseSize: 'Calculating...',
    };

    const backupData: Record<string, any> = {
      metadata: {
        appName: env.APP_NAME,
        appVersion: env.APP_VERSION,
        backupType,
        createdAt: new Date().toISOString(),
        createdBy: adminId,
        stats: { totalUsers, totalMessages, totalChats, totalGroups },
      },
      collections: {},
    };

    const collectionsToBackup = options.collections?.length
      ? options.collections
      : ['users', 'messages', 'chats', 'groups', 'statuses', 'calls', 'payments', 'reports', 'tickets'];

    if (collectionsToBackup.includes('users')) {
      const users = await User.find({ isDeleted: false }).select('-password -__v').lean();
      backupData.collections.users = users;
    }

    if (collectionsToBackup.includes('settings')) {
      const settings = await Settings.findOne().lean();
      backupData.collections.settings = settings;
    }

    if (collectionsToBackup.includes('groups')) {
      const groups = await Group.find({ isDeleted: false }).lean();
      backupData.collections.groups = groups;
    }

    if (collectionsToBackup.includes('chats')) {
      const chats = await Chat.find({ isDeleted: false }).select('-__v').lean();
      backupData.collections.chats = chats;
    }

    if (collectionsToBackup.includes('messages')) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const messages = await Message.find({
        createdAt: { $gte: ninetyDaysAgo },
        deletedForEveryone: false,
      }).select('-__v').lean();
      backupData.collections.messages = messages;
    }

    if (collectionsToBackup.includes('statuses')) {
      const statuses = await Status.find({ isDeleted: false }).lean();
      backupData.collections.statuses = statuses;
    }

    if (collectionsToBackup.includes('calls')) {
      const calls = await Call.find({ isDeleted: false }).lean();
      backupData.collections.calls = calls;
    }

    if (collectionsToBackup.includes('payments')) {
      const payments = await Payment.find({}).lean();
      backupData.collections.payments = payments;
    }

    if (collectionsToBackup.includes('reports')) {
      const reports = await Report.find({}).lean();
      backupData.collections.reports = reports;
    }

    if (collectionsToBackup.includes('tickets')) {
      const tickets = await Ticket.find({}).lean();
      backupData.collections.tickets = tickets;
    }

    const localFilePath = path.join(BACKUP_DIR, fileName);
    const jsonString = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(localFilePath, jsonString, 'utf8');

    let finalFilePath = localFilePath;
    if (compressionType === 'gzip') {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(jsonString);
      const compressedFileName = fileName + '.gz';
      finalFilePath = path.join(BACKUP_DIR, compressedFileName);
      fs.writeFileSync(finalFilePath, compressed);
      backup.fileName = compressedFileName;
    }

    const stats = fs.statSync(finalFilePath);
    backup.fileSize = stats.size;
    backup.metadata.databaseSize = formatBytes(stats.size);

    const hash = crypto.createHash('sha256');
    const fileBuffer = fs.readFileSync(finalFilePath);
    hash.update(fileBuffer);
    backup.checksum = hash.digest('hex');

    // Check if cloud backup is enabled
    const isCloudBackupEnabled = process.env.CLOUD_BACKUP_ENABLED === 'true';
    
    if (env.CLOUDINARY && env.CLOUDINARY_CLOUD_NAME && isCloudBackupEnabled) {
      try {
        logger.info('Uploading system backup to Cloudinary...');
        const uploadResult = await uploadDocument(finalFilePath, 'system_backups');
        if (uploadResult.success) {
          backup.fileUrl = uploadResult.url;
          logger.info('System backup uploaded to Cloudinary successfully', { url: uploadResult.url });
        } else {
          logger.warn('System backup cloud upload failed', { error: uploadResult.error });
        }
      } catch (uploadError: any) {
        logger.warn('System backup cloud upload failed', { error: uploadError.message });
      }
    } else {
      logger.info('Cloud backup disabled (CLOUD_BACKUP_ENABLED=false), keeping backup locally only');
    }

    backup.status = 'completed';
    backup.completedAt = new Date();
    await backup.save();

    if (adminId !== 'system') {
      await ModerationLog.create({
        adminId,
        action: 'content_removed',
        targetType: 'user',
        targetId: adminId,
        details: `System backup created: ${backup.fileName} (${formatBytes(backup.fileSize)})`,
        ipAddress: options.ipAddress || '',
        metadata: { backupId: backup._id, backupType, fileSize: backup.fileSize },
      });
    }

    // Delete local file only if uploaded to Cloudinary successfully
    if (backup.fileUrl) {
      try { fs.unlinkSync(localFilePath); } catch {}
      if (finalFilePath !== localFilePath) { try { fs.unlinkSync(finalFilePath); } catch {} }
      logger.info('Local backup file deleted after cloud upload');
    } else {
      logger.info('Local backup file retained', { path: finalFilePath });
    }

    logger.info('System backup completed', { backupId: backup._id, fileName: backup.fileName });
    return backup;
  } catch (error: any) {
    logger.error('System backup failed', { error: error.message });
    backup.status = 'failed';
    backup.errorMessage = error.message;
    backup.completedAt = new Date();
    await backup.save();
    throw new Error(`System backup failed: ${error.message}`);
  }
}

export async function getBackupHistory(
  page: number = 1,
  limit: number = 20,
): Promise<any> {
  const skip = (page - 1) * limit;

  const backups = await SystemBackup.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'displayName email')
    .lean();

  const total = await SystemBackup.countDocuments();

  return { backups, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBackupById(backupId: string): Promise<any> {
  const backup = await SystemBackup.findById(backupId)
    .populate('createdBy', 'displayName email')
    .lean();

  if (!backup) throw new NotFoundError('Backup not found');
  return backup;
}

export async function deleteBackup(backupId: string): Promise<void> {
  const backup = await SystemBackup.findById(backupId);
  if (!backup) throw new NotFoundError('Backup not found');

  if (backup.fileUrl) {
    try {
      const publicId = extractPublicId(backup.fileUrl);
      if (publicId) {
        const { deleteFile } = require('../external/cloudinaryService');
        await deleteFile(publicId, 'raw');
      }
    } catch {}
  }

  await backup.deleteOne();
}

export async function restoreFromBackup(
  backupId: string,
  adminId: string,
  options: { collections?: string[]; dryRun?: boolean } = {},
): Promise<any> {
  const backup = await SystemBackup.findById(backupId);
  if (!backup) throw new NotFoundError('Backup not found');
  if (backup.status !== 'completed') throw new BadRequestError('Backup not in completed state');

  if (options.dryRun) {
    return {
      backup: { id: backup._id, fileName: backup.fileName, fileSize: backup.fileSize, createdAt: backup.createdAt, metadata: backup.metadata },
      message: 'Dry run — no data restored',
      collections: options.collections || ['users', 'messages', 'chats', 'groups'],
    };
  }

  let backupData: any;
  if (backup.fileUrl) {
    try {
      const response = await fetch(backup.fileUrl);
      const text = await response.text();
      if (backup.compressionType === 'gzip') {
        const zlib = require('zlib');
        const decompressed = zlib.gunzipSync(Buffer.from(text)).toString('utf8');
        backupData = JSON.parse(decompressed);
      } else {
        backupData = JSON.parse(text);
      }
    } catch (error: any) {
      throw new Error(`Failed to download backup: ${error.message}`);
    }
  }

  if (!backupData) throw new BadRequestError('Backup data not available');

  const modelMap: Record<string, any> = {
    users: User, messages: Message, chats: Chat, groups: Group,
  };

  const collectionsToRestore = options.collections || Object.keys(backupData.collections || {});
  const restored: string[] = [];
  const skipped: string[] = [];

  for (const collectionName of collectionsToRestore) {
    const data = backupData.collections[collectionName];
    if (!data || !Array.isArray(data) || data.length === 0) {
      skipped.push(collectionName);
      continue;
    }

    const Model = modelMap[collectionName];
    if (!Model) { skipped.push(collectionName); continue; }

    let restoredCount = 0;
    for (const doc of data) {
      try {
        if (doc._id) {
          await Model.findByIdAndUpdate(doc._id, { $set: doc }, { upsert: true });
          restoredCount++;
        }
      } catch {}
    }
    restored.push(`${collectionName} (${restoredCount}/${data.length})`);
  }

  await ModerationLog.create({
    adminId,
    action: 'content_removed',
    targetType: 'user',
    targetId: adminId,
    details: `System backup restored: ${backup.fileName}, Collections: ${restored.join(', ')}`,
  });

  return { backupId: backup._id, fileName: backup.fileName, restored, skipped };
}