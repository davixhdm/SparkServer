import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  chatId: Schema.Types.ObjectId;
  name: string;
  icon: string;
  description: string;
  ownerId: Schema.Types.ObjectId;
  admins: Schema.Types.ObjectId[];
  members: Schema.Types.ObjectId[];
  memberCount: number;
  maxMembers: number;
  inviteLink: string;
  inviteCode: string;
  inviteLinkExpiresAt: Date | null;
  privacy: 'public' | 'private' | 'invite-only' | 'closed';
  joinApproval: 'auto' | 'admin';
  memberVisibility: 'all' | 'admins-only' | 'members-only';
  isMuted: boolean;
  mutedUntil: Date | null;
  restrictions: {
    sendMessages: boolean;
    sendMedia: boolean;
    sendLinks: boolean;
    addMembers: boolean;
    changeGroupInfo: boolean;
    pinMessages: boolean;
    deleteMessages: boolean;
  };
  permissions: {
    allowImages: boolean;
    allowVideos: boolean;
    allowDocuments: boolean;
    allowVoice: boolean;
    maxImageSize: number;
    maxVideoSize: number;
  };
  security: {
    disappearingMessages: boolean;
    disappearAfter: number;
    chatHistory: boolean;
    restrictForwarding: boolean;
    encryptMessages: boolean;
  };
  mediaGallery: Schema.Types.ObjectId[];
  pinnedMessages: Schema.Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, unique: true },
    name: { type: String, required: true, maxlength: 100 },
    icon: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 500 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    memberCount: { type: Number, default: 0 },
    maxMembers: { type: Number, default: 1024 },
    inviteLink: { type: String, default: '' },
    inviteCode: { type: String, default: '' },
    inviteLinkExpiresAt: { type: Date, default: null },
    privacy: { 
      type: String, 
      enum: ['public', 'private', 'invite-only', 'closed'], 
      default: 'private' 
    },
    joinApproval: { type: String, enum: ['auto', 'admin'], default: 'admin' },
    memberVisibility: { type: String, enum: ['all', 'admins-only', 'members-only'], default: 'all' },
    isMuted: { type: Boolean, default: false },
    mutedUntil: { type: Date, default: null },
    restrictions: {
      type: new Schema(
        {
          sendMessages: { type: Boolean, default: true },
          sendMedia: { type: Boolean, default: true },
          sendLinks: { type: Boolean, default: true },
          addMembers: { type: Boolean, default: true },
          changeGroupInfo: { type: Boolean, default: false },
          pinMessages: { type: Boolean, default: false },
          deleteMessages: { type: Boolean, default: false },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    permissions: {
      type: new Schema(
        {
          allowImages: { type: Boolean, default: true },
          allowVideos: { type: Boolean, default: true },
          allowDocuments: { type: Boolean, default: true },
          allowVoice: { type: Boolean, default: true },
          maxImageSize: { type: Number, default: 10 },
          maxVideoSize: { type: Number, default: 100 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    security: {
      type: new Schema(
        {
          disappearingMessages: { type: Boolean, default: false },
          disappearAfter: { type: Number, default: 86400 },
          chatHistory: { type: Boolean, default: true },
          restrictForwarding: { type: Boolean, default: false },
          encryptMessages: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    mediaGallery: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

groupSchema.index({ members: 1 });
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ inviteCode: 1 });

const Group = mongoose.model<IGroup>('Group', groupSchema);
export default Group;