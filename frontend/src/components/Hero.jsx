import { HiArrowRight } from "react-icons/hi2";
import { Cpu, Ambulance, Zap, TrafficCone, Activity } from "lucide-react";

function Hero({ onCreateCorridor, onOpenCommandHub }) {
  const features = [
    {
      icon: Cpu,
      title: "AI Graph Routing",
      subtitle: "OpenStreetMap Dijkstra",
    },
    {
      icon: Ambulance,
      title: "Real-time Telemetry",
      subtitle: "Live Vehicle Tracking",
    },
    {
      icon: Zap,
      title: "Zero Delay Arrival",
      subtitle: "Golden Hour Saved",
    },
    {
      icon: TrafficCone,
      title: "Smart Green Wave",
      subtitle: "Automated Clearance",
    },
  ];

  const stats = [
    { value: "2,534+", label: "Emergencies Dispatched" },
    { value: "1,245 km", label: "Green Corridors Created" },
    { value: "98.7%", label: "Intersections Cleared" },
    { value: "12,450+", label: "Lives Protected" },
    { value: "< 1 min", label: "Signal Override Latency" },
  ];

  return (
    <section
      aria-labelledby="hero-title"
      className="relative min-h-[90vh] w-full flex flex-col justify-between pt-28 lg:pt-36 pb-12 px-4 sm:px-8 lg:px-12 overflow-hidden bg-[#070A0F]"
    >
      {/* Background Hero Image & Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <img
          src="/hero-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-60 scale-105 filter brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F] via-[#070A0F]/85 to-transparent w-full md:w-3/4 lg:w-2/3" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-[#070A0F]/70" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        <div className="lg:col-span-8 flex flex-col items-start space-y-6 sm:space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-emerald-400 text-xs sm:text-sm font-semibold tracking-wider uppercase border border-emerald-500/30">
            <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" aria-hidden="true" />
            <span>AI BASED EMERGENCY RESPONSE SYSTEM</span>
          </div>

          {/* Heading */}
          <div className="space-y-1 font-['Outfit']">
            <h1 id="hero-title" className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
              AI Based
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black emerald-gradient-text tracking-tight leading-none drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              Green Corridor
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
              System
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
            Intelligent urban traffic management system that synchronizes city traffic signals to create an unobstructed virtual green corridor for emergency vehicles.
          </p>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-2xl py-2">
            {features.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="flex flex-col items-start gap-1.5 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <IconComp className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">{item.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
            <button
              onClick={onCreateCorridor}
              className="btn-emerald px-7 py-3.5 rounded-full text-sm font-bold tracking-wide flex items-center gap-2 group cursor-pointer shadow-xl focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Launch Rapid Way</span>
              <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
            </button>

            <button
              onClick={onOpenCommandHub}
              className="glass-button-secondary px-7 py-3.5 rounded-full text-sm font-semibold text-white tracking-wide flex items-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Live Operations Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Stats Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full mt-10">
        <div className="glass-stats-bar rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`flex flex-col items-center text-center ${
                  index !== 0 ? "pt-4 md:pt-0 md:pl-4" : ""
                }`}
              >
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 tracking-tight font-['Outfit'] drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-300 mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;