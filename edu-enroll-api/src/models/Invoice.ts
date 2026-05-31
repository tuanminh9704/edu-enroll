import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  user_id: mongoose.Types.ObjectId;
  enrollment_id: mongoose.Types.ObjectId;
  payment_id?: mongoose.Types.ObjectId;
  invoice_number: string;
  amount: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issued_at: Date;
  paid_at?: Date;
  description?: string;
  created_at: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollment_id: { type: Schema.Types.ObjectId, ref: 'EnrollmentForm', required: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment' },
  invoice_number: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'issued', 'paid', 'cancelled'], default: 'issued' },
  issued_at: { type: Date, default: Date.now },
  paid_at: Date,
  description: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
