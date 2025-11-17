"use client";

// ❗ IMPORTANT: No imports from lib/api or apiGet
// ❗ No async functions, no useEffect, no hooks

const kpi = {
  totalRevenue: 133573397.45,
  inventoryValue: 4563617.92,
  totalProfit: 16633354.83,
  priceVariance: 1397076.22,
  cashFlowRatio: 4.55,
};

export default function FinancialKPIs() {
  const KPIs = [
    {
      label: "Total Revenue",
      value: `₹${kpi.totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: "Current Inventory Value",
      value: `₹${kpi.inventoryValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: "Total Profit",
      value: `₹${kpi.totalProfit.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: "Purchase Price Variance",
      value: `₹${kpi.priceVariance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: "Inventory Value vs Cash Outflow",
      value: `${kpi.cashFlowRatio.toFixed(2)}%`,
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
            {k.value}
          </p>
        </div>
      ))}
    </div>
  );
}
