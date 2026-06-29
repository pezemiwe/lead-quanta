/* ───────────────────────────────────────────────────────────
   Duration & Risk Engine — Reference Data
   ─────────────────────────────────────────────────────────── */

import type { CurveScenario, LiabilityBucket, NigerianScenario } from "./types";

export const PARALLEL_SHOCKS_BPS = [
  -300, -200, -100, -50, 0, 50, 100, 200, 300,
];

export const DEFAULT_LIABILITY_STRUCTURE: LiabilityBucket[] = [
  { bucket: "0–3 Months (GI Claims)", duration: 0.125, valueNGN: 18_400_000_000 },
  { bucket: "3–6 Months (GI Claims)", duration: 0.375, valueNGN: 14_200_000_000 },
  { bucket: "6–12 Months (Health & GI)", duration: 0.75, valueNGN: 22_600_000_000 },
  { bucket: "1–2 Years (Life Short-term)", duration: 1.5, valueNGN: 19_800_000_000 },
  { bucket: "2–5 Years (Life & Annuity)", duration: 3.5, valueNGN: 38_500_000_000 },
  { bucket: "5–10 Years (Life Policy Reserves)", duration: 7.2, valueNGN: 52_300_000_000 },
  { bucket: "10–15 Years (Life Long-term)", duration: 12.1, valueNGN: 41_700_000_000 },
  { bucket: "15–20 Years (Annuity Payouts)", duration: 17.3, valueNGN: 26_800_000_000 },
  { bucket: "20–25 Years (Annuity Long-tail)", duration: 22.0, valueNGN: 11_200_000_000 },
  { bucket: "25+ Years (Very Long Annuity)", duration: 28.5, valueNGN: 4_500_000_000 },
];

export const LIABILITY_POLICY_CLASSES = [
  {
    name: "General Insurance",
    shortName: "GI",
    colour: "#F7941D",
    description: "Motor, fire, marine, engineering, aviation",
    duration: 0.5,
    valueNGN: 55_200_000_000,
    cashFlows: [18400, 14200, 12600, 8000, 2000].map((v) => v * 1_000_000),
    years: [0.25, 0.5, 1, 2, 3],
  },
  {
    name: "Health Insurance",
    shortName: "HI",
    colour: "#1A7A4A",
    description: "Group health, individual health, HMO",
    duration: 0.75,
    valueNGN: 22_600_000_000,
    cashFlows: [8200, 7400, 5800, 1200].map((v) => v * 1_000_000),
    years: [0.25, 0.5, 0.75, 1],
  },
  {
    name: "Life Assurance",
    shortName: "Life",
    colour: "#1E3A5F",
    description: "Term life, whole life, endowment, group life",
    duration: 8.4,
    valueNGN: 113_800_000_000,
    cashFlows: [6400, 9800, 14200, 18600, 22400, 19800, 13200, 7400, 2000].map((v) => v * 1_000_000),
    years: [1, 2, 3, 5, 7, 10, 15, 20, 25],
  },
  {
    name: "Annuities",
    shortName: "Ann",
    colour: "#3A3A6A",
    description: "Immediate annuities, deferred annuities, pension buy-outs",
    duration: 18.6,
    valueNGN: 38_400_000_000,
    cashFlows: [1200, 2100, 3400, 4800, 5900, 6200, 5800, 4400, 2900, 1600].map((v) => v * 1_000_000),
    years: [1, 2, 3, 5, 7, 10, 15, 20, 25, 30],
  },
] as const;

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
