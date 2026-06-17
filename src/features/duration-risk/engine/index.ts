/* ───────────────────────────────────────────────────────────
   Duration & Risk Engine — Calculations
   ─────────────────────────────────────────────────────────── */

import type { Assumptions, Instrument } from "../../valuation/engine/types";
import {
  buildCashFlowSchedule,
  fxRate,
  parseDate,
  valueInstrument,
  yearsBetween,
} from "../../valuation/engine";
import {
  CURVE_SCENARIOS,
  DURATION_EXCLUDED_TYPES,
  CASHFLOW_EXCLUDED_TYPES,
  MATURITY_BUCKETS_ORDER,
  NIGERIAN_SCENARIOS,
  PARALLEL_SHOCKS_BPS,
} from "./reference-data";
import type {
  ALMBucketRow,
  ALMResult,
  ByGroupRow,
  CashflowBucketRow,
  ConvexityCurvePoint,
  DurationHistogramRow,
  DurationMap,
  DurationRow,
  LiabilityBucket,
  ScenarioImpact,
  StressRow,
  RiskTotals,
} from "./types";

/* ─── helpers ───────────────────────────────────────────── */
function isShortEnd(tenor: number): boolean {
  return tenor <= 2.0;
}

function assignBucket(tenor: number): string {
  if (tenor <= 0.25) return "0-3 Months";
  if (tenor <= 0.5) return "3-6 Months";
  if (tenor <= 1.0) return "6-12 Months";
  if (tenor <= 2.0) return "1-2 Years";
  if (tenor <= 5.0) return "2-5 Years";
  if (tenor <= 10.0) return "5-10 Years";
  return "10+ Years";
}

function dateBucket(days: number): string {
  if (days <= 90) return "0-3 Months";
  if (days <= 180) return "3-6 Months";
  if (days <= 365) return "6-12 Months";
  if (days <= 730) return "1-2 Years";
  if (days <= 1825) return "2-5 Years";
  if (days <= 3650) return "5-10 Years";
  return "10+ Years";
}

function weightedAvg(values: number[], weights: number[]): number {
  let w = 0;
  let s = 0;
  for (let i = 0; i < values.length; i++) {
    w += weights[i];
    s += values[i] * weights[i];
  }
  return w > 0 ? s / w : 0;
}

/* ─── shocked value (local currency) ────────────────────── */
export function shockedValueLocal(
  inst: Instrument,
  assumptions: Assumptions,
  baseYield: number,
  bps: number,
): number {
  const valDate = parseDate(assumptions.valuationDate);
  const maturity = parseDate(inst.maturityDate);
  const remaining = yearsBetween(valDate, maturity);
  if (remaining <= 0) return inst.faceValue;
  const shockedYield = Math.max(0.0001, baseYield + bps / 10_000);

  // Zero coupon / discount instruments
  if (
    inst.couponRate === 0 ||
    inst.couponFrequency === "Zero" ||
    inst.couponFrequency === "N/A"
  ) {
    return inst.faceValue / (1 + shockedYield * remaining);
  }

  // Coupon-bearing — PV of future cash flows at shocked yield
  const { totalFuturePV } = buildCashFlowSchedule(inst, valDate, shockedYield);
  return totalFuturePV;
}

/* ─── build duration row for a single instrument ────────── */
function buildDurationRow(
  inst: Instrument,
  assumptions: Assumptions,
): DurationRow | null {
  if (DURATION_EXCLUDED_TYPES.has(inst.instrumentType)) return null;
  const valDate = parseDate(assumptions.valuationDate);
  const maturity = parseDate(inst.maturityDate);
  const remaining = yearsBetween(valDate, maturity);
  if (remaining <= 0) return null;

  const val = valueInstrument(inst, assumptions);
  const fx = fxRate(inst.currency, assumptions);
  const base = val.cleanFairValue || val.acCarryingValue || 0;

  const dv01Local = val.risk.dv01;
  const dv01NGN = dv01Local * fx;

  return {
    id: inst.id,
    name: inst.name,
    type: inst.instrumentType,
    issuer: inst.issuer,
    sector: inst.sector,
    classification: inst.classification,
    currency: inst.currency,
    faceValue: inst.faceValue,
    bsValueNGN: val.balanceSheetValueNGN,
    baseValueLocal: base,
    couponRate: inst.couponRate,
    marketYield: val.marketYieldUsed,
    remainingTenor: remaining,
    macaulayDur: val.risk.macaulayDuration,
    modifiedDur: val.risk.modifiedDuration,
    dv01Local,
    dv01NGN,
    convexity: val.risk.convexity,
    maturityDate: inst.maturityDate,
    purchaseDate: inst.purchaseDate,
  };
}

