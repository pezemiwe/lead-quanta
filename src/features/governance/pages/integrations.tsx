import { useState } from "react";
import {
  Activity,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { Badge } from "../../../components/shared/badge";

interface Integration {
  id: string;
  name: string;
  category:
    | "market-data"
    | "erp-gl"
    | "insurance"
    | "actuarial"
    | "settlement"
    | "regulatory"
    | "upload"
    | "api";
  vendor: string;
  description: string;
  status: "active" | "configured" | "scheduled" | "available" | "error";
  lastSync: string;
  syncFrequency: string;
  dataFlows: string[];
  endpoint?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "int001",
    name: "Bloomberg Terminal",
    category: "market-data",
    vendor: "Bloomberg L.P.",
    description:
      "Real-time bond prices, yield curves, credit ratings and market analytics feeds via Bloomberg API.",
    status: "active",
    lastSync: "Today 09:32",
    syncFrequency: "Real-time",
    dataFlows: [
      "Bond/bill prices",
      "Yield curve data",
      "Credit ratings",
      "FX rates",
    ],
    endpoint: "https://api.bloomberg.com/eap/",
  },
  {
    id: "int002",
    name: "Reuters / Refinitiv Eikon",
    category: "market-data",
    vendor: "Refinitiv (LSEG)",
    description:
      "Market data for bond pricing, equity indices, and macro-economic indicators via Refinitiv Data API.",
    status: "active",
    lastSync: "Today 09:32",
    syncFrequency: "Real-time",
    dataFlows: [
      "NSE/NGX equity prices",
      "Government bond yields",
      "Commodity indices",
      "Macro overlays",
    ],
  },
  {
    id: "int003",
    name: "CBN FMDQ Oracle",
    category: "market-data",
    vendor: "FMDQ Group",
    description:
      "Nigerian fixed income market yields, benchmark rates and money market data direct from FMDQ.",
    status: "active",
    lastSync: "Today 08:00",
    syncFrequency: "Daily (08:00)",
    dataFlows: [
      "FGN bond benchmark yields",
      "T-Bill stop rates",
      "NIBOR overnight rate",
      "FMDQ Secondary market data",
    ],
  },
  {
    id: "int004",
    name: "SAP S/4HANA (ERP/GL)",
    category: "erp-gl",
    vendor: "SAP SE",
    description:
      "Automated journal entry posting, GL code mapping, and financial statement reconciliation via SAP BAPI.",
    status: "configured",
    lastSync: "Yesterday 18:00",
    syncFrequency: "Daily batch (18:00)",
    dataFlows: [
      "Investment journal entries",
      "Coupon accruals",
      "Fair value adjustments",
      "Impairment charges",
    ],
    endpoint: "https://sap.leadwayholdings.com:8443/sap/",
  },
  {
    id: "int005",
    name: "Oracle Financials (Secondary GL)",
    category: "erp-gl",
    vendor: "Oracle Corp.",
    description:
      "Secondary GL integration for subsidiary entities using Oracle Fusion Financials.",
    status: "available",
    lastSync: "Not configured",
    syncFrequency: "On-demand",
    dataFlows: ["Inter-company eliminations", "Consolidated GL postings"],
  },
  {
    id: "int006",
    name: "Core Insurance System (Keyman)",
    category: "insurance",
    vendor: "Leadway Assurance",
    description:
      "Policy liability data, reserves, and actuarial assumptions feed from the core insurance policy admin system.",
    status: "configured",
    lastSync: "28 May 2026 23:00",
    syncFrequency: "Nightly batch",
    dataFlows: [
      "Policy liability totals by class",
      "Reserve estimates",
      "Premium income flows",
      "Claims outstanding",
    ],
    endpoint: "https://keyman.leadway.com/api/v2/",
  },
  {
    id: "int007",
    name: "Actuarial Models (Prophet)",
    category: "actuarial",
    vendor: "FIS / Moody's Analytics",
    description:
      "ALM liability benchmarks, duration matching targets, and projected liability cash flows from Prophet actuarial engine.",
    status: "scheduled",
    lastSync: "23 May 2026 (weekly)",
    syncFrequency: "Weekly (Friday 22:00)",
    dataFlows: [
      "Liability duration profile",
      "Asset-liability matching targets",
      "Projected liability CFs",
      "Solvency II SCR estimates",
    ],
  },
  {
    id: "int008",
    name: "Custodian — FirstBank Trustees",
    category: "settlement",
    vendor: "First Bank of Nigeria",
    description:
      "Securities custody, settlement confirmation, corporate action notices, and portfolio position reconciliation.",
    status: "active",
    lastSync: "Today 10:15",
    syncFrequency: "Real-time / T+1",
    dataFlows: [
      "Settlement confirmations",
      "Corporate action notices",
      "Custody position statement",
      "Dividend receipts",
    ],
    endpoint: "wss://custody.firstbank.com.ng/ws/",
  },
  {
    id: "int009",
    name: "Banking Platform — Access Bank",
    category: "settlement",
    vendor: "Access Bank Plc",
    description:
      "Settlement instruction transmission and intraday liquidity management for NGN and USD transactions.",
    status: "active",
    lastSync: "Today 09:45",
    syncFrequency: "Real-time",
    dataFlows: [
      "Payment instructions",
      "Settlement confirmations",
      "Account balances",
      "SWIFT MT103/MT202",
    ],
  },
  {
    id: "int010",
    name: "Banking Platform — Zenith Bank",
    category: "settlement",
    vendor: "Zenith Bank Plc",
    description:
      "Secondary settlement bank for backup settlement and large-value fund transfers.",
    status: "active",
    lastSync: "Today 09:45",
    syncFrequency: "Real-time",
    dataFlows: [
      "Large-value payment instructions",
      "FX purchase/sale settlements",
      "Call money placements",
    ],
  },
  {
    id: "int011",
    name: "CBN / PENCOM Regulatory API",
    category: "regulatory",
    vendor: "CBN / PENCOM",
    description:
      "Automated submission of regulatory investment returns and compliance data to CBN and PENCOM portals.",
    status: "configured",
    lastSync: "29 May 2026 (monthly)",
    syncFrequency: "Monthly / Quarterly",
    dataFlows: [
      "CBN Form A investment return",
      "PENCOM quarterly investment schedule",
      "NAICOM regulatory submissions",
    ],
    endpoint: "https://api.cbn.gov.ng/regulatoryreturns/",
  },
  {
    id: "int012",
    name: "Microsoft Excel Upload",
    category: "upload",
    vendor: "Microsoft Corp.",
    description:
      "Bulk instrument data ingestion, manual override entry, and template-based historical data loading.",
    status: "active",
    lastSync: "28 May 2026 (last upload)",
    syncFrequency: "On-demand",
    dataFlows: [
      "Bulk instrument master data",
      "Historical market prices",
      "Manual credit rating parameters",
      "Counterparty static data",
    ],
  },
  {
    id: "int013",
    name: "SWIFT Network",
    category: "settlement",
    vendor: "SWIFT (SCRL)",
    description:
      "Cross-border settlement and correspondent banking instructions for foreign currency investments via SWIFT gpi.",
    status: "configured",
    lastSync: "On-demand (last: 15 May 2026)",
    syncFrequency: "On-demand",
    dataFlows: [
      "MT101 payment instructions",
      "MT548 settlement status",
      "MT950 statement messages",
    ],
  },
  {
    id: "int014",
    name: "REST API Gateway",
    category: "api",
    vendor: "Leadway Holdings IT",
    description:
      "Outbound REST API for third-party data consumers. Provides read access to portfolio analytics, valuation results, and market data.",
    status: "active",
    lastSync: "Continuously available",
    syncFrequency: "On-demand",
    dataFlows: [
      "Portfolio analytics data",
      "Valuation and credit quality results",
      "Valuation outputs",
      "Market data feeds",
    ],
    endpoint: "https://api.leadwayholdings.com/quanta/v1/",
  },
];

