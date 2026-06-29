import type {
  Alert,
  BondPriceHistoryPoint,
  BondQuote,
  FXHistoryPoint,
  FXRate,
  InflationMprPoint,
  MarketHistory,
  MarketSnapshot,
  MarketState,
  NelsonSiegelParams,
  PortfolioPnlPoint,
  YieldCurveHistoryPoint,
  YieldCurvePoint,
} from "./types";

/* ─── constants (ported from notebook) ───────────────────────────────── */

export const VALUATION_DATE = "2026-05-28";
export const HISTORY_DAYS = 90;
export const ALERT_BPS = 25;

export const NGN_TENORS = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20];
export const USD_TENORS = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30];

// Base levels (decimal yields)
export const NGN_BASE_CURVE: Record<number, number> = {
  0.25: 0.175,
  0.5: 0.178,
  1: 0.182,
  2: 0.185,
  3: 0.188,
  5: 0.19,
  7: 0.192,
  10: 0.195,
  15: 0.198,
  20: 0.2,
};

export const USD_BASE_CURVE: Record<number, number> = {
  0.25: 0.0525,
  0.5: 0.052,
  1: 0.048,
  2: 0.043,
  3: 0.041,
  5: 0.04,
  7: 0.041,
  10: 0.042,
  20: 0.045,
  30: 0.047,
};

export const FX_BASE: Record<string, number> = {
  "USD-NGN": 1580.0,
  "EUR-NGN": 1720.0,
  "GBP-NGN": 2010.0,
};

export const BOND_UNIVERSE: {
  id: string;
  name: string;
  tenor: number;
  coupon: number;
}[] = [
  { id: "FGN-2027", name: "FGN 14.55% 2027", tenor: 1, coupon: 0.1455 },
  { id: "FGN-2029", name: "FGN 13.98% 2029", tenor: 3, coupon: 0.1398 },
  { id: "FGN-2031", name: "FGN 14.80% 2031", tenor: 5, coupon: 0.148 },
  { id: "FGN-2034", name: "FGN 15.45% 2034", tenor: 8, coupon: 0.1545 },
  { id: "FGN-2042", name: "FGN 16.25% 2042", tenor: 16, coupon: 0.1625 },
  { id: "INV-046", name: "Leadway Corp 18.50% 2030", tenor: 4, coupon: 0.185 },
];

export const COLORS = {
  ngn: "#F7941D",
  usd: "#1A6B8A",
  green: "#2ecc71",
  amber: "#f39c12",
  red: "#e74c3c",
  blue: "#3498db",
  purple: "#8e44ad",
  gray: "#95a5a6",
};

/* ─── deterministic PRNG (mulberry32) ────────────────────────────────── */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand: () => number): number {
  // Box-Muller
  let u = 0,
    v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ─── dates ──────────────────────────────────────────────────────────── */

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBack(asOf: string, n: number): string[] {
  const end = new Date(asOf + "T00:00:00Z");
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    out.push(isoDate(d));
  }
  return out;
}

/* ─── Nelson-Siegel ──────────────────────────────────────────────────── */

export function nsYield(p: NelsonSiegelParams, t: number): number {
  if (t <= 0) return p.beta0 + p.beta1;
  const x = t / p.tau;
  const e = Math.exp(-x);
  const factor = (1 - e) / x;
  return p.beta0 + p.beta1 * factor + p.beta2 * (factor - e);
}

/**
 * Crude NS fit: grid search over (beta1, beta2, tau), beta0 = long-end yield.
 * Good enough for visualization; avoids pulling in scipy-equivalent.
 */
export function fitNelsonSiegel(points: YieldCurvePoint[]): NelsonSiegelParams {
  const sorted = [...points].sort((a, b) => a.tenor - b.tenor);
  const beta0 = sorted[sorted.length - 1].yield;
  const shortY = sorted[0].yield;
  let best: NelsonSiegelParams = {
    beta0,
    beta1: shortY - beta0,
    beta2: 0,
    tau: 2,
  };
  let bestErr = Infinity;
  const taus = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7];
  const b1s = Array.from({ length: 11 }, (_, i) => -0.1 + i * 0.02);
  const b2s = Array.from({ length: 11 }, (_, i) => -0.1 + i * 0.02);
  for (const tau of taus) {
    for (const b1 of b1s) {
      for (const b2 of b2s) {
        const p: NelsonSiegelParams = { beta0, beta1: b1, beta2: b2, tau };
        let err = 0;
        for (const pt of sorted) {
          const d = nsYield(p, pt.tenor) - pt.yield;
          err += d * d;
        }
        if (err < bestErr) {
          bestErr = err;
          best = p;
        }
      }
    }
  }
  return best;
}

