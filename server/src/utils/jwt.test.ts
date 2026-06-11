import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt';

describe('jwt', () => {
  it('signs and verifies token payload', () => {
    const payload = {
      id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      role: 'customer' as const,
    };

    const token = signToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe('customer');
  });
});
