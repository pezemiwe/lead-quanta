import type {
  Security,
  Assumptions,
  Stage,
  SecurityComputed,
  EngineResult,
  AssetSpecification,
  StageSummary,
  SpecificationSummary,
} from "./types";
import {
  MOODY_PD_CUM,
  MOODY_RR,
  SP_SOV_FCY_PD_CUM,
  SP_SOV_LCY_PD_CUM,
  RATING_SCALE,
} from "./reference-data";

/* ──────────────────────────────────────────────────────────────
   DATE UTILS
   ────────────────────────────────────────────────────────────── */
const MS_PER_DAY = 86_400_000;
const MS_PER_MONTH = MS_PER_DAY * 30.4375;

const monthsBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / MS_PER_MONTH);

const daysBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);

/* ──────────────────────────────────────────────────────────────
   STAGING & CORE FIELDS
   ────────────────────────────────────────────────────────────── */
export function computeTTM(s: Security, reportingDate: Date): number {
  const months = monthsBetween(reportingDate, s.maturityDate);
  return Math.max(0, months);
}

export function computeMEIR(s: Security): number {
  const eir = s.eir >= 1 ? s.eir / 100 : s.eir;
  return eir / 12;
}

export function computeMCIR(s: Security): number {
  const c = s.couponRate >= 1 ? s.couponRate / 100 : s.couponRate;
  return c / 12;
}

export function computeLCD(s: Security, reportingDate: Date): number {
  if (!s.lastCouponDate) return 0;
  const m = monthsBetween(s.lastCouponDate, reportingDate);
  return Math.max(0, m);
}

export function computeDPDStage(dpd: number): Stage {
  if (dpd <= 30) return 1;
  if (dpd < 90) return 2;
  return 3;
}

export function computePerformanceStage(
  p: Security["performanceStatus"],
): Stage {
  const letter = p.charAt(0).toUpperCase();
  if (letter === "P") return 1;
  if (letter === "W") return 2;
  return 3;
}

export function computeExpiryStage(
  maturity: Date,
  reportingDate: Date,
): Stage | null {
  const threshold = new Date(reportingDate.getTime() + 90 * MS_PER_DAY);
  if (maturity.getTime() <= threshold.getTime()) return 3;
  return null;
}

export function computeModelStage(
  dpd: Stage,
  perf: Stage,
  exp: Stage | null,
): Stage {
  return Math.max(dpd, perf, exp ?? 0) as Stage;
}

export function computeFinalStage(model: Stage, override: number): Stage {
  if (override && override >= 1 && override <= 3) return override as Stage;
  return model;
}

/* ──────────────────────────────────────────────────────────────
   RATING MAPPING
   ────────────────────────────────────────────────────────────── */
function findScaleRow(
  rating: string,
  agency: string,
): (typeof RATING_SCALE)[number] | undefined {
  const colKey = ((): keyof (typeof RATING_SCALE)[number] | null => {
    const a = (agency || "").toLowerCase();
    if (a.includes("moody")) return "Moody";
    if (a.includes("s&p") || a.includes("sp") || a === "s and p") return "SP";
    if (a.includes("fitch")) return "Fitch";
    if (a.includes("gcr")) return "GCR";
    if (a.includes("agusto")) return "Agusto";
    if (a.includes("datapro")) return "Datapro";
    return null;
  })();
  if (!colKey) return undefined;
  return RATING_SCALE.find((r) => r[colKey] === rating);
}

export function mapRating(s: Security): string {
  const r = s.ratingAtReportingDate;
  const ag = s.ratingAgencyAtReportingDate;
  const targetCol: "Moody" | "SP" =
    s.assetSpecification === "Corporate" ? "Moody" : "SP";

  // If agency already matches target → keep
  const agLow = (ag || "").toLowerCase();
  if (targetCol === "Moody" && agLow.includes("moody")) return r;
  if (targetCol === "SP" && (agLow.includes("s&p") || agLow.includes("sp")))
    return r;

  const row = findScaleRow(r, ag);
  if (!row) return r;
  return row[targetCol];
}

/* ──────────────────────────────────────────────────────────────
   PD TERM STRUCTURE
   ────────────────────────────────────────────────────────────── */
function cumulativeToMarginal(cumPct: number[]): number[] {
  // values are cumulative %; convert to per-year marginal fractions
  const marginal: number[] = [];
  for (let i = 0; i < cumPct.length; i++) {
    const cur = cumPct[i] / 100;
    const prev = i === 0 ? 0 : cumPct[i - 1] / 100;
    marginal.push(Math.max(0, cur - prev));
  }
  return marginal;
}

function yearlyToMonthly(yearlyMarginal: number[]): number[] {
  // convert each yearly marginal PD into an equivalent monthly PD,
  // then expand into a per-month vector of length 12*N
  const months: number[] = [];
  for (const y of yearlyMarginal) {
    const m = 1 - Math.pow(1 - Math.min(0.999999, Math.max(0, y)), 1 / 12);
    for (let k = 0; k < 12; k++) months.push(m);
  }
  return months;
}

