import { NextFunction, Request, Response } from 'express';
import Coupon from '../models/Coupon';
import { validateCoupon } from '../utils/couponValidator';
import type { AppError } from '../types';

export async function validateCouponCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.query.code;
    if (!code || !String(code).trim()) {
      res.status(400).json({ valid: false, message: 'יש להזין קוד קופון' });
      return;
    }

    const coupon = await validateCoupon(String(code));
    res.json({
      valid: true,
      discountPercent: coupon.discountPercent,
      message: `הוחלה הנחה של ${coupon.discountPercent}%`,
    });
  } catch (err) {
    const error = err as AppError;
    if (error.statusCode) {
      res.status(error.statusCode).json({ valid: false, message: error.message });
      return;
    }
    next(err);
  }
}

export async function getCoupons(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = { ...req.body };
    if (payload.code) {
      payload.code = String(payload.code).trim().toUpperCase();
    }
    const coupon = await Coupon.create(payload);
    res.status(201).json({ coupon });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = { ...req.body };
    if (payload.code) {
      payload.code = String(payload.code).trim().toUpperCase();
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!coupon) {
      res.status(404).json({ message: 'הקופון לא נמצא' });
      return;
    }
    res.json({ coupon });
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      res.status(404).json({ message: 'הקופון לא נמצא' });
      return;
    }
    res.json({ message: 'הקופון נמחק' });
  } catch (err) {
    next(err);
  }
}
