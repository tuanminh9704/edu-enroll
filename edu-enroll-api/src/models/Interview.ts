import mongoose, { Schema, Document } from 'mongoose';

export interface IInterview extends Document {
  user_id: mongoose.Types.ObjectId;
  enrollment_id: mongoose.Types.ObjectId;
  title: string;
  scheduled_at: Date;
  location: string;
  format: 'online' | 'offline';
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  notes?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const InterviewSchema = new Schema<IInterview>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollment_id: { type: Schema.Types.ObjectId, ref: 'EnrollmentForm', required: true },
  title: { type: String, required: true },
  scheduled_at: { type: Date, required: true },
  location: { type: String, required: true },
  format: { type: String, enum: ['online', 'offline'], default: 'offline' },
  status: { type: String, enum: ['pending', 'confirmed', 'declined', 'completed', 'cancelled'], default: 'pending' },
  notes: String,
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
