import mongoose, { Schema, Document } from 'mongoose';

export interface IDeepLink extends Document {
  platform: 'spark' | 'vibe';
  name: string;
  description: string;
  urlScheme: string;
  iosScheme: string;
  androidScheme: string;
  webFallback: string;
  parameters: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deepLinkSchema = new Schema<IDeepLink>(
  {
    platform: { type: String, enum: ['spark', 'vibe'], required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    urlScheme: { type: String, required: true },
    iosScheme: { type: String, default: '' },
    androidScheme: { type: String, default: '' },
    webFallback: { type: String, default: '' },
    parameters: [
      {
        name: { type: String, required: true },
        required: { type: Boolean, default: false },
        description: { type: String, default: '' },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

deepLinkSchema.index({ platform: 1, name: 1 }, { unique: true });

const DeepLink = mongoose.model<IDeepLink>('DeepLink', deepLinkSchema);
export default DeepLink;