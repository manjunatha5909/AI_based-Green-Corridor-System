import { motion } from "framer-motion";
import {
  Brain,
  MapPinned,
  TrafficCone,
  BarChart3
} from "lucide-react";

const features = [
  {
    icon: <Brain size={40} />,
    title: "AI Route Planning",
    desc: "Finds the fastest emergency route using AI."
  },
  {
    icon: <MapPinned size={40} />,
    title: "Real Bengaluru Map",
    desc: "OpenStreetMap with live road network."
  },
  {
    icon: <TrafficCone size={40} />,
    title: "Smart Signals",
    desc: "Automatically activates the green corridor."
  },
  {
    icon: <BarChart3 size={40} />,
    title: "Analytics",
    desc: "Traffic, ETA and emergency reports."
  }
];

function FeatureCards() {
  return (
    <section className="py-24 px-10">

      <motion.h2
        initial={{opacity:0,y:30}}
        whileInView={{opacity:1,y:0}}
        transition={{duration:0.8}}
        className="text-5xl font-bold text-center mb-16"
      >
        Smart City Features
      </motion.h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

        {features.map((item,index)=>(
          <motion.div
            key={index}
            whileHover={{
              y:-10,
              scale:1.05
            }}
            className="glass p-8 rounded-2xl"
          >

            <div className="text-cyan-400 mb-6">
              {item.icon}
            </div>

            <h3 className="text-2xl font-bold mb-4">
              {item.title}
            </h3>

            <p className="text-gray-300">
              {item.desc}
            </p>

          </motion.div>
        ))}

      </div>

    </section>
  );
}

export default FeatureCards;