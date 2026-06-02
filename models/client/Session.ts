import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: Schema.Types.ObjectId;
  token: string;
  refreshToken: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    os: string;
    browser: string;
    ip: string;
    location: string;
  };
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  loggedOutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true },
    refreshToken: { type: String, required: true },
    deviceInfo: {
      type: new Schema(
        {
          deviceId: { type: String, default: '' },
          deviceName: { type: String, default: '' },
          deviceType: { type: String, default: '' },
          os: { type: String, default: '' },
          browser: { type: String, default: '' },
          ip: { type: String, default: '' },
          location: { type: String, default: '' },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    isActive: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    loggedOutAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index({ token: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ 'deviceInfo.deviceId': 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model<ISession>('Session', sessionSchema);
export default Session;