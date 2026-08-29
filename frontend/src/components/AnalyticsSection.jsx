import { useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Table, BarChart2 } from "lucide-react";
import { useAccessibility } from "../context/useAccessibility";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

function AnalyticsSection() {
  const { highContrast } = useAccessibility();
  const [timeRange, setTimeRange] = useState("7d"); // "24h" | "7d" | "30d"
  const [viewMode, setViewMode] = useState("chart"); // "chart" | "table"

  const weeklyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Green Corridor Activations",
        data: timeRange === "24h" ? [4, 6, 8, 5, 9, 12, 7] : timeRange === "30d" ? [180, 210, 195, 230, 245, 280, 260] : [28, 34, 30, 42, 38, 51, 46],
        borderColor: highContrast ? "#FCD34D" : "#10B981",
        backgroundColor: highContrast ? "rgba(252, 211, 77, 0.2)" : "rgba(16, 185, 129, 0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: highContrast ? "#FCD34D" : "#10B981",
        pointBorderColor: "#FFFFFF",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: highContrast ? "#FFFFFF" : "#94A3B8", font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: "#0F172A",
        titleColor: "#10B981",
        bodyColor: "#F1F5F9",
      },
    },
    scales: {
      x: {
        ticks: { color: highContrast ? "#FFFFFF" : "#94A3B8" },
        grid: { color: "rgba(255, 255, 255, 0.08)" },
      },
      y: {
        ticks: { color: highContrast ? "#FFFFFF" : "#94A3B8" },
        grid: { color: "rgba(255, 255, 255, 0.08)" },
      },
    },
  };

  const doughnutData = {
    labels: ["Critical Trauma", "Cardiac Emergency", "Organ Transit", "Pediatric Support"],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: highContrast
          ? ["#10B981", "#38BDF8", "#F59E0B", "#A855F7"]
          : ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6"],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: highContrast ? "#FFFFFF" : "#94A3B8", boxWidth: 12 },
      },
    },
  };

  const tableRows = [
    { day: "Monday", count: 28, avgTime: "12.4 mins", clearanceRate: "98.2%", savedMinutes: "16.5 mins" },
    { day: "Tuesday", count: 34, avgTime: "11.8 mins", clearanceRate: "99.1%", savedMinutes: "18.2 mins" },
    { day: "Wednesday", count: 30, avgTime: "13.1 mins", clearanceRate: "97.8%", savedMinutes: "15.0 mins" },
    { day: "Thursday", count: 42, avgTime: "10.9 mins", clearanceRate: "99.4%", savedMinutes: "21.4 mins" },
    { day: "Friday", count: 38, avgTime: "12.0 mins", clearanceRate: "98.7%", savedMinutes: "17.8 mins" },
    { day: "Saturday", count: 51, avgTime: "10.2 mins", clearanceRate: "99.6%", savedMinutes: "23.1 mins" },
    { day: "Sunday", count: 46, avgTime: "11.5 mins", clearanceRate: "98.9%", savedMinutes: "19.6 mins" },
  ];

  return (
    <section aria-labelledby="analytics-title" className="py-20 px-4 sm:px-8 lg:px-12 bg-[#0A0E17] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header & View Toggle Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full glass-pill text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              OPERATIONAL INTELLIGENCE & TELEMETRY
            </span>
            <h2 id="analytics-title" className="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
              Real-time <span className="emerald-gradient-text">Corridor Analytics</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Performance metrics, traffic clearance rates, and transit time savings across metropolitan Bengaluru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-900 border border-white/15 rounded-xl p-1 text-xs" role="group" aria-label="Time period selection">
              {["24h", "7d", "30d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    timeRange === range
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Visual Chart vs Accessible Table Toggle */}
            <div className="flex items-center bg-slate-900 border border-white/15 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode("chart")}
                aria-pressed={viewMode === "chart"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === "chart"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Charts</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Accessible Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Interactive Charts */}
        {viewMode === "chart" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Line Chart */}
            <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit']">
                    Weekly Emergency Corridors Activated
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated route throughput across major traffic nodes.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  Live Stream
                </span>
              </div>
              <div className="h-[280px]">
                <Line data={weeklyData} options={lineOptions} />
              </div>
            </div>

            {/* Doughnut Chart */}
            <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white font-['Outfit'] mb-1">
                Emergency Priority Distribution
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Breakdown by triage medical urgency.
              </p>
              <div className="h-[240px]">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        ) : (
          /* View Mode: Screen Reader / Low Vision Accessible Data Table */
          <div className="glass-card rounded-2xl p-6 border border-white/10 overflow-x-auto">
            <h3 className="text-lg font-bold text-white font-['Outfit'] mb-4">
              Detailed Operational Transit Metrics ({timeRange.toUpperCase()})
            </h3>
            <table
              className="w-full text-left text-xs border-collapse"
              aria-label="Weekly Corridor Performance Statistics"
            >
              <thead>
                <tr className="border-b border-white/15 text-slate-400 font-semibold uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Day</th>
                  <th scope="col" className="py-3 px-4">Activations</th>
                  <th scope="col" className="py-3 px-4">Avg. Transit Time</th>
                  <th scope="col" className="py-3 px-4">Signal Clearance Rate</th>
                  <th scope="col" className="py-3 px-4">Time Saved vs Standard Traffic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{row.day}</td>
                    <td className="py-3 px-4 text-emerald-400 font-mono font-bold">{row.count}</td>
                    <td className="py-3 px-4">{row.avgTime}</td>
                    <td className="py-3 px-4 text-sky-300 font-semibold">{row.clearanceRate}</td>
                    <td className="py-3 px-4 text-amber-300 font-semibold">{row.savedMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default AnalyticsSection;
