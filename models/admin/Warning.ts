import mongoose, { Schema, Document } from 'mongoose';

export interface IWarning extends Document {
  userId: Schema.Types.ObjectId;
  issuedBy: Schema.Types.ObjectId;
  type: 'spam' | 'harassment' | 'inappropriate_content' | 'terms_violation' | 'other';
  message: string;
  templateId: string;
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  relatedReportId: Schema.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const warningSchema = new Schema<IWarning>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    type: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate_content', 'terms_violation', 'other'],
      required: true,
    },
    message: { type: String, required: true },
    templateId: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    isRead: { type: Boolean, default: false },
    relatedReportId: { type: Schema.Types.ObjectId, ref: 'Report', default: null },
  },
  {
    timestamps: true,
  },
);

warningSchema.index({ userId: 1, createdAt: -1 });

const Warning = mongoose.model<IWarning>('Warning', warningSchema);
export default Warning;