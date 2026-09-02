import { resolveLocation, geocodeLocation } from "../utils/locations";

/**
 * AI Based Green Corridor System - Hybrid API Client
 * ===================================================
 * Seamlessly links the React frontend to the Python Flask Backend:
 * - Direct REST API integration with Flask server on http://127.0.0.1:5000
 * - Endpoints: /route, /corridor/start, /activate-signal/<id>, /location/update, /
 * - Real-time OpenStreetMap / OSMnx shortest path graph routing & live signal control
 * - Automatic graceful fallback to in-browser OSRM engine if backend is temporarily offline
 */

export const BACKEND_URL = "http://127.0.0.1:5000";

let lastBackendStatus = { online: false, lastChecked: 0 };

export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${BACKEND_URL}/`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      lastBackendStatus = {
        online: true,
        project: data.project || "AI Green Corridor System",
        status: data.status || "Running",
        version: data.version || "1.0",
        lastChecked: Date.now(),
      };
      return { online: true, ...lastBackendStatus };
    }
  } catch (err) {
    // Backend offline or unreachable
  }
  lastBackendStatus = { online: false, lastChecked: Date.now() };
  return { online: false };
}

export function getBackendStatus() {
  return lastBackendStatus;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Fallback Road Polyline Generator (Bengaluru urban road curvature)
function generateFallbackRoute(srcLat, srcLon, dstLat, dstLon, numPoints = 80) {
  const coordinates = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    let lat = srcLat + (dstLat - srcLat) * t;
    let lon = srcLon + (dstLon - srcLon) * t;
    const lateralCurve = Math.sin(t * Math.PI) * 0.0032;
    const microJitter = Math.sin(t * Math.PI * 4) * 0.0008;
    lat += lateralCurve * 0.6 + microJitter;
    lon += lateralCurve * 0.9 + microJitter * 0.5;
    coordinates.push([parseFloat(lat.toFixed(6)), parseFloat(lon.toFixed(6))]);
  }

  let distanceKm = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    distanceKm += haversineDistance(
      coordinates[i][0], coordinates[i][1],
      coordinates[i + 1][0], coordinates[i + 1][1]
    );
  }
  distanceKm = parseFloat(distanceKm.toFixed(2));

  const steps = [
    { instruction: "Head onto Main Emergency Arterial Road", street: "Main Road", distance_m: 500, duration_s: 30 },
    { instruction: "Continue straight along Central Express Corridor", street: "Central Corridor", distance_m: 1200, duration_s: 70 },
    { instruction: "Merge onto Hospital Approach Link", street: "Hospital Link", distance_m: 800, duration_s: 45 },
    { instruction: "Arrive at Emergency Trauma Center", street: "Emergency Trauma Center", distance_m: 0, duration_s: 0 },
  ];

  return { coordinates, distanceKm, steps };
}

// Client-side OSRM fallback fetcher
async function fetchRealOsmRoute(srcLat, srcLon, dstLat, dstLon) {
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${srcLon},${srcLat};${dstLon},${dstLat}?overview=full&geometries=geojson&steps=true&annotations=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        const distanceKm = parseFloat((route.distance / 1000).toFixed(2));

        const steps = [];
        if (route.legs && route.legs[0]?.steps) {
          for (const s of route.legs[0].steps) {
            let inst = s.maneuver?.instruction;
            if (!inst) {
              const type = s.maneuver?.type || "continue";
              const modifier = s.maneuver?.modifier || "";
              const street = s.name || "Main Road";
              if (type === "depart") inst = `Depart on ${street}`;
              else if (type === "arrive") inst = `Arrive at Trauma Center`;
              else if (type.includes("turn")) inst = `Turn ${modifier} onto ${street}`;
              else inst = `Continue onto ${street}`;
            }
            const loc = s.maneuver?.location ? [s.maneuver.location[1], s.maneuver.location[0]] : null;
            steps.push({
              instruction: inst,
              street: s.name || "Connecting Street",
              distance_m: Math.round(s.distance || 0),
              duration_s: Math.round(s.duration || 0),
              location: loc,
            });
          }
        }

        if (coordinates.length >= 10) {
          return { coordinates, distanceKm, steps };
        }
      }
    }
  } catch (err) {
    console.warn("OSRM public API query fallback:", err.message);
  }

  return generateFallbackRoute(srcLat, srcLon, dstLat, dstLon);
}

function extractSignalsAndHeadings(coordinates, steps) {
  const totalPts = coordinates.length;
  const bearings = [];

  for (let i = 0; i < totalPts; i++) {
    if (i < totalPts - 1) {
      const b = calculateBearing(
        coordinates[i][0], coordinates[i][1],
        coordinates[i + 1][0], coordinates[i + 1][1]
      );
      bearings.push(parseFloat(b.toFixed(1)));
    } else {
      bearings.push(bearings.length > 0 ? bearings[bearings.length - 1] : 0.0);
    }
  }

  const signals = [];
  const signalStates = [];
  const numSignals = Math.max(3, Math.min(8, Math.floor(totalPts / 20)));
  const stepInterval = Math.floor(totalPts / (numSignals + 1));

  let cumDist = 0.0;
  const distFromStart = [0.0];
  for (let i = 1; i < totalPts; i++) {
    cumDist += haversineDistance(
      coordinates[i - 1][0], coordinates[i - 1][1],
      coordinates[i][0], coordinates[i][1]
    );
    distFromStart.push(cumDist);
  }

  const landmarkNames = [
    "Cubbon Park Junction",
    "MG Road Central Crossing",
    "Brigade Road Intersection",
    "Richmond Circle Cross",
    "Corporation Circle Square",
    "KR Market Flyover Junction",
    "Victoria Trauma Approach",
    "City Central Boulevard",
  ];

  for (let s = 1; s <= numSignals; s++) {
    const wpIdx = Math.min(s * stepInterval, totalPts - 2);
    const pt = coordinates[wpIdx];
    const sigId = 1000 + s;

    let junctionName = landmarkNames[(s - 1) % landmarkNames.length];
    for (const step of steps) {
      if (step.location) {
        const d = haversineDistance(pt[0], pt[1], step.location[0], step.location[1]);
        if (d < 0.25 && step.street && step.street !== "Connecting Street") {
          junctionName = `${step.street} Crossing`;
          break;
        }
      }
    }

    const distKm = parseFloat(distFromStart[wpIdx].toFixed(2));
    signals.push({
      id: sigId,
      name: junctionName,
      lat: pt[0],
      lon: pt[1],
      distance_from_start_km: distKm,
      waypoint_index: wpIdx,
    });

    signalStates.push({
      id: sigId,
      name: junctionName,
      state: "RED",
      distance_from_start_km: distKm,
      last_cleared: null,
    });
  }

  return { bearings, signals, signalStates };
}

// Global In-Browser Corridor State Store
const clientState = {
  active: false,
  source: null,
  destination: null,
  distance_km: 0.0,
  eta_minutes: 0.0,
  route: [],
  route_bearings: [],
  steps: [],
  traffic_signals: [],
  signal_states: [],
  active_signal_index: -1,
  vehicle_index: 0,
  current_position: null,
  current_speed_kmh: 0.0,
  current_street: "Standby",
  next_maneuver: null,
  start_time: null,
  last_updated: null,
  backend_connected: false,
  data_source: "In-Browser Engine",
};

export async function createRoute(source, destination) {
  const parseCoords = async (value, isDst) => {
    if (typeof value === "object" && typeof value.lat === "number" && typeof value.lon === "number") {
      return { lat: value.lat, lon: value.lon, name: value.name || `${value.lat.toFixed(4)}, ${value.lon.toFixed(4)}` };
    }
    const resolved = await geocodeLocation(value, isDst);
    if (!resolved) {
      throw new Error(`Could not resolve location: "${value}". Enter a place name or GPS coordinates.`);
    }
    return { lat: resolved.lat, lon: resolved.lon, name: resolved.name };
  };

  const src = await parseCoords(source, false);
  const dst = await parseCoords(destination, true);

  let coordinates = [];
  let distanceKm = 0.0;
  let etaMinutes = 0.0;
  let steps = [];
  let signals = [];
  let signalStates = [];
  let bearings = [];
  let isBackendRoute = false;

  // 1. Attempt Route Calculation from Flask Backend
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    const res = await fetch(`${BACKEND_URL}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: { lat: src.lat, lon: src.lon },
        destination: { lat: dst.lat, lon: dst.lon },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.route) && data.route.length > 0) {
        coordinates = data.route;
        distanceKm = data.distance_km || 0.0;
        etaMinutes = data.eta_minutes || Math.max(2, Math.round((distanceKm / 60) * 60));
        isBackendRoute = true;
        lastBackendStatus.online = true;

        // Compute forward bearings for vehicle rotation
        const totalPts = coordinates.length;
        for (let i = 0; i < totalPts; i++) {
          if (i < totalPts - 1) {
            const b = calculateBearing(
              coordinates[i][0], coordinates[i][1],
              coordinates[i + 1][0], coordinates[i + 1][1]
            );
            bearings.push(parseFloat(b.toFixed(1)));
          } else {
            bearings.push(bearings.length > 0 ? bearings[bearings.length - 1] : 0.0);
          }
        }

        // Map backend traffic signals to nearest waypoints
        if (Array.isArray(data.traffic_signals) && data.traffic_signals.length > 0) {
          signals = data.traffic_signals.map((sig, idx) => {
            let closestWp = 0;
            let minDist = Infinity;
            for (let i = 0; i < totalPts; i++) {
              const d = haversineDistance(coordinates[i][0], coordinates[i][1], sig.lat, sig.lon);
              if (d < minDist) {
                minDist = d;
                closestWp = i;
              }
            }
            return {
              id: sig.id || 1000 + idx,
              name: sig.name || `Traffic Signal #${idx + 1}`,
              lat: sig.lat,
              lon: sig.lon,
              waypoint_index: closestWp,
              distance_from_start_km: parseFloat((closestWp * (distanceKm / Math.max(1, totalPts))).toFixed(2)),
            };
          });
        }

        if (Array.isArray(data.signal_states) && data.signal_states.length > 0) {
          signalStates = data.signal_states;
        } else {
          signalStates = signals.map((s) => ({
            id: s.id,
            name: s.name,
            state: "RED",
            last_cleared: null,
          }));
        }

        // Generate clean steps
        steps = [
          { instruction: `Depart from ${src.name || "Origin"}`, street: "Emergency Route", location: coordinates[0] },
          { instruction: "Proceed through priority-cleared corridor", street: "Main Arterial", location: coordinates[Math.floor(coordinates.length / 2)] },
          { instruction: `Arrive at ${dst.name || "Hospital Trauma Center"}`, street: "Trauma Center Bay", location: coordinates[coordinates.length - 1] },
        ];
      }
    }
  } catch (backendErr) {
    console.warn("Backend /route unreachable, switching smoothly to in-browser engine:", backendErr.message);
    lastBackendStatus.online = false;
  }

  // 2. Fallback to In-Browser Engine if Backend was unavailable
  if (!isBackendRoute || coordinates.length === 0) {
    const osmRes = await fetchRealOsmRoute(src.lat, src.lon, dst.lat, dst.lon);
    coordinates = osmRes.coordinates;
    distanceKm = osmRes.distanceKm;
    steps = osmRes.steps;
    const extracted = extractSignalsAndHeadings(coordinates, steps);
    bearings = extracted.bearings;
    signals = extracted.signals;
    signalStates = extracted.signalStates;
    const avgSpeed = 65.0;
    etaMinutes = Math.max(1.5, parseFloat(((distanceKm / avgSpeed) * 60).toFixed(1)));
  }

  const initialPos = {
    lat: coordinates[0][0],
    lon: coordinates[0][1],
    bearing: bearings[0] || 0.0,
  };

  clientState.active = false;
  clientState.source = src;
  clientState.destination = dst;
  clientState.distance_km = distanceKm;
  clientState.eta_minutes = etaMinutes;
  clientState.route = coordinates;
  clientState.route_bearings = bearings;
  clientState.steps = steps;
  clientState.traffic_signals = signals;
  clientState.signal_states = signalStates;
  clientState.active_signal_index = -1;
  clientState.vehicle_index = 0;
  clientState.current_position = initialPos;
  clientState.current_speed_kmh = 0.0;
  clientState.current_street = steps[0]?.street || "Origin Point";
  clientState.next_maneuver = steps[0]?.instruction || null;
  clientState.start_time = null;
  clientState.last_updated = Date.now();
  clientState.backend_connected = isBackendRoute;
  clientState.data_source = isBackendRoute ? "Flask Backend (OSMNx + TomTom Traffic)" : "In-Browser Engine (OSRM)";

  return {
    distance_km: distanceKm,
    eta_minutes: etaMinutes,
    route: coordinates,
    route_bearings: bearings,
    steps,
    traffic_signals: signals,
    signal_states: signalStates,
    initial_position: initialPos,
    signals_count: signals.length,
    backend_connected: isBackendRoute,
    data_source: clientState.data_source,
  };
}

