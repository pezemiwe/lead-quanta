export type DealSlipStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Returned for Amendment"
  | "Rejected"
  | "Approved"
  | "Pending Settlement"
  | "Settled"
  | "Active"
  | "Matured, Sold or Rolled Over";

export type AssetClass =
  | "Fixed deposits and call deposits"
  | "Treasury bills and commercial papers"
  | "Bonds"
  | "Equities"
  | "Mutual funds"
  | "Alternative investments";

export type CheckType = "limit" | "compliance" | "pricing" | "eligibility" | "rating" | "tenor";

export type CheckResultStatus = "pass" | "watch" | "breach" | "pending" | "cleared";

export type SettlementStatus =
  | "Pending"
  | "Instruction Generated"
  | "Instruction Checked"
  | "Settled"
  | "Partially Settled"
  | "Failed"
  | "Reversed"
  | "Settled with Exception";

export type ReviewFunction = "Middle Office" | "Risk Management" | "Compliance";

export interface DealSlipDocument {
  id: string;
  name: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface WorkflowComment {
  id: string;
  at: string;
  user: string;
  role: string;
  function?: ReviewFunction | "Approval" | "Settlement" | "System";
  text: string;
  type: "comment" | "query" | "clearance" | "return" | "reject" | "approve";
}

export interface ControlCheck {
  id: string;
  type: CheckType;
  label: string;
  status: CheckResultStatus;
  detail: string;
  reviewer?: string;
  reviewedAt?: string;
}

export interface SettlementInstruction {
  id: string;
  beneficiary: string;
  account: string;
  custodian: string;
  broker: string;
  valueDate: string;
  currency: string;
  amount: string;
  createdBy: string;
  createdAt: string;
  checkedBy?: string;
  checkedAt?: string;
  status: "draft" | "checked" | "released";
}

export interface WorkflowException {
  id: string;
  dealSlipId: string;
  type: string;
  description: string;
  owner: string;
  dueDate: string;
  status: "open" | "assigned" | "pending approval" | "closed";
  createdAt: string;
  closureComment?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  user: string;
  role: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface RegisterPosition {
  id: string;
  dealSlipId: string;
  assetClass: AssetClass;
  portfolioId: string;
  label: string;
  counterparty: string;
  currency: string;
  notional: number;
  status: "Active" | "Matured" | "Sold" | "Rolled Over" | "Closed";
  settledAt: string;
  fields: Record<string, string>;
}

export interface DealSlip {
  id: string;
  assetClass: AssetClass;
  portfolioId: string;
  portfolioName: string;
  status: DealSlipStatus;
  fields: Record<string, string>;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  settledAt?: string;
  documents: DealSlipDocument[];
  checks: ControlCheck[];
  comments: WorkflowComment[];
  settlement?: SettlementInstruction;
  settlementStatus?: SettlementStatus;
  registerPositionId?: string;
  auditTrail: AuditEvent[];
  version: number;
}

export type DealSlipFieldValues = Record<string, string>;

export type CorporateActionType =
  | "Coupon Payment"
  | "Principal Maturity"
  | "FD Rollover"
  | "Dividend"
  | "Call/Redemption"
  | "Rights Issue";

export type CorporateActionStatus =
  | "Upcoming"
  | "Due Today"
  | "Overdue"
  | "Processing"
  | "Processed"
  | "Failed"
  | "Cancelled";

export interface CorporateAction {
  id: string;
  instrumentId: string;
  instrumentName: string;
  issuer: string;
  type: CorporateActionType;
  eventDate: string;
  paymentDate: string;
  amount: number;
  currency: string;
  status: CorporateActionStatus;
  processedAt?: string;
  processedBy?: string;
  glRef?: string;
  notes?: string;
}
