import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Ambulance,
  Hospital,
  MapPin,
  Layers,
  Radio,
  Zap,
} from "lucide-react";
import { useAccessibility } from "../context/useAccessibility";

// Fix standard Leaflet default icon paths if needed
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper component to adjust map view when route changes
function MapBoundsUpdater({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [coordinates, map]);
  return null;
}

// Click listener to pick coordinates on map
function MapClickHandler({ onMapClick, pickMode }) {
  useMapEvents({
    click(e) {
      if (pickMode && onMapClick) {
        onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    },
  });
  return null;
}

function InteractiveMap({
  routeCoordinates = [],
  trafficSignals = [],
  signalStates = [],
  activeSignalIndex = -1,
  ambulancePosition = null,
  source = null,
  destination = null,
  onSignalOverride = null,
  onPickCoordinate = null,
  pickMode = null, // "source" | "destination" | null
  height = "520px",
}) {
  const { highContrast } = useAccessibility();
  const [mapStyle, setMapStyle] = useState("dark"); // "dark" | "standard"

  // Center Bengaluru fallback: 12.9716, 77.5946
  const defaultCenter = [12.9716, 77.5946];

  // Tile layer URL
  const tileUrl = useMemo(() => {
    if (highContrast) {
      return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    }
    if (mapStyle === "dark") {
      return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    }
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  }, [highContrast, mapStyle]);

  // Custom SVGs rendered as Leaflet DivIcons
  const sourceIcon = useMemo(() => {
    return L.divIcon({
      className: "custom-map-marker",
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #0284C7;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 16px #38BDF8, 0 4px 10px rgba(0,0,0,0.5);
          color: white;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.4 11.8a1 1 0 0 0 1.2 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  }, []);

  const destinationIcon = useMemo(() => {
    return L.divIcon({
      className: "custom-map-marker",
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #DC2626;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 18px #EF4444, 0 4px 10px rgba(0,0,0,0.5);
          color: white;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            <path d="M12 7v6m-3-3h6"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  }, []);

  const ambulanceIcon = useMemo(() => {
    return L.divIcon({
      className: "custom-ambulance-marker",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #059669;
          border: 3px solid #34D399;
          box-shadow: 0 0 24px #10B981, 0 0 40px #10B981;
          color: white;
        ">
          <span style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid #34D399;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 17h4V5H2v12h3"/>
            <path d="M20 17h2v-6l-3-4h-5v10h2"/>
            <circle cx="7.5" cy="17.5" r="2.5"/>
            <circle cx="17.5" cy="17.5" r="2.5"/>
            <path d="M7 8h4"/>
            <path d="M9 6v4"/>
          </svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }, []);

  const createSignalIcon = (isGreen, index) => {
    const bgColor = isGreen ? "#10B981" : "#EF4444";
    const glowColor = isGreen ? "rgba(16, 185, 129, 0.6)" : "rgba(239, 68, 68, 0.4)";
    const label = index + 1;

    return L.divIcon({
      className: "custom-signal-marker",
      html: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${bgColor};
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 16px ${glowColor}, 0 2px 6px rgba(0,0,0,0.6);
            color: #FFFFFF;
            font-weight: 800;
            font-size: 13px;
            font-family: sans-serif;
          ">
            ${label}
          </div>
          <span style="
            margin-top: 2px;
            padding: 1px 5px;
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: ${isGreen ? "#34D399" : "#F87171"};
            font-size: 9px;
            font-weight: 700;
            white-space: nowrap;
          ">
            ${isGreen ? "GREEN" : "RED"}
          </span>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 24],
    });
  };

  // Convert route coordinates to [lat, lng]
  const polylinePositions = useMemo(() => {
    return routeCoordinates.map((pt) => [pt[0], pt[1]]);
  }, [routeCoordinates]);

  // Current ambulance display position
  const currentVehiclePos = ambulancePosition
    ? [ambulancePosition.lat || ambulancePosition[0], ambulancePosition.lon || ambulancePosition[1]]
    : polylinePositions.length > 0
    ? polylinePositions[0]
    : null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-950">
      {/* Map Interactive Banner / Controls Top Bar */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-2 shadow-lg">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold font-['Outfit']">Bengaluru Road Graph</span>
          {routeCoordinates.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              {routeCoordinates.length} Waypoints
            </span>
          )}
        </div>

        {pickMode && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
            <MapPin className="w-3.5 h-3.5" />
            <span>Click map to set {pickMode === "source" ? "Origin" : "Destination"}</span>
          </div>
        )}
      </div>

      {/* Map Style Selector Bottom Left */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl p-1 text-[11px] pointer-events-auto shadow-lg">
        <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
        <button
          onClick={() => setMapStyle("dark")}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            mapStyle === "dark" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => setMapStyle("standard")}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            mapStyle === "standard" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
          }`}
        >
          Street
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height, width: "100%" }} tabIndex={0} aria-label="Interactive Green Corridor Route Map">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={tileUrl}
          />

          <MapBoundsUpdater coordinates={routeCoordinates} />
          <MapClickHandler onMapClick={onPickCoordinate} pickMode={pickMode} />

          {/* Render Route Polyline */}
          {polylinePositions.length > 0 && (
            <>
              {/* Outer Glow Line */}
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: "#10B981",
                  weight: 8,
                  opacity: 0.35,
                  lineCap: "round",
                }}
              />
              {/* Core Route Line */}
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: "#34D399",
                  weight: 4,
                  opacity: 0.95,
                  lineCap: "round",
                }}
              />
            </>
          )}

          {/* Source Marker */}
          {source && (
            <Marker position={[source.lat, source.lon]} icon={sourceIcon}>
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <p className="font-bold text-sky-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Emergency Origin
                  </p>
                  <p className="text-slate-300 font-mono text-[11px]">
                    {source.lat.toFixed(4)}, {source.lon.toFixed(4)}
                  </p>
                  <p className="text-slate-400 text-[10px]">Ambulance Dispatch Point</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker */}
          {destination && (
            <Marker position={[destination.lat, destination.lon]} icon={destinationIcon}>
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <p className="font-bold text-rose-400 flex items-center gap-1">
                    <Hospital className="w-3.5 h-3.5" /> Destination Hospital
                  </p>
                  <p className="text-slate-300 font-mono text-[11px]">
                    {destination.lat.toFixed(4)}, {destination.lon.toFixed(4)}
                  </p>
                  <p className="text-slate-400 text-[10px]">Trauma Emergency Center</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Traffic Signal Markers */}
          {trafficSignals.map((signal, index) => {
            const sigState = signalStates[index];
            const isGreen = sigState?.state === "GREEN" || index <= activeSignalIndex;

            return (
              <Marker
                key={signal.id || index}
                position={[signal.lat, signal.lon]}
                icon={createSignalIcon(isGreen, index)}
              >
                <Popup>
                  <div className="p-2 text-xs space-y-2 min-w-[180px]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="font-bold text-white">Junction #{index + 1}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isGreen
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {isGreen ? "GREEN WAVE" : "RED (STOP)"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <p>Signal ID: <span className="font-mono text-white">{signal.id}</span></p>
                      <p>Coordinates: <span className="font-mono text-slate-400">{signal.lat.toFixed(4)}, {signal.lon.toFixed(4)}</span></p>
                    </div>

                    {onSignalOverride && (
                      <button
                        onClick={() => onSignalOverride(signal.id, index)}
                        className="w-full mt-1 btn-emerald py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Force {isGreen ? "RED" : "GREEN"}</span>
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Live Moving Ambulance Vehicle Marker */}
          {currentVehiclePos && (
            <Marker position={currentVehiclePos} icon={ambulanceIcon}>
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                    <Ambulance className="w-3.5 h-3.5" /> Emergency Vehicle En Route
                  </p>
                  <p className="text-slate-300 text-[11px]">Virtual Green Corridor Active</p>
                  <p className="text-emerald-300 font-mono text-[10px]">
                    Lat: {currentVehiclePos[0].toFixed(4)}, Lng: {currentVehiclePos[1].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Map Status & Legend Footer */}
      <div className="p-3 bg-slate-950/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 border border-white" />
            <span>Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white" />
            <span>Hospital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-[0_0_8px_#10B981]" />
            <span>Green Wave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white" />
            <span>Red Signal</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          {trafficSignals.length > 0
            ? `${trafficSignals.length} Smart Junctions Synced`
            : "No active corridor route"}
        </div>
      </div>
    </div>
  );
}

export default InteractiveMap;
