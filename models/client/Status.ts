import mongoose, { Schema, Document } from 'mongoose';

export interface IStatus extends Document {
  userId: Schema.Types.ObjectId;
  content: string;
  media: string;
  mediaUrl: string;
  caption: string;
  backgroundColor: string;
  privacy: 'all' | 'selected' | 'except';
  selectedContacts: Schema.Types.ObjectId[];
  exceptContacts: Schema.Types.ObjectId[];
  viewers: Schema.Types.ObjectId[];
  reactions: Array<{ userId: Schema.Types.ObjectId; emoji: string; createdAt: Date }>;
  replies: Array<{ userId: Schema.Types.ObjectId; message: string; createdAt: Date }>;
  expiresAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const statusSchema = new Schema<IStatus>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '' },
    media: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    caption: { type: String, default: '', maxlength: 200 },
    backgroundColor: { type: String, default: '#1A73E8' },
    privacy: { type: String, enum: ['all', 'selected', 'except'], default: 'all' },
    selectedContacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    exceptContacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactions: [{ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, emoji: { type: String, required: true }, createdAt: { type: Date, default: Date.now } }],
    replies: [{ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, message: { type: String, required: true }, createdAt: { type: Date, default: Date.now } }],
    expiresAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

statusSchema.index({ userId: 1, createdAt: -1 });

const Status = mongoose.model<IStatus>('Status', statusSchema);
export default Status;