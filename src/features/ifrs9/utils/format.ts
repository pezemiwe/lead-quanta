/* Shared formatting helpers for the IFRS 9 module */

export const fmtLCY = (n: number, currency = "NGN"): string => {
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : "";
  const value = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  return `${symbol}${value}`;
};

export const fmtACY = (n: number, currency: string): string => {
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : "";
  return `${symbol}${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 2,
  }).format(n)}`;
};

export const fmtPct = (n: number, digits = 2): string =>
  `${(n * 100).toFixed(digits)}%`;

export const fmtDate = (d: Date): string =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const fmtCompact = (n: number, currency = "NGN"): string => {
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : "";
  const v = Math.abs(n);
  if (v >= 1e12) return `${symbol}${(n / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${symbol}${(n / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${symbol}${(n / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${symbol}${(n / 1e3).toFixed(2)}K`;
  return `${symbol}${n.toFixed(0)}`;
};
