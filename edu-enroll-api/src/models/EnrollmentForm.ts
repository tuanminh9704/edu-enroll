import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollmentForm extends Document {
  user_id: mongoose.Types.ObjectId;
  current_step: number;
  status: string;
  // Course preferences
  language?: string;
  level?: string;
  training_type?: string;
  schedule?: string;
  facility?: string;
  // Policy
  signed_policy: boolean;
  signature_data?: string;
  signed_at?: Date;
  signed_ip?: string;
  // Payment
  payment_status: 'pending' | 'success' | 'failed' | 'expired';
  payment_ref?: string;
  payment_amount: number;
  paid_at?: Date;
  // Student info
  student_full_name?: string;
  student_dob?: string;
  student_gender?: string;
  student_cccd?: string;
  student_address?: string;
  student_current_school?: string;
  // Parent info
  parent_full_name?: string;
  parent_phone?: string;
  parent_email?: string;
  // Exam
  exam_required: boolean;
  exam_confirmed: boolean;
  preferred_exam_date?: string;
  exam_schedule_id?: mongoose.Types.ObjectId;
  exam_score?: number;
  exam_level_passed?: string;
  exam_pass_status?: 'passed' | 'failed';
  exam_pass_threshold?: number;
  exam_scored_at?: Date;
  // Program
  program_id?: mongoose.Types.ObjectId;
  program_name?: string;
  tuition_fee?: number;
  // Final submission
  appointment_date?: string;
  buy_books: boolean;
  document_number?: string;
  documents_submitted: boolean;
  notes?: string;
  // Admin
  staff_notes?: string;
  // Soft delete
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const EnrollmentFormSchema = new Schema<IEnrollmentForm>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  current_step: { type: Number, default: 1, min: 1, max: 6 },
  status: { type: String, default: 'step_1' },
  language: String,
  level: String,
  training_type: String,
  schedule: String,
  facility: String,
  signed_policy: { type: Boolean, default: false },
  signature_data: String,
  signed_at: Date,
  signed_ip: String,
  payment_status: { type: String, enum: ['pending', 'success', 'failed', 'expired'], default: 'pending' },
  payment_ref: String,
  payment_amount: { type: Number, default: 50000 },
  paid_at: Date,
  student_full_name: String,
  student_dob: String,
  student_gender: String,
  student_cccd: String,
  student_address: String,
  student_current_school: String,
  parent_full_name: String,
  parent_phone: String,
  parent_email: String,
  exam_required: { type: Boolean, default: false },
  exam_confirmed: { type: Boolean, default: false },
  preferred_exam_date: String,
  exam_schedule_id: { type: Schema.Types.ObjectId, ref: 'ExamSchedule' },
  exam_score: Number,
  exam_level_passed: String,
  exam_pass_status: { type: String, enum: ['passed', 'failed'] },
  exam_pass_threshold: Number,
  exam_scored_at: Date,
  program_id: { type: Schema.Types.ObjectId, ref: 'TrainingProgram' },
  program_name: String,
  tuition_fee: Number,
  appointment_date: String,
  buy_books: { type: Boolean, default: false },
  document_number: String,
  documents_submitted: { type: Boolean, default: false },
  notes: String,
  staff_notes: String,
  is_deleted: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const EnrollmentForm = mongoose.model<IEnrollmentForm>('EnrollmentForm', EnrollmentFormSchema);
