import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock,
  Navigation,
  Radio,
  MapPin,
  Hospital,
  AlertTriangle,
  X,
  ShieldCheck,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TripReportModal({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null;

  const formatValue = (val, suffix = "") => {
    if (val === null || val === undefined || val === "") return "N/A";
    return `${val}${suffix}`;
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " · " + d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "N/A";
    }
  };

  const reportItems = [
    {
      label: "Ambulance ID",
      value: formatValue(report.ambulance_id),
      icon: ShieldCheck,
      highlight: true,
    },
    {
      label: "Trip ID",
      value: formatValue(report.trip_id),
      icon: FileText,
      mono: true,
    },
    {
      label: "Start Location",
      value: formatValue(report.start_location),
      icon: MapPin,
    },
    {
      label: "Destination",
      value: formatValue(report.destination),
      icon: Hospital,
    },
    {
      label: "Distance",
      value: report.distance !== null && report.distance !== undefined ? `${report.distance} km` : "N/A",
      icon: Navigation,
    },
    {
      label: "Planned ETA",
      value: report.planned_eta !== null && report.planned_eta !== undefined ? `${report.planned_eta} min` : "N/A",
      icon: Clock,
    },
    {
      label: "Actual Duration",
      value: formatValue(report.actual_duration),
      icon: Clock,
      highlight: true,
    },
    {
      label: "Traffic-Adjusted Status",
      value: formatValue(report.traffic_adjusted_status),
      icon: Zap,
    },
    {
      label: "Signals Monitored",
      value: formatValue(report.signals_monitored),
      icon: Radio,
    },
    {
      label: "Signals Cleared",
      value: formatValue(report.signals_cleared),
      icon: CheckCircle2,
      highlight: true,
    },
    {
      label: "Delays",
      value: formatValue(report.delays),
      icon: AlertTriangle,
    },
    {
      label: "Route Deviation",
      value: report.route_deviation !== null && report.route_deviation !== undefined
        ? (report.route_deviation ? "Deviation Detected" : "None (On Track)")
        : "N/A",
      icon: AlertTriangle,
    },
    {
      label: "Start Time",
      value: formatDateTime(report.start_time),
      icon: Calendar,
      mono: true,
    },
    {
      label: "End Time",
      value: formatDateTime(report.end_time),
      icon: Calendar,
      mono: true,
    },
    {
      label: "Trip Status",
      value: formatValue(report.trip_status),
      icon: CheckCircle2,
      statusBadge: true,
    },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-report-title"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/15 shadow-2xl text-slate-900 dark:text-white outline-none"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-6 sm:px-8 py-5 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Official Transit Summary
                  </span>
                </div>
                <h2 id="trip-report-title" className="text-xl sm:text-2xl font-black font-['Outfit'] text-slate-900 dark:text-white">
                  GREEN CORRIDOR TRIP REPORT
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Trip Report"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Status Highlight Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Emergency Transit Finalized
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Green Corridor cleared and telemetry logged to persistent registry.
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-xs">
                {report.trip_status || "COMPLETED"}
              </div>
            </div>

            {/* Grid of Report Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {reportItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.highlight
                        ? "bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 text-slate-500 dark:text-slate-400">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>

                    <div
                      className={`text-sm font-black truncate ${
                        item.mono ? "font-mono text-xs" : ""
                      } ${
                        item.highlight
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-slate-900 dark:text-white"
                      }`}
                      title={String(item.value)}
                    >
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 sm:px-8 py-4 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-mono">
              Bengaluru AI Green Corridor · Saved to Registry
            </p>
            <Button
              variant="emerald"
              onClick={onClose}
              className="rounded-xl px-6 font-bold shadow-sm"
            >
              Done / Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
