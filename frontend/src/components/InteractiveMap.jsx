import { useEffect, useMemo, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
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
  Navigation,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  ListOrdered,
  Maximize2,
  Minimize2,
  Tag,
  X,
  Route,
  CheckCircle2,
  Clock,
  Gauge,
  Compass,
} from "lucide-react";
import { useAccessibility } from "../context/useAccessibility";

// Fix standard Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper component to adjust map view when route changes
function MapBoundsUpdater({ coordinates, isAutoRunning }) {
  const map = useMap();
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!isAutoRunning && coordinates && coordinates.length > 0) {
      const key = `${coordinates[0][0]},${coordinates[0][1]}-${coordinates[coordinates.length - 1][0]}`;
      if (lastKeyRef.current !== key) {
        lastKeyRef.current = key;
        const bounds = L.latLngBounds(coordinates.map((c) => [c[0], c[1]]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [coordinates, isAutoRunning, map]);
  return null;
}

// Smooth camera follower that pans to follow the moving ambulance in live demo
function MapAmbulanceFollower({ ambulancePosition, autoFollow }) {
  const map = useMap();
  useEffect(() => {
    if (
      autoFollow &&
      ambulancePosition &&
      typeof ambulancePosition.lat === "number" &&
      typeof ambulancePosition.lon === "number"
    ) {
      map.panTo([ambulancePosition.lat, ambulancePosition.lon], {
        animate: true,
        duration: 0.25,
        noMoveStart: true,
      });
    }
  }, [ambulancePosition, autoFollow, map]);
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
  sourceName = "Emergency Origin",
  destName = "Trauma Hospital Center",
  distanceKm = 0,
  etaMinutes = 0,
  steps = [],
  dataSource = null,
  currentStreet = null,
  nextManeuver = null,
  speedKmH = 0,
  onSignalOverride = null,
  onPickCoordinate = null,
  pickMode = null,
  isAutoRunning = false,
  hideLiveOverlays = false,
  height = "540px",
}) {
  const { highContrast, theme } = useAccessibility();
  // Map style and camera follow state
  const [userMapStyle, setUserMapStyle] = useState(null);
  const [followVehicle, setFollowVehicle] = useState(true);

  // Complete Route Details Drawer state
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState("steps"); // "steps" | "signals"
  const [showJunctionLabels, setShowJunctionLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const effectiveMapStyle = userMapStyle || (theme === "dark" ? "dark" : "voyager");
  const effectiveHeight = isFullscreen ? "82vh" : height;

  const defaultCenter = [12.9716, 77.5946];

  const tileUrl = useMemo(() => {
    const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
    const apiKeyParam = cartoApiKey ? `?api_key=${encodeURIComponent(cartoApiKey)}` : "";

    if (effectiveMapStyle === "dark") {
      if (cartoApiKey) {
        return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${apiKeyParam}`;
      }
      return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    }

    // If Carto API key configured, use Carto Voyager without watermark
    if (cartoApiKey) {
      return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${apiKeyParam}`;
    }

    // Default clean OpenStreetMap raster tiles (no API key required, zero watermark)
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  }, [effectiveMapStyle]);

  // Origin Marker Icon
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
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4), 0 2px 6px rgba(0,0,0,0.15);
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

  // Destination Marker Icon
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
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4), 0 2px 6px rgba(0,0,0,0.15);
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

  // Google Maps Style Rotating Ambulance Marker with Bearing
  const ambulanceBearing = ambulancePosition?.bearing || 0;
  const ambulanceIcon = useMemo(() => {
    return L.divIcon({
      className: "custom-ambulance-marker",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #059669;
          border: 3px solid #FFFFFF;
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4), 0 0 0 4px rgba(16, 185, 129, 0.25);
          color: white;
          transform: rotate(${ambulanceBearing}deg);
          transition: transform 0.35s ease;
        ">
          <!-- Direction Arrow Tip like Google Maps Navigation -->
          <div style="
            position: absolute;
            top: -7px;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 9px solid #059669;
          "></div>

          <!-- Emergency Ambulance Icon -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 17h4V5H2v12h3"/>
            <path d="M20 17h2v-6l-3-4h-5v10h2"/>
            <circle cx="7.5" cy="17.5" r="2.5"/>
            <circle cx="17.5" cy="17.5" r="2.5"/>
            <path d="M7 8h4"/>
            <path d="M9 6v4"/>
          </svg>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  }, [ambulanceBearing]);

  const createSignalIcon = (signalState, index) => {
    const isGreen = signalState === "GREEN" || signalState === "CLEARED" || signalState === true;
    const isPrepare = signalState === "PREPARE";

    const bgColor = isGreen ? "#10B981" : isPrepare ? "#F59E0B" : "#EF4444";
    const glowColor = isGreen
      ? "rgba(16, 185, 129, 0.6)"
      : isPrepare
      ? "rgba(245, 158, 11, 0.6)"
      : "rgba(239, 68, 68, 0.4)";
    const label = index + 1;
    const textStatus = isGreen ? "● CLEARED" : isPrepare ? "● PREPARE" : "● RED";
    const textColor = isGreen ? "#059669" : isPrepare ? "#D97706" : "#DC2626";

    return L.divIcon({
      className: "custom-signal-marker",
      html: `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          ${isGreen ? `
            <div style="
              position: absolute;
              top: -3px;
              left: 50%;
              transform: translateX(-50%);
              width: 38px;
              height: 38px;
              border-radius: 50%;
              border: 2.5px solid #10B981;
              box-shadow: 0 0 14px rgba(16, 185, 129, 0.8);
              animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
              pointer-events: none;
            "></div>
          ` : isPrepare ? `
            <div style="
              position: absolute;
              top: -3px;
              left: 50%;
              transform: translateX(-50%);
              width: 38px;
              height: 38px;
              border-radius: 50%;
              border: 2.5px solid #F59E0B;
              box-shadow: 0 0 14px rgba(245, 158, 11, 0.8);
              animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
              pointer-events: none;
            "></div>
          ` : ""}
          <div style="
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${bgColor};
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 14px ${glowColor}, 0 2px 4px rgba(0,0,0,0.18);
            color: #FFFFFF;
            font-weight: 800;
            font-size: 13px;
            font-family: sans-serif;
            transition: all 0.3s ease;
          ">
            ${label}
          </div>
          <span style="
            position: relative;
            z-index: 2;
            margin-top: 2px;
            padding: 1px 6px;
            background: #FFFFFF;
            border: 1px solid rgba(226, 232, 240, 0.9);
            border-radius: 4px;
            color: ${textColor};
            font-size: 9px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
          ">
            ${textStatus}
          </span>
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 24],
    });
  };

  const polylinePositions = useMemo(() => {
    return routeCoordinates.map((pt) => [pt[0], pt[1]]);
  }, [routeCoordinates]);

  const currentVehiclePos = ambulancePosition
    ? [ambulancePosition.lat || ambulancePosition[0], ambulancePosition.lon || ambulancePosition[1]]
    : polylinePositions.length > 0
    ? polylinePositions[0]
    : null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/15 shadow-md bg-slate-100 dark:bg-slate-950">
      
      {/* ── Top Google-Maps-Style Navigation Turn & Complete Corridor Hub ── */}
      {routeCoordinates.length > 0 && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-400 pointer-events-auto space-y-2">
          {/* Route Info & Quick Control Hub */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-emerald-500/30 shadow-xl text-slate-900 dark:text-white space-y-2.5">
            {/* Row 1: Corridor Status & Turn Maneuver */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                  {nextManeuver && nextManeuver.toLowerCase().includes("left") ? (
                    <CornerUpLeft className="w-5 h-5" />
                  ) : nextManeuver && nextManeuver.toLowerCase().includes("right") ? (
                    <CornerUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider truncate">
                      Green Corridor Active
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white font-['Outfit'] truncate">
                    {nextManeuver
                      ? nextManeuver
                      : currentStreet && currentStreet !== "Standby"
                      ? `Driving on ${currentStreet}`
                      : `${sourceName} → ${destName}`}
                  </p>
                </div>
              </div>

              {/* Speed & Live Pulse */}
              <div className="flex flex-col items-end shrink-0">
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-black text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  {speedKmH > 0 ? `${speedKmH} km/h` : "65 km/h"}
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {distanceKm} km • ~{etaMinutes} min
                </span>
              </div>
            </div>

            {/* Row 2: Origin & Destination Path Pill */}
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold truncate text-[11px]">
                  {sourceName}
                </span>
              </div>
              <span className="text-slate-400 text-xs font-bold shrink-0">→</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Hospital className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold truncate text-[11px]">
                  {destName}
                </span>
              </div>
            </div>

            {/* Row 3: Action Buttons to View Complete Details */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsDrawer(!showDetailsDrawer || drawerTab !== "steps");
                  setDrawerTab("steps");
                }}
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showDetailsDrawer && drawerTab === "steps"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Directions ({steps.length > 0 ? steps.length : "Route"})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsDrawer(!showDetailsDrawer || drawerTab !== "signals");
                  setDrawerTab("signals");
                }}
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showDetailsDrawer && drawerTab === "signals"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                <span>Junctions ({trafficSignals.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowJunctionLabels(!showJunctionLabels)}
                title="Toggle permanent floating name labels on all traffic junctions"
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showJunctionLabels
                    ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Labels</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 ml-auto cursor-pointer"
                title={isFullscreen ? "Restore standard size" : "Expand map view"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* ── Slide-Out Details Drawer (Turn-by-turn Steps or Junctions Matrix) ── */}
          {showDetailsDrawer && (
            <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl space-y-3 max-h-80 overflow-y-auto animate-fade-in text-slate-900 dark:text-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
                  {drawerTab === "steps" ? (
                    <>
                      <Route className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Turn-by-Turn Driving Steps</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Green Wave Junction Clearance ({trafficSignals.length})</span>
                    </>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowDetailsDrawer(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tab 1: Step-by-Step Directions */}
              {drawerTab === "steps" && (
                <div className="space-y-2">
                  {steps && steps.length > 0 ? (
                    steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-start gap-2.5 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {st.instruction || `Drive along ${st.street || "designated corridor"}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {st.distance_m && <span>{st.distance_m >= 1000 ? `${(st.distance_m / 1000).toFixed(1)} km` : `${st.distance_m} m`}</span>}
                            {st.street && <span>• {st.street}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-bold">Fastest Green Corridor Route</p>
                      <p className="text-[11px] mt-1">
                        Depart {sourceName} via priority arterial expressway directly to {destName}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Drawer Tab 2: Green Wave Junctions Matrix */}
              {drawerTab === "signals" && (
                <div className="space-y-2">
                  {trafficSignals.map((sig, sIdx) => {
                    const sState = signalStates[sIdx];
                    const stateName = sState?.state || "RED";
                    const isCleared = stateName === "GREEN" || stateName === "CLEARED";
                    const isPrepare = stateName === "PREPARE";

                    return (
                      <div
                        key={sig.id || sIdx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-all ${
                          isCleared
                            ? "bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30"
                            : isPrepare
                            ? "bg-amber-50/70 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30"
                            : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isCleared
                                  ? "bg-emerald-500 animate-pulse"
                                  : isPrepare
                                  ? "bg-amber-500 animate-ping"
                                  : "bg-rose-500"
                              }`}
                            />
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              #{sIdx + 1} {sig.name}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            {sig.distance_from_start_km} km from start • ID: {sig.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCleared
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                                : isPrepare
                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                                : "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300"
                            }`}
                          >
                            {isCleared ? "CLEARED" : isPrepare ? "PREPARE" : "RED"}
                          </span>
                          {onSignalOverride && (
                            <button
                              type="button"
                              onClick={() => onSignalOverride(sig.id, sIdx)}
                              title="Override signal state"
                              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-[10px] font-bold cursor-pointer"
                            >
                              <Zap className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map Interactive Banner Top Right */}
      <div className="absolute top-3 right-3 z-400 flex items-center gap-2 pointer-events-auto">
        {isAutoRunning && (
          <button
            type="button"
            onClick={() => setFollowVehicle(!followVehicle)}
            title={followVehicle ? "Camera is locked to moving ambulance. Click for free pan." : "Click to center camera on moving ambulance."}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
              followVehicle
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/25"
                : "bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/15"
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${followVehicle ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">{followVehicle ? "Tracking GPS" : "Free Pan"}</span>
            <span className="sm:hidden">{followVehicle ? "Track" : "Pan"}</span>
          </button>
        )}

        <div className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/15 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-md">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="font-semibold font-['Outfit'] hidden sm:inline">OSM Road Network</span>
          {routeCoordinates.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
              {routeCoordinates.length} GPS Points
            </span>
          )}
        </div>

        {pickMode && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md animate-bounce">
            <MapPin className="w-3.5 h-3.5" />
            <span>Click to set {pickMode === "source" ? "Origin" : "Destination"}</span>
          </div>
        )}
      </div>

      {/* Map Style Selector Bottom Left */}
      <div className="absolute bottom-3 left-3 z-400 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/15 rounded-xl p-1 text-[11px] pointer-events-auto shadow-md">
        <Layers className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
        <button
          onClick={() => setUserMapStyle("voyager")}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            effectiveMapStyle === "voyager" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => setUserMapStyle("standard")}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            effectiveMapStyle === "standard" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Street
        </button>
        <button
          onClick={() => setUserMapStyle("dark")}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            effectiveMapStyle === "dark" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Dark
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height: effectiveHeight, width: "100%", transition: "height 0.35s ease" }} tabIndex={0} aria-label="Interactive Green Corridor Route Map">
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

          <MapBoundsUpdater coordinates={routeCoordinates} isAutoRunning={isAutoRunning} />
          <MapAmbulanceFollower ambulancePosition={ambulancePosition} autoFollow={isAutoRunning && followVehicle} />
          <MapClickHandler onMapClick={onPickCoordinate} pickMode={pickMode} />

          {/* Render Route Polyline */}
          {polylinePositions.length > 0 && (
            <>
              {/* Outer Glow Halo */}
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: "#059669",
                  weight: 10,
                  opacity: 0.28,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              {/* Inner High-Visibility Driving Route */}
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: "#10B981",
                  weight: 5,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </>
          )}

          {/* Origin Marker */}
          {source && (
            <Marker position={[source.lat, source.lon]} icon={sourceIcon}>
              <Tooltip direction="top" offset={[0, -22]} className="custom-junction-tooltip">
                <span>🚩 Start: {sourceName}</span>
              </Tooltip>
              <Popup>
                <div className="p-1.5 text-xs space-y-1">
                  <p className="font-bold text-sky-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Emergency Dispatch Point
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{sourceName}</p>
                  <p className="text-slate-600 font-mono text-[11px]">
                    {source.lat.toFixed(5)}, {source.lon.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Hospital Marker */}
          {destination && (
            <Marker position={[destination.lat, destination.lon]} icon={destinationIcon}>
              <Tooltip direction="top" offset={[0, -22]} className="custom-junction-tooltip">
                <span>🏥 Hospital: {destName}</span>
              </Tooltip>
              <Popup>
                <div className="p-1.5 text-xs space-y-1">
                  <p className="font-bold text-rose-600 flex items-center gap-1">
                    <Hospital className="w-3.5 h-3.5" /> Destination Trauma Center
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{destName}</p>
                  <p className="text-slate-600 font-mono text-[11px]">
                    {destination.lat.toFixed(5)}, {destination.lon.toFixed(5)}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                    Emergency Trauma Bay Gate #1
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Traffic Signal Markers */}
          {trafficSignals.map((signal, index) => {
            const sigState = signalStates[index];
            const currentSignalState = sigState?.state || "RED";
            const isGreen = currentSignalState === "GREEN" || currentSignalState === "CLEARED";
            const isPrepare = currentSignalState === "PREPARE";

            return (
              <Marker
                key={signal.id || index}
                position={[signal.lat, signal.lon]}
                icon={createSignalIcon(currentSignalState, index)}
              >
                {showJunctionLabels && (
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -18]}
                    className="custom-junction-tooltip"
                  >
                    <span>
                      #{index + 1} {signal.name} • {isGreen ? "🟢 CLEARED" : isPrepare ? "🟡 PREPARE" : "🔴 RED"}
                    </span>
                  </Tooltip>
                )}
                <Popup>
                  <div className="p-2 text-xs space-y-2 min-w-50">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-900">Junction #{index + 1}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isGreen
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPrepare
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isGreen ? "GREEN WAVE (CLEARED)" : isPrepare ? "PREPARING CORRIDOR" : "RED (STOP)"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p className="font-semibold text-slate-800">{signal.name}</p>
                      <p>Signal ID: <span className="font-mono text-emerald-600">{signal.id}</span></p>
                      <p>Distance from start: <span className="font-mono text-slate-700">{signal.distance_from_start_km} km</span></p>
                    </div>

                    {onSignalOverride && (
                      <button
                        onClick={() => onSignalOverride(signal.id, index)}
                        className="w-full mt-1 btn-emerald py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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

          {/* Live Rotating Ambulance Marker */}
          {currentVehiclePos && (
            <Marker position={currentVehiclePos} icon={ambulanceIcon}>
              <Tooltip direction="top" offset={[0, -22]} className="custom-junction-tooltip">
                <span>
                  🚑 Ambulance KA-01 • {speedKmH > 0 ? `${speedKmH} km/h` : "65 km/h"} • {Math.round(ambulanceBearing)}°
                </span>
              </Tooltip>
              <Popup>
                <div className="p-1.5 text-xs space-y-1">
                  <p className="font-bold text-emerald-700 flex items-center gap-1">
                    <Ambulance className="w-3.5 h-3.5" /> Emergency Vehicle En Route
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Heading: <span className="font-mono text-slate-900 font-bold">{Math.round(ambulanceBearing)}°</span> | Speed: <span className="font-mono text-emerald-700 font-bold">{speedKmH || 65} km/h</span>
                  </p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    Lat: {currentVehiclePos[0].toFixed(5)}, Lng: {currentVehiclePos[1].toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Map Status & Complete Details Legend Footer */}
      <div className="p-3 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow-xs" />
            <span>Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-xs" />
            <span>Hospital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
            <span>Green Wave ({activeSignalIndex >= 0 ? activeSignalIndex + 1 : 0}/{trafficSignals.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-xs" />
            <span>Red Signal</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-3 font-medium flex-wrap">
          {distanceKm > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 font-bold text-slate-800 dark:text-slate-200">
              {distanceKm} km
            </span>
          )}
          {etaMinutes > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30">
              ETA ~{etaMinutes} min
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {trafficSignals.length > 0
                ? `${trafficSignals.length} Real Junctions Mapped`
                : "Standby"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default InteractiveMap;
