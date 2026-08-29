import axios from "axios";
import { resolveLocation } from "../utils/locations";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" },
});

export async function createRoute(source, destination) {
  const parseCoords = (value, isDst) => {
    if (typeof value === "object" && typeof value.lat === "number" && typeof value.lon === "number") {
      return { lat: value.lat, lon: value.lon };
    }
    const resolved = resolveLocation(value, isDst);
    if (!resolved) {
      throw new Error(`Could not resolve location: "${value}". Select from the list or enter coordinates.`);
    }
    return { lat: resolved.lat, lon: resolved.lon };
  };

  const srcCoords = parseCoords(source, false);
  const dstCoords = parseCoords(destination, true);

  const { data } = await client.post("/route", {
    source: srcCoords,
    destination: dstCoords,
  });
  return data;
}

export async function startCorridor() {
  const { data } = await client.post("/corridor/start");
  return data;
}

export async function runCorridorAutomatically() {
  const { data } = await client.post("/corridor/auto");
  return data;
}

export async function activateSignal(signalId) {
  const { data } = await client.post(`/activate-signal/${signalId}`);
  return data;
}
