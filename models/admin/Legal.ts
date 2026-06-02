import mongoose, { Schema, Document } from 'mongoose';

export interface ILegal extends Document {
  type: 'terms' | 'privacy' | 'cookies' | 'ads_preferences';
  title: string;
  content: string;
  version: number;
  publishedAt: Date | null;
  isPublished: boolean;
  lastEditedBy: Schema.Types.ObjectId | null;
  history: Array<{
    version: number;
    content: string;
    editedBy: Schema.Types.ObjectId | null;
    editedAt: Date;
    notes: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const legalSchema = new Schema<ILegal>(
  {
    type: {
      type: String,
      enum: ['terms', 'privacy', 'cookies', 'ads_preferences'],
      required: true,
      unique: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true, default: '' },
    version: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: false },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    history: [
      {
        version: { type: Number, required: true },
        content: { type: String, required: true },
        editedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
        editedAt: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true },
);

const Legal = mongoose.model<ILegal>('Legal', legalSchema);
export default Legal;