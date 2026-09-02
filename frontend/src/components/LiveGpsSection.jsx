import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Navigation,
  Compass,
  Radio,
  MapPin,
  Satellite,
  Activity,
  Gauge,
  Shield,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LiveGpsSection({ onOpenCommandHub }) {
  // Simulated real-time GPS coordinates stream
  const [gpsData, setGpsData] = useState({
    lat: 12.975612,
    lon: 77.606624,
    bearing: 284,
    speed: 66.2,
    altitude: 918,
    accuracy: 1.2,
    satellites: 14,
    street: "MG Road Central Arterial",
    ping: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setGpsData((prev) => {
        const deltaLat = (Math.random() - 0.5) * 0.0001;
        const deltaLon = (Math.random() - 0.5) * 0.0001;
        const speedVar = (Math.random() - 0.5) * 3;
        const bearingVar = (Math.random() - 0.5) * 4;
        return {
          ...prev,
          lat: parseFloat((prev.lat + deltaLat).toFixed(6)),
          lon: parseFloat((prev.lon + deltaLon).toFixed(6)),
          bearing: Math.round((prev.bearing + bearingVar + 360) % 360),
          speed: parseFloat(Math.min(74, Math.max(58, prev.speed + speedVar)).toFixed(1)),
          ping: Math.round(16 + Math.random() * 6),
        };
      });
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const gpsFeatures = [
    {
      icon: Satellite,
      color: "sky",
      title: "Dual-Frequency NavIC + GPS",
      desc: "L1/L5 multi-constellation GNSS lock tracks 14+ satellites for sub-lane accuracy (±1.2m) across urban canyons.",
      stat: "14 Sats Locked",
    },
    {
      icon: Compass,
      color: "emerald",
      title: "360° Real-Time Heading",
      desc: "Continuous azimuth calculation rotates vehicle orientation smoothly through intersections, curves, and ramps.",
      stat: `${gpsData.bearing}° Compass`,
    },
    {
      icon: Activity,
      color: "amber",
      title: "Kalman Dead Reckoning",
      desc: "Inertial odometry + Kalman filtering maintains uninterrupted location tracking under flyovers and tunnels.",
      stat: "Zero Lag Drift",
    },
    {
      icon: Radio,
      color: "purple",
      title: "Geofenced Signal Triggers",
      desc: "Live GPS updates stream to Flask backend /location/update, clearing junction signals 600m ahead.",
      stat: "600m Proximity",
    },
  ];

  return (
    <section id="live-gps" className="py-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <Badge
          variant="outline"
          className="border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wider px-3.5 py-1 uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1.5" />
          Real-Time Satellite Telemetry
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-['Outfit']">
          Live Emergency GPS Tracking
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
          Continuous millisecond-precision positioning streams emergency vehicles directly to
          traffic signal controllers and hospital trauma centers.
        </p>
      </div>

      {/* Interactive GPS Telemetry Dashboard Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 items-stretch">
        {/* Left: Live Satellite Tracking Radar Card */}
        <div className="lg:col-span-7">
          <Card className="h-full relative overflow-hidden border-emerald-500/30 dark:border-emerald-500/30 shadow-lg">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

            <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col justify-between h-full space-y-6">
              {/* Radar Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Satellite className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase font-['Outfit']">
                        Vehicle GNSS Receiver
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                        3D DGPS FIX
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Emergency Ambulance Unit #KA-01-EA-9021
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Sync: {gpsData.ping}ms</span>
                </div>
              </div>

              {/* Coordinates & Radar Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Radar Ring Visual */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center">
                    {/* Concentric rings */}
                    <div className="absolute w-28 h-28 rounded-full border border-emerald-500/30" />
                    <div className="absolute w-16 h-16 rounded-full border border-emerald-500/20" />
                    
                    {/* Sweeping Radar Line */}
                    <div
                      className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"
                      style={{ animationDuration: "3s" }}
                    />

                    {/* Rotating Compass Needle with Ambulance Bearing */}
                    <div
                      className="relative z-10 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform duration-500"
                      style={{ transform: `rotate(${gpsData.bearing}deg)` }}
                    >
                      <Navigation className="w-6 h-6 fill-current" />
                    </div>

                    {/* Compass Points */}
                    <span className="absolute top-1 text-[9px] font-bold text-slate-400">N</span>
                    <span className="absolute bottom-1 text-[9px] font-bold text-slate-400">S</span>
                    <span className="absolute left-1.5 text-[9px] font-bold text-slate-400">W</span>
                    <span className="absolute right-1.5 text-[9px] font-bold text-slate-400">E</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 font-mono">
                    Bearing: {gpsData.bearing}° True North
                  </p>
                </div>

                {/* Live Readout Metrics */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Latitude & Longitude
                    </span>
                    <p className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tight">
                      {gpsData.lat}° N, {gpsData.lon}° E
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        GPS Speed
                      </span>
                      <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {gpsData.speed} <span className="text-xs font-normal">km/h</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        Elevation
                      </span>
                      <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {gpsData.altitude} <span className="text-xs font-normal">m ASL</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        Accuracy
                      </span>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ±{gpsData.accuracy} <span className="text-xs font-normal">meters</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        Satellites
                      </span>
                      <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {gpsData.satellites} <span className="text-xs font-normal">NavIC / GPS</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Link to Dashboard */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tracking on {gpsData.street}</span>
                </p>

                <Button
                  variant="emerald"
                  size="sm"
                  onClick={onOpenCommandHub}
                  className="rounded-xl gap-2 font-bold text-xs shadow-xs"
                >
                  <span>Track Live in Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: GPS Feature Highlights (2x2 Grid) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
          {gpsFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -2 }}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-all flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold shrink-0">
                      {item.stat}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

