import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpCode extends Document {
  email: string;
  otp: string;
  type: 'register' | 'forgot_password';
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['register', 'forgot_password'], required: true },
  expires_at: { type: Date, required: true },
  is_used: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

OtpCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const OtpCode = mongoose.model<IOtpCode>('OtpCode', OtpCodeSchema);
