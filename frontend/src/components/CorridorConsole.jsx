import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Zap,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Hospital,
  ChevronRight,
  Sliders,
} from "lucide-react";
import {
  createRoute,
  startCorridor,
  activateSignal,
} from "../services/corridorApi";
import { useAccessibility } from "../context/useAccessibility";
import { BENGALURU_SOURCES, BENGALURU_DESTINATIONS, resolveLocation } from "../utils/locations";

const BENGALURU_PRESETS = [
  {
    name: "MG Road → Victoria Hospital Trauma Center",
    type: "Critical Trauma",
    src: "MG Road Metro Station",
    dst: "Victoria Hospital Trauma Center",
    hospital: "Victoria Hospital",
    dist: "4.8 km",
  },
  {
    name: "Indiranagar 100ft → Manipal Hospital HAL",
    type: "Cardiac Emergency",
    src: "Indiranagar 100ft Road",
    dst: "Manipal Hospital (Old Airport Rd)",
    hospital: "Manipal Hospital Old Airport Rd",
    dist: "3.2 km",
  },
  {
    name: "Koramangala 5th Block → St. John's Medical College",
    type: "Organ Transit",
    src: "Koramangala 5th Block",
    dst: "St. John's Medical College Hospital",
    hospital: "St. John's National Academy",
    dist: "2.1 km",
  },
  {
    name: "Electronic City Phase 1 → Narayana Health City",
    type: "Pediatric Emergency",
    src: "Electronic City Phase 1",
    dst: "Narayana Health City (Mazumdar Shaw)",
    hospital: "Narayana Health Mazumdar Shaw",
    dist: "5.4 km",
  },
  {
    name: "Malleshwaram 8th Cross → Fortis Cunningham Road",
    type: "Stroke Alert",
    src: "Malleshwaram 8th Cross",
    dst: "Fortis Hospital (Cunningham Road)",
    hospital: "Fortis Hospital Cunningham",
    dist: "3.8 km",
  },
  {
    name: "Jayanagar 4th Block → NIMHANS Brain Center",
    type: "Neurotrauma",
    src: "Jayanagar 4th Block",
    dst: "NIMHANS Emergency Brain & Trauma Care",
    hospital: "NIMHANS Trauma Centre",
    dist: "2.6 km",
  },
];

