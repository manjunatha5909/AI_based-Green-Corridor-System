import { useState } from "react";
import { Shield, Menu, X, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "../context/useAccessibility";

function Navbar({ activeTab, setActiveTab, onGetStarted }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { playBeep } = useAccessibility();

  const navItems = [
    { id: "command", label: "Command Center" },
    { id: "home", label: "Overview" },
    { id: "gps", label: "Live GPS" },
    { id: "how-it-works", label: "How It Works" },
    { id: "features", label: "Features" },
    { id: "analytics", label: "Analytics" },
    { id: "about", label: "Mission" },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    playBeep("click");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleSelectTab("home")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectTab("home")}
          className="flex items-center gap-3 group cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1"
          aria-label="AI Green Corridor Home"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-200 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div className="font-bold tracking-wider text-base sm:text-lg font-['Outfit'] flex items-center">
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold mr-1">AI</span>
            <span className="text-slate-900 dark:text-white">GREEN CORRIDOR</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative py-1 text-xs xl:text-sm font-bold tracking-wider transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-2 cursor-pointer ${
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Top Right Actions (Rapid Way Button + Mobile Toggle) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Button
            variant="emerald"
            size="sm"
            onClick={onGetStarted}
            className="rounded-full px-4 sm:px-5 gap-1.5 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Rapid Way</span>
            <span className="sm:hidden">Rapid</span>
          </Button>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-850 border border-slate-200 dark:border-white/15 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden pt-4 pb-3 px-2 border-t border-slate-200/80 dark:border-white/10 mt-3 space-y-1 bg-white/95 dark:bg-slate-950/95 rounded-2xl p-2 shadow-lg"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === item.id
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </header>
  );
}

export default Navbar;