import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cpu, Radio, Shield, BarChart3, Clock, MapPin, Zap, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Cpu,
    title: "Adaptive AI Routing",
    desc: "Dijkstra & A* graph algorithms over real OpenStreetMap road networks guarantee the shortest physical delay path every time.",
    tag: "Core Engine",
    color: "emerald",
    size: "lg",
  },
  {
    icon: Radio,
    title: "Real-time Telemetry",
    desc: "Continuous polling of vehicle velocity, heading, and projected intersection arrival times.",
    tag: "Live Data",
    color: "sky",
    size: "sm",
  },
  {
    icon: Shield,
    title: "Priority Fail-safes",
    desc: "Multi-layered security prevents unauthorized signal overrides and restores normal flow instantly.",
    tag: "Safety",
    color: "violet",
    size: "sm",
  },
  {
    icon: BarChart3,
    title: "Corridor Analytics",
    desc: "Automated logging of time saved, clearance speed, and response metrics for municipal reporting and city planning.",
    tag: "Insights",
    color: "amber",
    size: "md",
  },
  {
    icon: Clock,
    title: "Under 1-Min Latency",
    desc: "Sub-second signal updates over 5G IoT traffic controllers.",
    tag: "Performance",
    color: "rose",
    size: "sm",
  },
  {
    icon: MapPin,
    title: "City-wide Coverage",
    desc: "Full Bengaluru OSM graph with 1,200+ intersections pre-indexed.",
    tag: "Scale",
    color: "teal",
    size: "sm",
  },
  {
    icon: Zap,
    title: "Instant Override",
    desc: "One-click signal flip from dashboard — zero dependency on physical hardware integration.",
    tag: "Control",
    color: "amber",
    size: "sm",
  },
  {
    icon: Eye,
    title: "Live Signal Monitor",
    desc: "Interactive signal matrix showing live RED/GREEN states with clickable manual overrides and history trail.",
    tag: "Visualization",
    color: "sky",
    size: "lg",
  },
];

const colorMap = {
  emerald: { icon: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20", border: "border-slate-200/90 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/40", glow: "hover:shadow-md", badge: "emerald" },
  sky: { icon: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20", border: "border-slate-200/90 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-500/40", glow: "hover:shadow-md", badge: "sky" },
  violet: { icon: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20", border: "border-slate-200/90 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/40", glow: "hover:shadow-md", badge: "outline" },
  amber: { icon: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", border: "border-slate-200/90 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/40", glow: "hover:shadow-md", badge: "amber" },
  rose: { icon: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20", border: "border-slate-200/90 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/40", glow: "hover:shadow-md", badge: "rose" },
  teal: { icon: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20", border: "border-slate-200/90 dark:border-white/10 hover:border-teal-300 dark:hover:border-teal-500/40", glow: "hover:shadow-md", badge: "emerald" },
};

const sizeClasses = {
  sm: "col-span-1",
  md: "col-span-1 sm:col-span-2 lg:col-span-2",
  lg: "col-span-1 sm:col-span-2",
};

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const c = colorMap[feature.color] || colorMap.emerald;
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08 }}
      className={`${sizeClasses[feature.size]}`}
    >
      <div className={`h-full bg-white dark:bg-slate-900/90 rounded-2xl p-6 border ${c.border} ${c.glow} transition-all duration-300 group cursor-default hover:-translate-y-1 shadow-xs`}>
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 shadow-2xs`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>

        {/* Badge */}
        <Badge variant={c.badge} className="mb-3 text-[10px] rounded-full px-2.5 py-0.5 font-semibold">{feature.tag}</Badge>

        <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit'] mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section className="relative py-24 px-4 sm:px-8 lg:px-12 overflow-hidden bg-white dark:bg-[#070A0F] transition-colors duration-300">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-emerald-400/8 dark:bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[250px] bg-sky-400/8 dark:bg-sky-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge variant="sky" className="mb-4 rounded-full px-4 py-1.5 font-bold shadow-xs">CAPABILITIES</Badge>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-['Outfit'] tracking-tight mb-4">
            What Makes It Exceptional
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed font-normal">
            Every feature is purpose-built for real emergency response — no generic traffic software, just life-saving engineering.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
