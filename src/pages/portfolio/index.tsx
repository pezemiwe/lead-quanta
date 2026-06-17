import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  PieChart,
  TrendingUp,
  ShieldAlert,
  ArrowLeftRight,
  FileText,
  Settings,
} from "lucide-react";
import { Logo } from "../../components/shared/logo";
import { UserMenu } from "../../components/shared/user-menu";

/* ─── page imports ──────────────────────────────────────── */
import { PortfolioDashboard } from "./pages/Dashboard";
import { PortfolioHoldings } from "./pages/Holdings";
import { AssetAllocation } from "./pages/AssetAllocation";
import { PerformanceAnalytics } from "./pages/Performance";
import { RiskAnalytics } from "./pages/Risk";
import { Transactions } from "./pages/Transactions";
import { Reports } from "./pages/Reports";
import { ModuleSettings } from "./pages/ModuleSettings";

/* ─── types ──────────────────────────────────────────────── */
export type PortfolioPage =
  | "dashboard"
  | "holdings"
  | "allocation"
  | "performance"
  | "risk"
  | "transactions"
  | "reports"
  | "settings";

interface Props {
  persona: { name: string; role: string; avatar: string };
  onBack: () => void;
  onLogout: () => void;
}

/* ─── nav items ──────────────────────────────────────────── */
const NAV: {
  id: PortfolioPage;
  label: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "holdings",
    label: "Holdings",
    icon: <Briefcase className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "allocation",
    label: "Asset Allocation",
    icon: <PieChart className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "performance",
    label: "Performance",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "risk",
    label: "Risk Analytics",
    icon: <ShieldAlert className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    group: "operations",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="h-4 w-4" />,
    group: "operations",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
    group: "system",
  },
];

const GROUPS: Record<string, string> = {
  main: "Overview",
  analytics: "Analytics",
  operations: "Operations",
  system: "System",
};

/* ─── component ──────────────────────────────────────────── */
export function PortfolioModule({ persona, onBack, onLogout }: Props) {
  const [page, setPage] = useState<PortfolioPage>("dashboard");

  function renderPage() {
    switch (page) {
      case "dashboard":
        return <PortfolioDashboard persona={persona} />;
      case "holdings":
        return <PortfolioHoldings />;
      case "allocation":
        return <AssetAllocation />;
      case "performance":
        return <PerformanceAnalytics />;
      case "risk":
        return <RiskAnalytics />;
      case "transactions":
        return <Transactions />;
      case "reports":
        return <Reports />;
      case "settings":
        return <ModuleSettings />;
    }
  }

  /* group nav items */
  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    groupLabel: label,
    items: NAV.filter((n) => n.group === key),
  }));

  return (
    <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
      {/* ── top header ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
        {/* left: logo + breadcrumb */}
        <div className="flex items-center gap-3">
          <Logo collapsed />
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-semibold text-dark-gray">
            Portfolio Management
          </span>
        </div>

        {/* right: user pill + sign out */}
        <div className="flex items-center gap-3">
          <UserMenu
            persona={persona}
            onSwitchModules={onBack}
            onLogout={onLogout}
          />
        </div>
      </header>

      {/* ── body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
          <nav className="flex-1 py-4">
            {grouped.map(({ groupLabel, items }) => (
              <div key={groupLabel} className="mb-5">
                <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-gray-300">
                  {groupLabel}
                </p>
                {items.map((item) => {
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPage(item.id)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? "border-r-2 border-primary bg-pale-red font-medium text-primary"
                          : "text-gray-500 hover:bg-gray-50 hover:text-dark-gray"
                      }`}
                    >
                      <span
                        className={`shrink-0 ${active ? "text-primary" : ""}`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* main content */}
        <main className="min-w-0 flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
