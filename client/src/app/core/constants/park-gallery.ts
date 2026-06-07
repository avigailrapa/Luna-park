import { environment } from '../../../environments/environment';

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
}

export function getHeroSlides(): HeroSlide[] {
  const base = environment.uploadsUrl;
  return [
    {
      image: `${base}/uploads/images/ferris-wheel.jpg`,
      title: 'גלגל ענק מואר',
      subtitle: 'נוף פנורמי על כל הפארק',
    },
    {
      image: `${base}/uploads/images/roller-coaster.jpg`,
      title: 'רכבות הרים אדרנלין',
      subtitle: 'ריגושים בלתי נשכחים',
    },
    {
      image: `${base}/uploads/images/light-show.jpg`,
      title: 'מופעי אור וזיקוקים',
      subtitle: 'קסם בכל ערב',
    },
    {
      image: `${base}/uploads/images/water-slide.jpg`,
      title: 'אזור המים',
      subtitle: 'התרעננות בקיץ',
    },
    {
      image: `${base}/uploads/images/carousel.jpg`,
      title: 'כיף לכל המשפחה',
      subtitle: 'אטרקציות לכל הגילאים',
    },
  ];
}

/** Local ride images served by the API — avoids broken external CDN links. */
export function getLocalParkImages(): string[] {
  return getHeroSlides().map((s) => s.image);
}

export function getDefaultParkImage(): string {
  return `${environment.uploadsUrl}/uploads/images/ferris-wheel.jpg`;
}

export function getAuthBackgroundImage(): string {
  return `${environment.uploadsUrl}/uploads/images/light-show.jpg`;
}
