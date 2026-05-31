import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const BannerSchema = new Schema<IBanner>({
  title: { type: String, required: true },
  subtitle: String,
  image_url: String,
  link_url: String,
  position: { type: String, default: 'home' },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
