import { environment } from '../../../environments/environment';

/** Local ride images served by the API — avoids broken external CDN links. */
export function getLocalParkImages(): string[] {
  const base = environment.uploadsUrl;
  return [
    `${base}/uploads/images/ferris-wheel.jpg`,
    `${base}/uploads/images/roller-coaster.jpg`,
    `${base}/uploads/images/carousel.jpg`,
    `${base}/uploads/images/water-slide.jpg`,
    `${base}/uploads/images/light-show.jpg`,
  ];
}

export function getDefaultParkImage(): string {
  return `${environment.uploadsUrl}/uploads/images/ferris-wheel.jpg`;
}
