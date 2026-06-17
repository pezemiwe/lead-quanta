import { useParams } from "react-router-dom";
import {
  Award,
  BarChart3,
  Coins,
  Gauge,
  LayoutDashboard,
  LineChart,
  Percent,
  PieChart,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { PlaceholderPage } from "../../components/shared/placeholder-page";
import { PerformanceDashboard } from "./pages/dashboard";
import { YTMAnalysis } from "./pages/ytm";
import { Returns } from "./pages/returns";
import { Attribution } from "./pages/attribution";
import { Income } from "./pages/income";
import { Carry } from "./pages/carry";
import { Benchmarks } from "./pages/benchmarks";
import { RiskAdjusted } from "./pages/risk-adjusted";

export type PerformancePage =
  | "dashboard"
  | "ytm"
  | "returns"
  | "attribution"
  | "benchmarks"
  | "income"
  | "carry"
  | "risk-adjusted";

const NAV: ModuleNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "overview",
  },
  {
    id: "ytm",
    label: "YTM & Yields",
    icon: <Percent className="h-4 w-4" />,
    group: "yields",
  },
  {
    id: "returns",
    label: "Returns",
    icon: <LineChart className="h-4 w-4" />,
    group: "returns",
  },
  {
    id: "attribution",
    label: "Attribution",
    icon: <PieChart className="h-4 w-4" />,
    group: "returns",
  },
  {
    id: "benchmarks",
    label: "Benchmarks",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "returns",
  },
  {
    id: "income",
    label: "Investment Income",
    icon: <Coins className="h-4 w-4" />,
    group: "income",
  },
  {
    id: "carry",
    label: "Carry Analysis",
    icon: <Award className="h-4 w-4" />,
    group: "income",
  },
  {
    id: "risk-adjusted",
    label: "Risk-Adjusted",
    icon: <Gauge className="h-4 w-4" />,
    group: "advanced",
  },
];

const GROUPS: Record<string, string> = {
  overview: "Overview",
  yields: "Yields",
  returns: "Returns",
  income: "Income",
  advanced: "Advanced",
};

function PageBody({ page }: { page: PerformancePage }) {
  switch (page) {
    case "dashboard":
      return <PerformanceDashboard />;
    case "ytm":
      return <YTMAnalysis />;
    case "returns":
      return <Returns />;
    case "attribution":
      return <Attribution />;
    case "benchmarks":
      return <Benchmarks />;
    case "income":
      return <Income />;
    case "carry":
      return <Carry />;
    case "risk-adjusted":
      return <RiskAdjusted />;
  }
}

export function PerformanceModule() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "dashboard") as PerformancePage;

  return (
    <ModuleShell
      moduleLabel="Return & Performance Analytics"
      basePath="/performance"
      activePage={page}
      nav={NAV}
      groups={GROUPS}
    >
      <PageBody page={page} />
    </ModuleShell>
  );
}
