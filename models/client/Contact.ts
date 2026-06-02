import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  userId: Schema.Types.ObjectId;
  contactPhone: string;
  contactName: string;
  contactUserId: Schema.Types.ObjectId | null;
  isOnSpark: boolean;
  isBlocked: boolean;
  isFavorite: boolean;
  isSynced: boolean;
  labels: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactPhone: { type: String, required: true },
    contactName: { type: String, required: true, maxlength: 100 },
    contactUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isOnSpark: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    isSynced: { type: Boolean, default: false },
    labels: [{ type: String }],
    notes: { type: String, default: '', maxlength: 500 },
  },
  {
    timestamps: true,
  },
);

contactSchema.index({ userId: 1, contactPhone: 1 }, { unique: true });
contactSchema.index({ userId: 1, isOnSpark: 1 });
contactSchema.index({ userId: 1, isBlocked: 1 });

const Contact = mongoose.model<IContact>('Contact', contactSchema);
export default Contact;