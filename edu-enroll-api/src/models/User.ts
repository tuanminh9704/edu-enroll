import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  phone?: string;
  full_name?: string;
  preferred_language?: string;
  role: 'student' | 'staff' | 'admin' | 'super_admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  phone: { type: String },
  full_name: { type: String },
  preferred_language: { type: String, enum: ['english', 'japanese', 'korean', 'chinese', 'french'] },
  role: { type: String, enum: ['student', 'staff', 'admin', 'super_admin'], default: 'student' },
  is_active: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const User = mongoose.model<IUser>('User', UserSchema);
