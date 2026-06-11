import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/env';
import type { AuthUser } from '../types';

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, jwtSecret) as AuthUser;
}
