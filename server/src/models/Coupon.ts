import mongoose, { Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountPercent: number;
  expiresAt: Date;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  imageUrl: string;
}

const couponSchema = new mongoose.Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, default: '' },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model<ICoupon>('Coupon', couponSchema);
