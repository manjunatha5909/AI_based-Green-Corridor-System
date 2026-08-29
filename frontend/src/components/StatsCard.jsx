import { motion } from "framer-motion";

function StatsCard({ title, value }) {
  const isEmergencyCard = title === "Emergencies Handled";

  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      className={
        `glass p-6 w-full max-w-[220px] min-h-[140px] flex flex-col justify-center ${
          isEmergencyCard ? "items-start text-left" : "items-center text-center"
        } space-y-3 ${isEmergencyCard ? "mx-0" : "mx-auto"} rounded-[1.25rem]`
      }
    >
      <h3 className="text-gray-300 text-sm uppercase tracking-[0.25em]">
        {title}
      </h3>
      <h1 className="text-4xl sm:text-5xl font-bold text-amber-300">
        {value}
      </h1>
    </motion.div>
  );
}

export default StatsCard;
