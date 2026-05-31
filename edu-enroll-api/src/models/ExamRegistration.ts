import mongoose, { Schema, Document } from 'mongoose';

export interface IExamRegistration extends Document {
  user_id: mongoose.Types.ObjectId;
  enrollment_id: mongoose.Types.ObjectId;
  schedule_id: mongoose.Types.ObjectId;
  room_id?: mongoose.Types.ObjectId;
  bag_number?: string;
  anonymous_code?: string;
  exam_code: string;
  status: 'confirmed' | 'absent' | 'pending';
  created_at: Date;
}

const ExamRegistrationSchema = new Schema<IExamRegistration>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollment_id: { type: Schema.Types.ObjectId, ref: 'EnrollmentForm', required: true },
  schedule_id: { type: Schema.Types.ObjectId, ref: 'ExamSchedule', required: true },
  room_id: { type: Schema.Types.ObjectId, ref: 'ExamRoom' },
  bag_number: String,
  anonymous_code: String,
  exam_code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['confirmed', 'absent', 'pending'], default: 'confirmed' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const ExamRegistration = mongoose.model<IExamRegistration>('ExamRegistration', ExamRegistrationSchema);