/* ─── duration table for the whole portfolio ────────────── */
export function buildDurationTable(
  instruments: Instrument[],
  assumptions: Assumptions,
): DurationRow[] {
  const out: DurationRow[] = [];
  for (const inst of instruments) {
    const r = buildDurationRow(inst, assumptions);
    if (r) out.push(r);
  }
  return out;
}

/* ─── stress table ──────────────────────────────────────── */
export function buildStressTable(
  instruments: Instrument[],
  durationRows: DurationRow[],
  assumptions: Assumptions,
  shocks: number[] = PARALLEL_SHOCKS_BPS,
): StressRow[] {
  const map = new Map(instruments.map((i) => [i.id, i]));
  return durationRows.map((d) => {
    const inst = map.get(d.id)!;
    const fx = fxRate(inst.currency, assumptions);
    const baseLocal = d.baseValueLocal;
    const baseNGN = baseLocal * fx;

    const shockValues: Record<number, number> = {};
    const pnl: Record<number, number> = {};
    for (const bps of shocks) {
      const sLocal =
        bps === 0
          ? baseLocal
          : shockedValueLocal(inst, assumptions, d.marketYield, bps);
      const sNGN = sLocal * fx;
      shockValues[bps] = sNGN;
      pnl[bps] = sNGN - baseNGN;
    }

    return {
      id: d.id,
      name: d.name,
      type: d.type,
      sector: d.sector,
      classification: d.classification,
      baseValueNGN: baseNGN,
      shockValues,
      pnl,
    };
  });
}

/* ─── cash-flow projection by maturity bucket ──────────── */
export function buildCashflowProjection(
  instruments: Instrument[],
  assumptions: Assumptions,
): CashflowBucketRow[] {
  const valDate = parseDate(assumptions.valuationDate);
  const buckets: Record<string, { coupon: number; principal: number }> = {};
  for (const b of MATURITY_BUCKETS_ORDER)
    buckets[b] = { coupon: 0, principal: 0 };

  for (const inst of instruments) {
    if (CASHFLOW_EXCLUDED_TYPES.has(inst.instrumentType)) continue;
    const maturity = parseDate(inst.maturityDate);
    if (maturity.getTime() <= valDate.getTime()) continue;

    const fx = fxRate(inst.currency, assumptions);
    const { rows } = buildCashFlowSchedule(
      inst,
      valDate,
      inst.marketYield ?? inst.couponRate ?? 0.18,
    );

    for (const cf of rows) {
      if (cf.status !== "Future") continue;
      const cfDate = parseDate(cf.date);
      const days = Math.round(
        (cfDate.getTime() - valDate.getTime()) / 86_400_000,
      );
      const b = dateBucket(days);
      if (!buckets[b]) continue;

      if (cf.type === "Principal") {
        buckets[b].principal += cf.amount * fx;
      } else if (cf.type === "Coupon + Principal") {
        buckets[b].principal += inst.faceValue * fx;
        buckets[b].coupon += (cf.amount - inst.faceValue) * fx;
      } else {
        buckets[b].coupon += cf.amount * fx;
      }
    }
  }

  return MATURITY_BUCKETS_ORDER.map((b) => ({
    bucket: b,
    coupon: buckets[b].coupon,
    principal: buckets[b].principal,
    total: buckets[b].coupon + buckets[b].principal,
  }));
}

/* ─── curve reshaping scenarios ─────────────────────────── */
export function runCurveScenarios(
  instruments: Instrument[],
  durationRows: DurationRow[],
  assumptions: Assumptions,
): ScenarioImpact[] {
  const map = new Map(instruments.map((i) => [i.id, i]));
  return CURVE_SCENARIOS.map((scen) => {
    let total = 0;
    for (const d of durationRows) {
      const inst = map.get(d.id);
      if (!inst) continue;
      const fx = fxRate(inst.currency, assumptions);
      const bps = isShortEnd(d.remainingTenor) ? scen.shortBps : scen.longBps;
      const shocked = shockedValueLocal(inst, assumptions, d.marketYield, bps);
      total += (shocked - d.baseValueLocal) * fx;
    }
    return { name: scen.name, totalNGN: total, ociNGN: 0, plNGN: 0 };
  });
}

