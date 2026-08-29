import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Menu, X, Shield, Activity, Map, Cpu } from "lucide-react";

function Navbar({ activeTab, setActiveTab, onGetStarted }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "OVERVIEW", icon: Activity },
    { id: "command", label: "COMMAND HUB", icon: Map },
    { id: "how-it-works", label: "HOW IT WORKS", icon: Cpu },
    { id: "features", label: "FEATURES", icon: Shield },
    { id: "analytics", label: "ANALYTICS", icon: Activity },
    { id: "about", label: "ABOUT", icon: Shield },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav px-4 sm:px-8 lg:px-12 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleSelectTab("home")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleSelectTab("home")}
          aria-label="AI Green Corridor System Home"
          className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl p-1"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500/40 bg-emerald-500/10 group-hover:border-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300">
            <svg
              className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3" strokeOpacity="0.4" />
              <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" fillOpacity="0.2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 12l4-4" strokeLinecap="round" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-center font-bold tracking-wider text-base sm:text-lg font-['Outfit']">
            <span className="text-emerald-400 font-extrabold mr-1.5 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              AI
            </span>
            <span className="text-white tracking-widest">GREEN CORRIDOR SYSTEM</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-6 xl:gap-8"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative py-1 text-xs xl:text-sm font-bold tracking-wider transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg px-2 ${
                  isActive ? "text-emerald-400" : "text-slate-300 hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10B981]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Top Right Action & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGetStarted}
            className="btn-emerald px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2 group shadow-lg focus-visible:ring-2 focus-visible:ring-white"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">Rapid Way</span>
            <span className="sm:hidden">Rapid</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 border border-white/10 focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden pt-4 pb-3 px-2 border-t border-white/10 mt-3 space-y-1"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-colors flex items-center justify-between ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </motion.div>
      )}
    </header>
  );
}

export default Navbar;