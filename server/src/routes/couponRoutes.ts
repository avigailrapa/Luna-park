import express from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import shabbat from '../middleware/shabbat';
import {
  validateCouponCode,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController';

const router = express.Router();

router.get('/validate', validateCouponCode);
router.get('/', auth, admin, getCoupons);
router.post('/', shabbat, auth, admin, createCoupon);
router.put('/:id', shabbat, auth, admin, updateCoupon);
router.delete('/:id', shabbat, auth, admin, deleteCoupon);

export default router;