/* ─── price from yield (simple bullet bond, semi-annual coupons) ──────── */

function bondPrice(
  coupon: number,
  ytm: number,
  years: number,
  face = 100,
): number {
  const freq = 2;
  const n = Math.max(1, Math.round(years * freq));
  const c = (coupon * face) / freq;
  const y = ytm / freq;
  let pv = 0;
  for (let k = 1; k <= n; k++) pv += c / Math.pow(1 + y, k);
  pv += face / Math.pow(1 + y, n);
  return pv;
}

/* ─── history simulators (ported from _sim_* in notebook) ─────────────── */

function simNgnCurveHistory(asOf: string): YieldCurveHistoryPoint[] {
  const rand = mulberry32(42);
  const dates = daysBack(asOf, HISTORY_DAYS);
  // Random walk on level + slope
  let level = 0;
  let slope = 0;
  return dates.map((date) => {
    level += gauss(rand) * 0.0008;
    slope += gauss(rand) * 0.0004;
    const yields: Record<number, number> = {};
    for (const t of NGN_TENORS) {
      const base = NGN_BASE_CURVE[t];
      const tilt = (Math.log(1 + t) - 1.5) * slope;
      yields[t] = Math.max(0.05, base + level + tilt);
    }
    return { date, yields };
  });
}

function simUsdCurveHistory(asOf: string): YieldCurveHistoryPoint[] {
  const rand = mulberry32(7);
  const dates = daysBack(asOf, HISTORY_DAYS);
  let level = 0;
  return dates.map((date) => {
    level += gauss(rand) * 0.0004;
    const yields: Record<number, number> = {};
    for (const t of USD_TENORS) {
      yields[t] = Math.max(0.01, USD_BASE_CURVE[t] + level);
    }
    return { date, yields };
  });
}

function simFxHistory(asOf: string): FXHistoryPoint[] {
  const rand = mulberry32(123);
  const dates = daysBack(asOf, HISTORY_DAYS);
  const cur: Record<string, number> = {
    "USD-NGN": FX_BASE["USD-NGN"] - 35,
    "EUR-NGN": FX_BASE["EUR-NGN"] - 40,
    "GBP-NGN": FX_BASE["GBP-NGN"] - 45,
  };
  return dates.map((date) => {
    cur["USD-NGN"] += gauss(rand) * 4 + 0.4;
    cur["EUR-NGN"] += gauss(rand) * 4.5 + 0.45;
    cur["GBP-NGN"] += gauss(rand) * 5 + 0.5;
    return {
      date,
      rates: {
        "USD-NGN": Math.round(cur["USD-NGN"] * 100) / 100,
        "EUR-NGN": Math.round(cur["EUR-NGN"] * 100) / 100,
        "GBP-NGN": Math.round(cur["GBP-NGN"] * 100) / 100,
      },
    };
  });
}

function simBondPriceHistory(
  asOf: string,
  ngnHist: YieldCurveHistoryPoint[],
): BondPriceHistoryPoint[] {
  const rand = mulberry32(99);
  return ngnHist.map((day) => {
    const prices: Record<string, number> = {};
    for (const b of BOND_UNIVERSE) {
      // interpolate yield for tenor
      const tenors = Object.keys(day.yields)
        .map(Number)
        .sort((a, b) => a - b);
      let y = day.yields[tenors[tenors.length - 1]];
      for (let i = 0; i < tenors.length - 1; i++) {
        if (b.tenor >= tenors[i] && b.tenor <= tenors[i + 1]) {
          const t0 = tenors[i],
            t1 = tenors[i + 1];
          const y0 = day.yields[t0],
            y1 = day.yields[t1];
          y = y0 + ((y1 - y0) * (b.tenor - t0)) / (t1 - t0);
          break;
        }
      }
      const spread = b.id.startsWith("INV") ? 0.025 + gauss(rand) * 0.001 : 0;
      prices[b.id] =
        Math.round(bondPrice(b.coupon, y + spread, b.tenor) * 100) / 100;
    }
    return { date: day.date, prices };
  });
}

