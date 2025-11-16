"use client";

import { useEffect, useState, useMemo } from "react";
import Papa, { ParseResult } from "papaparse";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from "recharts";

type PartyType = "Payable" | "Retail" | "Wholesale";

interface IPartyData {
  "Party Name": string;
  "Pending": number;
  "Aging Bucket": string;
  risk: number;
  type: PartyType;
  [key: string]: any;
}

interface IPolicy {
  type: "Strict" | "Moderate" | "Lenient";
  maxDays: number;
  pendingLimit: number;
  notes: string;
  action: string;
}

const MUTED_COLORS = [
  "#5eead4",
  "#67e8f9",
  "#7dd3fc",
  "#a5b4fc",
  "#c4b5fd",
  "#e9d5ff",
  "#d4d4d8",
  "#a3a3a3",
];

const computeRiskScore = (row: any, pending: number): number => {
  let score = 0;
  const bucket = row["Aging Bucket"] || "";

  if (bucket.includes("180")) score += 50;
  else if (bucket.includes("91")) score += 35;
  else if (bucket.includes("61")) score += 20;

  if (pending > 100000) score += 40;
  else if (pending > 50000) score += 25;
  else if (pending > 20000) score += 10;

  return score;
};

const getRecommendedPolicy = (party: IPartyData): IPolicy => {
  const score = party.risk;

  if (score >= 70)
    return {
      type: "Strict",
      maxDays: 30,
      pendingLimit: 20000,
      notes: "Severe overdue risk. High chance of default.",
      action: "Place account on hold. Send immediate final notice.",
    };

  if (score >= 35)
    return {
      type: "Moderate",
      maxDays: 60,
      pendingLimit: 50000,
      notes: "Some delay patterns observed. Monitor closely.",
      action: "Send automated 30-day reminder. Follow up personally.",
    };

  return {
    type: "Lenient",
    maxDays: 90,
    pendingLimit: 100000,
    notes: "Consistent payer. Low risk.",
    action: "No action needed. Standard credit terms apply.",
  };
};

