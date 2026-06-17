import { useParams } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  ClipboardList,
  BarChart2,
  AlertTriangle,
  Plug,
  Activity,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { AccessControl } from "./pages/access-control";
import { ApprovalsWorkflow } from "./pages/approvals-workflow";
import { AuditLog } from "./pages/audit-log";
import { InvestmentLimits } from "./pages/investment-limits";
import { ComplianceMonitoring } from "./pages/compliance";
import { ExternalIntegrations } from "./pages/integrations";

export type GovernancePage =
  | "access-control"
  | "approvals"
  | "audit-log"
  | "limits"
  | "compliance"
  | "integrations";

const NAV: ModuleNavItem[] = [
  {
    id: "access-control",
    label: "Access Control",
    icon: <Users className="h-4 w-4" />,
    group: "rbac",
  },
  {
    id: "approvals",
    label: "Approval Workflows",
    icon: <CheckCircle2 className="h-4 w-4" />,
    group: "rbac",
  },
  {
    id: "audit-log",
    label: "Audit Trail",
    icon: <ClipboardList className="h-4 w-4" />,
    group: "controls",
  },
  {
    id: "limits",
    label: "Investment Limits",
    icon: <BarChart2 className="h-4 w-4" />,
    group: "controls",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: <AlertTriangle className="h-4 w-4" />,
    group: "controls",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: <Plug className="h-4 w-4" />,
    group: "systems",
  },
];

const GROUPS: Record<string, string> = {
  rbac: "Access & Approvals",
  controls: "Controls & Compliance",
  systems: "Systems",
};

function PageBody({ page }: { page: GovernancePage }) {
  switch (page) {
    case "access-control":
      return <AccessControl />;
    case "approvals":
      return <ApprovalsWorkflow />;
    case "audit-log":
      return <AuditLog />;
    case "limits":
      return <InvestmentLimits />;
    case "compliance":
      return <ComplianceMonitoring />;
    case "integrations":
      return <ExternalIntegrations />;
  }
}

export function GovernanceModule() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "access-control") as GovernancePage;

  return (
    <ModuleShell
      moduleLabel="Governance & Controls"
      basePath="/governance"
      activePage={page}
      nav={NAV}
      groups={GROUPS}
    >
      <PageBody page={page} />
    </ModuleShell>
  );
}
