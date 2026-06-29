import { useParams } from "react-router-dom";
import {
  Activity,
  BookText,
  Briefcase,
  FileBarChart2,
  Landmark,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { ReportingDashboard } from "./pages/dashboard";
import { ValuationReport } from "./pages/valuation";
import { InvestmentCommittee } from "./pages/investment-committee";
import { ALCO } from "./pages/alco";
import { IFRS7Disclosures } from "./pages/ifrs7";
import { RegulatoryLimits } from "./pages/regulatory";
import { CreditQualityReport } from "./pages/credit-quality";
import { AlcoPack } from "./pages/alco-pack";

export type ReportingPage =
  | "dashboard"
  | "investment-committee"
  | "alco"
  | "alco-pack"
  | "ifrs7"
  | "credit-quality"
  | "valuation"
  | "regulatory";

const NAV: ModuleNavItem[] = [
  {
    id: "dashboard",
    label: "Daily Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "overview",
  },
  {
    id: "investment-committee",
    label: "Investment Committee",
    icon: <Briefcase className="h-4 w-4" />,
    group: "management",
  },
  {
    id: "alco",
    label: "ALCO",
    icon: <Activity className="h-4 w-4" />,
    group: "management",
  },
  {
    id: "alco-pack",
    label: "ALCO Investment Pack",
    icon: <FileBarChart2 className="h-4 w-4" />,
    group: "management",
  },
  {
    id: "ifrs7",
    label: "IFRS 7 Disclosures",
    icon: <BookText className="h-4 w-4" />,
    group: "disclosures",
  },
  {
    id: "credit-quality",
    label: "Credit Quality",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "disclosures",
  },
  {
    id: "valuation",
    label: "Valuation Reports",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "operations",
  },
  {
    id: "regulatory",
    label: "Regulatory Limits",
    icon: <Landmark className="h-4 w-4" />,
    group: "regulatory",
  },
];

const GROUPS: Record<string, string> = {
  overview: "Overview",
  management: "Management",
  disclosures: "Disclosures",
  operations: "Operations",
  regulatory: "Regulatory",
};

function PageBody({ page }: { page: ReportingPage }) {
  switch (page) {
    case "dashboard":
      return <ReportingDashboard />;
    case "investment-committee":
      return <InvestmentCommittee />;
    case "alco":
      return <ALCO />;
    case "alco-pack":
      return <AlcoPack />;
    case "ifrs7":
      return <IFRS7Disclosures />;
    case "credit-quality":
      return <CreditQualityReport />;
    case "valuation":
      return <ValuationReport />;
    case "regulatory":
      return <RegulatoryLimits />;
  }
}

export function ReportingModule() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "dashboard") as ReportingPage;

  return (
    <ModuleShell
      moduleLabel="Reporting & Dashboard"
      basePath="/reporting"
      activePage={page}
      nav={NAV}
      groups={GROUPS}
    >
      <PageBody page={page} />
    </ModuleShell>
  );
}
