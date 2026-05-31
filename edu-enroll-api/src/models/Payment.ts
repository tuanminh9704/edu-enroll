import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  user_id: mongoose.Types.ObjectId;
  enrollment_id: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'expired' | 'refunded';
  vnpay_ref?: string;
  created_at: Date;
}

const PaymentSchema = new Schema<IPayment>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollment_id: { type: Schema.Types.ObjectId, ref: 'EnrollmentForm', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed', 'expired', 'refunded'], default: 'pending' },
  vnpay_ref: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
