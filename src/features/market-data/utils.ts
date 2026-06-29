export function fmtPct(v: number, dp = 2): string {
  if (v == null || isNaN(v)) return "—";
  return `${(v * 100).toFixed(dp)}%`;
}

export function fmtBps(bps: number): string {
  if (bps == null || isNaN(bps)) return "—";
  const sign = bps > 0 ? "+" : "";
  return `${sign}${bps} bps`;
}

export function fmtFx(v: number, dp = 2): string {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtCompactNGN(v: number): string {
  if (v == null || isNaN(v)) return "—";
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  if (a >= 1e12) return `${sign}₦${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${sign}₦${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}₦${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}₦${(a / 1e3).toFixed(1)}K`;
  return `${sign}₦${a.toFixed(0)}`;
}

export function fmtTenor(t: number): string {
  if (t < 1) return `${Math.round(t * 12)}M`;
  return `${t}Y`;
}

export function fmtShortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
