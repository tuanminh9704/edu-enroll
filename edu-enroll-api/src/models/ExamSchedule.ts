import mongoose, { Schema, Document } from 'mongoose';

export interface IExamSchedule extends Document {
  title: string;
  language: string;
  exam_date: Date;
  location: string;
  room?: string;
  format: 'offline' | 'online';
  max_slots: number;
  registered_slots: number;
  status: 'open' | 'closed' | 'cancelled';
  rooms_published: boolean;
  created_at: Date;
}

const ExamScheduleSchema = new Schema<IExamSchedule>({
  title: { type: String, required: true },
  language: { type: String, required: true },
  exam_date: { type: Date, required: true },
  location: { type: String, required: true },
  room: String,
  format: { type: String, enum: ['offline', 'online'], default: 'offline' },
  max_slots: { type: Number, default: 30 },
  registered_slots: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open' },
  rooms_published: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const ExamSchedule = mongoose.model<IExamSchedule>('ExamSchedule', ExamScheduleSchema);
