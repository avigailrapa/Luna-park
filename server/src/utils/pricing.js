const { fullDayPrice, hourlyRate } = require('../config/env');

function calculateBasePrice(ticketType, hoursAmount, ridePrice) {
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

function applyDiscount(basePrice, discountPercent) {
  const discountApplied = Math.round(basePrice * (discountPercent / 100) * 100) / 100;
  const finalPrice = Math.round((basePrice - discountApplied) * 100) / 100;
  return { discountApplied, finalPrice };
}

function calculateTotal(ticketType, hoursAmount, coupon, ridePrice) {
  const totalPrice = calculateBasePrice(ticketType, hoursAmount, ridePrice);
  if (!coupon) {
    return { totalPrice, discountApplied: 0, finalPrice: totalPrice, couponCode: null };
  }
  const { discountApplied, finalPrice } = applyDiscount(totalPrice, coupon.discountPercent);
  return {
    totalPrice,
    discountApplied,
    finalPrice,
    couponCode: coupon.code,
  };
}

module.exports = { calculateBasePrice, applyDiscount, calculateTotal };