function simInflationMpr(asOf: string): InflationMprPoint[] {
  // 12 months of CPI vs MPR
  const months: InflationMprPoint[] = [];
  const end = new Date(asOf + "T00:00:00Z");
  const rand = mulberry32(11);
  let cpi = 0.262;
  let mpr = 0.275;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCMonth(end.getUTCMonth() - i);
    cpi += gauss(rand) * 0.003 - 0.0005;
    mpr += gauss(rand) * 0.001;
    months.push({
      date: d.toISOString().slice(0, 7),
      cpi: Math.round(cpi * 10000) / 10000,
      mpr: Math.round(mpr * 10000) / 10000,
    });
  }
  return months;
}

function simPortfolioPnl(
  asOf: string,
  ngnHist: YieldCurveHistoryPoint[],
): PortfolioPnlPoint[] {
  const rand = mulberry32(2025);
  const baseValue = 285_000_000_000; // ₦285B
  let v = baseValue;
  return ngnHist.map((day, i) => {
    const yChange = i === 0 ? 0 : day.yields[5] - ngnHist[i - 1].yields[5];
    // duration ~ 4.2, value moves by -dur * dy * value + noise
    const drift = -4.2 * yChange * v + gauss(rand) * 1e8;
    v += drift;
    return {
      date: day.date,
      value: Math.round(v),
      pnl: Math.round(v - baseValue),
    };
  });
}

function buildAlerts(ngnHist: YieldCurveHistoryPoint[]): Alert[] {
  if (ngnHist.length < 2) return [];
  const out: Alert[] = [];
  const today = ngnHist[ngnHist.length - 1];
  const yesterday = ngnHist[ngnHist.length - 2];
  for (const t of NGN_TENORS) {
    const oldY = yesterday.yields[t];
    const newY = today.yields[t];
    const bps = Math.round((newY - oldY) * 10000);
    if (Math.abs(bps) >= ALERT_BPS) {
      out.push({
        tenor: t,
        oldYield: oldY,
        newYield: newY,
        changeBps: bps,
        severity: Math.abs(bps) >= 50 ? "critical" : "warning",
        message: `${t}Y NGN yield moved ${bps > 0 ? "+" : ""}${bps} bps`,
        timestamp: today.date,
      });
    }
  }
  return out;
}

/* ─── snapshot builder ───────────────────────────────────────────────── */

export function buildSnapshot(
  asOf: string,
  ngnHist: YieldCurveHistoryPoint[],
  usdHist: YieldCurveHistoryPoint[],
  fxHist: FXHistoryPoint[],
  bondHist: BondPriceHistoryPoint[],
  infl: InflationMprPoint[],
): MarketSnapshot {
  const todayNgn = ngnHist[ngnHist.length - 1];
  const todayUsd = usdHist[usdHist.length - 1];
  const todayFx = fxHist[fxHist.length - 1];
  const todayBonds = bondHist[bondHist.length - 1];
  const yesterdayBonds = bondHist[bondHist.length - 2] ?? todayBonds;

  const ngnCurve: YieldCurvePoint[] = NGN_TENORS.map((t) => ({
    tenor: t,
    yield: todayNgn.yields[t],
  }));
  const usdCurve: YieldCurvePoint[] = USD_TENORS.map((t) => ({
    tenor: t,
    yield: todayUsd.yields[t],
  }));

  const fx: FXRate[] = Object.entries(todayFx.rates).map(([pair, rate]) => ({
    pair,
    rate,
  }));

  const bonds: BondQuote[] = BOND_UNIVERSE.map((b) => {
    const tenors = Object.keys(todayNgn.yields)
      .map(Number)
      .sort((a, c) => a - c);
    let y = todayNgn.yields[tenors[tenors.length - 1]];
    for (let i = 0; i < tenors.length - 1; i++) {
      if (b.tenor >= tenors[i] && b.tenor <= tenors[i + 1]) {
        const t0 = tenors[i],
          t1 = tenors[i + 1];
        const y0 = todayNgn.yields[t0],
          y1 = todayNgn.yields[t1];
        y = y0 + ((y1 - y0) * (b.tenor - t0)) / (t1 - t0);
        break;
      }
    }
    const spread = b.id.startsWith("INV") ? 0.025 : 0;
    const price = todayBonds.prices[b.id];
    const prevPrice = yesterdayBonds.prices[b.id];
    const changeBps = Math.round(((price - prevPrice) / prevPrice) * 10000);
    return {
      id: b.id,
      name: b.name,
      yield: y + spread,
      price,
      changeBps,
    };
  });

  // shared tenors for spread
  const sharedTenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20];
  const spreads = sharedTenors.map((t) => {
    const ngn = todayNgn.yields[t];
    const usd = todayUsd.yields[t];
    return { tenor: t, ngn, usd, spread: ngn - usd };
  });

  return {
    asOf,
    ngnCurve,
    usdCurve,
    ngnNelsonSiegel: fitNelsonSiegel(ngnCurve),
    usdNelsonSiegel: fitNelsonSiegel(usdCurve),
    fx,
    bonds,
    inflation: infl[infl.length - 1].cpi,
    mpr: infl[infl.length - 1].mpr,
    spreads,
  };
}

