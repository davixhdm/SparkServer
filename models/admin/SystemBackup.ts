import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemBackup extends Document {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  backupType: 'full' | 'incremental' | 'chats_only' | 'media_only';
  collections: string[];
  includesMedia: boolean;
  isEncrypted: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  compressionType: 'gzip' | 'zlib' | 'none';
  checksum: string;
  errorMessage: string;
  startedAt: Date | null;
  completedAt: Date | null;
  retentionDays: number;
  expiresAt: Date;
  createdBy: Schema.Types.ObjectId | null;
  metadata: {
    totalUsers: number;
    totalMessages: number;
    totalChats: number;
    totalGroups: number;
    databaseSize: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const systemBackupSchema = new Schema<ISystemBackup>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    backupType: {
      type: String,
      enum: ['full', 'incremental', 'chats_only', 'media_only'],
      default: 'full',
    },
    collections: [{ type: String }],
    includesMedia: { type: Boolean, default: true },
    isEncrypted: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    compressionType: {
      type: String,
      enum: ['gzip', 'zlib', 'none'],
      default: 'gzip',
    },
    checksum: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    retentionDays: { type: Number, default: 90 },
    expiresAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    metadata: {
      type: new Schema(
        {
          totalUsers: { type: Number, default: 0 },
          totalMessages: { type: Number, default: 0 },
          totalChats: { type: Number, default: 0 },
          totalGroups: { type: Number, default: 0 },
          databaseSize: { type: String, default: '0 MB' },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

systemBackupSchema.index({ status: 1, createdAt: -1 });
systemBackupSchema.index({ backupType: 1 });
systemBackupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SystemBackup = mongoose.model<ISystemBackup>('SystemBackup', systemBackupSchema);
export default SystemBackup;