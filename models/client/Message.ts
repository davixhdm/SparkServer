import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'gif';
  media: string;
  mediaUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  fileName: string;
  mimeType: string;
  location: { latitude: number; longitude: number; address: string };
  contact: { name: string; phone: string };
  replyTo: Schema.Types.ObjectId | null;
  forwardedFrom: Schema.Types.ObjectId | null;
  forwardedFromType: 'user' | 'group' | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  deliveredTo: Schema.Types.ObjectId[];
  readBy: Schema.Types.ObjectId[];
  reactions: Array<{ userId: Schema.Types.ObjectId; emoji: string; createdAt: Date }>;
  isEdited: boolean;
  editedAt: Date | null;
  isDeleted: boolean;
  deletedFor: Schema.Types.ObjectId[];
  deletedForEveryone: boolean;
  isPinned: boolean;
  isStarred: boolean;
  selfDestructAt: Date | null;
  scheduledAt: Date | null;
  isAiGenerated: boolean;
  aiMetadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    messageType: { type: String, enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'gif'], default: 'text' },
    media: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    location: { type: new Schema({ latitude: Number, longitude: Number, address: String }, { _id: false }), default: null },
    contact: { type: new Schema({ name: String, phone: String }, { _id: false }), default: null },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    forwardedFrom: { type: Schema.Types.ObjectId, default: null },
    forwardedFromType: { type: String, enum: ['user', 'group', null], default: null },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactions: [{ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, emoji: { type: String, required: true }, createdAt: { type: Date, default: Date.now } }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedForEveryone: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    selfDestructAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    isAiGenerated: { type: Boolean, default: false },
    aiMetadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });
messageSchema.index({ scheduledAt: 1 }, { sparse: true });
messageSchema.index({ selfDestructAt: 1 }, { sparse: true });

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;