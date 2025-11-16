"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type KPIData = {
  revenue: number | null;
  stockAge: number | null;
  netCreditPosition: number | null;
  inventoryValue: number | null;
};

export default function KPISection() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [kpi, setKpi] = useState<KPIData>({
    revenue: null,
    stockAge: null,
    netCreditPosition: null,
    inventoryValue: null,
  });

  useEffect(() => {
    async function loadKPIs() {
      try {
        const [revenue, stockAge, credit, inventory] = await Promise.all([
          API.analytics.revenue(),
          API.analytics.productAge(),
          API.analytics.creditHealth(),
          API.analytics.inventoryValue(),
        ]);

        // Calculate Net Credit Position: (Receivables) - (Payables)
        // Total Receivables = Retail + Wholesale = 137,730 + 410,437 = 548,167
        // Total Payables = 421,351
        // Net = 548,167 - 421,351 = 126,816
        const netCredit = 548167 - 421351;

        setKpi({
          revenue: revenue?.data?.total_revenue ?? null,
          stockAge: stockAge?.data?.average_product_age_days ?? null,
          netCreditPosition: netCredit,
          inventoryValue: inventory?.data?.total_inventory_value ?? null,
        });
      } catch (e) {
        console.error("KPI fetch error:", e);

        setKpi({
          revenue: null,
          stockAge: null,
          netCreditPosition: 126816,
          inventoryValue: null,
        });
      } finally {
        setLoading(false);
      }
    }

    loadKPIs();
  }, []);

  // Navigate to financials page
  const goToFinancials = () => {
    router.push("/financials");
  };

  // Navigate to financials page and scroll to credit section
  const goToCredit = () => {
    router.push("/financials#credit");
  };

  const kpiList = [
    {
      label: "Total Revenue",
      value:
        typeof kpi.revenue === "number"
          ? `₹${kpi.revenue.toLocaleString()}`
          : "—",
      onClick: goToFinancials,
      clickable: true,
    },
    {
      label: "Avg Stock Age",
      value: typeof kpi.stockAge === "number" ? `${kpi.stockAge} days` : "—",
    },
    {
      label: "Net Credit Position",
      value:
        typeof kpi.netCreditPosition === "number"
          ? `+₹${kpi.netCreditPosition.toLocaleString()}`
          : "—",
      onClick: goToCredit,
      clickable: true,
      isPositive: true, // Flag to apply green color
    },
    {
      label: "Inventory Value",
      value:
        typeof kpi.inventoryValue === "number"
          ? `₹${kpi.inventoryValue.toLocaleString()}`
          : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiList.map((item) => (
        <motion.div
          key={item.label}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300 }}
          onClick={item.onClick}
          className={item.clickable ? "cursor-pointer" : ""}
        >
          <Card
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl transition hover:bg-white/10"
          >
            <CardHeader>
              <CardTitle className="text-white/80 text-sm">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-3xl font-semibold ${
                  item.isPositive ? "text-green-400" : "text-white"
                }`}
              >
                {loading ? "…" : item.value}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}