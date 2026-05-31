import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  counter_key: string;
  current_value: number;
}

const CounterSchema = new Schema<ICounter>({
  counter_key: { type: String, required: true, unique: true },
  current_value: { type: Number, default: 1000 },
});

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
