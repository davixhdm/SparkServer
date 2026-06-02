import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  participants: Schema.Types.ObjectId[];
  isGroup: boolean;
  groupName: string;
  groupIcon: string;
  groupDescription: string;
  groupAdmins: Schema.Types.ObjectId[];
  groupInviteLink: string;
  groupPrivacy: 'open' | 'closed';
  lastMessage: {
    content: string;
    senderId: Schema.Types.ObjectId;
    messageType: string;
    createdAt: Date;
  };
  pinnedMessages: Schema.Types.ObjectId[];
  wallpaper: string;
  createdBy: Schema.Types.ObjectId;
  isArchived: Schema.Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  unreadCount?: number; // This will be virtual
}

const chatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, default: '', maxlength: 100 },
    groupIcon: { type: String, default: '' },
    groupDescription: { type: String, default: '', maxlength: 500 },
    groupAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    groupInviteLink: { type: String, default: '' },
    groupPrivacy: { type: String, enum: ['open', 'closed'], default: 'closed' },
    lastMessage: {
      type: new Schema(
        {
          content: { type: String, default: '' },
          senderId: { type: Schema.Types.ObjectId, ref: 'User' },
          messageType: { type: String, default: 'text' },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: false },
      ),
      default: null,
    },
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    wallpaper: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isArchived: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Add virtual field for unreadCount (calculated dynamically)
chatSchema.virtual('unreadCount').get(function() {
  // This will be populated by the service layer
  return this._unreadCount || 0;
});

chatSchema.index({ participants: 1 });
chatSchema.index({ 'lastMessage.createdAt': -1 });
chatSchema.index({ isGroup: 1 });

const Chat = mongoose.model<IChat>('Chat', chatSchema);
export default Chat;