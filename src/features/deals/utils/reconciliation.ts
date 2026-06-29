import type { DealSlip, RegisterPosition, WorkflowException } from "../../workflow/types";
import { dealNotional } from "../../workflow/engine/fields";
import { counterpartyOrIssuer } from "./blotter-metrics";
import { computeBlotterBridge } from "./blotter-bridge";

export type ReconciliationSeverity = "critical" | "warning" | "info";

export interface ReconciliationItem {
  id: string;
  dealSlipId: string;
  type: "unmatched" | "failed" | "partial" | "exception" | "missing-instruction";
  severity: ReconciliationSeverity;
  label: string;
  detail: string;
  amount?: number;
  custodian?: string;
}

export interface ReconciliationContext {
  register?: RegisterPosition[];
  dateFrom?: string;
  dateTo?: string;
}

export function buildReconciliationItems(
  deals: DealSlip[],
  exceptions: WorkflowException[],
  context?: ReconciliationContext,
): ReconciliationItem[] {
  const items: ReconciliationItem[] = [];

  for (const d of deals) {
    const cp = counterpartyOrIssuer(d);
    const amount = dealNotional(d.fields);
    const custodian =
      d.settlement?.custodian ||
      d.fields.cscsOrCustodian ||
      d.fields.custodian ||
      undefined;

    if (
      (d.status === "Approved" || d.status === "Pending Settlement") &&
      !d.settlement
    ) {
      items.push({
        id: `rec-missing-${d.id}`,
        dealSlipId: d.id,
        type: "missing-instruction",
        severity: "warning",
        label: "No settlement instruction",
        detail: `${d.id} approved — awaiting instruction generation`,
        amount,
        custodian,
      });
    }

    if (d.settlementStatus === "Failed") {
      items.push({
        id: `rec-failed-${d.id}`,
        dealSlipId: d.id,
        type: "failed",
        severity: "critical",
        label: "Settlement failed",
        detail: `${cp} — custodian rejected or funds not received`,
        amount,
        custodian,
      });
    }

    if (d.settlementStatus === "Partially Settled") {
      items.push({
        id: `rec-partial-${d.id}`,
        dealSlipId: d.id,
        type: "partial",
        severity: "warning",
        label: "Partial settlement",
        detail: "Remaining balance requires follow-up trade or exception waiver",
        amount,
        custodian,
      });
    }

    if (d.settlementStatus === "Settled with Exception") {
      items.push({
        id: `rec-exc-settle-${d.id}`,
        dealSlipId: d.id,
        type: "exception",
        severity: "warning",
        label: "Settled with exception",
        detail: "Posted to register with open reconciliation item",
        amount,
        custodian,
      });
    }

    if (
      d.settlement?.status === "checked" &&
      d.status === "Pending Settlement" &&
      d.settlementStatus === "Instruction Checked"
    ) {
      items.push({
        id: `rec-unmatched-${d.id}`,
        dealSlipId: d.id,
        type: "unmatched",
        severity: "info",
        label: "Awaiting custodian confirmation",
        detail: `${cp} — instruction checked, pending bank/custodian match`,
        amount,
        custodian,
      });
    }
  }

  for (const ex of exceptions) {
    if (ex.status === "closed") continue;
    if (
      ex.type.toLowerCase().includes("settlement") ||
      ex.type.toLowerCase().includes("document") ||
      ex.type.toLowerCase().includes("partial")
    ) {
      items.push({
        id: `rec-ex-${ex.id}`,
        dealSlipId: ex.dealSlipId,
        type: "exception",
        severity: ex.status === "open" ? "critical" : "warning",
        label: ex.type,
        detail: ex.description,
      });
    }
  }

  if (context?.register && (context.dateFrom || context.dateTo)) {
    const bridge = computeBlotterBridge(
      deals,
      context.register,
      context.dateFrom ?? "",
      context.dateTo ?? "",
    );
    if (!bridge.reconciled) {
      const drift = Math.abs(bridge.closing.notional - bridge.impliedClosing.notional);
      items.push({
        id: `rec-bridge-${bridge.periodFrom}-${bridge.periodTo}`,
        dealSlipId: "—",
        type: "exception",
        severity: drift >= 10_000_000 ? "critical" : "warning",
        label: "Position bridge out of balance",
        detail: `Period position does not reconcile with the register for ${bridge.periodFrom} to ${bridge.periodTo} (₦${drift.toLocaleString()} variance)`,
        amount: drift,
      });
    }
  }

  const seen = new Set<string>();
  return items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}
