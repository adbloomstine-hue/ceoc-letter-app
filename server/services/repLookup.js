const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const { point } = require('@turf/helpers');
const { getAssemblyData, getSenateData } = require('./geoData');

async function geocodeAddress(street, city, zip) {
  const fullAddress = encodeURIComponent(`${street}, ${city}, CA ${zip}`);
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${fullAddress}&benchmark=2020&format=json`;

  // 10-second timeout to prevent hanging if Census API is slow or down
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Unable to look up your representatives right now. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();
  const matches = data?.result?.addressMatches;
  if (!matches || matches.length === 0) {
    throw new Error('Address could not be geocoded. Please check the address and try again.');
  }
  const { x: lng, y: lat } = matches[0].coordinates;
  return { lat, lng };
}

function findReps(lat, lng) {
  const pt = point([lng, lat]);
  let assemblyMember = null;
  let senator = null;

  for (const feature of getAssemblyData().features) {
    if (booleanPointInPolygon(pt, feature)) {
      const p = feature.properties;
      assemblyMember = {
        name: `${p.NAME} ${p.LAST_NAME}`,
        firstName: p.NAME,
        lastName: p.LAST_NAME,
        district: p.DISTRICT,
        party: p.PARTY,
        website: p.WEBSITE,
        photo: p.PHOTO,
      };
      break;
    }
  }

  for (const feature of getSenateData().features) {
    if (booleanPointInPolygon(pt, feature)) {
      const p = feature.properties;
      senator = {
        name: `${p.first_name} ${p.last_name}`,
        firstName: p.first_name,
        lastName: p.last_name,
        district: String(p.district),
        party: p.party,
        website: p.district_website,
        phone: p.phone,
      };
      break;
    }
  }

  return { assemblyMember, senator };
}

async function lookupReps(street, city, zip) {
  const { lat, lng } = await geocodeAddress(street, city, zip);
  const reps = findReps(lat, lng);

  if (!reps.assemblyMember && !reps.senator) {
    return { ...reps, lat, lng, error: 'This address does not appear to be in California. Please enter a valid California address.' };
  }

  return { ...reps, lat, lng };
}

module.exports = { lookupReps };
