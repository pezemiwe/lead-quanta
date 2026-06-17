import { Badge, StageBadge } from "..";
import type { TabItem, Step, DataTableColumn } from "..";

export const PORTFOLIO_TABS: TabItem[] = [
  { value: "overview", label: "Overview", count: 3 },
  { value: "investments", label: "Investment Book", count: 1240 },
  { value: "ecl", label: "ECL Results" },
  { value: "ead", label: "EAD Projection", disabled: true },
];

export const STEPS: Step[] = [
  {
    id: "1",
    label: "Data Upload",
    description: "Upload raw loan data",
    status: "completed",
  },
  {
    id: "2",
    label: "PD Allocation",
    description: "Apply PD model",
    status: "active",
  },
  { id: "3", label: "LGD Estimation", status: "pending" },
  { id: "4", label: "ECL Calculation", status: "pending" },
];

export type LoanRow = {
  id: string;
  facility: string;
  stage: string;
  outstanding: string;
  ecl: string;
  status: string;
};

export const LOAN_ROWS: LoanRow[] = [
  {
    id: "L001",
    facility: "Term Loan",
    stage: "Stage 1",
    outstanding: "₦450,000,000",
    ecl: "₦1,350,000",
    status: "Performing",
  },
  {
    id: "L002",
    facility: "Overdraft",
    stage: "Stage 2",
    outstanding: "₦78,500,000",
    ecl: "₦9,420,000",
    status: "Watch",
  },
  {
    id: "L003",
    facility: "Mortgage",
    stage: "Stage 3",
    outstanding: "₦25,000,000",
    ecl: "₦12,500,000",
    status: "Substandard",
  },
  {
    id: "L004",
    facility: "LPO Finance",
    stage: "Stage 1",
    outstanding: "₦310,000,000",
    ecl: "₦930,000",
    status: "Performing",
  },
  {
    id: "L005",
    facility: "Lease",
    stage: "Stage 2",
    outstanding: "₦55,000,000",
    ecl: "₦6,600,000",
    status: "Doubtful",
  },
];

export const LOAN_COLS: DataTableColumn<LoanRow>[] = [
  { key: "id", header: "ID", width: "80px" },
  { key: "facility", header: "Facility Type" },
  {
    key: "stage",
    header: "Stage",
    render: (r) => (
      <StageBadge stage={r.stage as "Stage 1" | "Stage 2" | "Stage 3"} />
    ),
  },
  { key: "outstanding", header: "Outstanding", align: "right" },
  {
    key: "ecl",
    header: "ECL Charge",
    align: "right",
    render: (r) => <span className="font-medium text-danger">{r.ecl}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge variant="performing" size="sm">
        {r.status}
      </Badge>
    ),
  },
];
