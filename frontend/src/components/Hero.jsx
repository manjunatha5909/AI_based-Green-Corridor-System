import { HiArrowRight } from "react-icons/hi2";
import { Cpu, Zap, Activity, ShieldCheck, Navigation2, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const STATIC_PARTICLES = [
  { key: 0, style: { width: "6px", height: "6px", left: "12%", top: "25%" }, duration: 5.2, delay: 0.2 },
  { key: 1, style: { width: "4px", height: "4px", left: "28%", top: "45%" }, duration: 6.8, delay: 1.1 },
  { key: 2, style: { width: "8px", height: "8px", left: "42%", top: "30%" }, duration: 4.5, delay: 2.3 },
  { key: 3, style: { width: "5px", height: "5px", left: "65%", top: "60%" }, duration: 7.1, delay: 0.5 },
  { key: 4, style: { width: "7px", height: "7px", left: "80%", top: "35%" }, duration: 5.9, delay: 1.8 },
  { key: 5, style: { width: "4px", height: "4px", left: "18%", top: "70%" }, duration: 6.3, delay: 2.6 },
  { key: 6, style: { width: "9px", height: "9px", left: "50%", top: "80%" }, duration: 4.8, delay: 0.9 },
  { key: 7, style: { width: "5px", height: "5px", left: "72%", top: "20%" }, duration: 6.0, delay: 1.4 },
  { key: 8, style: { width: "6px", height: "6px", left: "88%", top: "55%" }, duration: 5.5, delay: 2.0 },
  { key: 9, style: { width: "4px", height: "4px", left: "35%", top: "65%" }, duration: 7.4, delay: 0.7 },
  { key: 10, style: { width: "7px", height: "7px", left: "5%", top: "40%" }, duration: 5.1, delay: 1.6 },
  { key: 11, style: { width: "5px", height: "5px", left: "92%", top: "75%" }, duration: 6.6, delay: 2.2 },
];

/* Floating particle dot */
function Particle({ style, duration, delay }) {
  return (
    <motion.div
      className="absolute rounded-full bg-emerald-500/20 pointer-events-none"
      style={style}
      animate={{ y: [0, -35, 0], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function Hero({ onOpenRapidWay, onOpenCommandHub }) {
  const features = [
    { icon: Cpu, title: "AI Graph Routing", subtitle: "OSRM & Dijkstra" },
    { icon: Navigation2, title: "Live Telemetry", subtitle: "Real-time Heading" },
    { icon: Zap, title: "Zero-Delay Wave", subtitle: "Golden Hour Saved" },
    { icon: ShieldCheck, title: "Smart Clearance", subtitle: "Auto Signal Sync" },
  ];

  const stats = [
    { value: 2534, suffix: "+", label: "Dispatched" },
    { value: 1245, suffix: " km", label: "Corridors Created" },
    { value: 98, suffix: "%", label: "Junctions Cleared" },
    { value: 12450, suffix: "+", label: "Lives Protected" },
    { value: 1, prefix: "< ", suffix: " min", label: "Override Latency" },
  ];

  return (
    <section
      aria-labelledby="hero-title"
      className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#F8FAFC] dark:bg-[#070A0F] transition-colors duration-300"
    >
      {/* ── Animated Background Layers ── */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        {/* Ambient Mesh Glows */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-sky-400/10 dark:bg-sky-500/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 right-10 w-[350px] h-[350px] bg-teal-300/10 dark:bg-teal-500/10 rounded-full blur-[120px]" />

        {/* Subtle Architectural Grid */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(15,23,42,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Floating Particles */}
        {STATIC_PARTICLES.map((p) => <Particle key={p.key} style={p.style} duration={p.duration} delay={p.delay} />)}
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 pt-28 sm:pt-32 pb-8 flex flex-col justify-between flex-1">
        <div className="max-w-3xl">

          {/* Live Status Pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-6"
          >
            <Badge variant="emerald" className="px-4 py-1.5 text-xs rounded-full gap-2 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
              SYSTEM LIVE · AI BASED EMERGENCY RESPONSE
            </Badge>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-xs">
              <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Bengaluru, India
            </div>
          </motion.div>

          {/* 3-Line Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-1 mb-6"
          >
            <h1
              id="hero-title"
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-['Outfit']"
            >
              AI Based
            </h1>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none font-['Outfit'] emerald-gradient-text">
              Green Corridor
            </h1>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-['Outfit']">
              System
            </h1>
          </motion.div>

          {/* Sub-description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed mb-8 font-normal"
          >
            Intelligent traffic orchestration that synchronizes city signals along real road graphs to create an unobstructed virtual corridor for emergency vehicles — saving lives in the golden hour.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-3 mb-10"
          >
            <Button
              variant="emerald"
              size="xl"
              onClick={onOpenRapidWay}
              className="rounded-full px-8 group shadow-md hover:shadow-lg"
            >
              <Zap className="w-5 h-5" />
              Rapid Way
              <HiArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" aria-hidden="true" />
            </Button>

            <Button
              variant="glass"
              size="xl"
              onClick={onOpenCommandHub}
              className="rounded-full px-7 shadow-xs border-slate-200 dark:border-white/15 bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
            >
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Live Operations Hub
            </Button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-2.5"
          >
            {features.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10 transition-all duration-200 cursor-default"
                >
                  <IconComp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</span>
                  <Separator orientation="vertical" className="h-3 bg-slate-200 dark:bg-white/15" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.subtitle}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ── Floating Stats Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10"
        >
          <div className="glass-stats-bar rounded-2xl px-5 py-4 sm:py-5 border border-slate-200/90 dark:border-white/10 shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 md:gap-3 divide-y sm:divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center text-center ${index >= 2 ? "pt-4 sm:pt-4 md:pt-0" : ""} md:px-3`}
                >
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix || ""}
                    prefix={stat.prefix || ""}
                    className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-['Outfit']"
                  />
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;