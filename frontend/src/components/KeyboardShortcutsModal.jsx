import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { useEffect, useRef } from "react";

function KeyboardShortcutsModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      modalRef.current?.focus();
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: "1 - 5", desc: "Switch navigation views (Command Center, Overview, How It Works, Features, Analytics)" },
    { key: "Alt + T", desc: "Toggle Dark / Light Theme" },
    { key: "Alt + C", desc: "Open Rapid Way" },
    { key: "Space / P", desc: "Start / Pause Green Corridor Simulation" },
    { key: "Alt + H", desc: "Toggle High Contrast mode (a11y)" },
    { key: "Alt + S", desc: "Toggle Audio Siren & Chimes" },
    { key: "Alt + V", desc: "Toggle Voice Dispatch Telemetry" },
    { key: "Alt + R", desc: "Recalculate Route & Reset Corridor" },
    { key: "Esc", desc: "Close any active modal / drawer" },
    { key: "?", desc: "Open this Keyboard Shortcuts Guide" },
  ];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <Keyboard className="w-5 h-5" aria-hidden="true" />
              <h2 id="shortcuts-title" className="text-lg font-bold text-slate-900 font-['Outfit']">
                Accessibility & Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close shortcuts dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              The AI Green Corridor Command System supports full keyboard navigation and screen-reader shortcuts:
            </p>

            <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {shortcuts.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs shadow-2xs"
                >
                  <span className="text-slate-700 font-medium">{item.desc}</span>
                  <kbd className="px-2 py-1 rounded-md bg-white border border-slate-200 text-emerald-700 font-mono font-bold text-[11px] shadow-2xs shrink-0 ml-2">
                    {item.key}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="btn-emerald px-5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Got it (Esc)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default KeyboardShortcutsModal;
