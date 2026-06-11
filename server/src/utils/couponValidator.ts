import mongoose from 'mongoose';
import type { ICoupon } from '../models/Coupon';
import type { AppError } from '../types';

function getCouponModel() {
  return mongoose.models.Coupon || null;
}

export async function validateCoupon(code: string): Promise<ICoupon> {
  if (!code || !String(code).trim()) {
    throw new Error('קוד קופון חסר');
  }

  const Coupon = getCouponModel();
  if (!Coupon) {
    const error = new Error('מערכת הקופונים אינה זמינה כרגע') as AppError;
    error.statusCode = 503;
    throw error;
  }

  const normalized = String(code).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalized });

  if (!coupon) {
    const error = new Error('קוד הקופון אינו תקין') as AppError;
    error.statusCode = 400;
    throw error;
  }
  if (!coupon.isActive) {
    const error = new Error('הקופון אינו פעיל') as AppError;
    error.statusCode = 400;
    throw error;
  }
  if (coupon.expiresAt <= new Date()) {
    const error = new Error('תוקף הקופון פג') as AppError;
    error.statusCode = 400;
    throw error;
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    const error = new Error('הקופון הגיע למגבלת השימוש') as AppError;
    error.statusCode = 400;
    throw error;
  }

  return coupon;
}

export async function incrementUsedCount(couponId: unknown): Promise<void> {
  const Coupon = getCouponModel();
  if (!Coupon) {
    return;
  }

  await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } },
  );
}
