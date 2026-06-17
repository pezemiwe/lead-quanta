import { useNavigate, useParams } from "react-router-dom";
import { usePersona } from "../../context/persona";
import {
  LayoutDashboard,
  Briefcase,
  SlidersHorizontal,
  TrendingUp,
  FileText,
  Database,
  PieChart,
  Calendar,
} from "lucide-react";
import { Logo } from "../../components/shared/logo";
import { UserMenu } from "../../components/shared/user-menu";

import { ValuationProvider } from "./store";
import { ValuationDataManager } from "./pages/data-manager";
import { ValuationOverview } from "./pages/overview";
import { ValuationInventory } from "./pages/inventory";
import { ValuationAssumptions } from "./pages/assumptions";
import { ValuationResults } from "./pages/results";
import { ValuationMaturity } from "./pages/maturity";
import { ValuationIncome } from "./pages/income";
import { ValuationReports } from "./pages/reports";
import { ValuationAssetDetail } from "./pages/asset-detail";

export type ValuationPage =
  | "data-manager"
  | "overview"
  | "inventory"
  | "results"
  | "maturity"
  | "income"
  | "assumptions"
  | "reports"
  | "asset-detail";

const NAV: {
  id: ValuationPage;
  label: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "portfolio",
  },
  {
    id: "inventory",
    label: "Asset Inventory",
    icon: <Briefcase className="h-4 w-4" />,
    group: "portfolio",
  },
  {
    id: "results",
    label: "Breakdown",
    icon: <PieChart className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "maturity",
    label: "Maturity Profile",
    icon: <Calendar className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "income",
    label: "Income & P&L",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "assumptions",
    label: "Assumptions",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    group: "settings",
  },
  {
    id: "data-manager",
    label: "Data Manager",
    icon: <Database className="h-4 w-4" />,
    group: "settings",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="h-4 w-4" />,
    group: "settings",
  },
];

const GROUPS: Record<string, string> = {
  portfolio: "Portfolio",
  analytics: "Analytics",
  settings: "Operations",
};

function PageBody({ page }: { page: ValuationPage }) {
  switch (page) {
    case "data-manager":
      return <ValuationDataManager />;
    case "overview":
      return <ValuationOverview />;
    case "inventory":
      return <ValuationInventory />;
    case "results":
      return <ValuationResults />;
    case "maturity":
      return <ValuationMaturity />;
    case "income":
      return <ValuationIncome />;
    case "assumptions":
      return <ValuationAssumptions />;
    case "reports":
      return <ValuationReports />;
    case "asset-detail":
      return <ValuationAssetDetail />;
  }
}

export function ValuationModule() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const { page: pageParam, id } = useParams<{ page?: string; id?: string }>();

  const page: ValuationPage = id
    ? "asset-detail"
    : ((pageParam ?? "overview") as ValuationPage);

  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    groupLabel: label,
    items: NAV.filter((n) => n.group === key),
  }));

  return (
    <ValuationProvider>
      <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
          <div className="flex items-center gap-3">
            <Logo collapsed />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-semibold text-dark-gray">
              Valuation Engine
            </span>
            <span className="ml-2 hidden rounded-full bg-pale-red px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
              Fixed Income
            </span>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu
              persona={persona}
              onSwitchModules={() => navigate("/modules")}
              onLogout={() => {
                setPersona({ name: "", role: "", avatar: "" });
                navigate("/");
              }}
            />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
            <nav className="flex-1 py-4">
              {grouped.map(({ groupLabel, items }) => (
                <div key={groupLabel} className="mb-5">
                  <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-gray-300">
                    {groupLabel}
                  </p>
                  {items.map((item) => {
                    const active =
                      page === item.id ||
                      (page === "asset-detail" && item.id === "inventory");
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/valuation/${item.id}`)}
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

          <main className="min-w-0 flex-1 overflow-y-auto">
            <PageBody page={page} />
          </main>
        </div>
      </div>
    </ValuationProvider>
  );
}