/**
 * Builds a per-month PD vector for a rating, blended across baseline / best /
 * worst FLI scenarios.  Output length = horizonYears * 12.
 */
export function buildPDTermStructure(
  cumulativePct: number[],
  assumptions: Assumptions,
): number[] {
  const marginal = cumulativeToMarginal(cumulativePct);
  const monthly = yearlyToMonthly(marginal); // length = years * 12

  const flatAt = (overlay: number[], m: number) =>
    overlay[Math.min(m, overlay.length - 1)] ?? 1;

  const scenarioWeighted: number[] = monthly.map((p, m) => {
    const base = p * flatAt(assumptions.baseline, m);
    const best = p * flatAt(assumptions.bestCase, m);
    const worse = p * flatAt(assumptions.worseCase, m);
    return (
      base * assumptions.weights.baseline +
      best * assumptions.weights.bestCase +
      worse * assumptions.weights.worseCase
    );
  });

  // unconditional weighting via cumulative survival
  const out: number[] = [];
  let survival = 1;
  for (let m = 0; m < scenarioWeighted.length; m++) {
    const p = Math.min(0.999999, Math.max(0, scenarioWeighted[m]));
    out.push(survival * p);
    survival *= 1 - p;
  }
  return out;
}

function pdTableFor(spec: AssetSpecification): Record<string, number[]> {
  if (spec === "Corporate") return MOODY_PD_CUM;
  if (spec === "Sovereign FCY") return SP_SOV_FCY_PD_CUM;
  return SP_SOV_LCY_PD_CUM;
}

/* ──────────────────────────────────────────────────────────────
   LGD
   ────────────────────────────────────────────────────────────── */
function bucketCorporateForRR(rating: string): string {
  if (rating === "Aaa") return "Aaa";
  if (rating.startsWith("C")) return "Caa-C";
  // strip trailing digit  Aa1 → Aa, Baa3 → Baa, B2 → B
  const trimmed = rating.replace(/\d+$/, "");
  if (MOODY_RR[trimmed]) return trimmed;
  // Fallback
  return "Baa";
}

export function computeLGD(
  s: Security,
  ratingEq: string,
  sovereignRR: number,
): { lgd: number[]; bucket: string } {
  if (s.assetSpecification !== "Corporate") {
    const lgd = Array(5).fill(1 - sovereignRR);
    return { lgd, bucket: "Sovereign" };
  }
  const bucket = bucketCorporateForRR(ratingEq);
  const rr = MOODY_RR[bucket] ?? MOODY_RR.Baa;
  // recovery rates supplied as percentages
  const lgd = rr.map((r) => 1 - r / 100);
  return { lgd, bucket };
}

/* ──────────────────────────────────────────────────────────────
   EAD PROJECTION
   ────────────────────────────────────────────────────────────── */
function paymentsPerYear(freq: Security["couponRepayment"]): number {
  switch (freq) {
    case "MONTHLY":
      return 12;
    case "QUARTERLY":
      return 4;
    case "SEMI-ANNUALLY":
    case "HALF-YEARLY":
      return 2;
    case "ANNUALLY":
    case "YEARLY":
      return 1;
    case "BULLET":
    default:
      return 0;
  }
}

export function projectEAD(
  s: Security,
  ttm: number,
  meir: number,
  mcir: number,
  lcd: number,
): number[] {
  const carrying = s.carryingAmountLcy;
  if (ttm <= 0) return [carrying];

  const piy = paymentsPerYear(s.couponRepayment);
  const couponLcy =
    piy > 0 ? mcir * (12 / piy) * s.redemptionValueAcy * s.fxRate : 0;

  const ead: number[] = [];
  let bal = carrying;
  for (let m = 0; m < ttm; m++) {
    bal = bal * (1 + meir);
    if (piy > 0 && lcd >= 0) {
      const period = 12 / piy;
      const offset = (lcd + m) % period;
      if (Math.round(offset) === 0 && m > 0) {
        bal -= couponLcy;
      }
    }
    ead.push(Math.max(0, bal));
  }
  return ead;
}

/* ──────────────────────────────────────────────────────────────
   ECL
   ────────────────────────────────────────────────────────────── */
export function computeECLForRow(c: SecurityComputed): number {
  const { finalStage, ttm, ead, pd, lgd, meir, carryingAmountLcy } = c;
  if (finalStage === 3) {
    return carryingAmountLcy * lgd[0];
  }
  const horizon = finalStage === 1 ? Math.min(ttm, 12) : Math.min(ttm, 180);
  let ecl = 0;
  for (let m = 0; m < horizon; m++) {
    const pdM = pd[m] ?? 0;
    const lgdIdx = Math.min(
      Math.max(Math.ceil((m + 1) / 12) - 1, 0),
      lgd.length - 1,
    );
    const lgdM = lgd[lgdIdx];
    const eadM = ead[Math.min(m, ead.length - 1)];
    const disc = Math.pow(1 + meir, -(m + 1));
    ecl += pdM * lgdM * eadM * disc;
  }
  return ecl;
}

