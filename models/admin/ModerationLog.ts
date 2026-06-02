import mongoose, { Schema, Document } from 'mongoose';

export interface IModerationLog extends Document {
  adminId: Schema.Types.ObjectId;
  action: 'warning_issued' | 'content_removed' | 'user_banned' | 'user_unbanned' | 'report_resolved' | 'report_dismissed' | 'verification_granted' | 'verification_revoked' | 'user_suspended' | 'user_reactivated';
  targetType: 'user' | 'message' | 'group' | 'report' | 'status';
  targetId: Schema.Types.ObjectId;
  details: string;
  metadata: Record<string, any>;
  ipAddress: string;
  createdAt: Date;
}

const moderationLogSchema = new Schema<IModerationLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    action: {
      type: String,
      enum: [
        'warning_issued',
        'content_removed',
        'user_banned',
        'user_unbanned',
        'report_resolved',
        'report_dismissed',
        'verification_granted',
        'verification_revoked',
        'user_suspended',
        'user_reactivated',
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'message', 'group', 'report', 'status'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    details: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

moderationLogSchema.index({ adminId: 1, createdAt: -1 });
moderationLogSchema.index({ action: 1, createdAt: -1 });
moderationLogSchema.index({ targetType: 1, targetId: 1 });

const ModerationLog = mongoose.model<IModerationLog>('ModerationLog', moderationLogSchema);
export default ModerationLog;