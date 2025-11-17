"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register necessary Chart.js elements
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

// --- STATIC DATA FROM PYTHON SCRIPT ---
// We only have the 2-year total (100,269,119.48).
// We will pro-rate this total to estimate totals for shorter periods.
const TOTAL_OUTFLOW_2Y = 100269119.48;
const DAILY_AVG_OUTFLOW = TOTAL_OUTFLOW_2Y / 730; // 730 days = 2 years

const OUTFLOW_TOTALS: { [key: number]: number } = {
  30: DAILY_AVG_OUTFLOW * 30, // ~4.12M
  90: DAILY_AVG_OUTFLOW * 90, // ~12.36M
  180: DAILY_AVG_OUTFLOW * 180, // ~24.72M
  365: DAILY_AVG_OUTFLOW * 365, // ~50.13M
  730: TOTAL_OUTFLOW_2Y, // ~100.27M
};
// --- END STATIC DATA ---

const FILTERS = [
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "2Y", days: 730 },
];

// Define types for clarity
interface CashFlowData {
  date: string;
  outflow: number;
}

export default function CashOutflowTrendChart() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<CashFlowData[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadTrend() {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        if (!isMounted) return;

        // --- Use the estimated static data total for the selected period ---
        const totalOutflow = OUTFLOW_TOTALS[days] ?? 0;

        // --- SIMULATED TREND (smooth gradual curve) ---
        const avgDaily = totalOutflow / days;
        const generatedTrend: CashFlowData[] = Array.from({ length: days }).map(
          (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));

            // Simulate some variance and a gentle curve/trend
            const trendFactor = 0.5 + (i / days) * 1.5;
            const variance = 0.7 + Math.random() * 0.6;
            const dailyOutflow = Math.max(0, avgDaily * variance * trendFactor);

            return {
              date: date.toISOString().split("T")[0],
              outflow: dailyOutflow,
            };
          }
        );
        // --- END SIMULATION ---

        setTrend(generatedTrend);
      } catch (e) {
        console.error("Cash Outflow trend error:", e);
        if (isMounted) setTrend([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTrend();
    return () => {
      isMounted = false;
    };
  }, [days]); // Re-run when 'days' filter changes

  const chartData = {
    labels: trend.map((t) => t.date),
    datasets: [
      {
        label: "Cash Outflow",
        data: trend.map((t) => t.outflow),
        // STYLING: Changed color to distinguish from Revenue
        borderColor: "rgb(59, 130, 246)", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.25)",
        borderWidth: 2,
        pointRadius: trend.length > 90 ? 0 : 3, // Hide points on long trends
        pointHoverRadius: 6,
        tension: 0.25,
        fill: true,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17, 17, 17, 0.9)",
        padding: 12,
        bodyFont: { size: 13 },
        titleFont: { size: 13, weight: "bold" },
        displayColors: false,
        callbacks: {
          title: (context: any[]) => {
            const dateStr = context[0].label;
            return new Date(dateStr).toLocaleDateString("en-IN", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
          },
          label: (context: any) => {
            // STYLING: Use Rupee format
            return `Outflow: ₹${context.parsed.y.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          color: "#a3a3a3",
          font: { size: 11 },
          maxTicksLimit: 6,
          callback: (value: number | string): string => {
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;

            // STYLING: Use Rupee symbols
            if (numValue >= 1000000)
              return `₹${(numValue / 1000000).toFixed(1)}M`;
            if (numValue >= 1000)
              return `₹${(numValue / 1000).toFixed(1)}k`;
            return `₹${numValue.toFixed(0)}`;
          },
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: "#a3a3a3",
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7, // STYLING: Prevent label overlap
          callback: function (this: any, val: number | string): string {
            const label = this.getLabelForValue(val) as string;
            const date: Date = new Date(label);
            return date.toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            });
          },
        },
      },
    },
  };

  return (
    <div className="min-h-[400px] rounded-xl bg-gray-900/50 border border-gray-800 p-6 shadow-2xl h-full flex flex-col font-sans">
      {/* Title + Filters */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Cash Outflow Trend
        </h2>

        <div className="flex gap-2 p-1 rounded-xl bg-gray-800">
          {FILTERS.map((f) => (
            <button
              key={f.days}
              onClick={() => setDays(f.days)}
              // STYLING: Changed to blue to match chart
              className={`px-3 py-1.5 rounded-lg text-sm transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                days === f.days
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="grow h-[300px] w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-blue-500/60 text-lg font-medium">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading data...
          </div>
        ) : trend.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-700 rounded-lg bg-gray-900">
            <p className="text-sm">No cash-flow data found for this period.</p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}