export default function Credit() {
  const [purchase, setPurchase] = useState<IPartyData[]>([]);
  const [retail, setRetail] = useState<IPartyData[]>([]);
  const [wholesale, setWholesale] = useState<IPartyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<IPartyData | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PartyType | "All">("All");

  useEffect(() => {
    const loadCSV = (
      path: string,
      type: PartyType
    ): Promise<IPartyData[]> => {
      return new Promise((resolve) => {
        Papa.parse(path, {
          download: true,
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => {
            // Remove BOM, trim, and normalize multiple spaces to single space
            return header.replace(/^\uFEFF/, "").trim().replace(/\s+/g, " ");
          },
          complete: (result: ParseResult<Record<string, string>>) => {
            const processed = result.data
              .map((r: Record<string, string>) => {
                // Clean all keys - remove BOM, trim, normalize spaces
                const row: Record<string, string> = {};
                Object.keys(r).forEach((key) => {
                  if (!key) return;
                  const cleanKey = key.replace(/^\uFEFF/, "").trim().replace(/\s+/g, " ");
                  row[cleanKey] = r[key];
                });

                // Try to find party name with various common column names
                const partyName =
                  row["Party Name"] ||
                  row["Supplier Name"] ||
                  row["Customer Name"] ||
                  row["Party"] ||
                  row["Name"];

                const pending = parseFloat(row["Pending"] || "0");

                // Skip rows with no name OR no pending amount
                if (!partyName || !pending || pending === 0) {
                  return null;
                }

                const risk = computeRiskScore(row, pending);

                return {
                  ...row,
                  "Party Name": partyName.trim(),
                  "Pending": pending,
                  "Aging Bucket": row["Aging Bucket"] || "N/A",
                  risk: risk,
                  type: type,
                };
              })
              .filter((r): r is IPartyData => r !== null);

            resolve(processed);
          },
        });
      });
    };

    Promise.all([
      loadCSV("/credit_demo_data/PURCHASE_Aging_Payables.csv", "Payable"),
      loadCSV("/credit_demo_data/RETAIL_Aging_Receivables.csv", "Retail"),
      loadCSV("/credit_demo_data/WHOLESALE_Aging_Receivables.csv", "Wholesale"),
    ]).then(([purchaseData, retailData, wholesaleData]) => {
      setPurchase(purchaseData);
      setRetail(retailData);
      setWholesale(wholesaleData);
      setIsLoading(false);
    });
  }, []);

  const allData = useMemo(
    () => [...purchase, ...retail, ...wholesale],
    [purchase, retail, wholesale]
  );

  const filteredData = useMemo(() => {
    if (activeFilter === "Payable") {
      return purchase;
    }
    if (activeFilter === "Retail") {
      return retail;
    }
    if (activeFilter === "Wholesale") {
      return wholesale;
    }
    return allData;
  }, [activeFilter, purchase, retail, wholesale, allData]);

  const topStrict = useMemo(
    () => [...filteredData].sort((a, b) => b.risk - a.risk).slice(0, 5),
    [filteredData]
  );

  const topLenient = useMemo(
    () => [...filteredData].sort((a, b) => a.risk - b.risk).slice(0, 5),
    [filteredData]
  );

  const searchResults = useMemo(
    () =>
      filteredData.filter((r) =>
        r["Party Name"].toLowerCase().includes(search.trim().toLowerCase())
      ),
    [filteredData, search]
  );

  const openDrawer = (party: IPartyData) => {
    setSelectedParty(party);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedParty(null), 300);
  };

  return (
    <div className="space-y-16 pb-20">
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-bold text-white cursor-pointer hover:text-gray-300"
          onClick={() => setActiveFilter("All")}
        >
          Credit Intelligence
          {activeFilter !== "All" && (
            <span className="text-xl text-cyan-400 ml-3">
              | {activeFilter}
            </span>
          )}
        </h1>
        {activeFilter !== "All" && (
          <button
            onClick={() => setActiveFilter("All")}
            className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label="Clear filter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

        {isLoading ? (
          <KPISkeleton />
        ) : (
          <KPICards
            purchase={purchase}
            retail={retail}
            wholesale={wholesale}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        )}

        <SearchBar
          search={search}
          setSearch={setSearch}
          results={searchResults}
          openDrawer={openDrawer}
          disabled={isLoading}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : activeFilter === "All" ? (
          <>
            <Highlights
              topStrict={topStrict}
              topLenient={topLenient}
              openDrawer={openDrawer}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <ExposureChart rows={filteredData} />
              <RiskHeatmap rows={filteredData} />
            </div>
          </>
        ) : (
          <>
            <DataTable
              rows={filteredData.sort((a, b) => b.Pending - a.Pending)}
              openDrawer={openDrawer}
            />
          </>
        )}

      {drawerOpen && selectedParty && (
        <Drawer
          party={selectedParty}
          policy={getRecommendedPolicy(selectedParty)}
          close={closeDrawer}
        />
      )}
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <span className="px-2 py-1 text-xs font-medium text-red-100 bg-red-800/60 rounded-full">
        High
      </span>
    );
  }
  if (score >= 35) {
    return (
      <span className="px-2 py-1 text-xs font-medium text-amber-100 bg-amber-800/60 rounded-full">
        Medium
      </span>
    );
  }
  return (
    <span className="px-2 py-1 text-xs font-medium text-green-100 bg-green-800/60 rounded-full">
      Low
    </span>
  );
}

interface KPIProps {
  purchase: IPartyData[];
  retail: IPartyData[];
  wholesale: IPartyData[];
  activeFilter: PartyType | "All";
  setActiveFilter: (filter: PartyType | "All") => void;
}

function KPICards({
  purchase,
  retail,
  wholesale,
  activeFilter,
  setActiveFilter,
}: KPIProps) {
  const total = (d: IPartyData[]) =>
    d.reduce((sum, r) => sum + r.Pending, 0);

  const cards = [
    {
      label: "Total Payables",
      value: total(purchase),
      color: "from-red-900/30 to-red-900/40 border-red-500/50",
      filter: "Payable" as PartyType,
    },
    {
      label: "Retail Receivables",
      value: total(retail),
      color: "from-green-900/30 to-green-900/40 border-green-500/50",
      filter: "Retail" as PartyType,
    },
    {
      label: "Wholesale Receivables",
      value: total(wholesale),
      color: "from-green-800/30 to-green-800/40 border-green-400/50",
      filter: "Wholesale" as PartyType,
    },
  ];

  const handleCardClick = (filter: PartyType) => {
    if (activeFilter === filter) {
      setActiveFilter("All");
    } else {
      setActiveFilter(filter);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {cards.map((c) => (
        <div
          key={c.label}
          onClick={() => handleCardClick(c.filter)}
          className={`p-6 rounded-xl bg-gradient-to-br ${
            c.color
          } shadow-lg border backdrop-blur-xl cursor-pointer transition-all duration-200
          ${
            activeFilter === c.filter
              ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-black"
              : "border-transparent"
          }
          `}
        >
          <div className="text-white/70 text-sm">{c.label}</div>
          <div className="text-3xl font-bold text-white mt-1">
            ₹{c.value.toLocaleString("en-IN")}
          </div>
        </div>
      ))}
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-xl bg-white/10 border border-white/10 animate-pulse"
        >
          <div className="h-4 bg-gray-600 rounded w-1/3"></div>
          <div className="h-8 bg-gray-500 rounded w-1/2 mt-2"></div>
        </div>
      ))}
    </div>
  );
}

