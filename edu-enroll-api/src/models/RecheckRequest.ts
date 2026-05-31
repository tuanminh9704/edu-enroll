import mongoose, { Schema, Document } from 'mongoose';

export interface IRecheckRequest extends Document {
  user_id: mongoose.Types.ObjectId;
  enrollment_id: mongoose.Types.ObjectId;
  registration_id: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  admin_note?: string;
  resolved_by?: mongoose.Types.ObjectId;
  resolved_at?: Date;
  created_at: Date;
}

const RecheckRequestSchema = new Schema<IRecheckRequest>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollment_id: { type: Schema.Types.ObjectId, ref: 'EnrollmentForm', required: true },
  registration_id: { type: Schema.Types.ObjectId, ref: 'ExamRegistration', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewing', 'resolved', 'rejected'], default: 'pending' },
  admin_note: String,
  resolved_by: { type: Schema.Types.ObjectId, ref: 'User' },
  resolved_at: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const RecheckRequest = mongoose.model<IRecheckRequest>('RecheckRequest', RecheckRequestSchema);
