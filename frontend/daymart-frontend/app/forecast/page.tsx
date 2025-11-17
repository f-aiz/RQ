"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/home/TopNav";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ForecastRow = {
  dot: string; // date
  PTC: number;
  total_sales_amount_forecast: number;
};

export default function ForecastPage() {
  const [forecast, setForecast] = useState<ForecastRow[]>([]);

  useEffect(() => {
    async function loadData() {
      const f = await fetch("/data/sku_forecast.json").then((r) => r.json());
      setForecast(f);
    }
    loadData();
  }, []);

  if (!forecast.length) return <p className="mt-20 text-center">Loading...</p>;

  // Only take the first 7 days of forecast
  const sevenDays = forecast.slice(0, 7);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAVBAR */}
      <TopNav />

      {/* PAGE CONTENT */}
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-10">
        {/* CARD */}
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow">

          <h1 className="text-3xl font-bold mb-6">
            7-Day Sales Forecast
          </h1>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={sevenDays}>
              <CartesianGrid stroke="#555" opacity={0.3} />

              <XAxis dataKey="dot" stroke="#aaa" tick={{ fontSize: 12 }} />
              <YAxis stroke="#aaa" tick={{ fontSize: 12 }} />

              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30,30,30,0.85)",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />

              <Line
                type="monotone"
                dataKey="total_sales_amount_forecast"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
