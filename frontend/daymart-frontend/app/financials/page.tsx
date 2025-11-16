"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/home/TopNav";
import FinancialKPIs from "@/components/financials/FinancialKPIs";
import FinancialOverviewChart from "@/components/financials/FinancialOverviewChart";
import CashOutflowChart from "@/components/financials/CashOutflowChart";
import Credit from "@/components/financials/Credit";

export default function FinancialsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen w-full bg-black text-white font-sans">
      <TopNav />

      <div
        className={`pt-32 px-10 space-y-12 max-w-7xl mx-auto transition-opacity duration-700 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        <FinancialKPIs />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <FinancialOverviewChart />
          <CashOutflowChart />
        </div>

        {/* Credit Section */}
        <div id="credit">
          <Credit />
        </div>
      </div>
    </main>
  );
}