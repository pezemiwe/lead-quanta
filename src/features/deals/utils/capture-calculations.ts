import type { AssetClass } from "../../workflow/types";
import { ISSUER_TICKERS } from "../data/capture-masters";

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export { addDays };

function dayCountBasis(convention: string): number {
  if (convention.includes("360")) return 360;
  return 365;
}

function parseNum(v: string | undefined): number {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function applyDerivedFields(
  assetClass: AssetClass,
  fields: Record<string, string>,
): Record<string, string> {
  const next = { ...fields };

  if (next.issuer && ISSUER_TICKERS[next.issuer]) {
    next.ticker = ISSUER_TICKERS[next.issuer];
  }

  const valueOrSettle = next.valueDate || next.settlementDate || next.tradeDate;
  if (valueOrSettle && next.maturityDate) {
    next.tenor = String(daysBetween(valueOrSettle, next.maturityDate));
  }

  if (assetClass === "Fixed deposits and call deposits") {
    const principal = parseNum(next.principal);
    const rate = parseNum(next.rate) / 100;
    const days = parseInt(next.tenor || "0", 10);
    const basis = dayCountBasis(next.dayCount || "Actual/365");
    if (principal && rate && days) {
      const interest = (principal * rate * days) / basis;
      next.expectedInterest = interest.toFixed(2);
      next.expectedMaturityValue = (principal + interest).toFixed(2);
    }
  }

  if (assetClass === "Treasury bills and commercial papers") {
    const face = parseNum(next.faceValue);
    const rate = parseNum(next.discountRateOrYield) / 100;
    const days = parseInt(next.tenor || "0", 10);
    if (face && rate && days) {
      if (next.yieldMode === "Discount Rate %") {
        next.maturityValue = face.toFixed(2);
        next.purchasePrice = (face * (1 - (rate * days) / 365)).toFixed(2);
      } else {
        next.maturityValue = (face * (1 + (rate * days) / 365)).toFixed(2);
      }
    }
  }

  if (assetClass === "Bonds") {
    const clean = parseNum(next.cleanPrice);
    const accrued = parseNum(next.accruedInterest);
    next.dirtyPrice = (clean + accrued).toFixed(4);
    const face = parseNum(next.faceValue) || parseNum(next.principal) || 100_000_000;
    next.settlementValue = ((face * (clean + accrued)) / 100).toFixed(2);
    const ytm = parseNum(next.yield) / 100 || 0.12;
    next.duration = (4.2 + 100 / (ytm * 100 + 1)).toFixed(2);
    next.dv01 = ((parseNum(next.settlementValue) * parseNum(next.duration)) / 10000).toFixed(0);
  }

  if (assetClass === "Equities") {
    const qty = parseNum(next.quantity);
    const price = parseNum(next.price);
    const brokerage = parseNum(next.brokerageFee);
    const other = parseNum(next.otherFees);
    next.grossSettlementValue = (qty * price).toFixed(2);
    next.netSettlementValue = (qty * price - brokerage - other).toFixed(2);
    next.settlementValue = next.netSettlementValue;
  }

  if (assetClass === "Mutual funds" || assetClass === "Alternative investments") {
    const nav = parseNum(next.nav);
    const units = parseNum(next.units);
    if (nav && units) {
      next.totalAmount = (nav * units).toFixed(2);
      if (!next.subscriptionAmount && !next.redemptionAmount) {
        next.subscriptionAmount = next.totalAmount;
      }
    }
  }

  if (next.settlementAccountId) {
    // populated from bank account selection in form handler
  }

  if (next.currency && !next.settlementCurrency) {
    next.settlementCurrency = next.currency;
  }

  return next;
}

export function isValidIsin(isin: string): boolean {
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin.trim().toUpperCase());
}

export function isValueDateValid(tradeDate: string, valueDate: string): boolean {
  if (!tradeDate || !valueDate) return true;
  return valueDate >= tradeDate;
}
