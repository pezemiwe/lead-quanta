import { useNavigate, useParams } from "react-router-dom";
import { usePersona } from "../../context/persona";
import {
  LayoutDashboard,
  Briefcase,
  SlidersHorizontal,
  Layers3,
  TrendingDown,
  FileText,
  Calculator,
  Database,
  Eye,
} from "lucide-react";
import { Logo } from "../../components/shared/logo";
import { UserMenu } from "../../components/shared/user-menu";

import { IFRS9Provider } from "./store";
import { IFRS9DataManager } from "./pages/data-manager";
import { IFRS9Overview } from "./pages/overview";
import { IFRS9Portfolio } from "./pages/portfolio";
import { IFRS9Assumptions } from "./pages/assumptions";
import { IFRS9Staging } from "./pages/staging";
import { IFRS9PDTables } from "./pages/pd-tables";
import { IFRS9ECLResults } from "./pages/ecl-results";
import { IFRS9Reports } from "./pages/reports";
import { IFRS9Watchlist } from "./pages/watchlist";

export type IFRS9Page =
  | "data-manager"
  | "overview"
  | "portfolio"
  | "assumptions"
  | "staging"
  | "pd-tables"
  | "ecl-results"
  | "watchlist"
  | "reports";

interface Props {
  persona: { name: string; role: string; avatar: string };
  onBack: () => void;
  onLogout: () => void;
}

const NAV: {
  id: IFRS9Page;
  label: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: <Briefcase className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "assumptions",
    label: "Assumptions",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "staging",
    label: "Staging",
    icon: <Layers3 className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "pd-tables",
    label: "PD Tables",
    icon: <TrendingDown className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "ecl-results",
    label: "ECL Results",
    icon: <Calculator className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "watchlist",
    label: "Watchlist",
    icon: <Eye className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "data-manager",
    label: "Data Manager",
    icon: <Database className="h-4 w-4" />,
    group: "operations",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="h-4 w-4" />,
    group: "operations",
  },
];

const GROUPS: Record<string, string> = {
  main: "Overview",
  analytics: "Analytics",
  operations: "Operations",
};

function PageBody({ page }: { page: IFRS9Page }) {
  switch (page) {
    case "data-manager":
      return <IFRS9DataManager />;
    case "overview":
      return <IFRS9Overview />;
    case "portfolio":
      return <IFRS9Portfolio />;
    case "assumptions":
      return <IFRS9Assumptions />;
    case "staging":
      return <IFRS9Staging />;
    case "pd-tables":
      return <IFRS9PDTables />;
    case "ecl-results":
      return <IFRS9ECLResults />;
    case "watchlist":
      return <IFRS9Watchlist />;
    case "reports":
      return <IFRS9Reports />;
  }
}

export function IFRS9Module() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "overview") as IFRS9Page;

  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    groupLabel: label,
    items: NAV.filter((n) => n.group === key),
  }));

  return (
    <IFRS9Provider>
      <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
        {/* ── top header ── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
          <div className="flex items-center gap-3">
            <Logo collapsed />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-semibold text-dark-gray">
              IFRS 9 & ECL
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

        {/* ── body: sidebar + main ── */}
        <div className="flex flex-1 overflow-hidden">
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
                        onClick={() => navigate(`/ifrs9/${item.id}`)}
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
    </IFRS9Provider>
  );
}
