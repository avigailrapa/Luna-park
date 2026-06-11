import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import shabbat from '../middleware/shabbat';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  validateTicket,
  getOrderBarcode,
  resendOrderEmail,
} from '../controllers/orderController';

const router = Router();

router.post('/', auth, shabbat, createOrder);
router.get('/my-orders', auth, getMyOrders);
router.get('/my-orders/:id/barcode', auth, getOrderBarcode);
router.post('/my-orders/:id/resend-email', auth, resendOrderEmail);
router.get('/validate/:code', auth, admin, validateTicket);
router.get('/', auth, admin, getAllOrders);

export default router;