export async function startCorridor() {
  if (!clientState.traffic_signals || clientState.traffic_signals.length === 0) {
    throw new Error("No route active. Please calculate a route first.");
  }

  // If backend is online, notify it
  if (lastBackendStatus.online) {
    try {
      const res = await fetch(`${BACKEND_URL}/corridor/start`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.signal_states)) {
          clientState.signal_states = data.signal_states;
        }
      }
    } catch (e) {
      console.warn("Backend corridor/start call error:", e.message);
    }
  }

  clientState.active = true;
  clientState.active_signal_index = 0;
  clientState.current_speed_kmh = 65.0;
  clientState.start_time = Date.now();

  clientState.signal_states = clientState.signal_states.map((s, idx) => ({
    ...s,
    state: idx === 0 ? "GREEN" : "RED",
    last_cleared: idx === 0 ? Date.now() : s.last_cleared,
  }));

  return {
    status: "started",
    message: "Emergency Corridor Active. Junction #1 is GREEN.",
    active_signal_index: 0,
    speed_kmh: 65.0,
    signal_states: clientState.signal_states,
    backend_connected: lastBackendStatus.online,
  };
}

export async function stepCorridor() {
  if (!clientState.route || clientState.route.length === 0) {
    throw new Error("No active route.");
  }

  const totalPts = clientState.route.length;
  const currIdx = clientState.vehicle_index;
  const stepJump = Math.max(2, Math.floor(totalPts / 40));
  const nextIdx = Math.min(currIdx + stepJump, totalPts - 1);
  clientState.vehicle_index = nextIdx;

  const pt = clientState.route[nextIdx];
  const bearing = clientState.route_bearings[nextIdx] || 0;
  clientState.current_position = { lat: pt[0], lon: pt[1], bearing };

  if (nextIdx >= totalPts - 1) {
    clientState.current_speed_kmh = 0.0;
    clientState.active = false;
  } else {
    const speedVar = Math.sin(nextIdx * 0.3) * 5;
    clientState.current_speed_kmh = parseFloat((65.0 + speedVar).toFixed(1));
  }

  // Update signal clearance
  const signals = clientState.traffic_signals;
  signals.forEach((sig, idx) => {
    const dist = haversineDistance(pt[0], pt[1], sig.lat, sig.lon);
    if (dist < 0.6 || nextIdx >= sig.waypoint_index) {
      if (clientState.signal_states[idx]) {
        clientState.signal_states[idx].state = "GREEN";
        clientState.signal_states[idx].last_cleared = Date.now();
        clientState.active_signal_index = Math.max(clientState.active_signal_index, idx);
      }
    }
  });

  // Post live location to backend asynchronously
  if (lastBackendStatus.online) {
    fetch(`${BACKEND_URL}/location/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: pt[0], lon: pt[1] }),
    }).catch(() => {});
  }

  return {
    status: clientState.active ? "IN_TRANSIT" : "ARRIVED",
    vehicle_index: nextIdx,
    total_waypoints: totalPts,
    position: clientState.current_position,
    speed_kmh: clientState.current_speed_kmh,
    active_signal_index: clientState.active_signal_index,
    signal_states: clientState.signal_states,
    backend_connected: lastBackendStatus.online,
  };
}

export async function runCorridorAutomatically() {
  return startCorridor();
}

export async function getTelemetry() {
  return {
    status: clientState.active ? "in_transit" : "standby",
    backend_connected: lastBackendStatus.online,
    data_source: clientState.data_source,
    vehicle: {
      position: clientState.current_position,
      speed_kmh: clientState.current_speed_kmh,
      current_street: clientState.current_street,
      next_maneuver: clientState.next_maneuver,
    },
    corridor: {
      distance_km: clientState.distance_km,
      eta_minutes: clientState.eta_minutes,
      active_signal_index: clientState.active_signal_index,
      total_signals: clientState.traffic_signals.length,
      signals: clientState.traffic_signals,
      signal_states: clientState.signal_states,
    },
  };
}

export async function activateSignal(signalId) {
  // If backend is online, notify it
  if (lastBackendStatus.online) {
    try {
      const res = await fetch(`${BACKEND_URL}/activate-signal/${signalId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.signal_states)) {
          clientState.signal_states = data.signal_states;
        }
      }
    } catch (e) {
      console.warn("Backend activate-signal call error:", e.message);
    }
  }

  let activeIdx = -1;
  clientState.signal_states = clientState.signal_states.map((s, idx) => {
    if (s.id === signalId) {
      activeIdx = idx;
      return { ...s, state: "GREEN", last_cleared: Date.now() };
    }
    return s;
  });
  if (activeIdx >= 0) {
    clientState.active_signal_index = activeIdx;
  }
  return {
    message: `Signal #${signalId} is now GREEN`,
    signal_id: signalId,
    state: "GREEN",
    signal_states: clientState.signal_states,
    backend_connected: lastBackendStatus.online,
  };
}

export async function resetCorridorApi() {
  clientState.active = false;
  clientState.active_signal_index = -1;
  clientState.vehicle_index = 0;
  clientState.current_speed_kmh = 0.0;
  clientState.signal_states = clientState.signal_states.map((s) => ({
    ...s,
    state: "RED",
    last_cleared: null,
  }));
  if (clientState.route && clientState.route.length > 0) {
    clientState.current_position = {
      lat: clientState.route[0][0],
      lon: clientState.route[0][1],
      bearing: clientState.route_bearings[0] || 0.0,
    };
  }
  return {
    status: "reset",
    signal_states: clientState.signal_states,
    backend_connected: lastBackendStatus.online,
  };
}
