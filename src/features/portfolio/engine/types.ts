/* ─────────────────────────────────────────────────────────
   Portfolio Engine — Type Definitions
   ───────────────────────────────────────────────────────── */

export type AssetClass =
  | "Equity"
  | "Fixed Income"
  | "Real Estate"
  | "Cash"
  | "Private Equity"
  | "Alternatives";

export type Geography = "Nigeria" | "Pan-Africa" | "International";

export type Currency = "NGN" | "USD" | "GBP" | "EUR";

export type TxType =
  | "Buy"
  | "Sell"
  | "Dividend"
  | "Coupon"
  | "Maturity"
  | "Rebalance"
  | "Capital Call";

export type TxStatus = "Settled" | "Processing" | "Failed";

/* ── Core holding record ─────────────────────────────────── */
export interface Holding {
  id: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  geography: Geography;
  currency: Currency;
  issuer: string;

  /* Position */
  quantity: number; // shares / units / face ₦M
  costPrice: number; // per unit (NGN)
  costBasis: number; // total ₦ millions

  /* Market */
  marketValue: number; // ₦ millions — current fair value
  marketPrice?: number; // per unit (NGN) where applicable
  ytdReturn: number; // decimal e.g. 0.118

  /* Risk */
  beta: number;
  dividendYield?: number; // decimal
}

/* ── Transaction record ──────────────────────────────────── */
export interface Transaction {
  id: string;
  date: string; // ISO date yyyy-mm-dd
  type: TxType;
  holdingId: string;
  assetName: string;
  quantity?: number;
  price?: number; // NGN per unit
  amount: number; // ₦ millions  (positive = cash in / income)
  status: TxStatus;
  notes?: string;
}

/* ── Strategic target per asset class ───────────────────── */
export interface AllocationTarget {
  assetClass: AssetClass;
  targetPct: number; // strategic weight %
  limitPct: number; // hard upper limit %
}

/* ── Computed aggregates ─────────────────────────────────── */
export interface AllocationSlice {
  label: string;
  value: number; // ₦ millions
  costBasis: number; // ₦ millions
  pnl: number; // ₦ millions unrealised
  pct: number; // % of total nav
  color: string;
}

export interface ConcentrationLimit {
  label: string;
  current: number; // % (decimal × 100)
  limit: number; // % hard cap
  status: "ok" | "watch" | "breach";
}

export interface StressScenario {
  scenario: string;
  shocks: Partial<Record<AssetClass, number>>; // % shock (decimal)
  impact: number; // ₦ millions
  pct: number; // % of nav
  severity: "high" | "medium" | "low";
}

export interface PerformancePoint {
  period: string;
  portfolioReturn: number;
  benchmarkReturn: number;
}

/* ── Master computed metrics object ─────────────────────── */
export interface PortfolioMetrics {
  /* Summary */
  totalNav: number;
  totalCostBasis: number;
  unrealisedPnL: number;
  unrealisedPnLPct: number;

  /* Returns */
  ytdReturn: number;
  benchmarkReturn: number;
  alpha: number;

  /* Risk-adjusted */
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  trackingError: number;
  beta: number;
  informationRatio: number;

  /* VaR */
  var95_1d: number;
  var99_1d: number;
  var95_10d: number;
  cvar95: number;

  /* Allocation */
  byClass: AllocationSlice[];
  bySector: AllocationSlice[];
  byGeo: AllocationSlice[];
  byCurrency: AllocationSlice[];

  /* Risk */
  concentrationLimits: ConcentrationLimit[];
  stressTests: StressScenario[];

  /* Derived */
  topHoldings: (Holding & { weight: number })[];
  monthlyReturns: PerformancePoint[];
}
