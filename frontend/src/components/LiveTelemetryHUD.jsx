import { Gauge, Clock, Navigation, Radio, MapPin, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

function LiveTelemetryHUD({
  distanceKm = 0,
  etaMinutes = 0,
  speedKmH = 65,
  totalSignals = 0,
  clearedSignals = 0,
  currentStreet = "Standby",
  nextManeuver = null,
  nextSignal = null,
  bearing = 0,
  isRunning = false,
  rapidWayActive = false,
}) {
  const clearancePercent =
    totalSignals > 0 ? Math.round((clearedSignals / totalSignals) * 100) : 0;

  const metrics = [
    {
      icon: Gauge,
      iconClass: "text-sky-600 dark:text-sky-400",
      label: "Transit Speed",
      value: isRunning ? speedKmH : 0,
      unit: "km/h",
      valueClass: "text-slate-900 dark:text-white",
    },
    {
      icon: Navigation,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      label: "Distance Left",
      value: distanceKm,
      unit: "km",
      valueClass: "text-emerald-700 dark:text-emerald-400",
    },
    {
      icon: Clock,
      iconClass: "text-amber-600 dark:text-amber-400",
      label: "Est. ETA",
      value: etaMinutes,
      unit: "min",
      valueClass: "text-amber-700 dark:text-amber-400",
    },
    {
      icon: Radio,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      label: "Green Wave",
      value: `${clearedSignals} / ${totalSignals}`,
      unit: "Junctions",
      valueClass: "text-emerald-700 dark:text-emerald-400",
    },
  ];

  return (
    <Card aria-label="Live Emergency Vehicle Telemetry" role="region" className="w-full">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-emerald-500 animate-ping" : "bg-slate-400 dark:bg-slate-600"}`}
            />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-['Outfit']">
              Live Emergency GPS Stream
            </h3>
          </div>
          <Badge variant={rapidWayActive || isRunning ? "emerald" : "outline"} className="text-[11px] font-bold tracking-wide">
            {isRunning ? "● CORRIDOR IN TRANSIT" : rapidWayActive ? "● RAPID WAY ACTIVE" : "STANDBY / READY"}
          </Badge>
        </div>

        {/* Live Street & Navigation Strip */}
        {isRunning && currentStreet && currentStreet !== "Standby" && (
          <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">Current Road</p>
                <p className="font-bold text-slate-900 dark:text-white truncate">{currentStreet}</p>
                {nextManeuver && (
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate mt-0.5">{nextManeuver}</p>
                )}
              </div>
            </div>
            {bearing !== undefined && (
              <div className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-mono text-slate-700 dark:text-slate-300 shadow-xs">
                <Compass className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{Math.round(bearing)}°</span>
              </div>
            )}
          </div>
        )}

        {/* 4 Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map(({ icon: Icon, iconClass, label, value, unit, valueClass }, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 flex flex-col items-center text-center hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors duration-200 shadow-xs"
            >
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">
                <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
                <span>{label}</span>
              </div>
              <p className={`text-xl sm:text-2xl font-extrabold font-['Outfit'] ${valueClass}`}>
                {value}{" "}
                {unit && <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Upcoming Signal Indicator */}
        {nextSignal && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full signal-light-green" />
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-300">{nextSignal.name}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 ml-1.5 font-medium">({nextSignal.distance_m}m ahead)</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
              GREEN WAVE
            </span>
          </div>
        )}

        {/* Corridor Clearance Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>Corridor Signal Clearance</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{clearancePercent}% Active</span>
          </div>
          <Progress value={clearancePercent} className="h-2.5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default LiveTelemetryHUD;
