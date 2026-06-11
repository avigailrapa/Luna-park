import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import connectDB from './config/db';
import { port, nodeEnv, uploadDir, clientOrigins } from './config/env';
import { requestLogger, errorLogger } from './middleware/logger';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import rideRoutes from './routes/rideRoutes';
import couponRoutes from './routes/couponRoutes';
import agentRoutes from './routes/agentRoutes';
import { seedDatabase } from './seed/seedData';
import type { AppError } from './types';

export const app = express();

for (const sub of ['images', 'audio']) {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(requestLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/agent', agentRoutes);

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'luna-park-api',
    message: 'API is running. Use /api/* endpoints.',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'luna-park-api' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'הנתיב לא נמצא' });
});

app.use(errorLogger);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'הקובץ גדול מדי. הגודל המקסימלי הוא 10MB.' });
    return;
  }
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ message: err.message || 'שגיאת שרת פנימית' });
});

async function start(): Promise<void> {
  await connectDB();
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Luna-park API running on port ${port} (${nodeEnv})`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
