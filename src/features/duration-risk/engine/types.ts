/* ───────────────────────────────────────────────────────────
   Duration & Risk Engine — Types
   Interest rate sensitivity, stress testing, ALM gap.
   ─────────────────────────────────────────────────────────── */

import type {
  Classification,
  Currency,
  Instrument,
  InstrumentType,
} from "../../valuation/engine/types";

export interface DurationRow {
  id: string;
  name: string;
  type: InstrumentType;
  issuer: string;
  sector: string;
  classification: Classification;
  currency: Currency;
  faceValue: number;
  bsValueNGN: number;
  baseValueLocal: number; // base value used for stress (clean fair value or carrying)
  couponRate: number;
  marketYield: number;
  remainingTenor: number;
  macaulayDur: number;
  modifiedDur: number;
  dv01Local: number;
  dv01NGN: number;
  convexity: number;
  maturityDate: string;
  purchaseDate: string;
}

export interface StressRow {
  id: string;
  name: string;
  type: InstrumentType;
  sector: string;
  classification: Classification;
  baseValueNGN: number;
  /** shocked NGN values keyed by bps (e.g. -300, 0, 300) */
  shockValues: Record<number, number>;
  /** NGN P&L keyed by bps */
  pnl: Record<number, number>;
}

export interface CashflowBucketRow {
  bucket: string;
  coupon: number;
  principal: number;
  total: number;
}

export interface LiabilityBucket {
  bucket: string;
  duration: number;
  valueNGN: number;
}

export interface ScenarioImpact {
  name: string;
  totalNGN: number;
  ociNGN: number;
  plNGN: number;
}

export interface CurveScenario {
  name: string;
  shortBps: number;
  longBps: number;
}

export interface NigerianScenario {
  name: string;
  ngnShock: number; // bps
  usdShock: number; // bps
  fxShock: number; // %
}

export interface ALMBucketRow {
  bucket: string;
  assetValue: number;
  assetDur: number;
  liabValue: number;
  liabDur: number;
  gap: number;
  durGap: number;
}

export interface ALMResult {
  buckets: ALMBucketRow[];
  totalAssetNGN: number;
  totalLiabNGN: number;
  wtdAssetDur: number;
  wtdLiabDur: number;
  durationGap: number;
  dv01Gap: number;
}

export interface ByGroupRow {
  group: string;
  count: number;
  wtdMacaulay: number;
  wtdModified: number;
  wtdConvexity: number;
  totalDV01: number;
  totalBSValueNGN: number;
}

export interface RiskTotals {
  instruments: number;
  totalBSValueNGN: number;
  totalDV01: number;
  wtdMacaulayDur: number;
  wtdModifiedDur: number;
  wtdConvexity: number;
  ir100bp: number; // +100 bp P&L
  ir200bp: number; // +200 bp P&L
}

/** Map of instrument id → duration row */
export type DurationMap = Record<string, DurationRow>;

/** One bucket of the modified-duration histogram (count by duration range) */
export interface DurationHistogramRow {
  bucket: string;
  count: number;
}

/** One point on the price/yield convexity curve */
export interface ConvexityCurvePoint {
  shock: number;
  portfolioNGN: number;
  pct: number;
}

export type { Instrument };