interface SearchProps {
  search: string;
  setSearch: (value: string) => void;
  results: IPartyData[];
  openDrawer: (party: IPartyData) => void;
  disabled: boolean;
}

function SearchBar({
  search,
  setSearch,
  results,
  openDrawer,
  disabled,
}: SearchProps) {
  return (
    <div className="relative max-w-xl">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search party name in current view..."
        disabled={disabled}
        className="w-full p-3 bg-white/5 text-white border border-white/10 rounded-lg backdrop-blur-lg disabled:opacity-50"
      />

      {search && (
        <div className="absolute bg-black/90 border border-white/10 rounded-lg w-full mt-2 py-2 max-h-64 overflow-auto z-20">
          {results.length > 0 ? (
            results.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  openDrawer(r);
                  setSearch("");
                }}
                className="px-3 py-2 hover:bg-white/10 cursor-pointer text-white"
              >
                {r["Party Name"]}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-white/50">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}

interface HighlightsProps {
  topStrict: IPartyData[];
  topLenient: IPartyData[];
  openDrawer: (party: IPartyData) => void;
}

function Highlights({ topStrict, topLenient, openDrawer }: HighlightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="p-6 bg-red-900/30 border border-red-500/50 rounded-xl backdrop-blur-lg">
        <h2 className="text-xl font-semibold text-red-300">
          Top 5 High Risk
        </h2>
        <div className="mt-4 space-y-3">
          {topStrict.map((p, i) => (
            <div
              key={i}
              onClick={() => openDrawer(p)}
              className="p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10"
            >
              <p className="text-white font-medium">{p["Party Name"]}</p>
              <p className="text-white/70 text-sm">
                Pending: ₹{p.Pending.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-green-900/30 border border-green-500/50 rounded-xl backdrop-blur-lg">
        <h2 className="text-xl font-semibold text-green-300">Top 5 Low Risk</h2>
        <div className="mt-4 space-y-3">
          {topLenient.map((p, i) => (
            <div
              key={i}
              onClick={() => openDrawer(p)}
              className="p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10"
            >
              <p className="text-white font-medium">{p["Party Name"]}</p>
              <p className="text-white/70 text-sm">
                Pending: ₹{p.Pending.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DataTableProps {
  rows: IPartyData[];
  openDrawer: (party: IPartyData) => void;
}

function DataTable({ rows, openDrawer }: DataTableProps) {
  if (!rows.length)
    return <p className="text-white/70">No data available for this filter.</p>;

  const headers = ["Party Name", "Pending", "Aging Bucket", "Risk"];

  return (
    <div className="overflow-auto border border-white/10 rounded-xl bg-white/5 backdrop-blur-lg">
      <table className="w-full min-w-[700px] text-left text-white">
        <thead className="bg-white/10 text-white/80">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3 capitalize whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => openDrawer(row)}
              className="border-t border-white/10 hover:bg-white/10 cursor-pointer"
            >
              <td className="p-3 whitespace-nowrap">{row["Party Name"]}</td>
              <td className="p-3 whitespace-nowrap font-medium">
                ₹{row.Pending.toLocaleString("en-IN")}
              </td>
              <td className="p-3 whitespace-nowrap">{row["Aging Bucket"]}</td>
              <td className="p-3 whitespace-nowrap">
                <RiskBadge score={row.risk} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-auto border border-white/10 rounded-xl bg-white/5 animate-pulse">
      <table className="w-full min-w-[800px] text-left text-white">
        <thead className="bg-white/10 text-white/80">
          <tr>
            {[...Array(5)].map((_, i) => (
              <th key={i} className="p-3">
                <div className="h-4 bg-gray-600 rounded w-1/3"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(7)].map((_, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="p-3">
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-600 rounded w-1/3"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-600 rounded w-1/4"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DrawerProps {
  party: IPartyData;
  policy: IPolicy;
  close: () => void;
}

function Drawer({ party, policy, close }: DrawerProps) {
  const policyColor =
    policy.type === "Strict"
      ? "text-red-300"
      : policy.type === "Moderate"
      ? "text-amber-300"
      : "text-green-300";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-end z-50"
      onClick={close}
    >
      <div
        className="w-full max-w-md h-full bg-black border-l border-white/10 p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="text-white/70 hover:text-white text-sm mb-4"
        >
          &larr; Close
        </button>

        <h2 className="text-2xl font-semibold text-white">
          {party["Party Name"]}
        </h2>
        <span
          className={`text-sm ${
            party.type === "Payable" ? "text-blue-300" : "text-purple-300"
          }`}
        >
          {party.type} ({party["Aging Bucket"]})
        </span>

        <div className="mt-6 space-y-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/70 text-sm">Pending</p>
            <p className="text-2xl text-white font-semibold">
              ₹{party.Pending.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/70 text-sm">Risk Level</p>
            <div className="text-xl text-white font-semibold flex items-center space-x-2 mt-1">
              <RiskBadge score={party.risk} />
              <span>(Score: {party.risk})</span>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/70 text-sm">Recommended Policy</p>
            <p className={`text-xl font-bold ${policyColor}`}>
              {policy.type} Policy
            </p>
            <p className="text-white/80 mt-1">{policy.notes}</p>

            <div className="mt-3 text-white/80 space-y-1">
              <p>Max Credit Days: {policy.maxDays}</p>
              <p>Pending Limit: ₹{policy.pendingLimit.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              policy.type === "Strict"
                ? "bg-red-900/30 border-red-500/50"
                : policy.type === "Moderate"
                ? "bg-amber-900/30 border-amber-500/50"
                : "bg-green-900/30 border-green-500/50"
            }`}
          >
            <p className={`font-semibold ${policyColor}`}>Suggested Action</p>
            <p className="text-white/80 mt-1">{policy.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExposureChart({ rows }: { rows: IPartyData[] }) {
  const exposure = [...rows]
    .sort((a, b) => b.Pending - a.Pending)
    .slice(0, 10)
    .map((r) => ({
      name: r["Party Name"],
      amount: r.Pending,
    }));

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-lg">
      <h2 className="text-lg text-white font-semibold mb-4">
        Top 10 Credit Exposure
      </h2>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={exposure}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis
              type="number"
              stroke="#a1a1aa"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              tickFormatter={(value) =>
                value >= 1000 ? `${value / 1000}k` : value
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#a1a1aa"
              axisLine={false}
              tickLine={false}
              width={150}
              tick={{ fontSize: 12, fill: "#e5e5ef", textAnchor: "end" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [
                `₹${value.toLocaleString("en-IN")}`,
                "Pending",
              ]}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {exposure.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={MUTED_COLORS[i % MUTED_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskHeatmap({ rows }: { rows: IPartyData[] }) {
  const heat = rows
    .map((r) => ({
      name: r["Party Name"],
      pending: r.Pending,
      risk: r.risk,
      intensity: Math.min(
        1,
        (r.risk / 100) * 0.6 + (Math.min(1, r.Pending / 250000)) * 0.4
      ),
    }))
    .sort((a, b) => b.intensity - a.intensity);

  const getHeatmapColor = (intensity: number) => {
    // High risk: red shades
    if (intensity > 0.7) {
      return {
        background: `rgba(239, 68, 68, ${0.3 + intensity * 0.4})`,
        border: `rgba(239, 68, 68, ${0.5 + intensity * 0.5})`,
      };
    }
    // Medium risk: amber/orange shades
    if (intensity > 0.4) {
      return {
        background: `rgba(251, 146, 60, ${0.25 + intensity * 0.35})`,
        border: `rgba(251, 146, 60, ${0.4 + intensity * 0.4})`,
      };
    }
    // Low risk: green shades
    return {
      background: `rgba(34, 197, 94, ${0.2 + intensity * 0.3})`,
      border: `rgba(34, 197, 94, ${0.3 + intensity * 0.4})`,
    };
  };

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-lg">
      <h2 className="text-lg text-white font-semibold mb-4">Risk Heatmap</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {heat.slice(0, 20).map((h, i) => {
          const colors = getHeatmapColor(h.intensity);
          return (
            <div
              key={i}
              className="p-3 rounded-lg border transition-all duration-200 hover:scale-105"
              style={{
                background: colors.background,
                borderColor: colors.border,
              }}
            >
              <p className="text-white text-sm font-medium truncate">{h.name}</p>
              <p className="text-white/90 text-xs">
                ₹{h.pending.toLocaleString("en-IN")}
              </p>
              <p className="text-white/90 text-xs font-semibold">Risk: {h.risk}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}