/* ──────────────────────────────────────────────────────────────
   RUN ENGINE
   ────────────────────────────────────────────────────────────── */
export function runEngine(
  securities: Security[],
  assumptions: Assumptions,
): EngineResult {
  const rows: SecurityComputed[] = securities.map((s) => {
    const ttm = computeTTM(s, assumptions.reportingDate);
    const meir = computeMEIR(s);
    const mcir = computeMCIR(s);
    const lcd = computeLCD(s, assumptions.reportingDate);
    const dpdStage = computeDPDStage(s.daysPastDue);
    const performanceStage = computePerformanceStage(s.performanceStatus);
    const expiryStage = computeExpiryStage(
      s.maturityDate,
      assumptions.reportingDate,
    );
    const modelStage = computeModelStage(
      dpdStage,
      performanceStage,
      expiryStage,
    );
    const finalStage = computeFinalStage(
      modelStage,
      s.qualitativeStagingOverride,
    );

    const ratingEquivalent = mapRating(s);
    const pdTable = pdTableFor(s.assetSpecification);
    const cum =
      pdTable[ratingEquivalent] ?? pdTable.B ?? Object.values(pdTable)[0];
    const pd = buildPDTermStructure(cum, assumptions);

    const { lgd, bucket } = computeLGD(
      s,
      ratingEquivalent,
      assumptions.sovereignRecoveryRate,
    );
    const ead = projectEAD(s, ttm, meir, mcir, lcd);

    const partial: SecurityComputed = {
      ...s,
      ttm,
      meir,
      mcir,
      lcd,
      dpdStage,
      performanceStage,
      expiryStage,
      modelStage,
      finalStage,
      ratingEquivalent,
      rrRating: bucket,
      pd,
      lgd,
      ead,
      ecl: 0,
      coverageRatio: 0,
    };
    partial.ecl = computeECLForRow(partial);
    partial.coverageRatio =
      partial.carryingAmountLcy > 0
        ? partial.ecl / partial.carryingAmountLcy
        : 0;
    return partial;
  });

  // STAGE SUMMARY
  const stageBuckets: Record<
    Stage,
    { exposure: number; impairment: number; count: number }
  > = {
    1: { exposure: 0, impairment: 0, count: 0 },
    2: { exposure: 0, impairment: 0, count: 0 },
    3: { exposure: 0, impairment: 0, count: 0 },
  };
  for (const r of rows) {
    stageBuckets[r.finalStage].exposure += r.carryingAmountLcy;
    stageBuckets[r.finalStage].impairment += r.ecl;
    stageBuckets[r.finalStage].count += 1;
  }
  const byStage: StageSummary[] = ([1, 2, 3] as Stage[]).map((st) => {
    const b = stageBuckets[st];
    return {
      stage: st,
      exposure: b.exposure,
      impairment: b.impairment,
      count: b.count,
      coverageRatio: b.exposure > 0 ? b.impairment / b.exposure : 0,
    };
  });
  const totalExposure = byStage.reduce((a, b) => a + b.exposure, 0);
  const totalImpairment = byStage.reduce((a, b) => a + b.impairment, 0);
  byStage.push({
    stage: "TOTAL",
    exposure: totalExposure,
    impairment: totalImpairment,
    count: rows.length,
    coverageRatio: totalExposure > 0 ? totalImpairment / totalExposure : 0,
  });

  // SPECIFICATION SUMMARY
  const specs: AssetSpecification[] = [
    "Corporate",
    "Sovereign FCY",
    "Sovereign LCY",
  ];
  const bySpecification: SpecificationSummary[] = specs.map((sp) => {
    const matched = rows.filter((r) => r.assetSpecification === sp);
    const exposure = matched.reduce((a, b) => a + b.carryingAmountLcy, 0);
    const impairment = matched.reduce((a, b) => a + b.ecl, 0);
    return {
      specification: sp,
      exposure,
      impairment,
      count: matched.length,
      coverageRatio: exposure > 0 ? impairment / exposure : 0,
    };
  });
  bySpecification.push({
    specification: "TOTAL",
    exposure: totalExposure,
    impairment: totalImpairment,
    count: rows.length,
    coverageRatio: totalExposure > 0 ? totalImpairment / totalExposure : 0,
  });

  return {
    rows,
    byStage,
    bySpecification,
    totals: {
      exposureLcy: totalExposure,
      impairmentLcy: totalImpairment,
      coverageRatio: totalExposure > 0 ? totalImpairment / totalExposure : 0,
      instrumentCount: rows.length,
    },
  };
}

/* re-exports for convenience */
export { daysBetween };
