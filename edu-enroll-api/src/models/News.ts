import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const NewsSchema = new Schema<INews>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  summary: String,
  content: String,
  category: { type: String, default: 'announcement' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  published_at: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const News = mongoose.model<INews>('News', NewsSchema);
