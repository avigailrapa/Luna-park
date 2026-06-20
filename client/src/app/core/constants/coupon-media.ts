export const COUPON_IMAGE_PATH = '/uploads/images/coupon.jpg';

export function couponImagePath(version = 1): string {
  return `${COUPON_IMAGE_PATH}?v=${version}`;
}
