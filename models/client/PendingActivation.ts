import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingActivation extends Document {
  userId: Schema.Types.ObjectId;
  paymentId: Schema.Types.ObjectId;
  plan: 'monthly' | 'yearly' | 'permanent';
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'mpesa_stk_push' | 'mpesa_send_money' | 'mpesa_paybill' | 'mpesa_till' | 'paypal';
  paymentConfirmed: boolean;
  paymentConfirmedBy: 'stripe_webhook' | 'mpesa_callback' | 'admin_manual' | null;
  paymentDetails: {
    mpesaPhone: string;
    mpesaReference: string;
    stripeSessionId: string;
    transactionReference: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: Schema.Types.ObjectId | null;
  reviewedAt: Date | null;
  rejectionReason: string;
  expiresAt: Date;
  smsSent: boolean;
  emailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pendingActivationSchema = new Schema<IPendingActivation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    plan: {
      type: String,
      enum: ['monthly', 'yearly', 'permanent'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'mpesa_stk_push', 'mpesa_send_money', 'mpesa_paybill', 'mpesa_till', 'paypal'],
      required: true,
    },
    paymentConfirmed: { type: Boolean, default: false },
    paymentConfirmedBy: {
      type: String,
      enum: ['stripe_webhook', 'mpesa_callback', 'admin_manual', null],
      default: null,
    },
    paymentDetails: {
      type: new Schema(
        {
          mpesaPhone: { type: String, default: '' },
          mpesaReference: { type: String, default: '' },
          stripeSessionId: { type: String, default: '' },
          transactionReference: { type: String, default: '' },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    smsSent: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

pendingActivationSchema.index({ status: 1, createdAt: -1 });
pendingActivationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PendingActivation = mongoose.model<IPendingActivation>(
  'PendingActivation',
  pendingActivationSchema,
);
export default PendingActivation;