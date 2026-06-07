const Coupon = require('../models/Coupon');
const { validateCoupon } = require('../utils/couponValidator');

async function validateCouponCode(req, res, next) {
  try {
    const code = req.query.code;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ valid: false, message: 'יש להזין קוד קופון' });
    }

    const coupon = await validateCoupon(code);
    res.json({
      valid: true,
      discountPercent: coupon.discountPercent,
      message: `הוחלה הנחה של ${coupon.discountPercent}%`,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ valid: false, message: err.message });
    }
    next(err);
  }
}

async function getCoupons(_req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
}

async function createCoupon(req, res, next) {
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

async function updateCoupon(req, res, next) {
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
      return res.status(404).json({ message: 'הקופון לא נמצא' });
    }
    res.json({ coupon });
  } catch (err) {
    next(err);
  }
}

async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'הקופון לא נמצא' });
    }
    res.json({ message: 'הקופון נמחק' });
  } catch (err) {
    next(err);
  }
}

module.exports = { validateCouponCode, getCoupons, createCoupon, updateCoupon, deleteCoupon };
