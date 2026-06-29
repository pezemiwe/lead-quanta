import { useNavigate, useParams } from "react-router-dom";
import { usePersona } from "../../context/persona";
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  Database,
  Scale,
  Layers,
  Zap,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Logo } from "../../components/shared/logo";
import { UserMenu } from "../../components/shared/user-menu";

import { DurationRiskProvider } from "./store";
import { DurationRiskDataManager } from "./pages/data-manager";
import { DurationRiskDashboard } from "./pages/dashboard";
import { DurationRiskTable } from "./pages/duration-table";
import { DurationRiskStressTest } from "./pages/stress-test";
import { DurationRiskScenarios } from "./pages/scenarios";
import { DurationRiskALMGap } from "./pages/alm-gap";
import { DurationRiskBySector } from "./pages/by-sector";
import { DurationRiskLiabilities } from "./pages/liabilities";
import { DurationRiskAssetDetail } from "./pages/asset-detail";
import { DurationRiskConvexity } from "./pages/convexity";

export type DurationRiskPage =
  | "data-manager"
  | "dashboard"
  | "duration-table"
  | "stress-test"
  | "scenarios"
  | "by-sector"
  | "convexity"
  | "alm-gap"
  | "liabilities"
  | "asset-detail";

const NAV: {
  id: DurationRiskPage;
  label: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "risk",
  },
  {
    id: "duration-table",
    label: "Duration Table",
    icon: <Briefcase className="h-4 w-4" />,
    group: "risk",
  },
  {
    id: "stress-test",
    label: "Stress Test",
    icon: <Zap className="h-4 w-4" />,
    group: "risk",
  },
  {
    id: "scenarios",
    label: "Scenarios",
    icon: <AlertTriangle className="h-4 w-4" />,
    group: "risk",
  },
  {
    id: "by-sector",
    label: "By Sector / Type",
    icon: <Layers className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "convexity",
    label: "Convexity Curve",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "alm-gap",
    label: "ALM Gap",
    icon: <Scale className="h-4 w-4" />,
    group: "alm",
  },
  {
    id: "data-manager",
    label: "Data Manager",
    icon: <Database className="h-4 w-4" />,
    group: "alm",
  },
  {
    id: "liabilities",
    label: "Liabilities",
    icon: <Activity className="h-4 w-4" />,
    group: "alm",
  },
];

const GROUPS: Record<string, string> = {
  risk: "Interest Rate Risk",
  analytics: "Analytics",
  alm: "ALM",
};

function PageBody({ page }: { page: DurationRiskPage }) {
  switch (page) {
    case "data-manager":
      return <DurationRiskDataManager />;
    case "dashboard":
      return <DurationRiskDashboard />;
    case "duration-table":
      return <DurationRiskTable />;
    case "stress-test":
      return <DurationRiskStressTest />;
    case "scenarios":
      return <DurationRiskScenarios />;
    case "by-sector":
      return <DurationRiskBySector />;
    case "convexity":
      return <DurationRiskConvexity />;
    case "alm-gap":
      return <DurationRiskALMGap />;
    case "liabilities":
      return <DurationRiskLiabilities />;
    case "asset-detail":
      return <DurationRiskAssetDetail />;
  }
}

export function DurationRiskModule() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const { page: pageParam, id } = useParams<{ page?: string; id?: string }>();

  const page: DurationRiskPage = id
    ? "asset-detail"
    : ((pageParam ?? "dashboard") as DurationRiskPage);

  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    groupLabel: label,
    items: NAV.filter((n) => n.group === key),
  }));

  return (
    <DurationRiskProvider>
      <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
          <div className="flex items-center gap-3">
            <Logo collapsed />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-semibold text-dark-gray">
              Duration &amp; Risk Analytics
            </span>
            <span className="ml-2 hidden rounded-full bg-pale-red px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
              Interest Rate Risk
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
                      (page === "asset-detail" && item.id === "duration-table");
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/duration-risk/${item.id}`)}
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
    </DurationRiskProvider>
  );
}