function CorridorConsole({
  isOpen,
  onClose,
  onRouteCalculated,
  onSignalUpdate,
  onStepChange,
  currentRoute = null,
  activeSignalIndex = -1,
}) {
  const { announce, playBeep, speak } = useAccessibility();

  const [source, setSource] = useState("MG Road Metro Station");
  const [destination, setDestination] = useState("Victoria Hospital Trauma Center");
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(2); // seconds per signal
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSignalIdx, setCurrentSignalIdx] = useState(-1);
  const autoRunTimerRef = useRef(null);
  const modalRef = useRef(null);

  // Use either local routeData or passed currentRoute
  const effectiveRoute = routeData || currentRoute;
  const effectiveSignalIdx = currentSignalIdx >= 0 ? currentSignalIdx : activeSignalIndex;

  const handleClose = useCallback(() => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    onClose();
  }, [onClose]);

  // Focus trap & Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      modalRef.current?.focus();
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    };
  }, [isOpen, handleClose]);

  const handleApplyPreset = (preset) => {
    setSource(preset.src);
    setDestination(preset.dst);
    setStatusMessage(`Selected preset: ${preset.name}`);
    announce(`Selected preset ${preset.name}`);
    playBeep("click");
  };

  const handleCalculateRoute = async (e) => {
    if (e) e.preventDefault();
    if (!source.trim() || !destination.trim()) {
      setErrorMessage("Please select both Source Origin and Destination Hospital.");
      announce("Please select both Source Origin and Destination Hospital.", "assertive");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setStatusMessage("Calculating optimal green corridor via OpenStreetMap graph...");
    announce("Calculating route...");
    playBeep("siren");

    try {
      const data = await createRoute(source, destination);
      setRouteData(data);
      setCurrentSignalIdx(-1);
      const resolvedSrc = resolveLocation(source, false);
      const resolvedDst = resolveLocation(destination, true);
      if (onRouteCalculated) {
        onRouteCalculated(data, resolvedSrc, resolvedDst);
      }
      const successText = `Route established: ${data.distance_km} km, ${data.eta_minutes} mins ETA, ${data.traffic_signals?.length || 0} signals synced.`;
      setStatusMessage(successText);
      announce(successText);
      speak(`Green Corridor established. ${data.traffic_signals?.length || 0} smart signals queued.`);
      playBeep("green");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Route calculation failed.";
      setErrorMessage(errMsg);
      announce(errMsg, "assertive");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCorridor = async () => {
    if (!effectiveRoute?.traffic_signals || effectiveRoute.traffic_signals.length === 0) {
      setErrorMessage("Please calculate a route first.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await startCorridor();
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : data));
      setCurrentSignalIdx(0);
      if (onSignalUpdate) onSignalUpdate(data.signal_states, 0);
      if (onStepChange) onStepChange(0);

      const msg = "Green Corridor Initiated! Junction #1 switched to GREEN.";
      setStatusMessage(msg);
      announce(msg);
      speak("Green corridor activated. Junction one is green.");
      playBeep("siren");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to start green corridor.";
      setErrorMessage(msg);
      announce(msg, "assertive");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepNextSignal = async () => {
    if (!effectiveRoute?.traffic_signals) return;
    const nextIdx = effectiveSignalIdx + 1;
    if (nextIdx >= effectiveRoute.traffic_signals.length) {
      setStatusMessage("All signals along the corridor are already GREEN! Ambulance at hospital.");
      announce("All signals cleared. Arrival at hospital.");
      speak("All signals cleared. Ambulance arrived at destination trauma center.");
      playBeep("arrival");
      return;
    }

    const nextSignal = effectiveRoute.traffic_signals[nextIdx];
    try {
      const data = await activateSignal(nextSignal.id);
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setCurrentSignalIdx(nextIdx);
      if (onSignalUpdate) onSignalUpdate(data.signal_states, nextIdx);
      if (onStepChange) onStepChange(nextIdx);

      const msg = `Junction #${nextIdx + 1} (${nextSignal.id}) cleared to GREEN!`;
      setStatusMessage(msg);
      announce(msg);
      speak(`Junction ${nextIdx + 1} cleared.`);
      playBeep("green");
    } catch (err) {
      setErrorMessage(err.message || "Failed to step signal.");
    }
  };

  const handleToggleAutoRun = async () => {
    if (isAutoRunning) {
      // Pause
      if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
      setIsAutoRunning(false);
      setStatusMessage("Corridor simulation paused.");
      announce("Simulation paused");
      return;
    }

    if (!effectiveRoute?.traffic_signals || effectiveRoute.traffic_signals.length === 0) {
      setErrorMessage("Calculate route before starting auto simulation.");
      return;
    }

    setIsAutoRunning(true);
    setErrorMessage("");
    setStatusMessage("Auto Green-Wave Wavefront active...");
    announce("Automated green wave simulation started");
    speak("Automated green wave simulation started.");
    playBeep("siren");

    let idx = effectiveSignalIdx >= 0 ? effectiveSignalIdx : -1;
    const total = effectiveRoute.traffic_signals.length;

    autoRunTimerRef.current = setInterval(async () => {
      idx += 1;
      if (idx >= total) {
        clearInterval(autoRunTimerRef.current);
        setIsAutoRunning(false);
        setStatusMessage("Emergency vehicle reached destination hospital safely!");
        announce("Corridor transit complete. Reached hospital.");
        speak("Emergency vehicle reached destination hospital safely. Mission accomplished.");
        playBeep("arrival");
        return;
      }

      const sig = effectiveRoute.traffic_signals[idx];
      try {
        const data = await activateSignal(sig.id);
        setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
        setCurrentSignalIdx(idx);
        if (onSignalUpdate) onSignalUpdate(data.signal_states, idx);
        if (onStepChange) onStepChange(idx);

        setStatusMessage(`Approaching Junction #${idx + 1}... Cleared GREEN.`);
        announce(`Junction ${idx + 1} cleared.`);
        playBeep("green");
      } catch (err) {
        console.error("Signal step error in auto run", err);
      }
    }, simulationSpeed * 1000);
  };

  const handleManualSignalClick = async (signalId, idx) => {
    try {
      const data = await activateSignal(signalId);
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setCurrentSignalIdx(idx);
      if (onSignalUpdate) onSignalUpdate(data.signal_states, idx);
      if (onStepChange) onStepChange(idx);

      const msg = `Manual Override: Signal #${signalId} switched to GREEN.`;
      setStatusMessage(msg);
      announce(msg);
      playBeep("green");
    } catch (err) {
      setErrorMessage(err.message || "Manual override error");
    }
  };

  const handleResetCorridor = () => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    setCurrentSignalIdx(-1);
    if (onStepChange) onStepChange(-1);
    setStatusMessage("Corridor reset to initial red standby.");
    announce("Corridor reset");
    playBeep("click");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="corridor-console-title"
      >
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto glass-card rounded-3xl p-5 sm:p-8 border border-emerald-500/30 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Radio className="w-6 h-6 animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="corridor-console-title"
                  className="text-xl sm:text-2xl font-bold text-white font-['Outfit']"
                >
                  Emergency Dispatch & Green Corridor Console
                </h2>
                <p className="text-xs text-slate-400">
                  Select Emergency Origin & Destination Hospital across Bengaluru
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Close Green Corridor Console"
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Area */}
          <div className="py-6 space-y-6">
            {/* Quick Emergency Hospital Presets */}
            <fieldset className="border border-white/10 rounded-2xl p-4 bg-white/5">
              <legend className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-2 flex items-center gap-1.5">
                <Hospital className="w-3.5 h-3.5" />
                <span>Quick Hospital Emergency Routes</span>
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
                {BENGALURU_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 text-left rounded-xl bg-slate-900/60 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all text-xs group focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white group-hover:text-emerald-300">
                        {preset.hospital}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                        {preset.dist}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">{preset.name}</p>
                    <span className="text-[10px] text-slate-400">{preset.type}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Source and Destination Dropdown Selection Form */}
            <form onSubmit={handleCalculateRoute} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                {/* Source Selection */}
                <div className="sm:col-span-5 space-y-1.5">
                  <label htmlFor="input-source-select" className="text-xs text-slate-300 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>Source (Origin Location)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Bengaluru Hubs</span>
                  </label>
                  <div className="relative">
                    <select
                      id="input-source-select"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
                    >
                      {BENGALURU_SOURCES.map((s) => (
                        <option key={s.id} value={s.name} className="bg-slate-950 text-white">
                          {s.name} ({s.area})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Selection */}
                <div className="sm:col-span-5 space-y-1.5">
                  <label htmlFor="input-destination-select" className="text-xs text-slate-300 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <Hospital className="w-3.5 h-3.5 text-rose-400" />
                      <span>Destination (Hospital Center)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Trauma Centers</span>
                  </label>
                  <div className="relative">
                    <select
                      id="input-destination-select"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
                    >
                      {BENGALURU_DESTINATIONS.map((d) => (
                        <option key={d.id} value={d.name} className="bg-slate-950 text-white">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Calculate Route Action Button */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isLoading || isAutoRunning}
                    className="w-full btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isLoading ? "Routing..." : "Calculate Route"}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Error or Status Feedback */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {statusMessage && !errorMessage && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Route Stats & Execution Deck */}
            {effectiveRoute && (
              <div className="space-y-6 pt-2 border-t border-white/10">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-slate-400 font-medium">Route Distance</p>
                    <p className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1">
                      {effectiveRoute.distance_km} <span className="text-sm font-normal text-slate-400">km</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-slate-400 font-medium">Estimated Transit Time</p>
                    <p className="text-2xl font-black text-amber-400 font-['Outfit'] mt-1">
                      {effectiveRoute.eta_minutes} <span className="text-sm font-normal text-slate-400">mins</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-slate-400 font-medium">Coordinated Smart Signals</p>
                    <p className="text-2xl font-black text-sky-400 font-['Outfit'] mt-1">
                      {effectiveRoute.traffic_signals?.length || 0}{" "}
                      <span className="text-sm font-normal text-slate-400">Junctions</span>
                    </p>
                  </div>
                </div>

                {/* Simulation Control Toolbar */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/15 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span>Corridor Simulation Deck</span>
                    </h3>

                    {/* Simulation Speed Selector */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Speed:</span>
                      {[
                        { label: "1x", val: 3 },
                        { label: "2x", val: 1.5 },
                        { label: "5x", val: 0.6 },
                      ].map((sp) => (
                        <button
                          key={sp.label}
                          type="button"
                          onClick={() => setSimulationSpeed(sp.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            simulationSpeed === sp.val
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {sp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleStartCorridor}
                      disabled={isLoading || isAutoRunning}
                      className="flex-1 btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Corridor</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStepNextSignal}
                      disabled={isLoading || isAutoRunning}
                      className="flex-1 glass-button-secondary py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                      <span>Step Next Signal</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleAutoRun}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isAutoRunning
                          ? "bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_15px_#F59E0B]"
                          : "btn-emerald"
                      }`}
                    >
                      {isAutoRunning ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause Simulation</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Auto Green Wave</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetCorridor}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                      title="Reset Corridor"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Interactive Signal Override Matrix */}
                {effectiveRoute.traffic_signals && effectiveRoute.traffic_signals.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Live Signal Override Matrix ({effectiveRoute.traffic_signals.length} Nodes)
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Click any junction to manually toggle GREEN
                      </span>
                    </div>

                    <div
                      role="group"
                      aria-label="Traffic signal override grid"
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5"
                    >
                      {effectiveRoute.traffic_signals.map((sig, idx) => {
                        const sigState = effectiveRoute.signal_states ? effectiveRoute.signal_states[idx] : null;
                        const isGreen = sigState?.state === "GREEN" || idx <= effectiveSignalIdx;

                        return (
                          <button
                            key={sig.id || idx}
                            type="button"
                            onClick={() => handleManualSignalClick(sig.id, idx)}
                            aria-pressed={isGreen}
                            aria-label={`Junction ${idx + 1}, ID ${sig.id}, currently ${isGreen ? "Green" : "Red"}. Click to toggle.`}
                            className={`p-3 rounded-xl border text-center transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer ${
                              isGreen
                                ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                                : "bg-white/5 border-white/10 hover:border-white/25"
                            }`}
                          >
                            <div className="flex justify-center mb-1.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-full ${
                                  isGreen ? "signal-light-green" : "signal-light-red"
                                }`}
                              />
                            </div>
                            <p className="text-[11px] font-bold text-white truncate">
                              Junction #{idx + 1}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {sig.id}
                            </p>
                            <span
                              className={`inline-block mt-1 text-[10px] font-bold ${
                                isGreen ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isGreen ? "● GREEN" : "● RED"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CorridorConsole;
