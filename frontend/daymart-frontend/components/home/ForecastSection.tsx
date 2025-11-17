"use client";

import { useEffect, useState } from "react";
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
  dot: string;
  PTC: number;
  total_sales_amount_forecast: number;
};

export default function ForecastSection() {
  const [forecast, setForecast] = useState<ForecastRow[]>([]);

  useEffect(() => {
    async function loadData() {
      const f = await fetch("/data/sku_forecast.json").then((r) => r.json());
      setForecast(f);
    }
    loadData();
  }, []);

  if (!forecast.length)
    return (
      <p className="text-center py-10 text-muted-foreground">
        Loading forecast...
      </p>
    );

  // Only the first 7 days of forecast
  const sevenDays = forecast.slice(0, 7);

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow w-full">
      <h1 className="text-3xl font-bold mb-6">
        7-Day Sales Forecast
      </h1>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={sevenDays}>
          <CartesianGrid stroke="#555" opacity={0.3} />

          <XAxis
            dataKey="dot"
            stroke="#aaa"
            tick={{ fontSize: 12 }}
          />

          <YAxis
  stroke="#aaa"
  tick={{ fontSize: 12 }}
  label={{
    value: "Quantities",
    angle: -90,
    position: "insideLeft",
    fill: "#aaa",
  }}
/>




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
            stroke="#3b82f6" // Tailwind Blue-500
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Forecast"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
