import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice(7));
    } catch {
      req.user = null;
    }
  }
  next();
}

export default optionalAuth;
