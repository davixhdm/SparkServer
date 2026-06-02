import mongoose, { Schema, Document } from 'mongoose';

export interface IBackup extends Document {
  userId: Schema.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  includesMedia: boolean;
  isEncrypted: boolean;
  chatIds: Schema.Types.ObjectId[];
  backupType: 'manual' | 'auto';
  storageType: 'local' | 'cloud';
  cloudProvider: 'google_drive' | 'icloud' | 'hdm_cloud' | null;
  status: 'in_progress' | 'completed' | 'failed';
  errorMessage: string;
  retentionDays: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const backupSchema = new Schema<IBackup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    includesMedia: { type: Boolean, default: true },
    isEncrypted: { type: Boolean, default: true },
    chatIds: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
    backupType: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    storageType: { type: String, enum: ['local', 'cloud'], default: 'local' },
    cloudProvider: {
      type: String,
      enum: ['google_drive', 'icloud', 'hdm_cloud', null],
      default: null,
    },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
    errorMessage: { type: String, default: '' },
    retentionDays: { type: Number, default: 90 },
    expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

backupSchema.index({ userId: 1, createdAt: -1 });
backupSchema.index({ status: 1 });

const Backup = mongoose.model<IBackup>('Backup', backupSchema);
export default Backup;