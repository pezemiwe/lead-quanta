import type { AssetClass, DealSlip, RegisterPosition } from "../../workflow/types";
import { dealNotional } from "../../workflow/engine/fields";
import { counterpartyOrIssuer } from "./blotter-metrics";

export type LimitStatus = "pass" | "watch" | "breach";

export interface LimitPreviewRow {
  key: string;
  label: string;
  current: number;
  limit: number;
  thisDeal: number;
  status: LimitStatus;
}

const CP_LIMIT = 5_000_000_000;
const ISSUER_LIMIT = 3_000_000_000;
const ASSET_CLASS_LIMIT = 8_000_000_000;
const CURRENCY_LIMIT = 6_000_000_000;
const FUND_LIMIT = 10_000_000_000;

function statusFor(current: number, limit: number): LimitStatus {
  const pct = (current / limit) * 100;
  if (pct >= 100) return "breach";
  if (pct >= 80) return "watch";
  return "pass";
}

export function buildLimitPreview(
  assetClass: AssetClass,
  portfolioId: string,
  portfolioName: string,
  fields: Record<string, string>,
  dealSlips: DealSlip[],
  register: RegisterPosition[],
): LimitPreviewRow[] {
  const thisDeal = dealNotional(fields);
  const cp = fields.counterparty || fields.issuer || fields.fundManager || "—";
  const currency = fields.currency || fields.settlementCurrency || "NGN";

  let cpExposure = thisDeal;
  for (const d of dealSlips) {
    if (["Rejected", "Draft"].includes(d.status)) continue;
    if (counterpartyOrIssuer(d) === cp) cpExposure += dealNotional(d.fields);
  }
  for (const p of register) {
    if (p.counterparty === cp) cpExposure += p.notional;
  }

  let issuerExposure = thisDeal;
  const issuer = fields.issuer || cp;
  for (const d of dealSlips) {
    if (["Rejected", "Draft"].includes(d.status)) continue;
    const i = d.fields.issuer || counterpartyOrIssuer(d);
    if (i === issuer) issuerExposure += dealNotional(d.fields);
  }

  let assetExposure = thisDeal;
  for (const d of dealSlips) {
    if (["Rejected", "Draft"].includes(d.status)) continue;
    if (d.assetClass === assetClass) assetExposure += dealNotional(d.fields);
  }

  let currencyExposure = thisDeal;
  for (const d of dealSlips) {
    if (["Rejected", "Draft"].includes(d.status)) continue;
    const c = d.fields.currency || d.settlement?.currency || "NGN";
    if (c === currency) currencyExposure += dealNotional(d.fields);
  }

  let fundExposure = thisDeal;
  for (const d of dealSlips) {
    if (["Rejected", "Draft"].includes(d.status)) continue;
    if (d.portfolioId === portfolioId) fundExposure += dealNotional(d.fields);
  }
  for (const p of register) {
    if (p.portfolioId === portfolioId) fundExposure += p.notional;
  }

  return [
    {
      key: "cp",
      label: "Counterparty limit",
      current: cpExposure,
      limit: CP_LIMIT,
      thisDeal,
      status: statusFor(cpExposure, CP_LIMIT),
    },
    {
      key: "issuer",
      label: "Issuer limit",
      current: issuerExposure,
      limit: ISSUER_LIMIT,
      thisDeal,
      status: statusFor(issuerExposure, ISSUER_LIMIT),
    },
    {
      key: "asset",
      label: "Asset class limit",
      current: assetExposure,
      limit: ASSET_CLASS_LIMIT,
      thisDeal,
      status: statusFor(assetExposure, ASSET_CLASS_LIMIT),
    },
    {
      key: "currency",
      label: "Currency limit",
      current: currencyExposure,
      limit: CURRENCY_LIMIT,
      thisDeal,
      status: statusFor(currencyExposure, CURRENCY_LIMIT),
    },
    {
      key: "fund",
      label: `Fund limit · ${portfolioName}`,
      current: fundExposure,
      limit: FUND_LIMIT,
      thisDeal,
      status: statusFor(fundExposure, FUND_LIMIT),
    },
  ];
}

export function breachedLimits(rows: LimitPreviewRow[]): LimitPreviewRow[] {
  return rows.filter((r) => r.status === "breach");
}

export function limitAlerts(rows: LimitPreviewRow[]): LimitPreviewRow[] {
  return rows.filter((r) => r.status !== "pass");
}
