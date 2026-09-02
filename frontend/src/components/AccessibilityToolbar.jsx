import { useState, useRef, useEffect } from "react";
import { useAccessibility } from "../context/useAccessibility";
import {
  Settings,
  Eye,
  Type,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  HelpCircle,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function AccessibilityToolbar() {
  const {
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    soundEnabled,
    setSoundEnabled,
    voiceAlerts,
    setVoiceAlerts,
    theme,
    setTheme,
    announce,
    playBeep,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  // Close panel on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSetFontSize = (size) => {
    setFontSize(size);
    announce(`Font size changed to ${size}`);
    playBeep("click");
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    announce(`High contrast mode ${next ? "enabled" : "disabled"}`);
    playBeep("click");
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    announce(`Audio sound effects ${next ? "enabled" : "muted"}`);
    if (next) playBeep("green");
  };

  const toggleVoice = () => {
    const next = !voiceAlerts;
    setVoiceAlerts(next);
    announce(`Voice dispatch telemetry ${next ? "activated" : "deactivated"}`);
    playBeep("click");
  };

  // Has any customized accessibility setting active
  const hasCustomSettings = highContrast || fontSize !== "normal" || !soundEnabled || voiceAlerts || theme === "dark";

  return (
    <TooltipProvider delayDuration={300}>
      {/* Skip to Main Content link for Screen Readers & Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-2xl focus:ring-4 focus:ring-emerald-400"
      >
        Skip to main content
      </a>

      {/* Floating Settings Bar Wrapper (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
        {/* Expandable Settings Popover Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-label="Display and accessibility settings"
              className="mb-2 w-80 sm:w-88 rounded-2xl border border-slate-200 dark:border-white/15 bg-white/98 dark:bg-slate-950/98 p-4 shadow-2xl backdrop-blur-2xl text-slate-900 dark:text-slate-100"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-['Outfit']">
                      Settings & Preferences
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Display and system controls</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close settings"
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Controls List */}
              <div className="py-3 space-y-2.5 text-xs">
                {/* 1. Dark Mode Toggle Switch & Selector */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8">
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <Moon className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">Dark Mode</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {theme === "dark" ? "Dark Theme active" : "Light Theme active"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Segmented Light/Dark Quick Switcher */}
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("light");
                          announce("Light mode enabled");
                          playBeep("click");
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          theme === "light"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("dark");
                          announce("Dark mode enabled");
                          playBeep("click");
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        Dark
                      </button>
                    </div>

                    {/* Classic Switch Toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={theme === "dark"}
                      aria-label="Toggle Dark Mode"
                      onClick={() => {
                        const next = theme === "dark" ? "light" : "dark";
                        setTheme(next);
                        announce(`Dark mode ${next === "dark" ? "enabled" : "disabled"}`);
                        playBeep("click");
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        theme === "dark" ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          theme === "dark" ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 2. High Contrast Mode */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8">
                  <div className="flex items-center gap-2.5">
                    <Eye className={`w-4 h-4 ${highContrast ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`} />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">High Contrast</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Enhanced readability</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={highContrast}
                    onClick={toggleContrast}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      highContrast ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        highContrast ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Font Size Switcher */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span className="font-bold text-slate-900 dark:text-white">Font Size</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-mono font-bold">
                      {fontSize === "normal" ? "Standard" : fontSize}
                    </span>
                  </div>

                  {/* 3-Way Segmented Control */}
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {[
                      { id: "normal", label: "Default", sample: "A" },
                      { id: "large", label: "Large", sample: "A+" },
                      { id: "xlarge", label: "X-Large", sample: "A++" },
                    ].map((opt) => {
                      const isSelected = fontSize === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSetFontSize(opt.id)}
                          className={`py-1.5 px-2 rounded-lg text-center font-bold text-xs transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                          }`}
                        >
                          <span className="text-[11px] leading-none font-bold">{opt.sample}</span>
                          <span className="text-[9px] font-medium opacity-90">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Audio FX Toggle */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8">
                  <div className="flex items-center gap-2.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">Siren & Audio FX</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Clearance chimes</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={soundEnabled}
                    onClick={toggleSound}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      soundEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        soundEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Voice Telemetry Dispatch Toggle */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8">
                  <div className="flex items-center gap-2.5">
                    {voiceAlerts ? (
                      <Mic className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <MicOff className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">Voice Readout</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Spoken telemetry</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={voiceAlerts}
                    onClick={toggleVoice}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      voiceAlerts ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        voiceAlerts ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer: Keyboard Shortcuts Helper Button */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsShortcutsOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors flex items-center justify-center gap-2 font-semibold text-xs cursor-pointer shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Keyboard Shortcuts Guide (?)</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unified Single Settings Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-label="Open display and accessibility settings"
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-full backdrop-blur-xl border shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                isOpen
                  ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-md"
                  : "bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md font-semibold"
              }`}
            >
              <Settings className={`w-4 h-4 ${isOpen ? "animate-spin text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
              <span className="text-xs font-bold tracking-wide">Settings</span>

              {/* Active setting dot indicator */}
              {hasCustomSettings && !isOpen && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isOpen ? "Close Settings" : "Display & Accessibility Settings"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </TooltipProvider>
  );
}

export default AccessibilityToolbar;
