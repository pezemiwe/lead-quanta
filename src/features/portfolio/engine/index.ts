import type {
  Holding,
  Transaction,
  AllocationTarget,
  AllocationSlice,
  ConcentrationLimit,
  StressScenario,
  PortfolioMetrics,
  PerformancePoint,
} from "./types";
import { MONTHLY_RETURNS, STRESS_SCENARIOS } from "./reference-data";

/* ─────────────────────────────────────────────────────────
   Asset-class colour palette
   ───────────────────────────────────────────────────────── */
export const CLASS_COLOR: Record<string, string> = {
  "Private Equity": "#9A3412",
  Equity: "#F7941D",
  "Fixed Income": "#C2410C",
  "Real Estate": "#E07B12",
  Cash: "#FBBF24",
  Alternatives: "#FCD9A8",
};

export const GEO_COLOR: Record<string, string> = {
  Nigeria: "#F7941D",
  "Pan-Africa": "#C2410C",
  International: "#9A3412",
};

export const CCY_COLOR: Record<string, string> = {
  NGN: "#F7941D",
  USD: "#C2410C",
  GBP: "#9A3412",
  EUR: "#FBBF24",
};

/* ─────────────────────────────────────────────────────────
   Daily volatility by asset class (parametric VaR inputs)
   Derived from historical NGSE / sector studies
   ───────────────────────────────────────────────────────── */
const CLASS_DAILY_VOL: Record<string, number> = {
  Equity: 0.0085,
  "Fixed Income": 0.0025,
  "Real Estate": 0.004,
  Cash: 0.0003,
  "Private Equity": 0.0072,
  Alternatives: 0.0055,
};

/* ─────────────────────────────────────────────────────────
   Core aggregation helper
   ───────────────────────────────────────────────────────── */
function aggregate(
  holdings: Holding[],
  keyFn: (h: Holding) => string,
  colorFn: (key: string) => string,
  totalNav: number,
): AllocationSlice[] {
  const map = new Map<string, { value: number; costBasis: number }>();

  for (const h of holdings) {
    const k = keyFn(h);
    const cur = map.get(k) ?? { value: 0, costBasis: 0 };
    cur.value += h.marketValue;
    cur.costBasis += h.costBasis;
    map.set(k, cur);
  }

  return Array.from(map.entries())
    .map(([label, v]) => ({
      label,
      value: v.value,
      costBasis: v.costBasis,
      pnl: v.value - v.costBasis,
      pct: totalNav > 0 ? (v.value / totalNav) * 100 : 0,
      color: colorFn(label),
    }))
    .sort((a, b) => b.value - a.value);
}

/* ─────────────────────────────────────────────────────────
   Portfolio VaR (parametric, weighted-sum vol approach)
   ───────────────────────────────────────────────────────── */
function computeVol(holdings: Holding[], totalNav: number): number {
  return holdings.reduce((sum, h) => {
    const w = totalNav > 0 ? h.marketValue / totalNav : 0;
    const vol = CLASS_DAILY_VOL[h.assetClass] ?? 0.005;
    return sum + w * vol;
  }, 0);
}

/* ─────────────────────────────────────────────────────────
   Stress tests
   ───────────────────────────────────────────────────────── */
function computeStress(
  holdings: Holding[],
  totalNav: number,
): StressScenario[] {
  return STRESS_SCENARIOS.map((s) => {
    const impact = holdings.reduce((sum, h) => {
      const shock = s.shocks[h.assetClass] ?? 0;
      return sum + h.marketValue * shock;
    }, 0);
    return {
      ...s,
      impact,
      pct: totalNav > 0 ? impact / totalNav : 0,
    };
  });
}

/* ─────────────────────────────────────────────────────────
   Concentration limits
   ───────────────────────────────────────────────────────── */
function computeConcentration(
  holdings: Holding[],
  targets: AllocationTarget[],
  totalNav: number,
): ConcentrationLimit[] {
  const limits: ConcentrationLimit[] = [];

  /* per-class limits from targets */
  for (const t of targets) {
    const classVal = holdings
      .filter((h) => h.assetClass === t.assetClass)
      .reduce((s, h) => s + h.marketValue, 0);
    const current = totalNav > 0 ? (classVal / totalNav) * 100 : 0;
    const status =
      current > t.limitPct
        ? "breach"
        : current > t.limitPct * 0.9
          ? "watch"
          : "ok";
    limits.push({
      label: `${t.assetClass} sector limit`,
      current,
      limit: t.limitPct,
      status,
    });
  }

  /* top-5 / top-10 concentration */
  const sorted = [...holdings].sort((a, b) => b.marketValue - a.marketValue);
  const top5 = sorted.slice(0, 5).reduce((s, h) => s + h.marketValue, 0);
  const top10 = sorted.slice(0, 10).reduce((s, h) => s + h.marketValue, 0);
  const top1 = sorted[0]?.marketValue ?? 0;

  limits.unshift(
    {
      label: `Largest single holding (${sorted[0]?.name ?? "—"})`,
      current: (top1 / totalNav) * 100,
      limit: 20,
      status:
        top1 / totalNav > 0.18
          ? "breach"
          : top1 / totalNav > 0.16
            ? "watch"
            : "ok",
    },
    {
      label: "Top 5 holdings as % of portfolio",
      current: (top5 / totalNav) * 100,
      limit: 60,
      status:
        top5 / totalNav > 0.55
          ? "breach"
          : top5 / totalNav > 0.5
            ? "watch"
            : "ok",
    },
    {
      label: "Top 10 holdings as % of portfolio",
      current: (top10 / totalNav) * 100,
      limit: 80,
      status:
        top10 / totalNav > 0.75
          ? "breach"
          : top10 / totalNav > 0.7
            ? "watch"
            : "ok",
    },
  );

  return limits;
}

