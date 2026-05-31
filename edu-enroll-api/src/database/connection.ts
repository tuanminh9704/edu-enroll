import mongoose from 'mongoose';
import { config } from '../configs';
import { seedData, seedAdmin } from './seed';

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(config.mongodbUri);
  console.log('MongoDB connected');
  await seedData();
  await seedAdmin();
};

export default mongoose;
