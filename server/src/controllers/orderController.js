const mongoose = require('mongoose');
const Order = require('../models/Order');
const { calculateTotal } = require('../utils/pricing');
const { validateCoupon, incrementUsedCount } = require('../utils/couponValidator');

function getRideModel() {
  return mongoose.models.Ride || null;
}

function resolveHourlyAmount(hoursAmount, startHour, endHour) {
  if (startHour != null && endHour != null) {
    if (endHour <= startHour) {
      const error = new Error('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
      error.statusCode = 400;
      throw error;
    }
    return { hoursAmount: endHour - startHour, startHour, endHour };
  }
  if (hoursAmount && hoursAmount >= 1) {
    return { hoursAmount, startHour: null, endHour: null };
  }
  const error = new Error('יש לבחור שעת התחלה ושעת סיום');
  error.statusCode = 400;
  throw error;
}

async function createOrder(req, res, next) {
  try {
    const { ticketType, chosenDate, hoursAmount, startHour, endHour, rideId, couponCode } =
      req.body;

    if (!ticketType || !chosenDate) {
      return res.status(400).json({ message: 'סוג כרטיס ותאריך ביקור הם שדות חובה' });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'רק לקוחות יכולים ליצור הזמנות' });
    }

    const visitDate = new Date(chosenDate);
    if (Number.isNaN(visitDate.getTime())) {
      return res.status(400).json({ message: 'תאריך הביקור אינו תקין' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDate < today) {
      return res.status(400).json({ message: 'לא ניתן להזמין לתאריך שעבר' });
    }

    let resolvedHours = null;
    let resolvedStartHour = null;
    let resolvedEndHour = null;

    if (ticketType === 'hourly') {
      try {
        const hourly = resolveHourlyAmount(hoursAmount, startHour, endHour);
        resolvedHours = hourly.hoursAmount;
        resolvedStartHour = hourly.startHour;
        resolvedEndHour = hourly.endHour;
      } catch (err) {
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
    }

    let rideDoc = null;
    if (ticketType === 'ride') {
      if (!rideId || !mongoose.Types.ObjectId.isValid(rideId)) {
        return res.status(400).json({ message: 'יש לבחור מתקן להזמנה' });
      }
      const Ride = getRideModel();
      if (!Ride) {
        return res.status(503).json({ message: 'מערכת המתקנים אינה זמינה כרגע' });
      }
      rideDoc = await Ride.findById(rideId);
      if (!rideDoc) {
        return res.status(404).json({ message: 'המתקן לא נמצא' });
      }
      if (rideDoc.status !== 'active') {
        return res.status(400).json({ message: 'המתקן אינו זמין להזמנה' });
      }
    }

    let coupon = null;
    if (couponCode) {
      coupon = await validateCoupon(couponCode);
    }

    let pricing;
    try {
      pricing = calculateTotal(
        ticketType,
        resolvedHours,
        coupon,
        ticketType === 'ride' ? rideDoc.price : undefined
      );
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const order = await Order.create({
      userId: req.user.id,
      rideId: ticketType === 'ride' ? rideId : null,
      ticketType,
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
    res.status(201).json({ order });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('rideId', 'name')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getAllOrders(req, res, next) {
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

module.exports = { createOrder, getMyOrders, getAllOrders };
