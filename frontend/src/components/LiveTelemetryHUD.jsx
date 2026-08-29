import { Gauge, Clock, Navigation, Radio } from "lucide-react";

function LiveTelemetryHUD({
  distanceKm = 0,
  etaMinutes = 0,
  speedKmH = 65,
  totalSignals = 0,
  clearedSignals = 0,
  isRunning = false,
}) {
  const clearancePercent = totalSignals > 0 ? Math.round((clearedSignals / totalSignals) * 100) : 0;

  return (
    <div
      aria-label="Live Emergency Vehicle Telemetry"
      role="region"
      className="w-full glass-card rounded-2xl p-4 sm:p-5 border border-white/15 shadow-xl"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
            Emergency Telemetry Stream
          </h3>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
            isRunning
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
              : "bg-white/10 text-slate-400 border border-white/10"
          }`}
        >
          {isRunning ? "● CORRIDOR IN TRANSIT" : "STANDBY / READY"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Speed */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>Transit Speed</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
            {isRunning ? speedKmH : 0}{" "}
            <span className="text-xs font-normal text-slate-400">km/h</span>
          </p>
        </div>

        {/* Distance Remaining */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Distance</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-['Outfit']">
            {distanceKm}{" "}
            <span className="text-xs font-normal text-slate-400">km</span>
          </p>
        </div>

        {/* Estimated Arrival Time */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Est. ETA</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-400 font-['Outfit']">
            {etaMinutes}{" "}
            <span className="text-xs font-normal text-slate-400">min</span>
          </p>
        </div>

        {/* Signals Cleared */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Green Wave</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-['Outfit']">
            {clearedSignals} / {totalSignals}
          </p>
        </div>
      </div>

      {/* Corridor Clearance Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-300 font-medium">
          <span>Corridor Clearance Status</span>
          <span className="text-emerald-400 font-bold">{clearancePercent}% Active</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-500"
            style={{ width: `${clearancePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default LiveTelemetryHUD;

