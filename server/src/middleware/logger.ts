import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { nodeEnv } from '../config/env';
import type { AppError } from '../types';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  if (nodeEnv !== 'production') {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
}

export function errorLogger(err: AppError, req: Request, _res: Response, next: NextFunction): void {
  const entry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${err.message}\n`;

  if (nodeEnv === 'production') {
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logDir, 'errors.log'), entry);
  } else {
    console.error(entry.trim());
  }
  next(err);
}
