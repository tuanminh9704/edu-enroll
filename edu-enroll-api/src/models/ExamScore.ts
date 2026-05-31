import mongoose, { Schema, Document } from 'mongoose';

export interface IExamScore extends Document {
  registration_id: mongoose.Types.ObjectId;
  score: number;
  level_passed: string;
  pass_status: 'passed' | 'failed';
  pass_threshold: number;
  status: 'scored' | 'pending';
  notes?: string;
  created_at: Date;
}

const ExamScoreSchema = new Schema<IExamScore>({
  registration_id: { type: Schema.Types.ObjectId, ref: 'ExamRegistration', required: true, unique: true },
  score: { type: Number, required: true },
  level_passed: { type: String, required: true },
  pass_status: { type: String, enum: ['passed', 'failed'], required: true },
  pass_threshold: { type: Number, default: 50 },
  status: { type: String, enum: ['scored', 'pending'], default: 'scored' },
  notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const ExamScore = mongoose.model<IExamScore>('ExamScore', ExamScoreSchema);
