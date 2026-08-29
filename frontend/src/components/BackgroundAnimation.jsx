import { motion } from "framer-motion";
import {
  Route,
  Brain,
  Activity,
  TrafficCone,
} from "lucide-react";

function DashboardPreview() {
  return (
    <section className="py-24 px-8">

      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: .8 }}
        className="text-5xl font-bold text-center mb-16"
      >
        Smart City Command Center
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: .9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: .8 }}
        className="glass rounded-3xl overflow-hidden border border-cyan-500/20 shadow-2xl"
      >

        <div className="grid lg:grid-cols-[220px_1fr_320px]">

          {/* Sidebar */}

          <div className="bg-slate-950/60 p-8 border-r border-cyan-500/10">

            <h3 className="text-2xl font-bold text-cyan-400 mb-8">
              Dashboard
            </h3>

            <ul className="space-y-5 text-gray-300">

              <li>🏠 Home</li>
              <li>🚑 Emergency</li>
              <li>🗺 Live Map</li>
              <li>🚦 Green Corridor</li>
              <li>📊 Analytics</li>
              <li>📄 Reports</li>

            </ul>

          </div>

          {/* Map */}

          <div className="relative h-125 bg-slate-900 overflow-hidden">

            {/* Animated Grid */}

            <div className="absolute inset-0 command-grid"></div>

            {/* Fake Route */}

            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 900 500"
            >
              <path
                d="M80 420 C250 320 350 260 480 210 S700 150 830 80"
                stroke="#00E5FF"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className="route-path"
              />
            </svg>

            {/* Ambulance */}

            <motion.div
              className="absolute text-4xl"
              animate={{
                x: [70, 260, 430, 650, 810],
                y: [410, 310, 220, 160, 70],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              🚑
            </motion.div>

            {/* Traffic Lights */}

            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-20 left-52 w-4 h-4 bg-red-500 rounded-full shadow-red-500 shadow-lg"
            />

            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-48 left-105 w-4 h-4 bg-green-400 rounded-full shadow-green-400 shadow-lg"
            />

            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-32 right-36 w-4 h-4 bg-yellow-400 rounded-full shadow-yellow-400 shadow-lg"
            />

          </div>

          {/* AI Panel */}

          <div className="bg-slate-950/60 p-8 border-l border-cyan-500/10">

            <h3 className="text-cyan-400 text-2xl font-bold mb-6">
              AI Decision Engine
            </h3>

            <div className="space-y-5">

              <div className="glass p-4 flex items-center gap-4">
                <Brain />
                Route B Recommended
              </div>

              <div className="glass p-4 flex items-center gap-4">
                <Route />
                ETA : 18 Minutes
              </div>

              <div className="glass p-4 flex items-center gap-4">
                <TrafficCone />
                14 Signals
              </div>

              <div className="glass p-4 flex items-center gap-4">
                <Activity />
                Confidence : 96%
              </div>

              <button className="btn w-full mt-6">
                Generate Green Corridor
              </button>

            </div>

          </div>

        </div>

      </motion.div>

    </section>
  );
}

export default DashboardPreview;
