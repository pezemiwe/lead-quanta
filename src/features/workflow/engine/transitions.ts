import type { DealSlipStatus } from "../types";

export const STATUS_ORDER: DealSlipStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Returned for Amendment",
  "Rejected",
  "Approved",
  "Pending Settlement",
  "Settled",
  "Active",
  "Matured, Sold or Rolled Over",
];

export const STATUS_META: Record<
  DealSlipStatus,
  { meaning: string; rule: string; color: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  Draft: {
    meaning: "Trader preparing deal slip",
    rule: "Trader can edit. Reviewers cannot approve.",
    color: "neutral",
  },
  Submitted: {
    meaning: "Submitted for review",
    rule: "Record locked except via returned-amendment workflow.",
    color: "info",
  },
  "Under Review": {
    meaning: "Middle Office, Risk or Compliance reviewing",
    rule: "Comments, queries and clearance captured.",
    color: "info",
  },
  "Returned for Amendment": {
    meaning: "Correction or missing evidence required",
    rule: "Trader edits and resubmits. Prior version in audit log.",
    color: "warning",
  },
  Rejected: {
    meaning: "Trade not approved",
    rule: "No settlement instruction can be created.",
    color: "danger",
  },
  Approved: {
    meaning: "Approver approved the deal",
    rule: "Back Office settlement queue entry created.",
    color: "success",
  },
  "Pending Settlement": {
    meaning: "Settlement instruction and payment validation in progress",
    rule: "Cannot become active investment yet.",
    color: "warning",
  },
  Settled: {
    meaning: "Cash, documents and confirmations match approved deal slip",
    rule: "Investment register update triggered.",
    color: "success",
  },
  Active: {
    meaning: "Position in investment register",
    rule: "Accrual, valuation, maturity and limit monitoring run.",
    color: "success",
  },
  "Matured, Sold or Rolled Over": {
    meaning: "Lifecycle event closed or transformed holding",
    rule: "Income, principal and register status updated.",
    color: "neutral",
  },
};

export function isEditableStatus(status: DealSlipStatus): boolean {
  return status === "Draft" || status === "Returned for Amendment";
}

export function canApproveStatus(status: DealSlipStatus): boolean {
  return status === "Under Review";
}

export function canReviewStatus(status: DealSlipStatus): boolean {
  return status === "Submitted" || status === "Under Review";
}

export function canSettleStatus(status: DealSlipStatus): boolean {
  return status === "Approved" || status === "Pending Settlement";
}

export function inFlightStatuses(): DealSlipStatus[] {
  return [
    "Draft",
    "Submitted",
    "Under Review",
    "Returned for Amendment",
    "Approved",
    "Pending Settlement",
  ];
}