/* ─── Nigerian / macro scenarios ────────────────────────── */
export function runNigerianScenarios(
  instruments: Instrument[],
  durationRows: DurationRow[],
  assumptions: Assumptions,
): ScenarioImpact[] {
  const map = new Map(instruments.map((i) => [i.id, i]));
  return NIGERIAN_SCENARIOS.map((scen) => {
    let total = 0;
    let oci = 0;
    let pl = 0;
    for (const d of durationRows) {
      const inst = map.get(d.id);
      if (!inst) continue;
      const isUSD = inst.currency === "USD";
      const bps = isUSD ? scen.usdShock : scen.ngnShock;
      const shocked = shockedValueLocal(inst, assumptions, d.marketYield, bps);
      const baseFX = isUSD ? assumptions.fxUSD : 1;
      const shockedFX = isUSD
        ? assumptions.fxUSD * (1 + scen.fxShock / 100)
        : 1;
      const pnl = shocked * shockedFX - d.baseValueLocal * baseFX;
      total += pnl;
      if (d.classification === "FVOCI") oci += pnl;
      else if (d.classification === "FVTPL") pl += pnl;
    }
    return { name: scen.name, totalNGN: total, ociNGN: oci, plNGN: pl };
  });
}

/* ─── ALM gap analysis ──────────────────────────────────── */
export function computeALMGap(
  durationRows: DurationRow[],
  liabilities: LiabilityBucket[],
): ALMResult {
  // group assets by bucket
  const assetMap: Record<string, { value: number; weightedDur: number }> = {};
  for (const b of MATURITY_BUCKETS_ORDER) {
    assetMap[b] = { value: 0, weightedDur: 0 };
  }
  for (const d of durationRows) {
    const b = assignBucket(d.remainingTenor);
    if (!assetMap[b]) continue;
    assetMap[b].value += d.bsValueNGN;
    assetMap[b].weightedDur += d.modifiedDur * d.bsValueNGN;
  }
  const liabMap = new Map(liabilities.map((l) => [l.bucket, l]));

  let totalAsset = 0;
  let totalLiab = 0;
  let totalAssetDV01 = 0;
  let totalLiabDV01 = 0;
  const buckets: ALMBucketRow[] = MATURITY_BUCKETS_ORDER.map((b) => {
    const av = assetMap[b].value;
    const ad = av > 0 ? assetMap[b].weightedDur / av : 0;
    const lb = liabMap.get(b);
    const lv = lb?.valueNGN ?? 0;
    const ld = lb?.duration ?? 0;
    totalAsset += av;
    totalLiab += lv;
    totalAssetDV01 += av * ad * 0.0001;
    totalLiabDV01 += lv * ld * 0.0001;
    return {
      bucket: b,
      assetValue: av,
      assetDur: ad,
      liabValue: lv,
      liabDur: ld,
      gap: av - lv,
      durGap: ad - ld,
    };
  });

  const wtdAssetDur = weightedAvg(
    durationRows.map((d) => d.modifiedDur),
    durationRows.map((d) => d.bsValueNGN),
  );
  const totalLiabValue = liabilities.reduce((s, l) => s + l.valueNGN, 0);
  const wtdLiabDur =
    totalLiabValue > 0
      ? liabilities.reduce((s, l) => s + l.duration * l.valueNGN, 0) /
        totalLiabValue
      : 0;

  return {
    buckets,
    totalAssetNGN: totalAsset,
    totalLiabNGN: totalLiab,
    wtdAssetDur,
    wtdLiabDur,
    durationGap: wtdAssetDur - wtdLiabDur,
    dv01Gap: totalAssetDV01 - totalLiabDV01,
  };
}

