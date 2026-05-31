import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollmentLog extends Document {
  enrollment_id: mongoose.Types.ObjectId;
  changed_by: mongoose.Types.ObjectId;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  created_at: Date;
}

const EnrollmentLogSchema = new Schema<IEnrollmentLog>({
  enrollment_id: { type: Schema.Types.ObjectId, ref: 'EnrollmentForm', required: true },
  changed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  field_name: String,
  old_value: String,
  new_value: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const EnrollmentLog = mongoose.model<IEnrollmentLog>('EnrollmentLog', EnrollmentLogSchema);
