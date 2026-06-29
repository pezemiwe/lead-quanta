import { Badge } from "..";
import type { TabItem, Step, DataTableColumn } from "..";

export const PORTFOLIO_TABS: TabItem[] = [
  { value: "overview", label: "Overview", count: 3 },
  { value: "investments", label: "Investment Book", count: 1240 },
  { value: "valuation", label: "Valuation" },
  { value: "reports", label: "Reports", disabled: true },
];

export const STEPS: Step[] = [
  {
    id: "1",
    label: "Deal Capture",
    description: "Record trade details",
    status: "completed",
  },
  {
    id: "2",
    label: "Checker Review",
    description: "Dual-control sign-off",
    status: "active",
  },
  { id: "3", label: "CRO Approval", status: "pending" },
  { id: "4", label: "Settlement", status: "pending" },
];

export type LoanRow = {
  id: string;
  instrument: string;
  classification: string;
  faceValue: string;
  yield: string;
  status: string;
};

export const LOAN_ROWS: LoanRow[] = [
  {
    id: "INV-001",
    instrument: "FGN Bond 2031",
    classification: "AC",
    faceValue: "₦450,000,000",
    yield: "15.25%",
    status: "Active",
  },
  {
    id: "INV-002",
    instrument: "Zenith Bank Bond",
    classification: "FVOCI",
    faceValue: "₦78,500,000",
    yield: "16.80%",
    status: "Active",
  },
  {
    id: "INV-003",
    instrument: "NGX — Dangote Cement",
    classification: "FVTPL",
    faceValue: "₦25,000,000",
    yield: "N/A",
    status: "Watch",
  },
  {
    id: "INV-004",
    instrument: "CBN T-Bill 182d",
    classification: "AC",
    faceValue: "₦310,000,000",
    yield: "18.50%",
    status: "Active",
  },
  {
    id: "INV-005",
    instrument: "Lafarge Africa Bond",
    classification: "FVOCI",
    faceValue: "₦55,000,000",
    yield: "17.40%",
    status: "Active",
  },
];

export const LOAN_COLS: DataTableColumn<LoanRow>[] = [
  { key: "id", header: "ID", width: "90px" },
  { key: "instrument", header: "Instrument" },
  {
    key: "classification",
    header: "Classification",
    render: (r) => (
      <Badge
        variant={
          r.classification === "AC"
            ? "success"
            : r.classification === "FVOCI"
              ? "warning"
              : "neutral"
        }
        size="sm"
      >
        {r.classification}
      </Badge>
    ),
  },
  { key: "faceValue", header: "Face Value", align: "right" },
  {
    key: "yield",
    header: "Yield",
    align: "right",
    render: (r) => (
      <span className="font-medium text-success">{r.yield}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge variant={r.status === "Watch" ? "warning" : "success"} size="sm">
        {r.status}
      </Badge>
    ),
  },
];