const CATEGORY_LABELS: Record<Integration["category"], string> = {
  "market-data": "Market Data",
  "erp-gl": "ERP / GL",
  insurance: "Insurance Core",
  actuarial: "Actuarial",
  settlement: "Settlement & Banking",
  regulatory: "Regulatory",
  upload: "File Uploads",
  api: "API / Outbound",
};

const STATUS_META = {
  active: {
    label: "Active",
    bg: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  configured: {
    label: "Configured",
    bg: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
  },
  available: {
    label: "Available",
    bg: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  error: { label: "Error", bg: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

type FilterType = "all" | Integration["category"];
const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "market-data", label: "Market Data" },
  { key: "erp-gl", label: "ERP / GL" },
  { key: "insurance", label: "Insurance" },
  { key: "actuarial", label: "Actuarial" },
  { key: "settlement", label: "Settlement" },
  { key: "regulatory", label: "Regulatory" },
  { key: "upload", label: "Uploads" },
  { key: "api", label: "API" },
];

export function ExternalIntegrations() {
  const [catFilter, setCatFilter] = useState<FilterType>("all");
  const [syncing, setSyncing] = useState<string | null>(null);

  const displayed =
    catFilter === "all"
      ? INTEGRATIONS
      : INTEGRATIONS.filter((i) => i.category === catFilter);
  const activeCount = INTEGRATIONS.filter((i) => i.status === "active").length;
  const configuredCount = INTEGRATIONS.filter(
    (i) => i.status === "configured",
  ).length;

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 2000);
  };

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          External Integrations
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          System connectivity status — market data feeds, ERP/GL, insurance,
          actuarial, banking & custodian platforms
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Integrations"
          value={String(INTEGRATIONS.length)}
          subtitle="Configured and available"
          variant="highlight"
        />
        <StatCard
          title="Active / Live"
          value={String(activeCount)}
          subtitle="Currently connected"
          variant="default"
        />
        <StatCard
          title="Configured"
          value={String(configuredCount)}
          subtitle="Batch / scheduled"
          variant="default"
        />
        <StatCard
          title="Available"
          value={String(
            INTEGRATIONS.filter((i) => i.status === "available").length,
          )}
          subtitle="Ready to configure"
          variant="default"
        />
      </StatCardGrid>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.key}
            onClick={() => setCatFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              catFilter === f.key
                ? "bg-primary text-white"
                : "border border-border bg-surface text-dark-gray/70 hover:bg-pale-red hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {displayed.map((int) => {
          const sm = STATUS_META[int.status];
          const isSyncing = syncing === int.id;
          return (
            <div
              key={int.id}
              className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
                int.status === "error"
                  ? "border-red-200 bg-red-50/20"
                  : int.status === "active"
                    ? "border-emerald-200 bg-surface"
                    : "border-border bg-surface"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-dark-gray">
                      {int.name}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sm.bg}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${sm.dot} ${isSyncing ? "animate-pulse" : ""}`}
                      />
                      {isSyncing ? "Syncing…" : sm.label}
                    </span>
                  </div>
                  <p className="text-xs text-dark-gray/50 mt-0.5">
                    {int.vendor} · {CATEGORY_LABELS[int.category]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {int.status === "active" || int.status === "configured" ? (
                    <button
                      onClick={() => handleSync(int.id)}
                      className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-dark-gray/70 hover:bg-pale-red hover:text-primary transition-colors"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
                      />
                      Sync
                    </button>
                  ) : (
                    <button className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-dark-gray/70 hover:bg-pale-red hover:text-primary transition-colors">
                      Configure
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-dark-gray/60 mb-3">
                {int.description}
              </p>

              {/* Data flows */}
              <div className="mb-3">
                <p className="text-xs font-medium text-dark-gray/50 mb-1.5">
                  Data Flows
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {int.dataFlows.map((d) => (
                    <span
                      key={d}
                      className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-dark-gray/70"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-dark-gray/40 pt-2 border-t border-border">
                <span>
                  Last sync:{" "}
                  <span className="text-dark-gray/60">{int.lastSync}</span>
                </span>
                <span>
                  Frequency:{" "}
                  <span className="text-dark-gray/60">{int.syncFrequency}</span>
                </span>
              </div>
              {int.endpoint && (
                <p className="mt-1.5 font-mono text-xs text-dark-gray/30 truncate">
                  {int.endpoint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
