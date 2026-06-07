const path = require('path');

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/luna-park',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  fullDayPrice: Number(process.env.FULL_DAY_PRICE) || 50,
  hourlyRate: Number(process.env.HOURLY_RATE) || 15,
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  adminName: process.env.ADMIN_NAME || 'מנהל לונה פארק',
  adminEmail:
    (process.env.ADMIN_EMAIL || '').trim() ||
    (process.env.NODE_ENV === 'production' ? '' : 'admin@luna-park.local'),
  adminPassword:
    (process.env.ADMIN_PASSWORD || '').trim() ||
    (process.env.NODE_ENV === 'production' ? '' : 'change-me-admin'),
  smtpHost: (process.env.SMTP_HOST || '').trim(),
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: (process.env.SMTP_USER || '').trim(),
  smtpPass: (process.env.SMTP_PASS || '').replace(/\s/g, ''),
  emailFrom: process.env.EMAIL_FROM || 'לונה פארק <noreply@luna-park.local>',
};
