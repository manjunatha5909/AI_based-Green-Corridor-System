import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Play, Pause, RotateCcw, Zap, MapPin, CheckCircle2,
  AlertTriangle, Radio, Hospital, ChevronRight, Sliders,
  Activity, TrendingUp,
} from "lucide-react";
import { createRoute, startCorridor, activateSignal } from "../services/corridorApi";
import { useAccessibility } from "../context/useAccessibility";
import { BENGALURU_SOURCES, BENGALURU_DESTINATIONS, resolveLocation } from "../utils/locations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const BENGALURU_PRESETS = [
  { name: "MG Road → Victoria Hospital", type: "Critical Trauma", src: "MG Road Metro Station", dst: "Victoria Hospital Trauma Center", dist: "4.8 km", color: "rose" },
  { name: "Indiranagar → Manipal HAL", type: "Cardiac Emergency", src: "Indiranagar 100ft Road", dst: "Manipal Hospital (Old Airport Rd)", dist: "3.2 km", color: "amber" },
  { name: "Koramangala → St. John's", type: "Organ Transit", src: "Koramangala 5th Block", dst: "St. John's Medical College Hospital", dist: "2.1 km", color: "violet" },
  { name: "Electronic City → Narayana", type: "Pediatric Emergency", src: "Electronic City Phase 1", dst: "Narayana Health City (Mazumdar Shaw)", dist: "5.4 km", color: "sky" },
  { name: "Malleshwaram → Fortis", type: "Stroke Alert", src: "Malleshwaram 8th Cross", dst: "Fortis Hospital (Cunningham Road)", dist: "3.8 km", color: "amber" },
  { name: "Jayanagar → NIMHANS", type: "Neurotrauma", src: "Jayanagar 4th Block", dst: "NIMHANS Emergency Brain & Trauma Care", dist: "2.6 km", color: "emerald" },
];

const TYPE_COLORS = {
  rose: "border-rose-200 bg-rose-50 text-rose-800 font-semibold",
  amber: "border-amber-200 bg-amber-50 text-amber-800 font-semibold",
  violet: "border-purple-200 bg-purple-50 text-purple-800 font-semibold",
  sky: "border-sky-200 bg-sky-50 text-sky-800 font-semibold",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold",
};

