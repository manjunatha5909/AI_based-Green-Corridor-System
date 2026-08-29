import { useState, useEffect, useCallback, useRef } from "react";
import { AccessibilityContext } from "./AccessibilityContextInstance";

export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("agc_high_contrast") === "true";
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem("agc_font_size") || "normal"; // normal, large, xlarge
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (localStorage.getItem("agc_reduced_motion") !== null) {
      return localStorage.getItem("agc_reduced_motion") === "true";
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("agc_sound_enabled") !== "false";
  });

  const [voiceAlerts, setVoiceAlerts] = useState(() => {
    return localStorage.getItem("agc_voice_alerts") === "true";
  });

  const [announcement, setAnnouncement] = useState({ text: "", priority: "polite" });
  const audioCtxRef = useRef(null);

  // Sync to localStorage and body classes
  useEffect(() => {
    localStorage.setItem("agc_high_contrast", highContrast);
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem("agc_font_size", fontSize);
    document.documentElement.setAttribute("data-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("agc_reduced_motion", reducedMotion);
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem("agc_sound_enabled", soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("agc_voice_alerts", voiceAlerts);
  }, [voiceAlerts]);

  // Screen reader announcer
  const announce = useCallback((text, priority = "polite") => {
    setAnnouncement({ text: "", priority });
    setTimeout(() => {
      setAnnouncement({ text, priority });
    }, 50);
  }, []);

  // Web Audio API beep generator
  const playBeep = useCallback(
    (type = "info") => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            audioCtxRef.current = new AudioContext();
          }
        }
        if (!audioCtxRef.current) return;

        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === "green") {
          // Pleasant high chime for green signal
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        } else if (type === "siren") {
          // Emergency dispatch siren tone
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(880, now + 0.2);
          osc.frequency.linearRampToValueAtTime(440, now + 0.4);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        } else if (type === "arrival") {
          // Success triumph chord
          osc.type = "triangle";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        } else {
          // Default click/notice
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        }
      } catch (err) {
        console.warn("Audio playback not supported or blocked", err);
      }
    },
    [soundEnabled]
  );

  // Web Speech API voice announcements
  const speak = useCallback(
    (text) => {
      if (!voiceAlerts || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel(); // cancel previous
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis error", err);
      }
    },
    [voiceAlerts]
  );

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        fontSize,
        setFontSize,
        reducedMotion,
        setReducedMotion,
        soundEnabled,
        setSoundEnabled,
        voiceAlerts,
        setVoiceAlerts,
        announce,
        playBeep,
        speak,
      }}
    >
      {/* Screen Reader Live Region */}
      <div
        aria-live={announcement.priority}
        aria-atomic="true"
        className="sr-only"
        id="a11y-live-announcer"
      >
        {announcement.text}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
}

