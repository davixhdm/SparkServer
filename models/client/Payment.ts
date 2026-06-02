import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: Schema.Types.ObjectId;
  plan: 'monthly' | 'yearly' | 'permanent';
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'mpesa_stk_push' | 'mpesa_send_money' | 'mpesa_paybill' | 'mpesa_till' | 'paypal';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transactionId: string;
  gatewayResponse: Record<string, any>;
  mpesaReference: string;
  mpesaPhone: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  metadata: Record<string, any>;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: { type: String, default: '' },
    gatewayResponse: { type: Schema.Types.Mixed, default: {} },
    mpesaReference: { type: String, default: '' },
    mpesaPhone: { type: String, default: '' },
    stripeSessionId: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;