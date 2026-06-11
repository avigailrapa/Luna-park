import { NextFunction, Request, Response } from 'express';

function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'נדרשת הרשאת מנהל' });
    return;
  }
  next();
}

export default adminMiddleware;
