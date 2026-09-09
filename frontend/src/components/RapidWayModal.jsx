import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Radio, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BENGALURU_SOURCES, BENGALURU_DESTINATIONS } from "../utils/locations";
import { Button } from "@/components/ui/button";

function RapidWayModal({ isOpen, onClose, onStart }) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState("demo");
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    modalRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if ((mode === "demo" && !source.trim()) || !destination.trim()) {
      setError(mode === "live" ? "Enter a destination to start GPS navigation." : "Enter both a starting location and destination.");
      return;
    }
    setError("");
    onStart({ source: source.trim(), destination: destination.trim(), mode });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-60 bg-transparent p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rapid-way-title"
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-16 w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl outline-none dark:border-white/15 dark:bg-slate-950 dark:text-white sm:right-2 sm:top-20 sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Navigation className="h-4 w-4" />
                </div>
                <h2 id="rapid-way-title" className="font-['Outfit'] text-lg font-bold">Start Rapid Way</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose how the vehicle location should be tracked.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Rapid Way"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  Starting Location
                </span>
                <input
                  autoFocus
                  type="text"
                  list="rapid-way-sources"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="Enter starting location"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-white/5"
                />
                <datalist id="rapid-way-sources">
                  {BENGALURU_SOURCES.map((location) => <option key={location.id} value={location.name} />)}
                </datalist>
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mode</span>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
                  {[{ id: "live", label: "Live GPS", icon: Radio }, { id: "demo", label: "Demo", icon: Navigation }].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMode(id)}
                      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${mode === id ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Navigation className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  Destination
                </span>
                <input
                  type="text"
                  list="rapid-way-destinations"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Enter destination"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-white/5"
                />
                <datalist id="rapid-way-destinations">
                  {BENGALURU_DESTINATIONS.map((location) => <option key={location.id} value={location.name} />)}
                </datalist>
              </label>

              {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="emerald" className="rounded-xl gap-2">
                  <Navigation className="h-3.5 w-3.5" />
                  Start Rapid Way
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default RapidWayModal;
