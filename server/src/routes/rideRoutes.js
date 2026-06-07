const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const shabbat = require('../middleware/shabbat');
const upload = require('../utils/upload');
const {
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
} = require('../controllers/rideController');

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

module.exports = router;
