import { useNavigate, useParams } from "react-router-dom";
import { usePersona } from "../../context/persona";
import {
  LayoutDashboard,
  Briefcase,
  PieChart,
  TrendingUp,
  ShieldAlert,
  ArrowLeftRight,
  FileText,
  KanbanSquare,
  ClipboardList,
  Bell,
  BookOpen,
} from "lucide-react";
import { Logo } from "../../components/shared/logo";
import { UserMenu } from "../../components/shared/user-menu";

import { PortfolioProvider, usePortfolio } from "./store";
import { PortfolioDashboard } from "./pages/dashboard";
import { PortfolioHoldings } from "./pages/holdings";
import { PortfolioAllocation } from "./pages/allocation";
import { PortfolioPerformance } from "./pages/performance";
import { PortfolioRisk } from "./pages/risk";
import { PortfolioTransactions } from "./pages/transactions";
import { PortfolioReports } from "./pages/reports";
import { PortfolioPipeline } from "./pages/pipeline";
import { PortfolioTasks } from "./pages/tasks";
import { PortfolioBooks } from "./pages/portfolio-books";

export type PortfolioPage =
  | "dashboard"
  | "holdings"
  | "pipeline"
  | "allocation"
  | "performance"
  | "risk"
  | "transactions"
  | "tasks"
  | "reports"
  | "portfolios";

interface Props {
  persona: { name: string; role: string; avatar: string };
  onBack: () => void;
  onLogout: () => void;
}

const NAV: {
  id: PortfolioPage;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  {
    id: "dashboard",
    label: "My Portfolio",
    tooltip:
      "Assets I oversee. KPI trends, valuation, and performance vs. budget.",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "holdings",
    label: "Holdings",
    tooltip:
      "Full position-level breakdown with search, filter, and detail panel.",
    icon: <Briefcase className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "portfolios",
    label: "Portfolio Books",
    tooltip:
      "Register, configure and manage named portfolio books used across modules.",
    icon: <BookOpen className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "pipeline",
    label: "Investment Pipeline",
    tooltip:
      "Deals under evaluation, due diligence tracker, and scenario models.",
    icon: <KanbanSquare className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "allocation",
    label: "Asset Allocation",
    tooltip:
      "Class, sector, geography, and currency exposure with drift alerts.",
    icon: <PieChart className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "performance",
    label: "Performance Analytics",
    tooltip: "Deep dive into returns, attribution, and risk-adjusted metrics.",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "risk",
    label: "Risk Management",
    tooltip: "VaR, concentration limits, stress tests, and limit monitoring.",
    icon: <ShieldAlert className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "transactions",
    label: "Transactions",
    tooltip: "Full transaction log with filters and new transaction entry.",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    group: "operations",
  },
  {
    id: "tasks",
    label: "Tasks",
    tooltip:
      "Requests from Group Executives, data queries from Finance, and commentary deadlines.",
    icon: <ClipboardList className="h-4 w-4" />,
    group: "operations",
  },
  {
    id: "reports",
    label: "Reports",
    tooltip:
      "Portfolio summaries, board contributions, and regulatory filings.",
    icon: <FileText className="h-4 w-4" />,
    group: "operations",
  },
];

const GROUPS: Record<string, string> = {
  main: "Overview",
  analytics: "Analytics",
  operations: "Operations",
};

/* Watchlist badge — rendered inside PortfolioProvider */
function WatchlistFooter({ onFilter }: { onFilter: () => void }) {
  const { holdings } = usePortfolio();
  const alertCount = holdings.filter((h) => h.ytdReturn < 0).length;
  if (alertCount === 0) return null;
  return (
    <div className="border-t border-border px-4 py-3">
      <button
        onClick={onFilter}
        className="flex w-full items-center gap-2 text-xs text-gray-500 hover:text-primary"
        title="Show holdings with negative YTD return"
      >
        <Bell className="h-3.5 w-3.5" />
        <span>Watchlist Alerts</span>
        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-white">
          {alertCount}
        </span>
      </button>
    </div>
  );
}

function PageBody({
  page,
  persona,
}: {
  page: PortfolioPage;
  persona: Props["persona"];
}) {
  switch (page) {
    case "dashboard":
      return <PortfolioDashboard persona={persona} />;
    case "holdings":
      return <PortfolioHoldings />;
    case "allocation":
      return <PortfolioAllocation />;
    case "performance":
      return <PortfolioPerformance />;
    case "risk":
      return <PortfolioRisk />;
    case "transactions":
      return <PortfolioTransactions />;
    case "pipeline":
      return <PortfolioPipeline />;
    case "tasks":
      return <PortfolioTasks />;
    case "reports":
      return <PortfolioReports />;
    case "portfolios":
      return <PortfolioBooks />;
  }
}

export function PortfolioModule() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "dashboard") as PortfolioPage;

  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    groupLabel: label,
    items: NAV.filter((n) => n.group === key),
  }));

  return (
    <PortfolioProvider>
      <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
        {/* top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
          <div className="flex items-center gap-3">
            <Logo collapsed />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-semibold text-dark-gray">
              Portfolio Management
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

        {/* body */}
        <div className="flex flex-1 overflow-hidden">
          {/* sidebar */}
          <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
            {/* cycle status */}
            <div className="px-4 py-3 border-b border-border">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                May 2026 · Active
              </span>
            </div>
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
                        onClick={() => navigate(`/portfolio/${item.id}`)}
                        title={item.tooltip}
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
            <WatchlistFooter onFilter={() => navigate("/portfolio/holdings")} />
          </aside>

          {/* main content */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <PageBody page={page} persona={persona} />
          </main>
        </div>
      </div>
    </PortfolioProvider>
  );
}
