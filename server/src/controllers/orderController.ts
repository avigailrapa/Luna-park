import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import { calculateTotal } from '../utils/pricing';
import { validateCoupon, incrementUsedCount } from '../utils/couponValidator';
import { generateTicketCode } from '../utils/ticketCode';
import { sendOrderConfirmationEmail, generateBarcodePng } from '../utils/orderEmail';
import type { ICoupon } from '../models/Coupon';
import type { EmailResult } from '../utils/orderEmail';
import type { AppError, TicketType } from '../types';

function getRideModel() {
  return mongoose.models.Ride || null;
}

function resolveHourlyAmount(
  hoursAmount: number | undefined,
  startHour: number | undefined,
  endHour: number | undefined,
) {
  if (startHour != null && endHour != null) {
    if (endHour <= startHour) {
      const error = new Error('שעת הסיום חייבת להיות אחרי שעת ההתחלה') as AppError;
      error.statusCode = 400;
      throw error;
    }
    return { hoursAmount: endHour - startHour, startHour, endHour };
  }
  if (hoursAmount && hoursAmount >= 1) {
    return { hoursAmount, startHour: null as number | null, endHour: null as number | null };
  }
  const error = new Error('יש לבחור שעת התחלה ושעת סיום') as AppError;
  error.statusCode = 400;
  throw error;
}

