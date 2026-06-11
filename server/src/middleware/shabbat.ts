import { NextFunction, Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hebcalModule: any = null;

async function loadHebcal() {
  if (!hebcalModule) {
    hebcalModule = await import('@hebcal/core');
  }
  return hebcalModule;
}

export async function isShabbatOrHoliday(date: Date = new Date()): Promise<boolean> {
  const { HebrewCalendar, Location } = await loadHebcal();
  const location = Location.lookup('Jerusalem');
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    location,
    isHebrewYear: false,
  });

  return events.some((event: { getCategories: () => string[]; basename: string }) => {
    const categories = event.getCategories();
    return (
      categories.includes('candles') ||
      categories.includes('holiday') ||
      event.basename === 'Shabbat'
    );
  });
}

function shabbatMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    next();
    return;
  }

  isShabbatOrHoliday()
    .then((blocked) => {
      if (blocked) {
        res.status(403).json({
          message: 'הפעולה אינה זמינה בשבת ובחגים. נסו שוב לאחר צאת השבת/ החג.',
        });
        return;
      }
      next();
    })
    .catch(next);
}

export default shabbatMiddleware;
