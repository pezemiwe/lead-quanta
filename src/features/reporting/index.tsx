import { useParams } from "react-router-dom";
import {
  Activity,
  BookText,
  Briefcase,
  FileText,
  Landmark,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { PlaceholderPage } from "../../components/shared/placeholder-page";
import { ReportingDashboard } from "./pages/dashboard";
import { ValuationReport } from "./pages/valuation";
import { IFRS9Disclosures } from "./pages/ifrs9-disclosures";
import { InvestmentCommittee } from "./pages/investment-committee";
import { ALCO } from "./pages/alco";
import { IFRS7Disclosures } from "./pages/ifrs7";
import { ECLReports } from "./pages/ecl";
import { RegulatoryLimits } from "./pages/regulatory";

export type ReportingPage =
  | "dashboard"
  | "investment-committee"
  | "alco"
  | "ifrs7"
  | "ifrs9-disclosures"
  | "valuation"
  | "ecl"
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
    id: "ifrs7",
    label: "IFRS 7 Disclosures",
    icon: <BookText className="h-4 w-4" />,
    group: "disclosures",
  },
  {
    id: "ifrs9-disclosures",
    label: "IFRS 9 Disclosures",
    icon: <ScrollText className="h-4 w-4" />,
    group: "disclosures",
  },
  {
    id: "valuation",
    label: "Valuation Reports",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "operations",
  },
  {
    id: "ecl",
    label: "ECL Reports",
    icon: <FileText className="h-4 w-4" />,
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
    case "ifrs7":
      return <IFRS7Disclosures />;
    case "ifrs9-disclosures":
      return <IFRS9Disclosures />;
    case "valuation":
      return <ValuationReport />;
    case "ecl":
      return <ECLReports />;
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
