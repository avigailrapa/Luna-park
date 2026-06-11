import mongoose from 'mongoose';
import { mongoUri } from './env';

async function connectDB(): Promise<void> {
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
}

export default connectDB;
