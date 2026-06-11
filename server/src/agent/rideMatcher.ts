import Ride, { IRide } from '../models/Ride';

export function normalize(text: string): string {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export async function findRideByName(rideName: string): Promise<IRide | null> {
  const query = normalize(rideName);
  if (!query) return null;

  const rides = await Ride.find({ status: 'active' }).sort({ name: 1 });

  let match = rides.find((ride) => normalize(ride.name) === query);
  if (match) return match;

  match = rides.find((ride) => normalize(ride.name).includes(query));
  if (match) return match;

  match = rides.find((ride) => query.includes(normalize(ride.name)));
  if (match) return match;

  const words = query.split(/\s+/).filter((word) => word.length > 1);
  if (words.length) {
    match = rides.find((ride) => {
      const name = normalize(ride.name);
      return words.every((word) => name.includes(word));
    });
    if (match) return match;
  }

  return null;
}

export async function suggestRideNames(limit = 5): Promise<string[]> {
  const rides = await Ride.find({ status: 'active' }).select('name').sort({ name: 1 }).limit(limit);
  return rides.map((ride) => ride.name);
}
