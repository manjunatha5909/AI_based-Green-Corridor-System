import { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Hospital,
  MapPin,
  Activity,
  Sliders,
  ArrowRightLeft,
  Navigation,
  X,
} from "lucide-react";
import InteractiveMap from "../components/InteractiveMap";
import LiveTelemetryHUD from "../components/LiveTelemetryHUD";
import CorridorConsole from "../components/CorridorConsole";
import { createRoute, startCorridor, activateSignal, resetCorridorApi, checkBackendHealth } from "../services/corridorApi";
import { useAccessibility } from "../context/useAccessibility";
import { BENGALURU_SOURCES, BENGALURU_DESTINATIONS, resolveLocation } from "../utils/locations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SAMPLE_PRESETS = [
  {
    name: "MG Road → Victoria Hospital Trauma",
    sourceName: "MG Road Metro Station",
    destName: "Victoria Hospital Trauma Center",
    type: "Critical Cardiac",
  },
  {
    name: "Indiranagar → Manipal Hospital HAL",
    sourceName: "Indiranagar 100ft Road",
    destName: "Manipal Hospital (Old Airport Rd)",
    type: "Organ Transit",
  },
  {
    name: "Koramangala → St. John's Medical College",
    sourceName: "Koramangala 5th Block",
    destName: "St. John's Medical College Hospital",
    type: "Multiple Trauma",
  },
  {
    name: "Electronic City → Narayana Health City",
    sourceName: "Electronic City Phase 1",
    destName: "Narayana Health City (Mazumdar Shaw)",
    type: "Pediatric Emergency",
  },
  {
    name: "Malleshwaram → Fortis Cunningham",
    sourceName: "Malleshwaram 8th Cross",
    destName: "Fortis Hospital (Cunningham Road)",
    type: "Stroke Alert",
  },
  {
    name: "Jayanagar → NIMHANS Brain Center",
    sourceName: "Jayanagar 4th Block",
    destName: "NIMHANS Emergency Brain & Trauma Care",
    type: "Neurotrauma",
  },
];

