import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterId: Schema.Types.ObjectId;
  targetType: 'message' | 'status' | 'profile' | 'group';
  targetId: Schema.Types.ObjectId;
  reason: 'spam' | 'harassment' | 'nudity' | 'violence' | 'hate_speech' | 'other';
  description: string;
  contextMessages: Array<{
    senderId: Schema.Types.ObjectId;
    content: string;
    timestamp: Date;
  }>;
  isAnonymous: boolean;
  status: 'submitted' | 'under_review' | 'resolved' | 'dismissed';
  assignedTo: Schema.Types.ObjectId | null;
  resolution: string;
  actionTaken: 'none' | 'warning' | 'content_removed' | 'user_banned' | 'dismissed';
  resolvedBy: Schema.Types.ObjectId | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['message', 'status', 'profile', 'group'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'nudity', 'violence', 'hate_speech', 'other'],
      required: true,
    },
    description: { type: String, default: '', maxlength: 1000 },
    contextMessages: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        content: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isAnonymous: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'resolved', 'dismissed'],
      default: 'submitted',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    resolution: { type: String, default: '' },
    actionTaken: {
      type: String,
      enum: ['none', 'warning', 'content_removed', 'user_banned', 'dismissed'],
      default: 'none',
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

const Report = mongoose.model<IReport>('Report', reportSchema);
export default Report;