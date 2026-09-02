export const BENGALURU_SOURCES = [
  { id: "mg-road", name: "MG Road Metro Station", lat: 12.9756, lon: 77.6066, area: "Central CBD" },
  { id: "indiranagar", name: "Indiranagar 100ft Road", lat: 12.9784, lon: 77.6408, area: "East" },
  { id: "koramangala", name: "Koramangala 5th Block", lat: 12.9352, lon: 77.6245, area: "South-East" },
  { id: "majestic", name: "Majestic Kempegowda Bus Station", lat: 12.9767, lon: 77.5713, area: "West-Central" },
  { id: "electronic-city", name: "Electronic City Phase 1", lat: 12.8452, lon: 77.6602, area: "South" },
  { id: "whitefield", name: "Whitefield ITPL Main Road", lat: 12.9866, lon: 77.7381, area: "East" },
  { id: "malleshwaram", name: "Malleshwaram 8th Cross", lat: 12.9984, lon: 77.5712, area: "North-West" },
  { id: "jayanagar", name: "Jayanagar 4th Block", lat: 12.9298, lon: 77.5835, area: "South" },
  { id: "hebbal", name: "Hebbal Flyover Junction", lat: 13.0358, lon: 77.5970, area: "North" },
  { id: "silk-board", name: "Central Silk Board Junction", lat: 12.9167, lon: 77.6214, area: "South" },
  { id: "btm-layout", name: "BTM Layout 2nd Stage", lat: 12.9166, lon: 77.6101, area: "South" },
  { id: "marathahalli", name: "Marathahalli Outer Ring Road", lat: 12.9591, lon: 77.6974, area: "East" },
  { id: "hsr-layout", name: "HSR Layout Sector 1", lat: 12.9121, lon: 77.6446, area: "South-East" },
  { id: "yeshwanthpur", name: "Yeshwanthpur Station Junction", lat: 13.0238, lon: 77.5501, area: "North-West" },
  { id: "rajajinagar", name: "Rajajinagar 1st Block", lat: 12.9901, lon: 77.5528, area: "West" },
  { id: "banashankari", name: "Banashankari 2nd Stage", lat: 12.9254, lon: 77.5663, area: "South-West" },
  { id: "church-street", name: "Church Street Central", lat: 12.9751, lon: 77.6047, area: "Central CBD" },
  { id: "cubbon-park", name: "Cubbon Park Kanteerava Gate", lat: 12.9738, lon: 77.5907, area: "Central CBD" },
  { id: "bellandur", name: "Bellandur EcoSpace Junction", lat: 12.9260, lon: 77.6762, area: "East" },
  { id: "sarjapur-road", name: "Sarjapur Road Wipro Gate", lat: 12.9110, lon: 77.6833, area: "South-East" },
  { id: "yelahanka", name: "Yelahanka Old Town", lat: 13.1007, lon: 77.5963, area: "North" },
  { id: "kr-puram", name: "KR Puram Hanging Bridge", lat: 13.0039, lon: 77.6987, area: "East" },
];