/* ─── by-group rollups (sector, type, classification) ───── */
function rollupBy(
  rows: DurationRow[],
  key: (r: DurationRow) => string,
): ByGroupRow[] {
  const groups: Record<string, DurationRow[]> = {};
  for (const r of rows) {
    const k = key(r);
    (groups[k] = groups[k] ?? []).push(r);
  }
  return Object.entries(groups)
    .map(([group, items]) => {
      const w = items.map((i) => i.bsValueNGN);
      return {
        group,
        count: items.length,
        wtdMacaulay: weightedAvg(
          items.map((i) => i.macaulayDur),
          w,
        ),
        wtdModified: weightedAvg(
          items.map((i) => i.modifiedDur),
          w,
        ),
        wtdConvexity: weightedAvg(
          items.map((i) => i.convexity),
          w,
        ),
        totalDV01: items.reduce((s, i) => s + i.dv01NGN, 0),
        totalBSValueNGN: items.reduce((s, i) => s + i.bsValueNGN, 0),
      };
    })
    .sort((a, b) => b.totalDV01 - a.totalDV01);
}

export function rollupBySector(rows: DurationRow[]): ByGroupRow[] {
  return rollupBy(rows, (r) => r.sector);
}

export function rollupByType(rows: DurationRow[]): ByGroupRow[] {
  return rollupBy(rows, (r) => r.type);
}

export function rollupByClassification(rows: DurationRow[]): ByGroupRow[] {
  return rollupBy(rows, (r) => r.classification);
}

/* ─── portfolio totals ──────────────────────────────────── */
export function computeRiskTotals(
  durationRows: DurationRow[],
  stressRows: StressRow[],
): RiskTotals {
  const w = durationRows.map((d) => d.bsValueNGN);
  return {
    instruments: durationRows.length,
    totalBSValueNGN: durationRows.reduce((s, d) => s + d.bsValueNGN, 0),
    totalDV01: durationRows.reduce((s, d) => s + d.dv01NGN, 0),
    wtdMacaulayDur: weightedAvg(
      durationRows.map((d) => d.macaulayDur),
      w,
    ),
    wtdModifiedDur: weightedAvg(
      durationRows.map((d) => d.modifiedDur),
      w,
    ),
    wtdConvexity: weightedAvg(
      durationRows.map((d) => d.convexity),
      w,
    ),
    ir100bp: stressRows.reduce((s, r) => s + (r.pnl[100] ?? 0), 0),
    ir200bp: stressRows.reduce((s, r) => s + (r.pnl[200] ?? 0), 0),
  };
}

/* ─── map by id ─────────────────────────────────────────── */
export function indexById(rows: DurationRow[]): DurationMap {
  const out: DurationMap = {};
  for (const r of rows) out[r.id] = r;
  return out;
}
/* ─── duration histogram ───────────────────────────────── */
const HIST_BUCKETS: { label: string; max: number }[] = [
  { label: "0-6M", max: 0.5 },
  { label: "6M-1Y", max: 1.0 },
  { label: "1-2Y", max: 2.0 },
  { label: "2-3Y", max: 3.0 },
  { label: "3-5Y", max: 5.0 },
  { label: "5-7Y", max: 7.0 },
  { label: "7-10Y", max: 10.0 },
  { label: "10-15Y", max: 15.0 },
  { label: "15Y+", max: Infinity },
];

export function buildDurationHistogram(
  durationRows: DurationRow[],
): DurationHistogramRow[] {
  const counts: Record<string, number> = {};
  for (const b of HIST_BUCKETS) counts[b.label] = 0;
  for (const r of durationRows) {
    const b = HIST_BUCKETS.find((h) => r.modifiedDur <= h.max);
    if (b) counts[b.label]++;
  }
  return HIST_BUCKETS.map((b) => ({ bucket: b.label, count: counts[b.label] }));
}

/* ─── price/yield convexity curve ────────────────────────── */
export function buildConvexityCurve(
  stressRows: StressRow[],
): ConvexityCurvePoint[] {
  const baseNGN = stressRows.reduce((s, r) => s + r.baseValueNGN, 0);
  return PARALLEL_SHOCKS_BPS.map((bps) => {
    const val =
      bps === 0
        ? baseNGN
        : stressRows.reduce(
            (s, r) => s + (r.shockValues[bps] ?? r.baseValueNGN),
            0,
          );
    return {
      shock: bps,
      portfolioNGN: val,
      pct: baseNGN > 0 ? ((val - baseNGN) / baseNGN) * 100 : 0,
    };
  });
}
/* ─── re-exports ────────────────────────────────────────── */
export {
  PARALLEL_SHOCKS_BPS,
  CURVE_SCENARIOS,
  NIGERIAN_SCENARIOS,
} from "./reference-data";
