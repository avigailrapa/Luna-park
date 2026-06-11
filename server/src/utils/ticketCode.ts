import crypto from 'crypto';

export function generateTicketCode(): string {
  return `LUNA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}
