import mongoose, { Document } from 'mongoose';

export interface IRide extends Document {
  name: string;
  description: string;
  capacity: number;
  minimumHeight: number;
  category: 'thrill' | 'family' | 'kids' | 'water' | 'show';
  price: number;
  status: 'active' | 'maintenance';
  imageUrl: string;
  audioUrl: string;
}

const rideSchema = new mongoose.Schema<IRide>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    capacity: { type: Number, default: 1, min: 1 },
    minimumHeight: { type: Number, default: 0, min: 0 },
    category: {
      type: String,
      enum: ['thrill', 'family', 'kids', 'water', 'show'],
      default: 'family',
    },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'maintenance'],
      default: 'active',
    },
    imageUrl: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model<IRide>('Ride', rideSchema);
