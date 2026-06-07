const multer = require('multer');
const path = require('path');
const { uploadDir } = require('../config/env');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = file.fieldname === 'image' ? 'images' : 'audio';
    cb(null, path.join(uploadDir, sub));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    return cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  }
  if (file.fieldname === 'audio') {
    return cb(null, ['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(file.mimetype));
  }
  cb(null, false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