export const BENGALURU_DESTINATIONS = [
  { id: "victoria", name: "Victoria Hospital Trauma Center", lat: 12.9628, lon: 77.5746, type: "Trauma & Emergency Care" },
  { id: "manipal-hal", name: "Manipal Hospital (Old Airport Rd)", lat: 12.9592, lon: 77.6491, type: "Cardiac & Multi-Specialty" },
  { id: "st-johns", name: "St. John's Medical College Hospital", lat: 12.9304, lon: 77.6186, type: "Multi-Specialty & Organ Transplant" },
  { id: "nimhans", name: "NIMHANS Emergency Brain & Trauma Care", lat: 12.9392, lon: 77.5958, type: "Neurotrauma & Critical Care" },
  { id: "narayana-health", name: "Narayana Health City (Mazumdar Shaw)", lat: 12.8124, lon: 77.6912, type: "Cardiothoracic & Pediatric" },
  { id: "fortis-cunningham", name: "Fortis Hospital (Cunningham Road)", lat: 12.9856, lon: 77.5978, type: "Critical Care & Stroke Center" },
  { id: "apollo-bannerghatta", name: "Apollo Hospital (Bannerghatta Road)", lat: 12.8954, lon: 77.5986, type: "Emergency & Trauma" },
  { id: "bowring", name: "Bowring & Lady Curzon Hospital", lat: 12.9831, lon: 77.6033, type: "Government General Hospital" },
  { id: "aster-cmi", name: "Aster CMI Hospital (Hebbal)", lat: 13.0558, lon: 77.5925, type: "Emergency & Critical Care" },
  { id: "sakra", name: "Sakra World Hospital (Bellandur)", lat: 12.9268, lon: 77.6836, type: "Trauma & Advanced Surgery" },
  { id: "manipal-yesh", name: "Manipal Hospital (Yeshwanthpur)", lat: 13.0135, lon: 77.5552, type: "Super Specialty & Trauma" },
  { id: "cloudnine", name: "Cloudnine Hospital (Jayanagar)", lat: 12.9300, lon: 77.5850, type: "Maternity & Pediatric Emergency" },
  { id: "columbia-asia", name: "Columbia Asia Referral Hospital (Yeshwanthpur)", lat: 13.0142, lon: 77.5539, type: "Multi-Specialty Emergency" },
  { id: "jayadeva", name: "Sri Jayadeva Institute of Cardiovascular Sciences", lat: 12.9189, lon: 77.5983, type: "Heart & Vascular Emergency" },
  { id: "kc-general", name: "KC General Hospital (Malleshwaram)", lat: 12.9961, lon: 77.5684, type: "Government General Hospital" },
];

export const ALL_LOCATIONS = [
  ...BENGALURU_DESTINATIONS,
  ...BENGALURU_SOURCES,
];

/**
 * Fuzzy word matching between query and a target name/id
 */
function isMatch(query, target) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;

  // Split into tokens: if all words in query appear in target
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 0 && words.every((w) => t.includes(w))) {
    return true;
  }
  return false;
}

/**
 * Resolve either an object {lat, lon}, a string name, or "lat, lon" string into {lat, lon, name} synchronously
 */
export function resolveLocation(value, isDestination = false) {
  if (!value) return null;

  if (typeof value === "object" && typeof value.lat === "number" && typeof value.lon === "number") {
    return { lat: value.lat, lon: value.lon, name: value.name || `${value.lat.toFixed(4)}, ${value.lon.toFixed(4)}` };
  }

  const str = String(value).trim();

  // If it's a coordinate string "12.9756, 77.6066"
  if (str.includes(",")) {
    const parts = str.split(",").map((s) => Number(s.trim()));
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return { lat: parts[0], lon: parts[1], name: str };
    }
  }

  // Check primary preferred list first
  const primary = isDestination ? BENGALURU_DESTINATIONS : BENGALURU_SOURCES;
  const match = primary.find((item) => isMatch(str, item.name) || isMatch(str, item.id));
  if (match) {
    return { lat: match.lat, lon: match.lon, name: match.name };
  }

  // Check secondary list
  const secondary = isDestination ? BENGALURU_SOURCES : BENGALURU_DESTINATIONS;
  const altMatch = secondary.find((item) => isMatch(str, item.name) || isMatch(str, item.id));
  if (altMatch) {
    return { lat: altMatch.lat, lon: altMatch.lon, name: altMatch.name };
  }

  return null;
}

/**
 * Asynchronous Geocoding: resolves local matches first, or queries OpenStreetMap Nominatim for any arbitrary typed location in Bengaluru
 */
export async function geocodeLocation(value, isDestination = false) {
  const local = resolveLocation(value, isDestination);
  if (local) return local;

  const str = String(value).trim();
  if (!str) return null;

  // Query OpenStreetMap Nominatim for user typed location
  try {
    const encoded = encodeURIComponent(`${str}, Bengaluru, Karnataka, India`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" },
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const shortName = item.display_name.split(",")[0] || str;
          return { lat, lon, name: `${shortName} (${str})` };
        }
      }
    }
  } catch (err) {
    console.warn("Geocoding lookup failed for:", str, err.message);
  }

  // Default fallback if unknown
  if (isDestination) {
    return { lat: 12.9628, lon: 77.5746, name: str || "Victoria Hospital Trauma Center" };
  }
  return { lat: 12.9756, lon: 77.6066, name: str || "MG Road Metro Station" };
}
