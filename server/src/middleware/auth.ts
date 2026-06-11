import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'נדרשת התחברות' });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: 'אסימון לא תקין או שפג תוקפו' });
  }
}

export default authMiddleware;
