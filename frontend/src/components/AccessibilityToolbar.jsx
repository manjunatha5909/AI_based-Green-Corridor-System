import { useState } from "react";
import { useAccessibility } from "../context/useAccessibility";
import { Eye, Type, Volume2, VolumeX, Mic, MicOff, HelpCircle } from "lucide-react";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

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
    announce,
    playBeep,
  } = useAccessibility();

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const cycleFontSize = () => {
    const next = fontSize === "normal" ? "large" : fontSize === "large" ? "xlarge" : "normal";
    setFontSize(next);
    announce(`Font size changed to ${next}`);
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

  return (
    <>
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-black focus:font-bold focus:rounded-lg focus:shadow-2xl focus:ring-4 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Accessible Floating Control Bar */}
      <aside
        aria-label="Accessibility settings"
        className="fixed bottom-4 right-4 z-40 bg-slate-900/90 backdrop-blur-md border border-white/15 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1 text-xs"
      >
        <div className="flex items-center gap-1" role="group" aria-label="Accessibility options">
          {/* High Contrast Toggle */}
          <button
            onClick={toggleContrast}
            aria-pressed={highContrast}
            title={highContrast ? "Disable High Contrast" : "Enable High Contrast (Alt+H)"}
            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              highContrast
                ? "bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline text-[11px]">
              {highContrast ? "High Contrast On" : "Contrast"}
            </span>
          </button>

          {/* Text Resizer */}
          <button
            onClick={cycleFontSize}
            aria-label={`Change text size. Current size: ${fontSize}`}
            title={`Cycle Text Size: Normal, Large, X-Large (Current: ${fontSize})`}
            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              fontSize !== "normal" ? "text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30" : ""
            }`}
          >
            <Type className="w-4 h-4" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-wider font-bold">
              {fontSize === "normal" ? "A" : fontSize === "large" ? "A+" : "A++"}
            </span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            title={soundEnabled ? "Mute Siren & Audio FX (Alt+S)" : "Unmute Siren & Audio FX"}
            className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              soundEnabled
                ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="sr-only">{soundEnabled ? "Audio Enabled" : "Audio Muted"}</span>
          </button>

          {/* Voice Dispatch Telemetry Toggle */}
          <button
            onClick={toggleVoice}
            aria-pressed={voiceAlerts}
            title={voiceAlerts ? "Disable Voice Telemetry (Alt+V)" : "Enable Voice Telemetry Readout"}
            className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              voiceAlerts
                ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {voiceAlerts ? (
              <Mic className="w-4 h-4" aria-hidden="true" />
            ) : (
              <MicOff className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="sr-only">{voiceAlerts ? "Voice Alerts On" : "Voice Alerts Off"}</span>
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            aria-label="Open keyboard shortcuts guide"
            title="Keyboard Shortcuts & Accessibility Info (?)"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  );
}

export default AccessibilityToolbar;
