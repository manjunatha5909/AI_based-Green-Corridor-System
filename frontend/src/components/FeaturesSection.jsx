import { motion } from "framer-motion";
import { Cpu, Radio, Shield, BarChart3, Clock, MapPin } from "lucide-react";

function FeaturesSection() {
  const list = [
    {
      icon: Cpu,
      title: "Adaptive AI Routing",
      desc: "Uses Dijkstra & A* graph algorithms over real OpenStreetMap road networks to guarantee shortest physical delay.",
    },
    {
      icon: Radio,
      title: "Real-time Telemetry",
      desc: "Continuous websocket & HTTP polling of vehicle velocity, heading, and projected intersection arrival times.",
    },
    {
      icon: Shield,
      title: "Priority Fail-safes",
      desc: "Multi-layered security protocols preventing unauthorized signal overrides and restoring normal traffic flow instantly.",
    },
    {
      icon: BarChart3,
      title: "Corridor Analytics",
      desc: "Automated logging of average time saved, traffic clearance speed, and response metrics for municipal reports.",
    },
    {
      icon: Clock,
      title: "Under 1-Min Latency",
      desc: "Sub-second signal state updates across high-speed optical and 5G IoT traffic controllers.",
    },
    {
      icon: MapPin,
      title: "Multi-city Support",
      desc: "Seamless integration across metropolitan zones including Bengaluru, Delhi, Mumbai, and Hyderabad.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-8 lg:px-12 bg-[#0A0E17] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full glass-pill text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            ADVANCED CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
            Built For Mission Critical <span className="emerald-gradient-text">Emergency Services</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit'] group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