function calculateBearing(lat1, lon1, lat2, lon2) {
  const dlon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dlon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dlon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function Dashboard() {
  const { announce, playBeep, speak } = useAccessibility();

  const [selectedSource, setSelectedSource] = useState("MG Road Metro Station");
  const [selectedDestination, setSelectedDestination] = useState("Victoria Hospital Trauma Center");

  const [sourceCoords, setSourceCoords] = useState({ lat: 12.9756, lon: 77.6066 });
  const [destCoords, setDestCoords] = useState({ lat: 12.9628, lon: 77.5746 });

  const [routeData, setRouteData] = useState(null);
  const [activeSignalIndex, setActiveSignalIndex] = useState(-1);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [vehicleWaypointIndex, setVehicleWaypointIndex] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentStreet, setCurrentStreet] = useState("Standby");
  const [nextManeuver, setNextManeuver] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [eventLogs, setEventLogs] = useState([
    {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text: "AI Green Corridor Command Center Initialized and Online.",
      type: "system",
    },
  ]);

  const autoRunTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      const res = await checkBackendHealth();
      if (isMounted) setBackendOnline(res.online);
    };
    verify();
    const interval = setInterval(verify, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const addLog = useCallback((text, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEventLogs((prev) => [{ time, text, type }, ...prev.slice(0, 24)]);
  }, []);

  const setVehicleToWaypoint = useCallback(
    (wpIdx, routePoints, bearings) => {
      if (!routePoints || routePoints.length === 0) return;
      const idx = Math.min(wpIdx, routePoints.length - 1);
      const pt = routePoints[idx];
      let bearing = 0;

      if (bearings && bearings[idx] !== undefined) {
        bearing = bearings[idx];
      } else if (idx < routePoints.length - 1) {
        const nextPt = routePoints[idx + 1];
        bearing = calculateBearing(pt[0], pt[1], nextPt[0], nextPt[1]);
      }

      setAmbulancePos({ lat: pt[0], lon: pt[1], bearing });
      setVehicleWaypointIndex(idx);
    },
    []
  );

  const handleRouteCalculated = useCallback(
    (data, src, dst) => {
      // Ensure all traffic signals start in RED (STOP) state until ambulance passes
      const initialSignalStates = (data.signal_states || data.traffic_signals || []).map((s) => ({
        ...s,
        state: "RED",
      }));

      setRouteData({
        ...data,
        signal_states: initialSignalStates,
      });

      if (src) {
        setSourceCoords(src);
        if (src.name) setSelectedSource(src.name);
      }
      if (dst) {
        setDestCoords(dst);
        if (dst.name) setSelectedDestination(dst.name);
      }
      setActiveSignalIndex(-1);
      setVehicleWaypointIndex(0);
      setCurrentSpeed(0);

      if (data.steps && data.steps.length > 0) {
        setCurrentStreet(data.steps[0].street || "Origin");
        setNextManeuver(data.steps[0].instruction || null);
      }

      if (data.route && data.route.length > 0) {
        setVehicleToWaypoint(0, data.route, data.route_bearings);
      }

      const logText = `Route Calculated: ${data.distance_km} km with ${data.traffic_signals?.length || 0} real junctions synced.`;
      addLog(logText, "success");
    },
    [addLog, setVehicleToWaypoint]
  );

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const data = await createRoute("MG Road Metro Station", "Victoria Hospital Trauma Center");
        if (isMounted) {
          handleRouteCalculated(
            data,
            { lat: 12.9756, lon: 77.6066, name: "MG Road Metro Station" },
            { lat: 12.9628, lon: 77.5746, name: "Victoria Hospital Trauma Center" }
          );
        }
      } catch (err) {
        console.warn("Backend route init failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [handleRouteCalculated]);

  const handleDispatchRoute = async (srcQuery, dstQuery) => {
    if (!srcQuery || !dstQuery) return;
    setIsLoading(true);
    try {
      const data = await createRoute(srcQuery, dstQuery);
      const srcCoord =
        data.route && data.route.length > 0
          ? { lat: data.route[0][0], lon: data.route[0][1], name: srcQuery }
          : null;
      const dstCoord =
        data.route && data.route.length > 0
          ? { lat: data.route[data.route.length - 1][0], lon: data.route[data.route.length - 1][1], name: dstQuery }
          : null;
      handleRouteCalculated(data, srcCoord, dstCoord);
      announce(`Calculated green corridor route between ${srcQuery} and ${dstQuery}`);
      playBeep("green");
    } catch (err) {
      addLog(`Route failed: ${err.message}`, "error");
      announce("Route calculation failed.");
      playBeep("red");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = async (preset) => {
    setSelectedSource(preset.sourceName);
    setSelectedDestination(preset.destName);
    await handleDispatchRoute(preset.sourceName, preset.destName);
    addLog(`Preset selected: ${preset.name}`);
    announce(`Preset selected: ${preset.name}`);
  };

  const handleSwapLocations = () => {
    const prevSrc = selectedSource;
    const prevDst = selectedDestination;
    setSelectedSource(prevDst);
    setSelectedDestination(prevSrc);
    handleDispatchRoute(prevDst, prevSrc);
    playBeep("click");
  };

  const handleManualRouteSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    handleDispatchRoute(selectedSource, selectedDestination);
  };

  const handleStart = async () => {
    if (!routeData?.traffic_signals || routeData.traffic_signals.length === 0) return;
    setIsLoading(true);
    try {
      const data = await startCorridor();
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setActiveSignalIndex(0);
      setCurrentSpeed(65);

      if (routeData.route && routeData.route.length > 0) {
        setVehicleToWaypoint(0, routeData.route, routeData.route_bearings);
      }

      addLog("Green Corridor Started! Junction #1 cleared to GREEN.", "success");
      announce("Green Corridor Started. Junction 1 is green.");
      speak("Green corridor activated. Junction one is green.");
      playBeep("siren");
    } catch (err) {
      addLog("Could not start green corridor: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDemo = async () => {
    if (isAutoRunning) {
      if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
      setIsAutoRunning(false);
      setCurrentSpeed(0);
      addLog("Live Demo Paused.", "info");
      announce("Simulation paused");
      return;
    }

    let activeRoute = routeData;
    if (!activeRoute?.route || activeRoute.route.length === 0) {
      setIsLoading(true);
      try {
        const data = await createRoute(selectedSource, selectedDestination);
        const srcCoord =
          data.route && data.route.length > 0
            ? { lat: data.route[0][0], lon: data.route[0][1], name: selectedSource }
            : null;
        const dstCoord =
          data.route && data.route.length > 0
            ? { lat: data.route[data.route.length - 1][0], lon: data.route[data.route.length - 1][1], name: selectedDestination }
            : null;
        handleRouteCalculated(data, srcCoord, dstCoord);
        activeRoute = data;
      } catch (err) {
        addLog(`Demo route failed: ${err.message}`, "error");
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (!activeRoute?.route || activeRoute.route.length === 0) return;

    const totalWaypoints = activeRoute.route.length;
    const signals = activeRoute.traffic_signals || [];
    const steps = activeRoute.steps || [];

    // Local mutable copy of all signal states for this demo run
    const currentSignalStates = (activeRoute.signal_states || signals).map((s) => ({
      ...s,
      state: "RED", // All signals start RED!
    }));

    const clearedIndices = new Set();

    if (wpIdx === 0) {
      setVehicleToWaypoint(0, activeRoute.route, activeRoute.route_bearings);
      setRouteData((prev) => (prev ? { ...prev, signal_states: [...currentSignalStates] } : prev));
      setActiveSignalIndex(-1);
    } else {
      // If resuming midway, preserve signals that were already passed
      for (let i = 0; i < signals.length; i++) {
        const sig = signals[i];
        const sigWp = sig.waypoint_index !== undefined ? sig.waypoint_index : Math.floor((i + 1) * (totalWaypoints / (signals.length + 1)));
        if (wpIdx >= sigWp) {
          clearedIndices.add(i);
          currentSignalStates[i] = { ...currentSignalStates[i], state: "GREEN" };
        }
      }
      setRouteData((prev) => (prev ? { ...prev, signal_states: [...currentSignalStates] } : prev));
    }

    setIsAutoRunning(true);
    addLog(`Live Demo Running: Ambulance moving towards ${selectedDestination}!`, "success");
    announce("Live emergency corridor demo started");
    speak(`Emergency ambulance moving towards ${selectedDestination}.`);
    playBeep("siren");

    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);

    autoRunTimerRef.current = setInterval(() => {
      const stepJump = Math.max(1, Math.floor(totalWaypoints / 70));
      wpIdx = Math.min(wpIdx + stepJump, totalWaypoints - 1);

      setVehicleToWaypoint(wpIdx, activeRoute.route, activeRoute.route_bearings);

      const currentSpd = Math.round(62 + Math.sin(wpIdx * 0.35) * 8);
      setCurrentSpeed(currentSpd);

      const currentPos = activeRoute.route[wpIdx];

      // Update current street & next maneuver
      for (const step of steps) {
        if (step.location) {
          const dLat = Math.abs(currentPos[0] - step.location[0]);
          const dLon = Math.abs(currentPos[1] - step.location[1]);
          if (dLat < 0.0035 && dLon < 0.0035) {
            setCurrentStreet(step.street || "Main Road");
            setNextManeuver(step.instruction || null);
          }
        }
      }

      // Check each traffic signal along the corridor:
      // Turn signal GREEN when the ambulance is passing or arriving at the junction!
      for (let sIdx = 0; sIdx < signals.length; sIdx++) {
        if (clearedIndices.has(sIdx)) continue; // Already turned green

        const sig = signals[sIdx];
        const sigWp = sig.waypoint_index !== undefined
          ? sig.waypoint_index
          : Math.floor((sIdx + 1) * (totalWaypoints / (signals.length + 1)));

        // Real distance in km between current ambulance position and the traffic signal
        const distKm = Math.hypot(
          (currentPos[0] - sig.lat) * 111,
          (currentPos[1] - sig.lon) * 111 * Math.cos((sig.lat * Math.PI) / 180)
        );

        // TRIGGER: When the ambulance is passing the junction (within 280m or reaching the junction waypoint)
        const isPassing = distKm <= 0.28 || wpIdx >= (sigWp - 1);

        if (isPassing) {
          clearedIndices.add(sIdx);
          currentSignalStates[sIdx] = { ...currentSignalStates[sIdx], state: "GREEN" };

          // Immediately update routeData so InteractiveMap and HUD re-render with the GREEN light
          setRouteData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              signal_states: [...currentSignalStates],
            };
          });

          setActiveSignalIndex(sIdx);

          addLog(`🚦 Green Wave: Junction #${sIdx + 1} (${sig.name}) turned GREEN as ambulance passes!`, "success");
          announce(`Junction ${sIdx + 1} turned green`);
          speak(`Junction ${sIdx + 1}, ${sig.name}, signal is now green.`);
          playBeep("green");
          break; // Process one clearance per tick
        }
      }

      if (wpIdx >= totalWaypoints - 1) {
        clearInterval(autoRunTimerRef.current);
        setIsAutoRunning(false);
        setCurrentSpeed(0);
        setCurrentStreet("Hospital Emergency Bay");
        setNextManeuver("Arrived safely at Trauma Center");
        addLog(`Ambulance arrived safely at ${selectedDestination}! Mission accomplished.`, "success");
        announce("Ambulance arrived at destination hospital.");
        speak("Emergency vehicle arrived safely at destination hospital.");
        playBeep("arrival");
      }
    }, 180);
  };

  const handleAutoRun = () => {
    handleStartDemo();
  };

  const handleSignalOverride = async (signalId, idx) => {
    try {
      const data = await activateSignal(signalId);
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setActiveSignalIndex(idx);
      addLog(`Manual Override: Signal #${signalId} switched to GREEN.`);
      announce(`Signal ${signalId} set to Green`);
      playBeep("green");
    } catch (err) {
      addLog(`Signal switch error: ${err.message}`, "error");
    }
  };

  const handleReset = async () => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    setActiveSignalIndex(-1);
    setVehicleWaypointIndex(0);
    setCurrentSpeed(0);

    if (routeData?.route && routeData.route.length > 0) {
      setVehicleToWaypoint(0, routeData.route, routeData.route_bearings);
    }

    try {
      await resetCorridorApi();
    } catch (err) {
      console.warn("Backend reset error", err);
    }

    addLog("Corridor state and vehicle position reset.");
    announce("Corridor reset");
    playBeep("click");
  };

  const nextSignal =
    routeData?.traffic_signals && activeSignalIndex + 1 < routeData.traffic_signals.length
      ? {
          name: routeData.traffic_signals[activeSignalIndex + 1].name,
          distance_m: 450,
        }
      : null;

  return (
    <div className="space-y-6 pt-24 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      {/* Top Operations Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
                  Emergency Operations Command Center
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Real-World OpenStreetMap Shortest Path Routing, Live GPS Heading Tracking, and Dynamic Smart Traffic Wave.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-xs transition-colors ${
                  backendOnline
                    ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${backendOnline ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`}
                />
                <span>{backendOnline ? "Flask Backend Linked (5000)" : "In-Browser Engine Active"}</span>
              </div>

              <Button
                variant="emerald"
                onClick={() => setIsConsoleOpen(true)}
                className="rounded-xl gap-2 shadow-xs"
              >
                <Radio className="w-4 h-4" />
                Launch Rapid Console
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Source & Destination Selector Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleManualRouteSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Source Input */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Source (Origin Location)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Type place name or GPS</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    list="dashboard-source-datalist"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    placeholder="Type starting location, e.g. Koramangala..."
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                  {selectedSource && (
                    <button
                      type="button"
                      onClick={() => setSelectedSource("")}
                      title="Clear source"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="dashboard-source-datalist">
                    {BENGALURU_SOURCES.map((s) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.area})</option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Swap Button */}
              <div className="hidden md:flex md:col-span-1 justify-center pb-1">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap Origin and Destination"
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Destination Input */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hospital className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Destination (Hospital Center)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Type trauma hospital</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    list="dashboard-dest-datalist"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    placeholder="Type destination hospital, e.g. Manipal..."
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                  {selectedDestination && (
                    <button
                      type="button"
                      onClick={() => setSelectedDestination("")}
                      title="Clear destination"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="dashboard-dest-datalist">
                    {BENGALURU_DESTINATIONS.map((d) => (
                      <option key={d.id} value={d.name}>{d.name} ({d.type})</option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Action Buttons: Route + Live Demo */}
              <div className="md:col-span-3 flex items-center gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isLoading || !selectedSource.trim() || !selectedDestination.trim()}
                  className="flex-1 rounded-xl py-2.5 gap-1.5 text-xs font-bold shadow-2xs border-slate-200 dark:border-white/15 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Routing..." : "Route"}</span>
                </Button>

                <Button
                  type="button"
                  variant="emerald"
                  onClick={handleStartDemo}
                  disabled={isLoading}
                  title={
                    isAutoRunning
                      ? "Pause the ambulance moving demo"
                      : "Start live demo with ambulance moving towards destination"
                  }
                  className={`flex-1 rounded-xl py-2.5 gap-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
                    isAutoRunning
                      ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  }`}
                >
                  {isAutoRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Demo</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Live Demo</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map + Presets */}
        <div className="lg:col-span-8 space-y-4">
          <InteractiveMap
            routeCoordinates={routeData?.route || []}
            trafficSignals={routeData?.traffic_signals || []}
            signalStates={routeData?.signal_states || []}
            activeSignalIndex={activeSignalIndex}
            ambulancePosition={ambulancePos}
            source={sourceCoords}
            destination={destCoords}
            sourceName={selectedSource || "Emergency Origin"}
            destName={selectedDestination || "Trauma Hospital Center"}
            distanceKm={routeData?.distance_km || 0}
            etaMinutes={routeData?.eta_minutes || 0}
            steps={routeData?.steps || []}
            dataSource={routeData?.data_source}
            currentStreet={currentStreet}
            nextManeuver={nextManeuver}
            speedKmH={currentSpeed}
            onSignalOverride={handleSignalOverride}
            isAutoRunning={isAutoRunning}
            height="540px"
          />

          {/* Quick Hospital Presets */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hospital className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Quick Emergency Corridors (Bengaluru)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SAMPLE_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleApplyPreset(p)}
                    className="p-3 text-left rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10 transition-all duration-200 text-xs group cursor-pointer shadow-xs"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="emerald" className="text-[10px] px-1.5 py-0 font-semibold">
                        {p.type}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Telemetry, Controls & Feed */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          {/* Live Telemetry HUD */}
          <LiveTelemetryHUD
            distanceKm={routeData?.distance_km || 0}
            etaMinutes={routeData?.eta_minutes || 0}
            speedKmH={currentSpeed}
            totalSignals={routeData?.traffic_signals?.length || 0}
            clearedSignals={activeSignalIndex >= 0 ? activeSignalIndex + 1 : 0}
            currentStreet={currentStreet}
            nextManeuver={nextManeuver}
            nextSignal={nextSignal}
            bearing={ambulancePos?.bearing || 0}
            isRunning={isAutoRunning || currentSpeed > 0}
          />

          {/* Dedicated Live GPS Position & Satellite Lock Card */}
          <Card className="border-emerald-500/30 dark:border-emerald-500/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-['Outfit']">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Live GPS Telemetry
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                  {isAutoRunning ? "TRACKING ACTIVE" : "DGPS READY"}
                </Badge>
              </div>

              {/* Dynamic Coordinates Stream */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">Coordinates</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate ml-2">
                  {ambulancePos
                    ? `${ambulancePos.lat.toFixed(6)}° N, ${ambulancePos.lon.toFixed(6)}° E`
                    : "12.975612° N, 77.606624° E"}
                </span>
              </div>

              {/* 3 Metrics: Compass Heading, Satellites, Precision */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-sans font-bold">Heading</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {ambulancePos?.bearing ? `${Math.round(ambulancePos.bearing)}°` : "0° N"}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-sans font-bold">Satellites</p>
                  <p className="font-bold text-sky-600 dark:text-sky-400 mt-0.5">14 NavIC</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-sans font-bold">Accuracy</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">±1.2m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Simulation Action Card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Live Corridor Control
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleStart}
                  disabled={isLoading || isAutoRunning}
                  className="flex-1 rounded-xl gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start
                </Button>

                <Button
                  variant={isAutoRunning ? "outline" : "emerald"}
                  size="sm"
                  onClick={handleAutoRun}
                  className={`flex-1 rounded-xl gap-1.5 ${
                    isAutoRunning
                      ? "bg-amber-500 text-slate-950 font-extrabold border-amber-500 shadow-md hover:bg-amber-400"
                      : ""
                  }`}
                >
                  {isAutoRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      GPS Track
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Reset Corridor"
                  className="rounded-xl border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Incident & Signal Dispatch Stream */}
          <Card className="flex-1">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Live Incident & Clearance Stream
                </h2>
                <Badge variant="sky" className="text-[10px] font-bold">Real-time</Badge>
              </div>

              <div
                tabIndex={0}
                role="log"
                aria-label="Real-time incident event log"
                className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs flex-1"
              >
                {eventLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 flex items-start gap-2 shadow-2xs"
                  >
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                      {log.time}
                    </span>
                    <p
                      className={`text-[11px] leading-snug ${
                        log.type === "success"
                          ? "text-emerald-800 dark:text-emerald-400 font-semibold"
                          : log.type === "error"
                          ? "text-rose-700 dark:text-rose-400 font-medium"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {log.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Corridor Console Modal */}
      <CorridorConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        onRouteCalculated={handleRouteCalculated}
        onSignalUpdate={(states, idx) => {
          setActiveSignalIndex(idx);
        }}
        currentRoute={routeData}
        activeSignalIndex={activeSignalIndex}
      />
    </div>
  );
}

export default Dashboard;
