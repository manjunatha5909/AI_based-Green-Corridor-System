import { Radio, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const NAV_LINKS = [
  { label: "Overview", tab: "home" },
  { label: "How It Works", tab: "how-it-works" },
  { label: "Features", tab: "features" },
  { label: "Analytics", tab: "analytics" },
  { label: "About", tab: "about" },
];

const TECH_STACK = ["React 19", "Tailwind v4", "Framer Motion", "shadcn/ui", "Leaflet", "OpenStreetMap"];

function Footer({ setActiveTab, onGetStarted }) {
  return (
    <footer className="relative bg-[#F1F5F9] dark:bg-[#040608] border-t border-slate-200 dark:border-white/8 pt-16 pb-10 px-4 sm:px-8 lg:px-12 overflow-hidden transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand block */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Radio className="w-5 h-5" />
              </div>
              <div className="font-bold tracking-wider text-lg font-['Outfit'] flex items-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold mr-1">AI</span>
                <span className="text-slate-900 dark:text-white">GREEN CORRIDOR</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm font-normal">
              Intelligent traffic orchestration that synchronizes city signals along real road graphs to create an unobstructed virtual corridor for emergency vehicles — saving lives in the golden hour.
            </p>
            <Button variant="emerald" size="sm" onClick={onGetStarted} className="rounded-full px-5 gap-2 shadow-xs">
              <Zap className="w-3.5 h-3.5" />
              Launch Corridor Console
            </Button>

            {/* Tech tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TECH_STACK.map((tech) => (
                <span key={tech} className="px-2.5 py-1 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 text-[10px] text-slate-600 dark:text-slate-400 font-semibold shadow-2xs">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-5 font-['Outfit']">Navigation</h4>
            <ul className="space-y-3 text-sm">
              {NAV_LINKS.map(({ label, tab }) => (
                <li key={tab}>
                  <button
                    onClick={() => setActiveTab(tab)}
                    className="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200 font-medium cursor-pointer"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* System status */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-5 font-['Outfit']">System Status</h4>
            <div className="space-y-3">
              {[
                { label: "AI Routing Engine (OSRM)", status: "Operational" },
                { label: "In-Browser Simulation Engine", status: "Operational" },
                { label: "Live GPS Telemetry", status: "Operational" },
                { label: "Bengaluru Road Graph", status: "Up to date" },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">{status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-xs">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mb-0.5">All systems operational</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Automatic signal sync ready · Golden Hour active</p>
            </div>
          </div>
        </div>

        <Separator className="mb-6 bg-slate-200 dark:bg-white/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for emergency responders in Bengaluru
          </p>
          <p>
            © {new Date().getFullYear()} AI Based Green Corridor System · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
