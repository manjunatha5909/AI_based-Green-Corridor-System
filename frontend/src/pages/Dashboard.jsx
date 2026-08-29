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
} from "lucide-react";
import InteractiveMap from "../components/InteractiveMap";
import LiveTelemetryHUD from "../components/LiveTelemetryHUD";
import CorridorConsole from "../components/CorridorConsole";
import { createRoute, startCorridor, activateSignal } from "../services/corridorApi";
import { useAccessibility } from "../context/useAccessibility";
import { BENGALURU_SOURCES, BENGALURU_DESTINATIONS, resolveLocation } from "../utils/locations";

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

function Dashboard() {
  const { announce, playBeep, speak } = useAccessibility();

  const [selectedSource, setSelectedSource] = useState("MG Road Metro Station");
  const [selectedDestination, setSelectedDestination] = useState("Victoria Hospital Trauma Center");

  const [sourceCoords, setSourceCoords] = useState({ lat: 12.9756, lon: 77.6066 });
  const [destCoords, setDestCoords] = useState({ lat: 12.9628, lon: 77.5746 });

  const [routeData, setRouteData] = useState(null);
  const [activeSignalIndex, setActiveSignalIndex] = useState(-1);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [eventLogs, setEventLogs] = useState([
    {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text: "AI Green Corridor Command Center Initialized and Online.",
      type: "system",
    },
  ]);

  const autoRunTimerRef = useRef(null);

  const addLog = useCallback((text, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEventLogs((prev) => [{ time, text, type }, ...prev.slice(0, 19)]);
  }, []);

  // Initial load: create default corridor route
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const data = await createRoute("MG Road Metro Station", "Victoria Hospital Trauma Center");
        if (isMounted) {
          setRouteData(data);
          if (data.route && data.route.length > 0) {
            setAmbulancePos({ lat: data.route[0][0], lon: data.route[0][1] });
          }
          addLog(`Default Corridor Loaded: ${data.distance_km} km with ${data.traffic_signals?.length || 0} smart signals.`);
        }
      } catch (err) {
        console.warn("Backend not yet online or default route load failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [addLog]);

  const handleRouteCalculated = (data, src, dst) => {
    setRouteData(data);
    if (src) {
      setSourceCoords(src);
      if (src.name) setSelectedSource(src.name);
    }
    if (dst) {
      setDestCoords(dst);
      if (dst.name) setSelectedDestination(dst.name);
    }
    setActiveSignalIndex(-1);
    if (data.route && data.route.length > 0) {
      setAmbulancePos({ lat: data.route[0][0], lon: data.route[0][1] });
    }
    addLog(`Route created: ${data.distance_km} km | ETA: ${data.eta_minutes} min.`);
  };

  const handleApplyPreset = async (preset) => {
    setSelectedSource(preset.sourceName);
    setSelectedDestination(preset.destName);
    const resolvedSrc = resolveLocation(preset.sourceName, false);
    const resolvedDst = resolveLocation(preset.destName, true);
    if (resolvedSrc) setSourceCoords(resolvedSrc);
    if (resolvedDst) setDestCoords(resolvedDst);

    setIsLoading(true);
    try {
      const data = await createRoute(preset.sourceName, preset.destName);
      handleRouteCalculated(data, resolvedSrc, resolvedDst);
      addLog(`Preset selected: ${preset.name}`);
      announce(`Preset selected: ${preset.name}`);
      playBeep("green");
    } catch (err) {
      addLog(`Failed to load preset: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceChange = async (newSource) => {
    setSelectedSource(newSource);
    const resolvedSrc = resolveLocation(newSource, false);
    if (resolvedSrc) setSourceCoords(resolvedSrc);
    setIsLoading(true);
    try {
      const data = await createRoute(newSource, selectedDestination);
      handleRouteCalculated(data, resolvedSrc, destCoords);
    } catch (err) {
      console.warn("Route change error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestinationChange = async (newDst) => {
    setSelectedDestination(newDst);
    const resolvedDst = resolveLocation(newDst, true);
    if (resolvedDst) setDestCoords(resolvedDst);
    setIsLoading(true);
    try {
      const data = await createRoute(selectedSource, newDst);
      handleRouteCalculated(data, sourceCoords, resolvedDst);
    } catch (err) {
      console.warn("Route change error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!routeData?.traffic_signals || routeData.traffic_signals.length === 0) return;
    setIsLoading(true);
    try {
      const data = await startCorridor();
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setActiveSignalIndex(0);
      if (routeData.traffic_signals.length > 0) {
        setAmbulancePos({
          lat: routeData.traffic_signals[0].lat,
          lon: routeData.traffic_signals[0].lon,
        });
      }
      addLog("Green Corridor Started. Junction #1 cleared to GREEN.", "success");
      announce("Green Corridor Started. Junction 1 is green.");
      playBeep("siren");
    } catch (err) {
      addLog("Could not start green corridor: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoRun = () => {
    if (isAutoRunning) {
      if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
      setIsAutoRunning(false);
      addLog("Corridor Simulation Paused.", "info");
      announce("Simulation paused");
      return;
    }

    if (!routeData?.traffic_signals || routeData.traffic_signals.length === 0) return;

    setIsAutoRunning(true);
    addLog("Automated Green-Wave Simulation Activated.", "success");
    announce("Automated green wave simulation started");
    speak("Green corridor automated run initiated.");
    playBeep("siren");

    let idx = activeSignalIndex >= 0 ? activeSignalIndex : -1;
    const signals = routeData.traffic_signals;

    autoRunTimerRef.current = setInterval(async () => {
      idx += 1;
      if (idx >= signals.length) {
        clearInterval(autoRunTimerRef.current);
        setIsAutoRunning(false);
        if (destCoords) setAmbulancePos(destCoords);
        addLog("Ambulance arrived at Hospital Trauma Center! Mission Complete.", "success");
        announce("Ambulance arrived at hospital.");
        speak("Emergency vehicle arrived safely at hospital.");
        playBeep("arrival");
        return;
      }

      const sig = signals[idx];
      setAmbulancePos({ lat: sig.lat, lon: sig.lon });
      try {
        const data = await activateSignal(sig.id);
        setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
        setActiveSignalIndex(idx);
        addLog(`Junction #${idx + 1} (Node ${sig.id}) Cleared to GREEN.`);
        announce(`Junction ${idx + 1} cleared.`);
        playBeep("green");
      } catch (err) {
        console.error("Auto step error", err);
      }
    }, 2000);
  };

  const handleSignalOverride = async (signalId, idx) => {
    try {
      const data = await activateSignal(signalId);
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setActiveSignalIndex(idx);
      if (routeData?.traffic_signals && routeData.traffic_signals[idx]) {
        setAmbulancePos({
          lat: routeData.traffic_signals[idx].lat,
          lon: routeData.traffic_signals[idx].lon,
        });
      }
      addLog(`Manual Override: Signal #${signalId} switched to GREEN.`);
      announce(`Signal ${signalId} set to Green`);
      playBeep("green");
    } catch (err) {
      addLog(`Signal switch error: ${err.message}`, "error");
    }
  };

  const handleReset = () => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    setActiveSignalIndex(-1);
    if (routeData?.route && routeData.route.length > 0) {
      setAmbulancePos({ lat: routeData.route[0][0], lon: routeData.route[0][1] });
    }
    addLog("Corridor state reset.");
    announce("Corridor reset");
    playBeep("click");
  };

  return (
    <div className="space-y-6 pt-24 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      {/* Top Operations Header */}
      <section aria-labelledby="ops-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card rounded-2xl p-5 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 id="ops-header" className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              Emergency Operations Command Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time telemetry, OpenStreetMap graph routing, and dynamic smart traffic clearance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsConsoleOpen(true)}
            className="btn-emerald px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Launch Rapid Console</span>
          </button>
        </div>
      </section>

      {/* Quick Source & Destination Selector Bar */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Source Selector */}
        <div className="md:col-span-6 space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Source (Origin Location)</span>
          </label>
          <select
            value={selectedSource}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white outline-none focus:border-emerald-400 cursor-pointer"
          >
            {BENGALURU_SOURCES.map((s) => (
              <option key={s.id} value={s.name} className="bg-slate-950 text-white">
                {s.name} ({s.area})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Selector */}
        <div className="md:col-span-6 space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Hospital className="w-3.5 h-3.5 text-rose-400" />
            <span>Destination (Hospital Center)</span>
          </label>
          <select
            value={selectedDestination}
            onChange={(e) => handleDestinationChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white outline-none focus:border-emerald-400 cursor-pointer"
          >
            {BENGALURU_DESTINATIONS.map((d) => (
              <option key={d.id} value={d.name} className="bg-slate-950 text-white">
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Command Grid: Left Map + Right HUD & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Leaflet Map & Quick Presets */}
        <div className="lg:col-span-8 space-y-4">
          <InteractiveMap
            routeCoordinates={routeData?.route || []}
            trafficSignals={routeData?.traffic_signals || []}
            signalStates={routeData?.signal_states || []}
            activeSignalIndex={activeSignalIndex}
            ambulancePosition={ambulancePos}
            source={sourceCoords}
            destination={destCoords}
            onSignalOverride={handleSignalOverride}
            height="520px"
          />

          {/* Quick Presets Bar */}
          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Hospital className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Emergency Corridors (Bengaluru)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SAMPLE_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleApplyPreset(p)}
                  className="p-3 text-left rounded-xl bg-white/5 border border-white/5 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all text-xs group cursor-pointer"
                >
                  <p className="font-bold text-white group-hover:text-emerald-300 truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.type}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry, Simulation Controls & Live Event Feed */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          {/* Live Telemetry HUD */}
          <LiveTelemetryHUD
            distanceKm={routeData?.distance_km || 0}
            etaMinutes={routeData?.eta_minutes || 0}
            speedKmH={isAutoRunning ? 72 : activeSignalIndex >= 0 ? 55 : 0}
            totalSignals={routeData?.traffic_signals?.length || 0}
            clearedSignals={activeSignalIndex >= 0 ? activeSignalIndex + 1 : 0}
            isRunning={isAutoRunning || activeSignalIndex >= 0}
          />

          {/* Real-time Simulation Action Card */}
          <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Live Corridor Control</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleStart}
                disabled={isLoading || isAutoRunning}
                className="flex-1 btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>

              <button
                onClick={handleAutoRun}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isAutoRunning
                    ? "bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_15px_#F59E0B]"
                    : "btn-emerald"
                }`}
              >
                {isAutoRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Wave</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                title="Reset Corridor"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Incident & Signal Dispatch Stream */}
          <div className="glass-card rounded-2xl p-4 border border-white/10 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Event Feed</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
            </div>

            <div
              tabIndex={0}
              role="log"
              aria-label="Real-time incident event log"
              className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs"
            >
              {eventLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2"
                >
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                    {log.time}
                  </span>
                  <p
                    className={`text-[11px] leading-snug ${
                      log.type === "success"
                        ? "text-emerald-300 font-semibold"
                        : log.type === "error"
                        ? "text-rose-300"
                        : "text-slate-200"
                    }`}
                  >
                    {log.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Corridor Dispatch Modal */}
      <CorridorConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        onRouteCalculated={handleRouteCalculated}
        onSignalUpdate={(states, idx) => {
          setActiveSignalIndex(idx);
          if (routeData?.traffic_signals && routeData.traffic_signals[idx]) {
            setAmbulancePos({
              lat: routeData.traffic_signals[idx].lat,
              lon: routeData.traffic_signals[idx].lon,
            });
          }
        }}
        currentRoute={routeData}
        activeSignalIndex={activeSignalIndex}
      />
    </div>
  );
}

export default Dashboard;
