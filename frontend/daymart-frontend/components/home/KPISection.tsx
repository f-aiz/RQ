"use client";

// Removed useEffect and useState since data is now static
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
// import { useRouter } from "next/navigation"; // Removed Next.js router
// KPI data is now a constant object populated from your script's output
const kpi = {
  revenue: 133573397.45,
  stockAge: 154.4, // From "Average Stock Age (FIFO): 154.4 days"
  netCreditPosition: 126816, // Kept your original hardcoded calculation
  inventoryValue: 4563617.92, // From "Current Inventory Value: 4,563,617.92"
};

export default function KPISection() {
  // const router = useRouter(); // Removed Next.js router hook

  // Removed loading state and useEffect hook

  // Restore navigation functions using standard browser navigation
  // Navigate to financials page
  const goToFinancials = () => {
    // Simulating navigation
    console.log("Navigating to /financials");
    window.location.href = "/financials";
  };

  // Navigate to financials page and scroll to credit section
  const goToCredit = () => {
    // Simulating navigation
    console.log("Navigating to /financials#credit");
    window.location.href = "/financials#credit";
  };

  // Navigate to products page and scroll to inventory age section
  const goToInventoryAge = () => {
    // Simulating navigation
    console.log("Navigating to /products#inventory-age");
    window.location.href = "/products#inventory-age";
  };

  const kpiList = [
    {
      label: "Total Revenue",
      value:
        typeof kpi.revenue === "number"
          ? `₹${kpi.revenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "—",
      onClick: goToFinancials, // Restore onClick
      clickable: true, // Restore clickable
    },
    {
      label: "Avg Stock Age",
      value: typeof kpi.stockAge === "number" ? `${kpi.stockAge} days` : "—",
      onClick: goToInventoryAge, // Restore onClick
      clickable: true, // Restore clickable
    },
    // Removed the duplicate "Avg Stock Age" entry
    {
      label: "Net Credit Position",
      value:
        typeof kpi.netCreditPosition === "number"
          ? `+${kpi.netCreditPosition.toLocaleString()}`
          : "—",
      onClick: goToCredit, // Restore onClick
      clickable: true, // Restore clickable
      isPositive: true, // Flag to apply green color
    },
    {
      label: "Inventory Value",
      value:
        typeof kpi.inventoryValue === "number"
          ? `₹${kpi.inventoryValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "—",
      // This item has no onClick, so it won't be clickable
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
          onClick={item.onClick} // This will now call the navigation functions
          className={item.clickable ? "cursor-pointer" : ""} // This will now add cursor-pointer
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
                {/* Removed the loading state check here */}
                {item.value}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}