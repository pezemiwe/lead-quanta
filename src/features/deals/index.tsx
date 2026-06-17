import { useParams } from "react-router-dom";
import {
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  PlusSquare,
  Users,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { PlaceholderPage } from "../../components/shared/placeholder-page";
import { DealBlotter } from "./pages/blotter";
import { CouponSchedules } from "./pages/coupon-schedules";
import { Settlements } from "./pages/settlements";
import { Counterparties } from "./pages/counterparties";
import { Approvals } from "./pages/approvals";
import { NewBooking } from "./pages/new-booking";

export type DealsPage =
  | "blotter"
  | "new-booking"
  | "coupon-schedules"
  | "settlements"
  | "counterparties"
  | "approvals";

const NAV: ModuleNavItem[] = [
  {
    id: "blotter",
    label: "Trade Blotter",
    icon: <ClipboardList className="h-4 w-4" />,
    group: "trades",
  },
  {
    id: "new-booking",
    label: "New Booking",
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
    id: "approvals",
    label: "Approvals",
    icon: <CheckCircle2 className="h-4 w-4" />,
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
    case "approvals":
      return <Approvals />;
  }
}

export function DealsModule() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "blotter") as DealsPage;

  return (
    <ModuleShell
      moduleLabel="Deal Capture & Trade Management"
      basePath="/deal-capture"
      activePage={page}
      nav={NAV}
      groups={GROUPS}
    >
      <PageBody page={page} />
    </ModuleShell>
  );
}
