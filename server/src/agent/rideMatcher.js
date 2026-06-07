const Ride = require('../models/Ride');

function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function findRideByName(rideName) {
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

async function suggestRideNames(limit = 5) {
  const rides = await Ride.find({ status: 'active' }).select('name').sort({ name: 1 }).limit(limit);
  return rides.map((ride) => ride.name);
}

module.exports = { findRideByName, suggestRideNames, normalize };
