import { describe, expect, it } from 'vitest';
import { generateTicketCode } from './ticketCode';

describe('ticketCode', () => {
  it('generates code with LUNA prefix', () => {
    const code = generateTicketCode();
    expect(code).toMatch(/^LUNA-[A-F0-9]{8}$/);
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateTicketCode()));
    expect(codes.size).toBe(20);
  });
});
