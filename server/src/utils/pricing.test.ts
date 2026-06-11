import { describe, expect, it } from 'vitest';
import { applyDiscount, calculateBasePrice, calculateTotal } from './pricing';

describe('pricing', () => {
  it('calculates full day price', () => {
    expect(calculateBasePrice('full_day', null)).toBe(50);
  });

  it('calculates hourly price', () => {
    expect(calculateBasePrice('hourly', 3)).toBe(45);
  });

  it('calculates ride price', () => {
    expect(calculateBasePrice('ride', null, 30)).toBe(30);
  });

  it('throws for invalid hourly hours', () => {
    expect(() => calculateBasePrice('hourly', 0)).toThrow('נדרש מספר שעות תקין');
  });

  it('applies discount correctly', () => {
    expect(applyDiscount(100, 10)).toEqual({ discountApplied: 10, finalPrice: 90 });
  });

  it('calculates total with coupon', () => {
    const result = calculateTotal('full_day', null, {
      code: 'SUMMER10',
      discountPercent: 10,
    });
    expect(result.totalPrice).toBe(50);
    expect(result.finalPrice).toBe(45);
    expect(result.couponCode).toBe('SUMMER10');
  });

  it('calculates total without coupon', () => {
    const result = calculateTotal('full_day', null, null);
    expect(result).toEqual({
      totalPrice: 50,
      discountApplied: 0,
      finalPrice: 50,
      couponCode: null,
    });
  });
});
