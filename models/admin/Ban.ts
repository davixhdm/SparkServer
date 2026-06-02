import mongoose, { Schema, Document } from 'mongoose';

export interface IBan extends Document {
  userId: Schema.Types.ObjectId;
  bannedBy: Schema.Types.ObjectId;
  type: 'temporary' | 'permanent';
  reason: string;
  duration: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  liftedBy: Schema.Types.ObjectId | null;
  liftedAt: Date | null;
  liftReason: string;
  relatedReportId: Schema.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const banSchema = new Schema<IBan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bannedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    type: { type: String, enum: ['temporary', 'permanent'], required: true },
    reason: { type: String, required: true },
    duration: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    liftedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    liftedAt: { type: Date, default: null },
    liftReason: { type: String, default: '' },
    relatedReportId: { type: Schema.Types.ObjectId, ref: 'Report', default: null },
  },
  {
    timestamps: true,
  },
);

banSchema.index({ userId: 1, isActive: 1 });
banSchema.index({ expiresAt: 1 }, { sparse: true });

const Ban = mongoose.model<IBan>('Ban', banSchema);
export default Ban;