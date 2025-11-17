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

// Define types for clarity
interface RevenueData {
  date: string;
  revenue: number;
}

// --- STATIC DATA FROM PYTHON SCRIPT ---
const REVENUE_TOTALS: { [key: number]: number } = {
  30: 3824831.22,
  90: 11579673.12,
  180: 27204031.09,
  365: 63319897.56,
  730: 133355191.09,
};

// --- END STATIC DATA ---

const FILTERS = [
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "2Y", days: 730 },
];

export default function RevenueTrendChart() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<RevenueData[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadTrend() {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 250));

      try {
        if (!isMounted) return;

        // --- Use the static data total for the selected period ---
        const totalRevenue = REVENUE_TOTALS[days] ?? 0;

        // --- SIMULATED TREND (copied from your CashOutflowTrendChart) ---
        // This creates a plausible-looking graph based on the real total
        const avgDaily = totalRevenue / days;
        const generatedTrend: RevenueData[] = Array.from({ length: days }).map(
          (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));

            // Simulate some variance and a gentle curve/trend
            const trendFactor = 0.5 + (i / days) * 1.5;
            const variance = 0.7 + Math.random() * 0.6;
            const dailyRevenue = Math.max(0, avgDaily * variance * trendFactor);

            return {
              date: date.toISOString().split("T")[0],
              revenue: dailyRevenue,
            };
          }
        );
        // --- END SIMULATION ---

        setTrend(generatedTrend);
      } catch (e) {
        console.error("Trend fetch error:", e);
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
        label: "Revenue",
        data: trend.map((t) => t.revenue),
        borderColor: "rgb(52, 211, 153)", // Emerald Green
        backgroundColor: "rgba(52, 211, 153, 0.25)", // Emerald Fill
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
            // Format as Rupee
            return `Revenue: ₹${context.parsed.y.toLocaleString("en-IN", {
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
            // Use Rupee symbol
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
          maxTicksLimit: 7,
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
      {/* Title Row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Revenue Trend Overview
        </h2>

        {/* Filters */}
        <div className="flex gap-2 p-1 rounded-xl bg-gray-800">
          {FILTERS.map((f) => (
            <button
              key={f.days}
              onClick={() => setDays(f.days)}
              className={`px-3 py-1.5 rounded-lg text-sm transition font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                days === f.days
                  ? "bg-emerald-500 text-gray-900 shadow-md"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-grow h-[300px] w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-emerald-500/60 text-lg font-medium">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-500"
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
            <p className="text-sm">No sales data found for this period.</p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}