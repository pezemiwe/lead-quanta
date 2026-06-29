import type { AssetClass, ControlCheck, DealSlip } from "../types";
import { dealNotional } from "./fields";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Run automated pre-approval checks when a deal slip is submitted. */
export function runAutomatedChecks(deal: DealSlip): ControlCheck[] {
  const notional = dealNotional(deal.fields);
  const checks: ControlCheck[] = [
    {
      id: uid("chk"),
      type: "limit",
      label: "Counterparty / issuer limit",
      status: notional > 5_000_000_000 ? "breach" : notional > 3_000_000_000 ? "watch" : "pass",
      detail:
        notional > 5_000_000_000
          ? "Exposure exceeds NAICOM single-counterparty limit"
          : notional > 3_000_000_000
            ? "Approaching counterparty concentration watch level"
            : "Within approved counterparty limit",
    },
    {
      id: uid("chk"),
      type: "compliance",
      label: "Eligible instrument",
      status: isEligible(deal.assetClass) ? "pass" : "breach",
      detail: isEligible(deal.assetClass)
        ? "Instrument class permitted under investment policy"
        : "Instrument class requires waiver approval",
    },
    {
      id: uid("chk"),
      type: "rating",
      label: "Minimum rating threshold",
      status: ratingCheck(deal),
      detail: ratingDetail(deal),
    },
    {
      id: uid("chk"),
      type: "tenor",
      label: "Tenor / maturity limit",
      status: tenorCheck(deal.fields),
      detail: "Tenor reviewed against portfolio mandate",
    },
    {
      id: uid("chk"),
      type: "pricing",
      label: "Pricing reasonableness",
      status: "pending",
      detail: "Awaiting Middle Office pricing review",
    },
    {
      id: uid("chk"),
      type: "eligibility",
      label: "Document completeness",
      status: deal.documents.length > 0 ? "pass" : "watch",
      detail:
        deal.documents.length > 0
          ? "Supporting documents attached"
          : "No documents attached — may require evidence before approval",
    },
  ];
  return checks;
}

function isEligible(assetClass: AssetClass): boolean {
  return assetClass !== "Alternative investments";
}

function ratingCheck(deal: DealSlip): ControlCheck["status"] {
  const rating = deal.fields.rating?.toUpperCase() ?? "";
  if (!rating) return deal.assetClass.includes("Treasury") ? "pass" : "pending";
  if (["AAA", "AA+", "AA", "AA-", "A+", "A"].some((r) => rating.includes(r))) return "pass";
  if (rating.includes("BBB")) return "watch";
  return "breach";
}

function ratingDetail(deal: DealSlip): string {
  const rating = deal.fields.rating;
  if (!rating && deal.assetClass.includes("Treasury")) return "Sovereign instrument — rating assumed";
  if (!rating) return "Rating not supplied — compliance review required";
  return `Issuer rating ${rating} assessed against policy floor`;
}

function tenorCheck(fields: Record<string, string>): ControlCheck["status"] {
  const tenor = fields.tenor ?? "";
  if (tenor.includes("year") && parseInt(tenor, 10) > 10) return "breach";
  return "pass";
}

export function hasOpenBreaches(checks: ControlCheck[]): boolean {
  return checks.some((c) => c.status === "breach" || c.status === "watch");
}

export function allChecksCleared(checks: ControlCheck[]): boolean {
  return checks.every((c) => c.status === "pass" || c.status === "cleared");
}
