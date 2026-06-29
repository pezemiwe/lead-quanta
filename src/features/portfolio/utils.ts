/* ─────────────────────────────────────────────────────────
   Portfolio — shared formatters + colour maps
   ───────────────────────────────────────────────────────── */

/** ₦ millions → human readable: ₦1.2T / ₦847.3B / ₦12.4M */
export function fmtNGN(millions: number, dec = 1): string {
  const abs = Math.abs(millions);
  const sign = millions < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(dec)}T`;
  if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(dec)}B`;
  return `${sign}₦${abs.toFixed(dec)}M`;
}

/** decimal → "11.8%" */
export function fmtPct(v: number, dec = 1): string {
  return `${(v * 100).toFixed(dec)}%`;
}

/** plain number with thousands separator */
export function fmtNumber(v: number, dec = 0): string {
  return v.toLocaleString("en-NG", { maximumFractionDigits: dec });
}

/** signed percent string with + prefix */
export function fmtDelta(v: number, dec = 1): string {
  const s = (v * 100).toFixed(dec);
  return v >= 0 ? `+${s}%` : `${s}%`;
}

/** Date string for display */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const CLASS_BADGE: Record<string, string> = {
  Equity: "bg-pale-red text-primary",
  "Fixed Income": "bg-red-100 text-deep-red",
  "Real Estate": "bg-orange-50 text-orange-700",
  Cash: "bg-gray-100 text-gray-500",
  "Private Equity": "bg-purple-50 text-purple-700",
  Alternatives: "bg-blue-50 text-blue-700",
};

export const TX_BADGE: Record<string, string> = {
  Buy: "bg-pale-red text-primary",
  Sell: "bg-red-50 text-danger",
  Dividend: "bg-teal-50 text-success",
  Coupon: "bg-teal-50 text-success",
  Maturity: "bg-blue-50 text-blue-700",
  Rebalance: "bg-gray-100 text-gray-600",
  "Capital Call": "bg-purple-50 text-purple-700",
};

export const STATUS_BADGE: Record<string, string> = {
  Settled: "bg-teal-50 text-success",
  Processing: "bg-yellow-50 text-yellow-700",
  Failed: "bg-red-50 text-danger",
};
