import express from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import shabbat from '../middleware/shabbat';
import upload from '../utils/upload';
import {
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
} from '../controllers/rideController';

const router = express.Router();

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

router.get('/', getRides);
router.get('/:id', getRideById);
router.post('/', shabbat, auth, admin, uploadFields, createRide);
router.put('/:id', shabbat, auth, admin, uploadFields, updateRide);
router.delete('/:id', shabbat, auth, admin, deleteRide);

export default router;
