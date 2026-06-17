export type Currency = "NGN" | "USD";

export interface YieldCurvePoint {
  tenor: number; // years
  yield: number; // decimal
}

export interface YieldCurveHistoryPoint {
  date: string; // ISO yyyy-mm-dd
  yields: Record<number, number>; // tenor -> yield
}

export interface NelsonSiegelParams {
  beta0: number;
  beta1: number;
  beta2: number;
  tau: number;
}

export interface FXRate {
  pair: string; //  USD-NGN
  rate: number;
}

export interface FXHistoryPoint {
  date: string;
  rates: Record<string, number>;
}

export interface BondQuote {
  id: string;
  name: string;
  yield: number; // decimal
  price: number; // clean price per 100
  changeBps: number; // vs prior day
}

export interface BondPriceHistoryPoint {
  date: string;
  prices: Record<string, number>;
}

export interface InflationMprPoint {
  date: string; // yyyy-mm
  cpi: number;
  mpr: number;
}

export interface PortfolioPnlPoint {
  date: string;
  value: number;
  pnl: number;
}

export interface Alert {
  tenor: number;
  oldYield: number;
  newYield: number;
  changeBps: number;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
}

export interface MarketSnapshot {
  asOf: string;
  ngnCurve: YieldCurvePoint[];
  usdCurve: YieldCurvePoint[];
  ngnNelsonSiegel: NelsonSiegelParams;
  usdNelsonSiegel: NelsonSiegelParams;
  fx: FXRate[];
  bonds: BondQuote[];
  inflation: number; // latest CPI
  mpr: number; // latest MPR
  spreads: { tenor: number; ngn: number; usd: number; spread: number }[];
}

export interface MarketHistory {
  ngnCurve: YieldCurveHistoryPoint[];
  usdCurve: YieldCurveHistoryPoint[];
  fx: FXHistoryPoint[];
  bondPrices: BondPriceHistoryPoint[];
  inflationMpr: InflationMprPoint[];
  portfolioPnl: PortfolioPnlPoint[];
  alerts: Alert[];
}

export interface MarketState {
  snapshot: MarketSnapshot;
  history: MarketHistory;
  overrides: {
    type: string;
    key: string;
    value: number;
    source: string;
    at: string;
  }[];
  source: "Simulated" | "FMDQ" | "Bloomberg" | "Manual";
  lastUpdated: string;
}
