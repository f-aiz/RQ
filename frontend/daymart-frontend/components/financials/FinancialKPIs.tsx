"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";

export default function FinancialKPIs() {
  const [loading, setLoading] = useState(true);

  const [kpi, setKpi] = useState({
    totalRevenue: null as number | null,
    inventoryValue: null as number | null,
    totalProfit: null as number | null,
    priceVariance: null as number | null,
    cashFlow: null as number | null,
  });

  useEffect(() => {
    async function loadKPIs() {
      try {
        const [revenue, inventory, profit, priceVar, cashFlow] =
          await Promise.all([
            API.analytics.revenue(),
            API.analytics.inventoryValue(),
            API.analytics.profit(), // this exists (profit_calculator)
            API.analytics.priceVariance(),
            API.analytics.cashFlow(),
          ]);

        setKpi({
          totalRevenue: revenue?.data?.total_revenue ?? null,
          inventoryValue:
            inventory?.data?.total_inventory_value ?? null,
          totalProfit:
            profit?.data?.total_profit ??
            profit?.data?.profit ??
            null,
          priceVariance:
            priceVar?.data?.purchase_price_variance ?? null,
          cashFlow:
            cashFlow?.data?.inventory_vs_cashflow ?? null,
        });
      } catch (err) {
        console.error("Financial KPIs error:", err);
        setKpi({
          totalRevenue: null,
          inventoryValue: null,
          totalProfit: null,
          priceVariance: null,
          cashFlow: null,
        });
      } finally {
        setLoading(false);
      }
    }

    loadKPIs();
  }, []);

  const KPIs = [
    {
      label: "Total Revenue",
      value:
        kpi.totalRevenue !== null
          ? `₹${kpi.totalRevenue.toLocaleString()}`
          : "—",
    },
    {
      label: "Current Inventory Value",
      value:
        kpi.inventoryValue !== null
          ? `₹${kpi.inventoryValue.toLocaleString()}`
          : "—",
    },
    {
      label: "Total Profit",
      value:
        kpi.totalProfit !== null
          ? `₹${kpi.totalProfit.toLocaleString()}`
          : "—",
    },
    {
      label: "Purchase Price Variance",
      value:
        kpi.priceVariance !== null
          ? `${kpi.priceVariance}%`
          : "—",
    },
    {
      label: "Inventory Value vs Cash Outflow",
      value:
        kpi.cashFlow !== null
          ? `₹${kpi.cashFlow.toLocaleString()}`
          : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
      {KPIs.map((k, idx) => (
        <div
          key={idx}
          className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-md shadow-lg"
        >
          <p className="text-sm text-white/60">{k.label}</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {loading ? "…" : k.value}
          </p>
        </div>
      ))}
    </div>
  );
}
