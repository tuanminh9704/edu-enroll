import mongoose, { Schema, Document } from 'mongoose';

export interface IExamRoom extends Document {
  schedule_id: mongoose.Types.ObjectId;
  name: string;
  location?: string;
  capacity: number;
  assigned_count: number;
  created_at: Date;
}

const ExamRoomSchema = new Schema<IExamRoom>({
  schedule_id: { type: Schema.Types.ObjectId, ref: 'ExamSchedule', required: true, index: true },
  name: { type: String, required: true },
  location: String,
  capacity: { type: Number, required: true, min: 1 },
  assigned_count: { type: Number, default: 0, min: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

ExamRoomSchema.index({ schedule_id: 1, name: 1 }, { unique: true });

export const ExamRoom = mongoose.model<IExamRoom>('ExamRoom', ExamRoomSchema);
