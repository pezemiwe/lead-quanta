/** Sector → brand colour. */
export const SECTOR_COLOR: Record<string, string> = {
  Sovereign: "#1abc9c",
  Banking: "#2980b9",
  Energy: "#f39c12",
  Telecoms: "#8e44ad",
  Government: "#16a085",
  "Money Market": "#34495e",
  Corporate: "#d35400",
  Industrials: "#7f8c8d",
  FMCG: "#9b59b6",
  Construction: "#c0392b",
  Agric: "#27ae60",
  Conglomerate: "#2c3e50",
  Automotive: "#e67e22",
  Transport: "#3498db",
};

export function colorForSector(sector: string): string {
  return SECTOR_COLOR[sector] ?? "#7f8c8d";
}

export function colorForPnl(value: number): string {
  return value >= 0 ? "#2ecc71" : "#e74c3c";
}

export function colorForShock(bps: number): string {
  // negative shocks (rate cuts) → green; positive (hikes) → red
  if (bps === 0) return "#95a5a6";
  return bps < 0 ? "#2ecc71" : "#e74c3c";
}

export function fmtCompactNGN(amount: number): string {
  if (amount == null || isNaN(amount)) return "—";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1e12) return `${sign}₦${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}₦${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}₦${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₦${abs.toFixed(0)}`;
}

export function fmtBps(bps: number): string {
  const sign = bps > 0 ? "+" : "";
  return `${sign}${bps} bps`;
}

export function fmtYears(v: number, decimals = 2): string {
  if (v == null || isNaN(v)) return "—";
  return `${v.toFixed(decimals)} yrs`;
}
