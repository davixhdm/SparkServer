import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  userId: Schema.Types.ObjectId;
  subject: string;
  description: string;
  category: 'general' | 'technical' | 'billing' | 'account' | 'privacy' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assignedTo: Schema.Types.ObjectId | null;
  messages: Array<{
    senderId: Schema.Types.ObjectId;
    senderType: 'user' | 'admin';
    message: string;
    attachments: string[];
    createdAt: Date;
  }>;
  attachments: string[];
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      enum: ['general', 'technical', 'billing', 'account', 'privacy', 'other'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'],
      default: 'open',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    messages: [
      {
        senderId: { type: Schema.Types.ObjectId, required: true },
        senderType: { type: String, enum: ['user', 'admin'], required: true },
        message: { type: String, required: true },
        attachments: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attachments: [{ type: String }],
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
export default Ticket;