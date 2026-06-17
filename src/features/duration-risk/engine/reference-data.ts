/* ───────────────────────────────────────────────────────────
   Duration & Risk Engine — Reference Data
   ─────────────────────────────────────────────────────────── */

import type { CurveScenario, LiabilityBucket, NigerianScenario } from "./types";

export const PARALLEL_SHOCKS_BPS = [
  -300, -200, -100, -50, 0, 50, 100, 200, 300,
];

export const DEFAULT_LIABILITY_STRUCTURE: LiabilityBucket[] = [
  { bucket: "0-3 Months", duration: 0.125, valueNGN: 2_500_000_000 },
  { bucket: "3-6 Months", duration: 0.375, valueNGN: 3_200_000_000 },
  { bucket: "6-12 Months", duration: 0.75, valueNGN: 4_100_000_000 },
  { bucket: "1-2 Years", duration: 1.5, valueNGN: 5_800_000_000 },
  { bucket: "2-5 Years", duration: 3.5, valueNGN: 6_500_000_000 },
  { bucket: "5-10 Years", duration: 7.0, valueNGN: 3_200_000_000 },
  { bucket: "10+ Years", duration: 12.0, valueNGN: 1_500_000_000 },
];

export const CURVE_SCENARIOS: CurveScenario[] = [
  { name: "Bear Steepener", shortBps: 0, longBps: 150 },
  { name: "Bull Flattener", shortBps: 0, longBps: -150 },
  { name: "Bear Flattener", shortBps: 150, longBps: 0 },
  { name: "Bull Steepener", shortBps: -150, longBps: 0 },
  { name: "Twist Up", shortBps: 100, longBps: -100 },
  { name: "Twist Down", shortBps: -100, longBps: 100 },
];

export const NIGERIAN_SCENARIOS: NigerianScenario[] = [
  { name: "CBN Hike +200bps", ngnShock: 200, usdShock: 0, fxShock: 0 },
  { name: "CBN Cut -150bps", ngnShock: -150, usdShock: 0, fxShock: 0 },
  { name: "Inflation Shock +250bps", ngnShock: 250, usdShock: 0, fxShock: 0 },
  { name: "FX Crash -30%", ngnShock: 0, usdShock: 0, fxShock: -30 },
  { name: "Eurobond Spread +300bps", ngnShock: 0, usdShock: 300, fxShock: 0 },
  { name: "Combined Crisis", ngnShock: 200, usdShock: 300, fxShock: -25 },
];

export const MATURITY_BUCKETS_ORDER = [
  "0-3 Months",
  "3-6 Months",
  "6-12 Months",
  "1-2 Years",
  "2-5 Years",
  "5-10 Years",
  "10+ Years",
];

export const DURATION_EXCLUDED_TYPES = new Set([
  "Mutual Fund",
  "Equity",
  "Bank Placement",
]);

export const CASHFLOW_EXCLUDED_TYPES = new Set(["Mutual Fund", "Equity"]);
