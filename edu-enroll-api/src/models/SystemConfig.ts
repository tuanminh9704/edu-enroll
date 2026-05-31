import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: string;
  group: string;
  description?: string;
  updated_by?: mongoose.Types.ObjectId;
  updated_at: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  group: { type: String, default: 'general' },
  description: String,
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: false, updatedAt: 'updated_at' } });

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
