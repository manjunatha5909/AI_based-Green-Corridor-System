import { motion } from "framer-motion";
import { Ambulance, Cpu, TrafficCone, ShieldCheck } from "lucide-react";

function HowItWorksSection({ onCreateCorridor }) {
  const steps = [
    {
      step: "01",
      icon: Ambulance,
      title: "Emergency Dispatch & Geo-Tracking",
      description: "Ambulance registers GPS coordinates via mobile app or emergency call center dispatch system.",
    },
    {
      step: "02",
      icon: Cpu,
      title: "AI Route Optimization",
      description: "Backend algorithms query OpenStreetMap graphs to compute the fastest real-time route avoiding heavy congestion.",
    },
    {
      step: "03",
      icon: TrafficCone,
      title: "Dynamic Green-Wave Control",
      description: "Traffic signals ahead of the approaching ambulance switch automatically to GREEN, clearing intersection jams.",
    },
    {
      step: "04",
      icon: ShieldCheck,
      title: "Safe Patient Arrival",
      description: "Emergency vehicle arrives at hospital trauma center up to 50% faster, saving critical minutes for life support.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-8 lg:px-12 bg-[#070A0F]/90 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full glass-pill text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
            How The Virtual <span className="emerald-gradient-text">Green Corridor</span> Works
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            End-to-end automated orchestration connecting emergency dispatch, AI graph routing, and smart city traffic hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card rounded-2xl p-6 relative group hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black font-['Outfit'] text-slate-600 group-hover:text-emerald-400 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors font-['Outfit']">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={onCreateCorridor}
            className="btn-emerald px-8 py-3.5 rounded-full text-sm font-bold tracking-wide cursor-pointer"
          >
            Try Live Route Simulation
          </button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