/* ─── top-level build ────────────────────────────────────────────────── */

export function buildMarketState(asOf: string = VALUATION_DATE): MarketState {
  const ngnHist = simNgnCurveHistory(asOf);
  const usdHist = simUsdCurveHistory(asOf);
  const fxHist = simFxHistory(asOf);
  const bondHist = simBondPriceHistory(asOf, ngnHist);
  const infl = simInflationMpr(asOf);
  const pnl = simPortfolioPnl(asOf, ngnHist);
  const alerts = buildAlerts(ngnHist);

  const snapshot = buildSnapshot(
    asOf,
    ngnHist,
    usdHist,
    fxHist,
    bondHist,
    infl,
  );
  const history: MarketHistory = {
    ngnCurve: ngnHist,
    usdCurve: usdHist,
    fx: fxHist,
    bondPrices: bondHist,
    inflationMpr: infl,
    portfolioPnl: pnl,
    alerts,
  };
  return {
    snapshot,
    history,
    overrides: [],
    source: "Simulated",
    lastUpdated: new Date().toISOString(),
  };
}

/* ─── overrides (mutates a state immutably and returns new) ──────────── */

export function applyYieldOverride(
  state: MarketState,
  tenor: number,
  newYield: number,
  source: string,
  currency: "NGN" | "USD" = "NGN",
): MarketState {
  const snap = state.snapshot;
  const curve = currency === "NGN" ? snap.ngnCurve : snap.usdCurve;
  const updated = curve.map((p) =>
    p.tenor === tenor ? { ...p, yield: newYield } : p,
  );
  const newSnap: MarketSnapshot = {
    ...snap,
    [currency === "NGN" ? "ngnCurve" : "usdCurve"]: updated,
    [currency === "NGN" ? "ngnNelsonSiegel" : "usdNelsonSiegel"]:
      fitNelsonSiegel(updated),
  };
  return {
    ...state,
    snapshot: newSnap,
    overrides: [
      ...state.overrides,
      {
        type: `${currency} Yield`,
        key: `${tenor}Y`,
        value: newYield,
        source,
        at: new Date().toISOString(),
      },
    ],
    source: "Manual",
    lastUpdated: new Date().toISOString(),
  };
}

export function applyFxOverride(
  state: MarketState,
  pair: string,
  rate: number,
  source: string,
): MarketState {
  const newFx = state.snapshot.fx.map((f) =>
    f.pair === pair ? { ...f, rate } : f,
  );
  return {
    ...state,
    snapshot: { ...state.snapshot, fx: newFx },
    overrides: [
      ...state.overrides,
      {
        type: "FX",
        key: pair,
        value: rate,
        source,
        at: new Date().toISOString(),
      },
    ],
    source: "Manual",
    lastUpdated: new Date().toISOString(),
  };
}

export function applyBondYieldOverride(
  state: MarketState,
  bondId: string,
  newYield: number,
  source: string,
): MarketState {
  const meta = BOND_UNIVERSE.find((b) => b.id === bondId);
  if (!meta) return state;
  const price = bondPrice(meta.coupon, newYield, meta.tenor);
  const newBonds = state.snapshot.bonds.map((b) =>
    b.id === bondId
      ? { ...b, yield: newYield, price: Math.round(price * 100) / 100 }
      : b,
  );
  return {
    ...state,
    snapshot: { ...state.snapshot, bonds: newBonds },
    overrides: [
      ...state.overrides,
      {
        type: "Bond Yield",
        key: bondId,
        value: newYield,
        source,
        at: new Date().toISOString(),
      },
    ],
    source: "Manual",
    lastUpdated: new Date().toISOString(),
  };
}
