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
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn(`[Census] HTTP ${response.status} for "${street}, ${city} ${zip}"`);
      return null;
    }
    const data = await response.json();
    const matches = data?.result?.addressMatches;
    if (!matches || matches.length === 0) {
      console.warn(`[Census] No matches for "${street}, ${city} ${zip}"`);
      return null;
    }
    const { x: lng, y: lat } = matches[0].coordinates;
    console.log(`[Census] OK: "${street}, ${city} ${zip}" → ${lat}, ${lng}`);
    return { lat, lng };
  } catch (err) {
    console.warn(`[Census] ${err.name === 'AbortError' ? 'Timeout' : err.message} for "${street}, ${city} ${zip}"`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeNominatim(street, city, zip, _isRetry = false) {
  const q = encodeURIComponent(`${street}, ${city}, CA ${zip}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CEOC-Letter-Generator/1.0 (ceocletters.com)' },
    });
    // On 429 rate limit, wait 2s and retry once before giving up
    if (response.status === 429 && !_isRetry) {
      console.warn(`[Nominatim] HTTP 429 rate limited - waiting 2s before retry for "${street}, ${city} ${zip}"`);
      clearTimeout(timeout);
      await new Promise(r => setTimeout(r, 2000));
      return geocodeNominatim(street, city, zip, true);
    }
    if (!response.ok) {
      console.warn(`[Nominatim] HTTP ${response.status} for "${street}, ${city} ${zip}"`);
      return null;
    }
    const results = await response.json();
    if (!results || results.length === 0) {
      console.warn(`[Nominatim] No matches for "${street}, ${city} ${zip}"`);
      return null;
    }
    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon);
    console.log(`[Nominatim] OK: "${street}, ${city} ${zip}" → ${lat}, ${lng}`);
    return { lat, lng };
  } catch (err) {
    console.warn(`[Nominatim] ${err.name === 'AbortError' ? 'Timeout' : err.message} for "${street}, ${city} ${zip}"`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ZIP-code centroid fallback — uses Census TIGERweb for rough coordinates
async function geocodeByZip(zip) {
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${zip}&benchmark=Public_AR_Current&format=json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const matches = data?.result?.addressMatches;
    if (!matches || matches.length === 0) return null;
    const { x: lng, y: lat } = matches[0].coordinates;
    console.log(`[ZIP-fallback] OK: ZIP ${zip} → ${lat}, ${lng}`);
    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeAddress(street, city, zip) {
  const cleanStreet = stripUnit(street);
  console.log(`[Geocode] Starting lookup: "${cleanStreet}", "${city}", "${zip}"`);

  // Strategy 1: Census geocoder (try twice with a pause)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await geocodeCensus(cleanStreet, city, zip);
    if (result) return result;
    if (attempt < 2) await new Promise(r => setTimeout(r, 800));
  }

  // Strategy 2: Nominatim (try twice with a pause)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await geocodeNominatim(cleanStreet, city, zip);
    if (result) return result;
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
  }

  // Strategy 3: Try with just city + ZIP on Census (drops street)
  const cityOnly = await geocodeCensus('', city, zip);
  if (cityOnly) {
    console.log(`[Geocode] Using city-level fallback for "${city}, CA ${zip}"`);
    return cityOnly;
  }

  // Strategy 4: Try Nominatim with just city + state
  const cityNom = await geocodeNominatim('', city, zip);
  if (cityNom) {
    console.log(`[Geocode] Using Nominatim city-level fallback for "${city}, CA ${zip}"`);
    return cityNom;
  }

  console.error(`[Geocode] All strategies failed for "${cleanStreet}, ${city}, CA ${zip}"`);
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
