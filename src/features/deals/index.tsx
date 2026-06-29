import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GitMerge,
  Landmark,
  PlusSquare,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { usePersona } from "../../context/persona";
import { DealBlotter } from "./pages/blotter";
import { CouponSchedules } from "./pages/coupon-schedules";
import { Settlements } from "./pages/settlements";
import { Counterparties } from "./pages/counterparties";
import { Approvals } from "./pages/approvals";
import { NewBooking } from "./pages/new-booking";
import { WorkflowExceptions } from "./pages/exceptions";
import { CounterpartyExposure } from "./pages/counterparty-exposure";
import { ReconciliationPage } from "./pages/reconciliation";
import { TreasuryCashManagement } from "./pages/treasury-cash";
import { TraderPerformance } from "./pages/trader-performance";
import { canAccessDealsPage, defaultDealsPage, type DealsPage } from "./deals-access";

export type { DealsPage } from "./deals-access";

const ALL_NAV: ModuleNavItem[] = [
  {
    id: "blotter",
    label: "Trade Blotter",
    icon: <ClipboardList className="h-4 w-4" />,
    group: "trades",
  },
  {
    id: "new-booking",
    label: "Deal Capture",
    icon: <PlusSquare className="h-4 w-4" />,
    group: "trades",
  },
  {
    id: "coupon-schedules",
    label: "Coupon Schedules",
    icon: <CalendarClock className="h-4 w-4" />,
    group: "lifecycle",
  },
  {
    id: "settlements",
    label: "Settlements",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    group: "lifecycle",
  },
  {
    id: "counterparties",
    label: "Counterparties",
    icon: <Users className="h-4 w-4" />,
    group: "static",
  },
  {
    id: "exposure",
    label: "Exposure Monitor",
    icon: <ShieldAlert className="h-4 w-4" />,
    group: "static",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    icon: <GitMerge className="h-4 w-4" />,
    group: "lifecycle",
  },
  {
    id: "treasury-cash",
    label: "Treasury Cash",
    icon: <Landmark className="h-4 w-4" />,
    group: "lifecycle",
  },
  {
    id: "trader-performance",
    label: "Trader Performance",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "controls",
  },
  {
    id: "approvals",
    label: "Review & Approval",
    icon: <CheckCircle2 className="h-4 w-4" />,
    group: "controls",
  },
  {
    id: "exceptions",
    label: "Exceptions",
    icon: <AlertTriangle className="h-4 w-4" />,
    group: "controls",
  },
];

const GROUPS: Record<string, string> = {
  trades: "Trades",
  lifecycle: "Lifecycle",
  static: "Static Data",
  controls: "Controls",
};

function PageBody({ page }: { page: DealsPage }) {
  switch (page) {
    case "blotter":
      return <DealBlotter />;
    case "new-booking":
      return <NewBooking />;
    case "coupon-schedules":
      return <CouponSchedules />;
    case "settlements":
      return <Settlements />;
    case "counterparties":
      return <Counterparties />;
    case "exposure":
      return <CounterpartyExposure />;
    case "reconciliation":
      return <ReconciliationPage />;
    case "treasury-cash":
      return <TreasuryCashManagement />;
    case "trader-performance":
      return <TraderPerformance />;
    case "approvals":
      return <Approvals />;
    case "exceptions":
      return <WorkflowExceptions />;
  }
}

export function DealsModule() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const { persona } = usePersona();
  const page = (pageParam ?? "blotter") as DealsPage;

  const nav = useMemo(
    () =>
      ALL_NAV.filter((item) =>
        canAccessDealsPage(persona.role, item.id as DealsPage),
      ),
    [persona.role],
  );

  const visibleGroups = useMemo(() => {
    const keys = new Set(nav.map((n) => n.group));
    return Object.fromEntries(
      Object.entries(GROUPS).filter(([key]) => keys.has(key)),
    );
  }, [nav]);

  if (!canAccessDealsPage(persona.role, page)) {
    return <Navigate to={`/deal-capture/${defaultDealsPage(persona.role)}`} replace />;
  }

  return (
    <ModuleShell
      moduleLabel="Deal Capture & Trade Management"
      basePath="/deal-capture"
      activePage={page}
      nav={nav}
      groups={visibleGroups}
    >
      <PageBody page={page} />
    </ModuleShell>
  );
}
