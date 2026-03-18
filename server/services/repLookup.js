const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const { point } = require('@turf/helpers');
const { getAssemblyData, getSenateData } = require('./geoData');

// Strip apartment/unit/suite from street for geocoding (Census often chokes on these)
function stripUnit(street) {
  return street.replace(/[,.]?\s*(apt|suite|ste|unit|#)\s*\S*/i, '').trim();
}

async function geocodeCensus(street, city, zip) {
  const fullAddress = encodeURIComponent(`${street}, ${city}, CA ${zip}`);
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${fullAddress}&benchmark=Public_AR_Current&format=json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();
    const matches = data?.result?.addressMatches;
    if (!matches || matches.length === 0) return null;
    const { x: lng, y: lat } = matches[0].coordinates;
    return { lat, lng };
  } catch (err) {
    if (err.name === 'AbortError') return null;
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeNominatim(street, city, zip) {
  const q = encodeURIComponent(`${street}, ${city}, CA ${zip}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CEOC-Letter-Generator/1.0' },
    });
    const results = await response.json();
    if (!results || results.length === 0) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeAddress(street, city, zip) {
  const cleanStreet = stripUnit(street);

  // Try Census geocoder with retries (primary)
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await geocodeCensus(cleanStreet, city, zip);
    if (result) return result;
    if (attempt < 3) await new Promise(r => setTimeout(r, 500));
  }

  // Fallback: OpenStreetMap Nominatim
  const fallback = await geocodeNominatim(cleanStreet, city, zip);
  if (fallback) return fallback;

  throw new Error('Address could not be geocoded. Please check the address and try again.');
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

  if (!reps.assemblyMember || !reps.senator) {
    return { ...reps, lat, lng, error: 'This address does not appear to be in California. Please enter a valid California address.' };
  }

  return { ...reps, lat, lng };
}

module.exports = { lookupReps };
