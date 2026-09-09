import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Ambulance, Cpu, TrafficCone, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    step: "01",
    icon: Ambulance,
    color: "sky",
    title: "Emergency Dispatch & Geo-Tracking",
    description: "Ambulance registers GPS coordinates via mobile app or emergency call center dispatch system in real-time.",
    detail: "Sub-second GPS lock",
  },
  {
    step: "02",
    icon: Cpu,
    color: "violet",
    title: "AI Route Optimization",
    description: "Backend algorithms query OpenStreetMap graphs using Dijkstra + A* to compute the fastest real-time route.",
    detail: "< 200ms computation",
  },
  {
    step: "03",
    icon: TrafficCone,
    color: "amber",
    title: "Dynamic Green-Wave Control",
    description: "Traffic signals ahead of the approaching ambulance switch automatically to GREEN, clearing intersection jams.",
    detail: "Cascade propagation",
  },
  {
    step: "04",
    icon: ShieldCheck,
    color: "emerald",
    title: "Safe Patient Arrival",
    description: "Emergency vehicle arrives at the hospital trauma center up to 50% faster — saving critical golden hour minutes.",
    detail: "50% faster ETA",
  },
];

const colorMap = {
  sky: { icon: "text-sky-600 dark:text-sky-400", border: "border-sky-200 dark:border-sky-500/30", bg: "bg-sky-50 dark:bg-sky-500/10", badge: "border-sky-200 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300 font-semibold" },
  violet: { icon: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/30", bg: "bg-purple-50 dark:bg-purple-500/10", badge: "border-purple-200 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 font-semibold" },
  amber: { icon: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/30", bg: "bg-amber-50 dark:bg-amber-500/10", badge: "border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold" },
  emerald: { icon: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30", bg: "bg-emerald-50 dark:bg-emerald-500/10", badge: "border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold" },
};

function StepCard({ step, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const c = colorMap[step.color];
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className="relative group"
    >
      <div className={`relative bg-white dark:bg-slate-900/90 rounded-2xl p-6 border ${c.border} shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1`}>
        {/* Step number */}
        <div className="flex items-start justify-between mb-5">
          <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center shadow-2xs`}>
            <Icon className={`w-7 h-7 ${c.icon}`} />
          </div>
          <span className="text-4xl font-black text-slate-200 dark:text-white/10 font-['Outfit'] select-none">{step.step}</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-['Outfit'] leading-snug">
          {step.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{step.description}</p>

        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${c.badge}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {step.detail}
        </div>
      </div>
    </motion.div>
  );
}

function HowItWorksSection({ onOpenRapidWay }) {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section className="relative py-24 px-4 sm:px-8 lg:px-12 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 transition-colors duration-300">
      {/* Glow BG */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge variant="emerald" className="mb-4 rounded-full px-4 py-1.5 font-bold shadow-xs">
            HOW IT WORKS
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-['Outfit'] tracking-tight mb-4">
            Four Steps to Save a Life
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed font-normal">
            From emergency dispatch to hospital arrival — the entire AI corridor is established in under 60 seconds.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {STEPS.map((step, index) => (
            <StepCard key={step.step} step={step} index={index} />
          ))}
        </div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="emerald" size="lg" onClick={onOpenRapidWay} className="rounded-full px-8 group gap-2 shadow-xs">
            <span>See it in Action</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">No setup needed — runs on live Bengaluru graph</span>
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
