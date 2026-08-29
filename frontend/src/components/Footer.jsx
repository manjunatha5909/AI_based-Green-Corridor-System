function Footer({ setActiveTab, onGetStarted }) {
  return (
    <footer className="bg-[#05070B] border-t border-white/10 pt-16 pb-12 px-4 sm:px-8 lg:px-12 text-slate-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center font-bold tracking-wider text-xl font-['Outfit']">
            <span className="text-emerald-400 font-extrabold mr-1.5 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">AI</span>
            <span className="text-white">GREEN CORRIDOR</span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Intelligent traffic management system creating virtual green corridors for emergency vehicles to save precious lives.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="btn-emerald px-5 py-2 rounded-full text-xs font-bold"
            >
              Launch Corridor Console
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-4 font-['Outfit']">Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => setActiveTab("home")} className="hover:text-emerald-400 transition-colors">Home</button></li>
            <li><button onClick={() => setActiveTab("how-it-works")} className="hover:text-emerald-400 transition-colors">How It Works</button></li>
            <li><button onClick={() => setActiveTab("features")} className="hover:text-emerald-400 transition-colors">Features</button></li>
            <li><button onClick={() => setActiveTab("about")} className="hover:text-emerald-400 transition-colors">About Mission</button></li>
            <li><button onClick={() => setActiveTab("analytics")} className="hover:text-emerald-400 transition-colors">Performance Analytics</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-4 font-['Outfit']">Emergency Hotlines</h4>
          <ul className="space-y-2 text-xs">
            <li className="text-emerald-400 font-semibold">Medical Dispatch: 108</li>
            <li className="text-emerald-400 font-semibold">Traffic Police Command: 103</li>
            <li className="text-slate-400 mt-2">Bengaluru Metropolitan Control Room</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 AI Green Corridor System. All rights reserved.</p>
        <p>Smart City Traffic Management & Emergency Transit System</p>
      </div>
    </footer>
  );
}

export default Footer;
