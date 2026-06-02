import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: Schema.Types.ObjectId;
  type: 'message' | 'call' | 'status' | 'group_invite' | 'mention' | 'reaction' | 'system' | 'payment';
  title: string;
  body: string;
  data: Record<string, any>;
  isRead: boolean;
  isPushSent: boolean;
  chatId: Schema.Types.ObjectId | null;
  messageId: Schema.Types.ObjectId | null;
  actionUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['message', 'call', 'status', 'group_invite', 'mention', 'reaction', 'system', 'payment'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    isPushSent: { type: Boolean, default: false },
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', default: null },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    actionUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;