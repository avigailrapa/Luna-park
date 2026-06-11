import { fullDayPrice, hourlyRate } from '../config/env';
import type { CouponLike, TicketType } from '../types';

export function calculateBasePrice(
  ticketType: TicketType,
  hoursAmount: number | null,
  ridePrice?: number | null,
): number {
  if (ticketType === 'full_day') {
    return fullDayPrice;
  }
  if (ticketType === 'hourly') {
    if (!hoursAmount || hoursAmount < 1) {
      throw new Error('נדרש מספר שעות תקין לכרטיס שעתי');
    }
    return hourlyRate * hoursAmount;
  }
  if (ticketType === 'ride') {
    if (ridePrice == null || ridePrice < 0) {
      throw new Error('מחיר מתקן נדרש');
    }
    return ridePrice;
  }
  throw new Error('סוג כרטיס לא תקין');
}

export function applyDiscount(basePrice: number, discountPercent: number) {
  const discountApplied = Math.round(basePrice * (discountPercent / 100) * 100) / 100;
  const finalPrice = Math.round((basePrice - discountApplied) * 100) / 100;
  return { discountApplied, finalPrice };
}

export function calculateTotal(
  ticketType: TicketType,
  hoursAmount: number | null,
  coupon: CouponLike | null,
  ridePrice?: number | null,
) {
  const totalPrice = calculateBasePrice(ticketType, hoursAmount, ridePrice);
  if (!coupon) {
    return { totalPrice, discountApplied: 0, finalPrice: totalPrice, couponCode: null as string | null };
  }
  const { discountApplied, finalPrice } = applyDiscount(totalPrice, coupon.discountPercent);
  return {
    totalPrice,
    discountApplied,
    finalPrice,
    couponCode: coupon.code,
  };
}