async function createUniqueTicketCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticketCode = generateTicketCode();
    const exists = await Order.exists({ ticketCode });
    if (!exists) {
      return ticketCode;
    }
  }
  const error = new Error('לא ניתן ליצור קוד כרטיס ייחודי') as AppError;
  error.statusCode = 500;
  throw error;
}

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketType, chosenDate, hoursAmount, startHour, endHour, rideId, couponCode } =
      req.body;

    if (!ticketType || !chosenDate) {
      res.status(400).json({ message: 'סוג כרטיס ותאריך ביקור הם שדות חובה' });
      return;
    }

    if (req.user!.role !== 'customer') {
      res.status(403).json({ message: 'רק לקוחות יכולים ליצור הזמנות' });
      return;
    }

    const visitDate = new Date(chosenDate);
    if (Number.isNaN(visitDate.getTime())) {
      res.status(400).json({ message: 'תאריך הביקור אינו תקין' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDate < today) {
      res.status(400).json({ message: 'לא ניתן להזמין לתאריך שעבר' });
      return;
    }

    let resolvedHours: number | null = null;
    let resolvedStartHour: number | null = null;
    let resolvedEndHour: number | null = null;

    if (ticketType === 'hourly') {
      try {
        const hourly = resolveHourlyAmount(hoursAmount, startHour, endHour);
        resolvedHours = hourly.hoursAmount;
        resolvedStartHour = hourly.startHour;
        resolvedEndHour = hourly.endHour;
      } catch (err) {
        const error = err as AppError;
        res.status(error.statusCode || 400).json({ message: error.message });
        return;
      }
    }

    let rideDoc: { price: number; status: string } | null = null;
    if (ticketType === 'ride') {
      if (!rideId || !mongoose.Types.ObjectId.isValid(rideId)) {
        res.status(400).json({ message: 'יש לבחור מתקן להזמנה' });
        return;
      }
      const Ride = getRideModel();
      if (!Ride) {
        res.status(503).json({ message: 'מערכת המתקנים אינה זמינה כרגע' });
        return;
      }
      rideDoc = await Ride.findById(rideId);
      if (!rideDoc) {
        res.status(404).json({ message: 'המתקן לא נמצא' });
        return;
      }
      if (rideDoc.status !== 'active') {
        res.status(400).json({ message: 'המתקן אינו זמין להזמנה' });
        return;
      }
    }

    let coupon: ICoupon | null = null;
    if (couponCode) {
      coupon = await validateCoupon(couponCode);
    }

    let pricing;
    try {
      pricing = calculateTotal(
        ticketType as TicketType,
        resolvedHours,
        coupon,
        ticketType === 'ride' ? rideDoc!.price : undefined,
      );
    } catch (err) {
      const error = err as Error;
      res.status(400).json({ message: error.message });
      return;
    }

    const ticketCode = await createUniqueTicketCode();

    const order = await Order.create({
      userId: req.user!.id,
      rideId: ticketType === 'ride' ? rideId : null,
      ticketType,
      ticketCode,
      chosenDate: visitDate,
      hoursAmount: ticketType === 'hourly' ? resolvedHours : null,
      startHour: ticketType === 'hourly' ? resolvedStartHour : null,
      endHour: ticketType === 'hourly' ? resolvedEndHour : null,
      couponCode: pricing.couponCode,
      totalPrice: pricing.totalPrice,
      discountApplied: pricing.discountApplied,
      finalPrice: pricing.finalPrice,
    });

    if (coupon) {
      await incrementUsedCount(coupon._id);
    }

    await order.populate('rideId', 'name');

    let emailResult: EmailResult = { sent: false, reason: 'email_error' };
    try {
      const user = await User.findById(req.user!.id);
      emailResult = await sendOrderConfirmationEmail(user, order);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Order ${order._id} confirmation failed:`, message);
    }

    const message = emailResult.sent
      ? 'ההזמנה בוצעה בהצלחה. אישור נשלח לאימייל שלך.'
      : 'ההזמנה בוצעה בהצלחה. הציגי את הברקוד ב"ההזמנות שלי".';

    res.status(201).json({
      order,
      message,
      emailSent: emailResult.sent,
      emailHint: emailResult.hint || null,
    });
  } catch (err) {
    const error = err as AppError;
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(err);
  }
}

export async function getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await Order.find({ userId: req.user!.id })
      .populate('rideId', 'name')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('rideId', 'name')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function validateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      res.status(400).json({ valid: false, message: 'קוד כרטיס חסר' });
      return;
    }

    const order = await Order.findOne({ ticketCode: code })
      .populate('userId', 'name email')
      .populate('rideId', 'name');

    if (!order) {
      res.status(404).json({ valid: false, message: 'כרטיס לא נמצא' });
      return;
    }
    if (order.status === 'cancelled') {
      res.status(400).json({ valid: false, message: 'הכרטיס בוטל' });
      return;
    }

    res.json({
      valid: true,
      message: 'כרטיס תקין — כניסה מאושרת',
      order,
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrderBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!order?.ticketCode) {
      res.status(404).json({ message: 'כרטיס לא נמצא' });
      return;
    }
    const png = await generateBarcodePng(order.ticketCode);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(png);
  } catch (err) {
    next(err);
  }
}

export async function resendOrderEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id }).populate(
      'rideId',
      'name',
    );
    if (!order?.ticketCode) {
      res.status(404).json({ message: 'הזמנה לא נמצאה' });
      return;
    }

    const user = await User.findById(req.user!.id);
    let recipient = user?.email?.trim().toLowerCase() || '';

    const customEmail = req.body?.email?.trim().toLowerCase();
    if (customEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) {
        res.status(400).json({ message: 'כתובת אימייל לא תקינה' });
        return;
      }
      recipient = customEmail;
    }

    if (!recipient) {
      res.status(400).json({ message: 'יש להזין כתובת אימייל לשליחה' });
      return;
    }

    const emailResult = await sendOrderConfirmationEmail(user, order, recipient);

    if (emailResult.sent) {
      res.json({
        message: emailResult.message || `הכרטיס נשלח לאימייל ${recipient}`,
        emailSent: true,
        recipient,
        devMode: emailResult.devMode || false,
        previewUrl: emailResult.previewUrl || null,
      });
      return;
    }

    res.json({
      message:
        emailResult.message ||
        emailResult.hint ||
        `הכרטיס נשמר בשרת (logs/tickets) עבור ${recipient}`,
      emailSent: false,
      emailHint: emailResult.hint || null,
      localPath: emailResult.localPath || null,
      recipient,
    });
  } catch (err) {
    next(err);
  }
}
