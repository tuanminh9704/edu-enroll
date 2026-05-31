import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingProgram extends Document {
  language: string;
  name: string;
  level: string;
  level_code: string;
  duration_months: number;
  sessions_per_week: number;
  session_hours: number;
  tuition_fee: number;
  description?: string;
  min_score: number;
  is_active: boolean;
  created_at: Date;
}

const TrainingProgramSchema = new Schema<ITrainingProgram>({
  language: { type: String, required: true },
  name: { type: String, required: true },
  level: { type: String },
  level_code: { type: String, required: true },
  duration_months: { type: Number, required: true },
  sessions_per_week: { type: Number, required: true },
  session_hours: { type: Number, default: 2 },
  tuition_fee: { type: Number, required: true },
  description: String,
  min_score: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const TrainingProgram = mongoose.model<ITrainingProgram>('TrainingProgram', TrainingProgramSchema);
