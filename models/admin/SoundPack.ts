import mongoose, { Schema, Document } from 'mongoose';

export interface ISoundPack extends Document {
  name: string;
  description: string;
  author: string;
  coverImage: string;
  sounds: Array<{
    name: string;
    fileUrl: string;
    category: 'notification' | 'call' | 'message' | 'system';
    duration: number;
    fileSize: number;
  }>;
  isActive: boolean;
  isDefault: boolean;
  downloads: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const soundPackSchema = new Schema<ISoundPack>(
  {
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    author: { type: String, default: 'HDM' },
    coverImage: { type: String, default: '' },
    sounds: [
      {
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        category: {
          type: String,
          enum: ['notification', 'call', 'message', 'system'],
          default: 'notification',
        },
        duration: { type: Number, default: 0 },
        fileSize: { type: Number, default: 0 },
      },
    ],
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    downloads: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  {
    timestamps: true,
  },
);

soundPackSchema.index({ isActive: 1, downloads: -1 });

const SoundPack = mongoose.model<ISoundPack>('SoundPack', soundPackSchema);
export default SoundPack;