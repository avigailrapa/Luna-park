import { describe, expect, it } from 'vitest';
import {
  extractRideName,
  isGenericAddToCartMessage,
  isGenericRidePlaceholder,
  parseDateToken,
  parseMessage,
} from './intentParser';

describe('intentParser', () => {
  it('returns help intent', () => {
    expect(parseMessage('עזרה')).toEqual({ type: 'help' });
  });

  it('returns health tool intent', () => {
    expect(parseMessage('health')).toEqual({ type: 'tool', tool: 'health', params: {} });
  });

  it('returns cart show client action', () => {
    expect(parseMessage('מה בסל')).toEqual({ type: 'client', action: 'cart_show' });
  });

  it('returns pick_ride_for_cart for generic add to cart', () => {
    expect(parseMessage('הוסף לסל')).toEqual({
      type: 'tool',
      tool: 'pick_ride_for_cart',
      params: {},
    });
  });

  it('extracts ride name for add to cart', () => {
    expect(parseMessage('הוסף גלגל הענק לסל')).toEqual({
      type: 'tool',
      tool: 'add_to_cart',
      params: { rideName: 'גלגל הענק' },
    });
  });

  it('parses today date token', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(parseDateToken('היום')).toBe(expected);
  });

  it('detects generic ride placeholders', () => {
    expect(isGenericRidePlaceholder('מתקן')).toBe(true);
    expect(isGenericRidePlaceholder('גלגל הענק')).toBe(false);
  });

  it('detects generic add to cart messages', () => {
    expect(isGenericAddToCartMessage('הוסף לסל')).toBe(true);
    expect(isGenericAddToCartMessage('הוסף גלגל הענק לסל')).toBe(false);
  });

  it('extracts ride name from message', () => {
    expect(extractRideName('הוסף קרוסלת הכוכבים לסל')).toBe('קרוסלת הכוכבים');
  });

  it('returns unknown for unrecognized input', () => {
    expect(parseMessage('xyz random text')).toEqual({ type: 'unknown' });
  });
});
