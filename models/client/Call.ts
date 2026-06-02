import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  chatId: Schema.Types.ObjectId;
  callerId: Schema.Types.ObjectId;
  receiverId: Schema.Types.ObjectId;
  callType: 'voice' | 'video';
  status: 'initiated' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined';
  duration: number;
  startedAt: Date | null;
  endedAt: Date | null;
  isGroup: boolean;
  participants: Schema.Types.ObjectId[];
  declinedBy: Schema.Types.ObjectId[];
  missedBy: Schema.Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    callType: { type: String, enum: ['voice', 'video'], required: true },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'ongoing', 'ended', 'missed', 'declined'],
      default: 'initiated',
    },
    duration: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    isGroup: { type: Boolean, default: false },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    declinedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    missedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });

const Call = mongoose.model<ICall>('Call', callSchema);
export default Call;