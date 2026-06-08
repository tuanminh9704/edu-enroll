import mongoose, { Schema, Document } from 'mongoose';

export interface IExamRegistration extends Document {
  user_id: mongoose.Types.ObjectId;
  enrollment_id: mongoose.Types.ObjectId;
  schedule_id: mongoose.Types.ObjectId;
  room_id?: mongoose.Types.ObjectId;
  subject_code?: string;
  bag_number?: string;
  anonymous_code?: string;
  exam_code: string;
  attendance_status: 'pending' | 'attended' | 'absent';
  absence_report_number?: string;
  absence_reason?: string;
  exam_violation: boolean;
  violation_report_number?: string;
  violation_note?: string;
  status: 'confirmed' | 'absent' | 'pending';
  created_at: Date;
}

const ExamRegistrationSchema = new Schema<IExamRegistration>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollment_id: { type: Schema.Types.ObjectId, ref: 'EnrollmentForm', required: true },
  schedule_id: { type: Schema.Types.ObjectId, ref: 'ExamSchedule', required: true },
  room_id: { type: Schema.Types.ObjectId, ref: 'ExamRoom' },
  subject_code: String,
  bag_number: String,
  anonymous_code: String,
  exam_code: { type: String, required: true, unique: true },
  attendance_status: { type: String, enum: ['pending', 'attended', 'absent'], default: 'pending' },
  absence_report_number: String,
  absence_reason: String,
  exam_violation: { type: Boolean, default: false },
  violation_report_number: String,
  violation_note: String,
  status: { type: String, enum: ['confirmed', 'absent', 'pending'], default: 'confirmed' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const ExamRegistration = mongoose.model<IExamRegistration>('ExamRegistration', ExamRegistrationSchema);
