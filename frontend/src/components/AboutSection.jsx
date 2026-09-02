import { ShieldCheck, HeartPulse, Sparkles } from "lucide-react";

function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="py-20 px-4 sm:px-8 lg:px-12 bg-slate-50/50 dark:bg-slate-950/50 relative border-t border-slate-200/80 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-2xs">
            OUR MISSION & IMPACT
          </span>
          <h2 id="about-title" className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-['Outfit'] tracking-tight leading-tight">
            Saving Lives By Eliminating <span className="emerald-gradient-text">Traffic Gridlock</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            In medical emergencies, every minute lost in traffic reduces survival rates by up to 10%. The AI Green Corridor System transforms city infrastructure into an intelligent, living network that automatically clears a path for ambulances, organ transport, and fire services.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-1 shadow-2xs">
                <HeartPulse className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">Golden Hour Preservation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Drastically reduces transport times during critical cardiac, stroke, and trauma incidents.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-1 shadow-2xs">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">Traffic Safety First</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gentle phase transitions prevent abrupt stops, keeping civilian drivers safe while opening emergency lanes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-8 relative overflow-hidden border border-slate-200/90 dark:border-white/10 shadow-md">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-pulse" aria-hidden="true" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">Live Network Coverage</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center shadow-xs">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-['Outfit']">99.4%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">System Reliability</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center shadow-xs">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-['Outfit']">&lt; 3 sec</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Signal Switch Speed</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
                <p className="font-bold text-emerald-900 dark:text-emerald-300 mb-1">Civilian Safety Architecture</p>
                Civilians receive advanced warning up to 800m ahead via V2X broadcasts and variable message signage, ensuring smooth transition lanes without sudden stops.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
