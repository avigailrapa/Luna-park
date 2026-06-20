export const COUPON_IMAGE_FILE = 'coupon.jpg';
export const COUPON_IMAGE_PATH = `/uploads/images/${COUPON_IMAGE_FILE}`;
export const COUPON_IMAGE_VERSION = 1;

export function couponImageUrl(version = COUPON_IMAGE_VERSION): string {
  return `${COUPON_IMAGE_PATH}?v=${version}`;
}
