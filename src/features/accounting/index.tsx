import { useParams } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  Coins,
  FileSpreadsheet,
  Layers,
  Receipt,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { Journals } from "./pages/journals";
import { Accruals } from "./pages/accruals";
import { FVAdjustments } from "./pages/fv-adjustments";
import { Impairment } from "./pages/impairment";
import { EIRAmortisation } from "./pages/eir-amortisation";
import { CouponRecognition } from "./pages/coupon-recognition";
import { Disposals } from "./pages/disposals";
import { MultiCurrency } from "./pages/multi-currency";

export type AccountingPage =
  | "journals"
  | "eir-amortisation"
  | "accruals"
  | "fv-adjustments"
  | "coupon-recognition"
  | "impairment"
  | "disposals"
  | "multi-currency";

const NAV: ModuleNavItem[] = [
  {
    id: "journals",
    label: "Journal Entries",
    icon: <BookOpen className="h-4 w-4" />,
    group: "ledger",
  },
  {
    id: "eir-amortisation",
    label: "EIR Amortisation",
    icon: <Calculator className="h-4 w-4" />,
    group: "ledger",
  },
  {
    id: "accruals",
    label: "Interest Accruals",
    icon: <Receipt className="h-4 w-4" />,
    group: "ledger",
  },
  {
    id: "fv-adjustments",
    label: "Fair Value Adjustments",
    icon: <Layers className="h-4 w-4" />,
    group: "valuation",
  },
  {
    id: "coupon-recognition",
    label: "Coupon Recognition",
    icon: <Coins className="h-4 w-4" />,
    group: "valuation",
  },
  {
    id: "impairment",
    label: "Impairment Postings",
    icon: <ShieldAlert className="h-4 w-4" />,
    group: "valuation",
  },
  {
    id: "disposals",
    label: "Disposal Accounting",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    group: "lifecycle",
  },
  {
    id: "multi-currency",
    label: "Multi-Currency",
    icon: <Wallet className="h-4 w-4" />,
    group: "lifecycle",
  },
];

const GROUPS: Record<string, string> = {
  ledger: "General Ledger",
  valuation: "Valuation Postings",
  lifecycle: "Lifecycle",
};

function PageBody({ page }: { page: AccountingPage }) {
  switch (page) {
    case "journals":
      return <Journals />;
    case "eir-amortisation":
      return <EIRAmortisation />;
    case "accruals":
      return <Accruals />;
    case "fv-adjustments":
      return <FVAdjustments />;
    case "coupon-recognition":
      return <CouponRecognition />;
    case "impairment":
      return <Impairment />;
    case "disposals":
      return <Disposals />;
    case "multi-currency":
      return <MultiCurrency />;
  }
}

export function AccountingModule() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "journals") as AccountingPage;

  return (
    <ModuleShell
      moduleLabel="Accounting & GL Integration"
      basePath="/accounting"
      activePage={page}
      nav={NAV}
      groups={GROUPS}
    >
      <PageBody page={page} />
    </ModuleShell>
  );
}
