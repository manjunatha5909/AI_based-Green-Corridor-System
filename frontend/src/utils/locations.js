export const BENGALURU_SOURCES = [
  { id: "mg-road", name: "MG Road Metro Station", lat: 12.9756, lon: 77.6066, area: "Central CBD" },
  { id: "indiranagar", name: "Indiranagar 100ft Road", lat: 12.9784, lon: 77.6408, area: "East" },
  { id: "koramangala", name: "Koramangala 5th Block", lat: 12.9352, lon: 77.6245, area: "South-East" },
  { id: "majestic", name: "Majestic / Kempegowda Bus Station", lat: 12.9767, lon: 77.5713, area: "West-Central" },
  { id: "electronic-city", name: "Electronic City Phase 1", lat: 12.8452, lon: 77.6602, area: "South" },
  { id: "whitefield", name: "Whitefield ITPL Main Road", lat: 12.9866, lon: 77.7381, area: "East" },
  { id: "malleshwaram", name: "Malleshwaram 8th Cross", lat: 12.9984, lon: 77.5712, area: "North-West" },
  { id: "jayanagar", name: "Jayanagar 4th Block", lat: 12.9298, lon: 77.5835, area: "South" },
  { id: "hebbal", name: "Hebbal Flyover Junction", lat: 13.0358, lon: 77.5970, area: "North" },
  { id: "marathahalli", name: "Marathahalli Outer Ring Road", lat: 12.9591, lon: 77.6974, area: "East" },
  { id: "hsr-layout", name: "HSR Layout Sector 1", lat: 12.9121, lon: 77.6446, area: "South-East" },
  { id: "yeshwanthpur", name: "Yeshwanthpur Station Junction", lat: 13.0238, lon: 77.5501, area: "North-West" },
  { id: "rajajinagar", name: "Rajajinagar 1st Block", lat: 12.9901, lon: 77.5528, area: "West" },
  { id: "banashankari", name: "Banashankari 2nd Stage", lat: 12.9254, lon: 77.5663, area: "South-West" },
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
];

/**
 * Resolve either an object {lat, lon}, a string name, or "lat, lon" string into {lat, lon, name}
 */
export function resolveLocation(value, isDestination = false) {
  if (!value) return null;

  if (typeof value === "object" && typeof value.lat === "number" && typeof value.lon === "number") {
    return value;
  }

  const str = String(value).trim();

  // If it's a coordinate string "12.9756, 77.6066"
  if (str.includes(",")) {
    const parts = str.split(",").map((s) => Number(s.trim()));
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return { lat: parts[0], lon: parts[1], name: str };
    }
  }

  // Lookup in dataset
  const list = isDestination ? BENGALURU_DESTINATIONS : BENGALURU_SOURCES;
  const match = list.find((item) =>
    item.name.toLowerCase().includes(str.toLowerCase()) ||
    item.id.toLowerCase() === str.toLowerCase()
  );

  if (match) {
    return { lat: match.lat, lon: match.lon, name: match.name };
  }

  // Also check other list as fallback
  const altList = isDestination ? BENGALURU_SOURCES : BENGALURU_DESTINATIONS;
  const altMatch = altList.find((item) =>
    item.name.toLowerCase().includes(str.toLowerCase()) ||
    item.id.toLowerCase() === str.toLowerCase()
  );

  if (altMatch) {
    return { lat: altMatch.lat, lon: altMatch.lon, name: altMatch.name };
  }

  return null;
}