/* ─────────────────────────────────────────────────────────
   Portfolio beta (holding-weighted average)
   ───────────────────────────────────────────────────────── */
function computePortfolioBeta(holdings: Holding[], totalNav: number): number {
  return holdings.reduce((sum, h) => {
    const w = totalNav > 0 ? h.marketValue / totalNav : 0;
    return sum + w * h.beta;
  }, 0);
}

/* ─────────────────────────────────────────────────────────
   YTD return — time-weighted (simple weighted average
   of holding returns, weighted by current market value)
   ───────────────────────────────────────────────────────── */
function computeYTDReturn(holdings: Holding[], totalNav: number): number {
  return holdings.reduce((sum, h) => {
    const w = totalNav > 0 ? h.marketValue / totalNav : 0;
    return sum + w * h.ytdReturn;
  }, 0);
}

/* ─────────────────────────────────────────────────────────
   Monthly time-weighted benchmark return
   ───────────────────────────────────────────────────────── */
function cumulativeReturn(points: PerformancePoint[]): {
  port: number;
  bench: number;
} {
  return points.reduce(
    (acc, p) => ({
      port: (1 + acc.port) * (1 + p.portfolioReturn) - 1,
      bench: (1 + acc.bench) * (1 + p.benchmarkReturn) - 1,
    }),
    { port: 0, bench: 0 },
  );
}

/* ─────────────────────────────────────────────────────────
   Annual portfolio vol (for Sharpe/Sortino)
   ───────────────────────────────────────────────────────── */
function annualVol(dailyVol: number): number {
  return dailyVol * Math.sqrt(252);
}

/* ─────────────────────────────────────────────────────────
   Master computation entry point
   ───────────────────────────────────────────────────────── */
export function computePortfolioMetrics(
  holdings: Holding[],
  targets: AllocationTarget[],
): PortfolioMetrics {
  const totalNav = holdings.reduce((s, h) => s + h.marketValue, 0);
  const totalCostBasis = holdings.reduce((s, h) => s + h.costBasis, 0);
  const unrealisedPnL = totalNav - totalCostBasis;
  const unrealisedPnLPct =
    totalCostBasis > 0 ? unrealisedPnL / totalCostBasis : 0;

  /* Allocation slices */
  const byClass = aggregate(
    holdings,
    (h) => h.assetClass,
    (k) => CLASS_COLOR[k] ?? "#888",
    totalNav,
  );
  const bySector = aggregate(
    holdings,
    (h) => h.sector,
    () => "#F7941D",
    totalNav,
  );
  const byGeo = aggregate(
    holdings,
    (h) => h.geography,
    (k) => GEO_COLOR[k] ?? "#888",
    totalNav,
  );
  const byCurrency = aggregate(
    holdings,
    (h) => h.currency,
    (k) => CCY_COLOR[k] ?? "#888",
    totalNav,
  );

  /* Performance */
  const ytdReturn = computeYTDReturn(holdings, totalNav);
  const { bench: benchmarkReturn } = cumulativeReturn(MONTHLY_RETURNS);
  const alpha = ytdReturn - benchmarkReturn;

  /* Risk */
  const beta = computePortfolioBeta(holdings, totalNav);
  const dailyVol = computeVol(holdings, totalNav);
  const annVol = annualVol(dailyVol);

  /* VaR (parametric, z-scores: 95%=1.645, 99%=2.326) */
  const var95_1d = totalNav * dailyVol * 1.645;
  const var99_1d = totalNav * dailyVol * 2.326;
  const var95_10d = var95_1d * Math.sqrt(10);
  const cvar95 = var95_1d * 1.35;

  /* Risk-adjusted ratios */
  const rfr = 0.142; // 10Y FGN yield (annualised)
  const rfrYtd = rfr * (5 / 12); // 5 months
  const sharpeRatio =
    annVol > 0 ? (ytdReturn - rfrYtd) / (dailyVol * Math.sqrt(126)) : 0;
  // Sortino uses downside deviation (approx 60% of total vol for this portfolio)
  const sortinoRatio =
    annVol > 0 ? (ytdReturn - rfrYtd) / (dailyVol * 0.6 * Math.sqrt(126)) : 0;
  const trackingError = 0.023; // historical, stored
  const maxDrawdown = -0.041; // historical, stored
  const informationRatio = trackingError > 0 ? alpha / trackingError : 0;

  /* Concentration & stress */
  const concentrationLimits = computeConcentration(holdings, targets, totalNav);
  const stressTests = computeStress(holdings, totalNav);

  /* Top holdings */
  const topHoldings = [...holdings]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 8)
    .map((h) => ({
      ...h,
      weight: totalNav > 0 ? (h.marketValue / totalNav) * 100 : 0,
    }));

  return {
    totalNav,
    totalCostBasis,
    unrealisedPnL,
    unrealisedPnLPct,
    ytdReturn,
    benchmarkReturn,
    alpha,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    trackingError,
    beta,
    informationRatio,
    var95_1d,
    var99_1d,
    var95_10d,
    cvar95,
    byClass,
    bySector,
    byGeo,
    byCurrency,
    concentrationLimits,
    stressTests,
    topHoldings,
    monthlyReturns: MONTHLY_RETURNS,
  };
}
