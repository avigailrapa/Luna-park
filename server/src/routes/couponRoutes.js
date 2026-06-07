const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const shabbat = require('../middleware/shabbat');
const {
  validateCouponCode,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');

const router = express.Router();

router.get('/validate', validateCouponCode);
router.get('/', auth, admin, getCoupons);
router.post('/', shabbat, auth, admin, createCoupon);
router.put('/:id', shabbat, auth, admin, updateCoupon);
router.delete('/:id', shabbat, auth, admin, deleteCoupon);

module.exports = router;
