const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const { port, nodeEnv, uploadDir } = require('./config/env');
const { requestLogger, errorLogger } = require('./middleware/logger');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const rideRoutes = require('./routes/rideRoutes');
const couponRoutes = require('./routes/couponRoutes');
const agentRoutes = require('./routes/agentRoutes');
const { seedDatabase } = require('./seed/seedData');

const app = express();

for (const sub of ['images', 'audio']) {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(requestLogger);
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/agent', agentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'luna-park-api' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'הנתיב לא נמצא' });
});

app.use(errorLogger);
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'הקובץ גדול מדי. הגודל המקסימלי הוא 10MB.' });
  }
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ message: err.message || 'שגיאת שרת פנימית' });
});

async function start() {
  await connectDB();
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Luna-park API running on port ${port} (${nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