function CorridorConsole({ isOpen, onClose, onRouteCalculated, onSignalUpdate, onStepChange, currentRoute = null, activeSignalIndex = -1 }) {
  const { announce, playBeep, speak } = useAccessibility();

  const [source, setSource] = useState("MG Road Metro Station");
  const [destination, setDestination] = useState("Victoria Hospital Trauma Center");
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(2);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSignalIdx, setCurrentSignalIdx] = useState(-1);
  const [activeTab, setActiveTab] = useState("dispatch");

  const autoRunTimerRef = useRef(null);
  const modalRef = useRef(null);

  const effectiveRoute = routeData || currentRoute;
  const effectiveSignalIdx = currentSignalIdx >= 0 ? currentSignalIdx : activeSignalIndex;
  const clearancePercent = effectiveRoute?.traffic_signals?.length
    ? Math.round(((effectiveSignalIdx + 1) / effectiveRoute.traffic_signals.length) * 100)
    : 0;

  const handleClose = useCallback(() => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape" && isOpen) handleClose(); };
    if (isOpen) { window.addEventListener("keydown", handleKeyDown); modalRef.current?.focus(); }
    return () => { window.removeEventListener("keydown", handleKeyDown); if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current); };
  }, [isOpen, handleClose]);

  const handleApplyPreset = (preset) => {
    setSource(preset.src);
    setDestination(preset.dst);
    setStatusMessage(`Selected: ${preset.name}`);
    announce(`Selected preset ${preset.name}`);
    playBeep("click");
  };

  const handleCalculateRoute = async (e) => {
    if (e) e.preventDefault();
    if (!source.trim() || !destination.trim()) { setErrorMessage("Select both origin and destination."); return; }
    setIsLoading(true); setErrorMessage(""); setStatusMessage("Calculating optimal green corridor...");
    announce("Calculating route..."); playBeep("siren");
    try {
      const data = await createRoute(source, destination);
      setRouteData(data); setCurrentSignalIdx(-1);
      const resolvedSrc = resolveLocation(source, false);
      const resolvedDst = resolveLocation(destination, true);
      if (onRouteCalculated) onRouteCalculated(data, resolvedSrc, resolvedDst);
      const msg = `Route: ${data.distance_km} km · ${data.eta_minutes} min ETA · ${data.traffic_signals?.length || 0} signals synced.`;
      setStatusMessage(msg); announce(msg);
      speak(`Green Corridor established. ${data.traffic_signals?.length || 0} smart signals queued.`);
      playBeep("green");
      if (data.traffic_signals?.length > 0) setActiveTab("signals");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Route calculation failed.";
      setErrorMessage(errMsg); announce(errMsg, "assertive");
    } finally { setIsLoading(false); }
  };

  const handleStartCorridor = async () => {
    if (!effectiveRoute?.traffic_signals?.length) { setErrorMessage("Calculate a route first."); return; }
    setIsLoading(true); setErrorMessage("");
    try {
      const data = await startCorridor();
      setRouteData((prev) => prev ? { ...prev, signal_states: data.signal_states } : data);
      setCurrentSignalIdx(0);
      if (onSignalUpdate) onSignalUpdate(data.signal_states, 0);
      if (onStepChange) onStepChange(0);
      const msg = "Green Corridor Initiated! Junction #1 → GREEN.";
      setStatusMessage(msg); announce(msg);
      speak("Green corridor activated. Junction one is green."); playBeep("siren");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to start corridor.");
    } finally { setIsLoading(false); }
  };

  const handleStepNextSignal = async () => {
    if (!effectiveRoute?.traffic_signals) return;
    const nextIdx = effectiveSignalIdx + 1;
    if (nextIdx >= effectiveRoute.traffic_signals.length) {
      setStatusMessage("All signals CLEAR! Ambulance at hospital. ✓");
      announce("All signals cleared."); speak("All signals cleared. Ambulance arrived at destination."); playBeep("arrival"); return;
    }
    const sig = effectiveRoute.traffic_signals[nextIdx];
    try {
      const data = await activateSignal(sig.id);
      setRouteData((prev) => prev ? { ...prev, signal_states: data.signal_states } : prev);
      setCurrentSignalIdx(nextIdx);
      if (onSignalUpdate) onSignalUpdate(data.signal_states, nextIdx);
      if (onStepChange) onStepChange(nextIdx);
      setStatusMessage(`Junction #${nextIdx + 1} cleared to GREEN!`);
      announce(`Junction ${nextIdx + 1} cleared.`); speak(`Junction ${nextIdx + 1} cleared.`); playBeep("green");
    } catch (err) { setErrorMessage(err.message || "Failed."); }
  };

  const handleToggleAutoRun = async () => {
    if (isAutoRunning) {
      clearInterval(autoRunTimerRef.current); setIsAutoRunning(false);
      setStatusMessage("Simulation paused."); announce("Simulation paused"); return;
    }
    if (!effectiveRoute?.traffic_signals?.length) { setErrorMessage("Calculate route first."); return; }
    setIsAutoRunning(true); setErrorMessage("");
    setStatusMessage("Auto Green-Wave active..."); announce("Automated green wave started");
    speak("Automated green wave cascade engaged."); playBeep("siren");

    let idx = effectiveSignalIdx >= 0 ? effectiveSignalIdx : -1;
    const signals = effectiveRoute.traffic_signals;
    const intervalMs = (3 / simulationSpeed) * 1000;

    autoRunTimerRef.current = setInterval(async () => {
      idx += 1;
      if (idx >= signals.length) {
        clearInterval(autoRunTimerRef.current); setIsAutoRunning(false);
        setStatusMessage("Corridor run complete! Vehicle arrived at trauma bay. ✓");
        announce("Corridor complete. Vehicle arrived."); speak("Emergency vehicle has reached hospital. Mission successful.");
        playBeep("arrival"); return;
      }
      const sig = signals[idx];
      try {
        const data = await activateSignal(sig.id);
        setRouteData((prev) => prev ? { ...prev, signal_states: data.signal_states } : prev);
        setCurrentSignalIdx(idx);
        if (onSignalUpdate) onSignalUpdate(data.signal_states, idx);
        if (onStepChange) onStepChange(idx);
        setStatusMessage(`Auto Wave: Signal #${idx + 1} (${sig.name}) GREEN`);
        announce(`Signal ${idx + 1} green`); playBeep("green");
      } catch (err) { console.error("Auto step error", err); }
    }, intervalMs);
  };

  const handleManualSignal = async (signalId, idx) => {
    try {
      const data = await activateSignal(signalId);
      setRouteData((prev) => prev ? { ...prev, signal_states: data.signal_states } : prev);
      setCurrentSignalIdx(idx);
      if (onSignalUpdate) onSignalUpdate(data.signal_states, idx);
      if (onStepChange) onStepChange(idx);
      setStatusMessage(`Manual Override: Signal #${signalId} → GREEN`);
      announce(`Signal ${signalId} set to Green`); playBeep("green");
    } catch (err) { setErrorMessage(err.message || "Failed."); }
  };

  const handleReset = () => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    setCurrentSignalIdx(-1);
    if (onSignalUpdate && effectiveRoute?.signal_states) {
      const resetStates = effectiveRoute.signal_states.map((s) => ({ ...s, state: "RED" }));
      onSignalUpdate(resetStates, -1);
    }
    setStatusMessage("Corridor reset to standby."); announce("Corridor reset."); playBeep("click");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        style={{ background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(12px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="corridor-console-title"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/15 shadow-2xl text-slate-900 dark:text-white outline-none"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-6 sm:px-8 py-5 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 id="corridor-console-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Emergency Dispatch Console
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI Green Corridor · Bengaluru Network</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">SYSTEM LIVE</span>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex items-center gap-1 px-6 sm:px-8 pt-5 pb-0">
            {[
              { id: "dispatch", label: "Dispatch", icon: MapPin },
              { id: "signals", label: "Signal Matrix", icon: Activity },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === id
                    ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-xs font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === "signals" && effectiveRoute?.traffic_signals?.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    {effectiveRoute.traffic_signals.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {activeTab === "dispatch" && (
              <>
                {/* Quick Presets */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hospital className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Quick Emergency Routes</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {BENGALURU_PRESETS.map((preset, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="p-3.5 text-left rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10 transition-all group cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {preset.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 ml-2 shrink-0">{preset.dist}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[preset.color]}`}>
                          {preset.type}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Route Form */}
                <form onSubmit={handleCalculateRoute} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                    <div className="sm:col-span-5 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Source (Origin)
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Type place / GPS</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          list="console-source-datalist"
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          placeholder="Type starting location..."
                          className="w-full pl-3 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-2xs"
                        />
                        {source && (
                          <button
                            type="button"
                            onClick={() => setSource("")}
                            className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <datalist id="console-source-datalist">
                          {BENGALURU_SOURCES.map((s) => (
                            <option key={s.id} value={s.name}>{s.name} ({s.area})</option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="sm:col-span-5 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Hospital className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Destination (Hospital)
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Type hospital</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          list="console-dest-datalist"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          placeholder="Type hospital name..."
                          className="w-full pl-3 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-2xs"
                        />
                        {destination && (
                          <button
                            type="button"
                            onClick={() => setDestination("")}
                            className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <datalist id="console-dest-datalist">
                          {BENGALURU_DESTINATIONS.map((d) => (
                            <option key={d.id} value={d.name}>{d.name} ({d.type})</option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <Button type="submit" variant="emerald" size="sm" disabled={isLoading || isAutoRunning} className="w-full rounded-xl gap-1.5 shadow-xs">
                        {isLoading ? (
                          <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Routing...</>
                        ) : (
                          <><Zap className="w-3.5 h-3.5" /> Calculate</>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Status Alerts */}
                <AnimatePresence mode="wait">
                  {errorMessage && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      role="alert"
                      className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      {errorMessage}
                    </motion.div>
                  )}
                  {statusMessage && !errorMessage && (
                    <motion.div
                      key="status"
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      role="status"
                      className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      {statusMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Route stats & simulation controls */}
                {effectiveRoute && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-2 border-t border-slate-200 dark:border-white/10">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Distance", value: effectiveRoute.distance_km, unit: "km", color: "text-emerald-700 dark:text-emerald-400" },
                        { label: "ETA", value: effectiveRoute.eta_minutes, unit: "min", color: "text-amber-700 dark:text-amber-400" },
                        { label: "Signals", value: effectiveRoute.traffic_signals?.length || 0, unit: "Junctions", color: "text-sky-700 dark:text-sky-400" },
                      ].map((m, i) => (
                        <Card key={i} className="border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 shadow-xs">
                          <CardContent className="p-4 text-center">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mb-1">{m.label}</p>
                            <p className={`text-2xl font-black font-['Outfit'] ${m.color}`}>
                              {m.value} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{m.unit}</span>
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Clearance progress */}
                    {effectiveSignalIdx >= 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Clearance Progress</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{clearancePercent}%</span>
                        </div>
                        <Progress value={clearancePercent} className="h-2" />
                      </div>
                    )}

                    {/* Simulation controls */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Simulation Deck
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          Speed:
                          {[{ label: "1×", val: 3 }, { label: "2×", val: 1.5 }, { label: "5×", val: 0.6 }].map((sp) => (
                            <button
                              key={sp.label}
                              type="button"
                              onClick={() => setSimulationSpeed(sp.val)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                simulationSpeed === sp.val ? "bg-emerald-600 text-white shadow-xs" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                              }`}
                            >
                              {sp.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="emerald" size="sm" onClick={handleStartCorridor} disabled={isLoading || isAutoRunning} className="flex-1 rounded-xl gap-1.5 shadow-xs">
                          <Play className="w-3.5 h-3.5 fill-current" /> Start Corridor
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleStepNextSignal} disabled={isLoading || isAutoRunning} className="flex-1 rounded-xl gap-1.5 shadow-xs border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Step Next
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleToggleAutoRun}
                          className={`flex-1 rounded-xl gap-1.5 cursor-pointer shadow-xs ${
                            isAutoRunning
                              ? "bg-amber-500 text-slate-950 font-extrabold shadow-md hover:bg-amber-400 border-transparent"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {isAutoRunning ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> : <><Zap className="w-3.5 h-3.5" /> Auto Wave</>}
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleReset} className="rounded-xl border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white w-9 h-9 shadow-xs">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* Signal Matrix Tab */}
            {activeTab === "signals" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {effectiveRoute?.traffic_signals?.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Live Signal Override Matrix ({effectiveRoute.traffic_signals.length} Nodes)
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Click any junction to force GREEN</span>
                    </div>

                    {/* Progress summary */}
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full signal-light-green" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Cleared: {Math.max(0, effectiveSignalIdx + 1)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full signal-light-red" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Pending: {effectiveRoute.traffic_signals.length - Math.max(0, effectiveSignalIdx + 1)}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={clearancePercent} className="h-1.5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{clearancePercent}%</span>
                    </div>

                    {/* Signal grid */}
                    <div
                      role="group"
                      aria-label="Traffic signal override grid"
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5"
                    >
                      {effectiveRoute.traffic_signals.map((sig, idx) => {
                        const sigState = effectiveRoute.signal_states?.[idx];
                        const isGreen = sigState?.state === "GREEN" || idx <= effectiveSignalIdx;
                        const isCurrent = idx === effectiveSignalIdx;

                        return (
                          <motion.button
                            key={sig.id || idx}
                            type="button"
                            onClick={() => handleManualSignal(sig.id, idx)}
                            aria-pressed={isGreen}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className={`relative p-3 rounded-xl border text-center transition-all cursor-pointer shadow-xs ${
                              isGreen
                                ? "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                            } ${isCurrent ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-950" : ""}`}
                          >
                            {isCurrent && (
                              <motion.div
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500"
                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                            )}
                            <div className="flex justify-center mb-1.5">
                              <span className={`w-4 h-4 rounded-full transition-all duration-500 ${isGreen ? "signal-light-green" : "signal-light-red"}`} />
                            </div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">J#{idx + 1}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">ID:{sig.id}</p>
                            <span className={`inline-block mt-1 text-[9px] font-bold ${isGreen ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                              {isGreen ? "GREEN" : "RED"}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Signal controls shortcut */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                      <Button variant="emerald" size="sm" onClick={handleStepNextSignal} disabled={isLoading || isAutoRunning} className="rounded-xl gap-1.5 shadow-xs">
                        <ChevronRight className="w-3.5 h-3.5" /> Step Next Signal
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleToggleAutoRun}
                        className={`rounded-xl gap-1.5 cursor-pointer shadow-xs ${
                          isAutoRunning ? "bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400" : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isAutoRunning ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> : <><Zap className="w-3.5 h-3.5" /> Auto Wave</>}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleReset} className="rounded-xl border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white gap-1.5 shadow-xs">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mb-4">
                      <Activity className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">No route calculated yet</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Switch to Dispatch tab and calculate a route first.</p>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("dispatch")} className="mt-4 rounded-xl gap-2 shadow-xs border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200">
                      <MapPin className="w-3.5 h-3.5" /> Go to Dispatch
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CorridorConsole;
