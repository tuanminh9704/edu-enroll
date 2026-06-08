import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseClass extends Document {
  code: string;
  name: string;
  language: string;
  level_code: string;
  program_id?: mongoose.Types.ObjectId;
  teacher_name?: string;
  facility?: string;
  schedule?: string;
  start_date?: Date;
  end_date?: Date;
  max_students: number;
  current_students: number;
  status: 'open' | 'full' | 'closed' | 'completed';
  note?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CourseClassSchema = new Schema<ICourseClass>({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  language: { type: String, required: true, index: true },
  level_code: { type: String, required: true, index: true },
  program_id: { type: Schema.Types.ObjectId, ref: 'TrainingProgram' },
  teacher_name: String,
  facility: String,
  schedule: String,
  start_date: Date,
  end_date: Date,
  max_students: { type: Number, required: true, min: 1 },
  current_students: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['open', 'full', 'closed', 'completed'], default: 'open', index: true },
  note: String,
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CourseClassSchema.index({ language: 1, level_code: 1, status: 1 });

export const CourseClass = mongoose.model<ICourseClass>('CourseClass', CourseClassSchema);
