import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  phone: string;
  email?: string;
  username?: string;
  displayName: string;
  bio: string;
  avatar: string;
  password?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isHdmVerified: boolean;
  hdmVerifiedPlan: 'monthly' | 'yearly' | 'permanent' | null;
  hdmVerifiedExpiresAt: Date | null;
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    about: 'everyone' | 'contacts' | 'nobody';
    status: 'all' | 'selected' | 'except';
    readReceipts: boolean;
    typingIndicator: boolean;
    onlineStatus: boolean;
    freezeLastSeen: boolean;
    hideBlueTicks: boolean;
    hideDoubleTicks: boolean;
    hideTyping: boolean;
    hideRecording: boolean;
    antiDeleteMessages: boolean;
    antiDeleteStatus: boolean;
    ghostMode: boolean;
  };
  privacyProfiles: Array<{
    name: string;
    config: Record<string, any>;
  }>;
  blockedContacts: Schema.Types.ObjectId[];
  mutedChats: Array<{
    chatId: Schema.Types.ObjectId;
    until: Date | null;
  }>;
  mutedStatuses: Schema.Types.ObjectId[];
  contacts: Schema.Types.ObjectId[];
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const privacySchema = new Schema(
  {
    lastSeen: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    profilePhoto: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    about: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    status: { type: String, enum: ['all', 'selected', 'except'], default: 'all' },
    readReceipts: { type: Boolean, default: true },
    typingIndicator: { type: Boolean, default: true },
    onlineStatus: { type: Boolean, default: true },
    freezeLastSeen: { type: Boolean, default: false },
    hideBlueTicks: { type: Boolean, default: false },
    hideDoubleTicks: { type: Boolean, default: false },
    hideTyping: { type: Boolean, default: false },
    hideRecording: { type: Boolean, default: false },
    antiDeleteMessages: { type: Boolean, default: false },
    antiDeleteStatus: { type: Boolean, default: false },
    ghostMode: { type: Boolean, default: false },
  },
  { _id: false },
);

const privacyProfileSchema = new Schema(
  {
    name: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: true },
);

const mutedChatSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    until: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, sparse: true, unique: true, trim: true, lowercase: true },
    username: { type: String, sparse: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 30 },
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    bio: { type: String, default: '', maxlength: 200 },
    avatar: { type: String, default: '' },
    password: { type: String, select: false },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isHdmVerified: { type: Boolean, default: false },
    hdmVerifiedPlan: { type: String, enum: ['monthly', 'yearly', 'permanent', null], default: null },
    hdmVerifiedExpiresAt: { type: Date, default: null },
    privacy: { type: privacySchema, default: () => ({}) },
    privacyProfiles: { type: [privacyProfileSchema], default: [] },
    blockedContacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mutedChats: { type: [mutedChatSchema], default: [] },
    mutedStatuses: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ phone: 1, isDeleted: 1 });
userSchema.index({ isHdmVerified: 1 });
userSchema.index({ 'privacy.ghostMode': 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;