import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorksSection from "./components/HowItWorksSection";
import FeaturesSection from "./components/FeaturesSection";
import AboutSection from "./components/AboutSection";
import AnalyticsSection from "./components/AnalyticsSection";
import CorridorConsole from "./components/CorridorConsole";
import AccessibilityToolbar from "./components/AccessibilityToolbar";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";
import { useAccessibility } from "./context/useAccessibility";

function App() {
  const [activeTab, setActiveTab] = useState("home"); // Default to Overview
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const { setHighContrast, setSoundEnabled, setVoiceAlerts, playBeep } = useAccessibility();

  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const analyticsRef = useRef(null);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    playBeep("click");

    const refMap = {
      "how-it-works": howItWorksRef,
      features: featuresRef,
      about: aboutRef,
      analytics: analyticsRef,
    };

    if (tabId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (refMap[tabId] && refMap[tabId].current) {
      refMap[tabId].current.scrollIntoView({ behavior: "smooth" });
    }
  }, [playBeep]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setIsConsoleOpen((prev) => !prev);
      } else if (e.altKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setHighContrast((prev) => !prev);
      } else if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
      } else if (e.altKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        setVoiceAlerts((prev) => !prev);
      } else if (e.key === "1") {
        handleTabChange("command");
      } else if (e.key === "2") {
        handleTabChange("home");
      } else if (e.key === "3") {
        handleTabChange("how-it-works");
      } else if (e.key === "4") {
        handleTabChange("features");
      } else if (e.key === "5") {
        handleTabChange("analytics");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setHighContrast, setSoundEnabled, setVoiceAlerts, handleTabChange]);

  const handleOpenConsole = () => {
    setIsConsoleOpen(true);
    playBeep("click");
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onGetStarted={handleOpenConsole}
      />

      {/* Main Content Area with A11y Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {activeTab === "command" ? (
          /* Live Interactive Command Center with Leaflet Map & Telemetry HUD */
          <Dashboard />
        ) : (
          /* Landing & System Tour View */
          <>
            <Hero
              onCreateCorridor={handleOpenConsole}
              onOpenCommandHub={() => handleTabChange("command")}
            />

            <div ref={howItWorksRef} id="how-it-works">
              <HowItWorksSection onCreateCorridor={handleOpenConsole} />
            </div>

            <div ref={featuresRef} id="features">
              <FeaturesSection />
            </div>

            <div ref={aboutRef} id="about">
              <AboutSection />
            </div>

            <div ref={analyticsRef} id="analytics">
              <AnalyticsSection />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={handleTabChange}
        onGetStarted={handleOpenConsole}
      />

      {/* Accessibility Toolbar */}
      <AccessibilityToolbar />

      {/* Emergency Dispatch Console Modal */}
      <CorridorConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
      />
    </div>
  );
}

export default App;