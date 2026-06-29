import type {
  Classification,
  Currency,
  InstrumentType,
} from "./engine/types";

/* ─── currency formatting ───────────────────────────────── */
const CCY_SYMBOL: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export function fmtMoney(
  amount: number,
  currency: Currency = "NGN",
  decimals = 2,
): string {
  if (amount == null || isNaN(amount)) return "—";
  const sym = CCY_SYMBOL[currency];
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${sym}${abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function fmtMoneyCompact(
  amount: number,
  currency: Currency = "NGN",
): string {
  if (amount == null || isNaN(amount)) return "—";
  const sym = CCY_SYMBOL[currency];
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
}

export function fmtPct(v: number, decimals = 4): string {
  if (v == null || isNaN(v)) return "—";
  return `${(v * 100).toFixed(decimals)}%`;
}

export function fmtNumber(v: number, decimals = 0): string {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  return iso;
}

/* ─── label maps ────────────────────────────────────────── */
export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  AC: "Amortised Cost",
  FVOCI: "Fair Value through OCI",
  FVTPL: "Fair Value through P&L",
};

export const CLASSIFICATION_BADGE: Record<Classification, string> = {
  AC: "bg-teal-50 text-success",
  FVOCI: "bg-blue-50 text-blue-700",
  FVTPL: "bg-pale-red text-primary",
};

export const INSTRUMENT_TYPE_COLOR: Record<InstrumentType, string> = {
  "FGN Bond": "#0f766e",
  "Corporate Bond": "#E07B12",
  "State Bond": "#9333ea",
  Eurobond: "#1d4ed8",
  "T-Bill": "#1A1A1A",
  "Commercial Paper": "#F7941D",
  "Promissory Note": "#7c2d12",
  "Bank Placement": "#0891b2",
  "Fixed Deposit": "#65a30d",
  "Mutual Fund": "#d97706",
  Equity: "#dc2626",
};
