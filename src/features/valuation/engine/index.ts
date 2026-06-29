/* ───────────────────────────────────────────────────────────
   Valuation Engine — Calculations
   Fixed income amortisation, EIR, cash-flow PV, OCI, risk.
   ─────────────────────────────────────────────────────────── */

import type {
  AmortRow,
  Assumptions,
  CashFlowRow,
  Classification,
  CouponFrequency,
  Currency,
  Instrument,
  InstrumentType,
  InstrumentValuation,
  IncomeSummary,
  MaturityBucket,
  OCIRow,
  PortfolioByClassification,
  PortfolioBySector,
  PortfolioByType,
  PortfolioResult,
  RiskMetrics,
  TopExposure,
  YieldCurvePoint,
} from "./types";

/* ─── date helpers ──────────────────────────────────────── */
const MS_DAY = 86_400_000;

export function parseDate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}

export function yearsBetween(a: Date, b: Date): number {
  return daysBetween(a, b) / 365.25;
}

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCMonth(r.getUTCMonth() + months);
  // handle month overflow
  if (r.getUTCDate() < day) r.setUTCDate(0);
  return r;
}

/* ─── coupon frequency ──────────────────────────────────── */
export function periodsPerYear(freq: CouponFrequency): number {
  switch (freq) {
    case "Annual":
      return 1;
    case "Semi":
      return 2;
    case "Quarterly":
      return 4;
    case "Monthly":
      return 12;
    default:
      return 0;
  }
}

export function monthsPerPeriod(freq: CouponFrequency): number {
  switch (freq) {
    case "Annual":
      return 12;
    case "Semi":
      return 6;
    case "Quarterly":
      return 3;
    case "Monthly":
      return 1;
    default:
      return 0;
  }
}

/* ─── build coupon dates from purchase → maturity ───────── */
export function couponDates(inst: Instrument): Date[] {
  const purchase = parseDate(inst.purchaseDate);
  const maturity = parseDate(inst.maturityDate);
  const months = monthsPerPeriod(inst.couponFrequency);
  if (months === 0) return [maturity]; // zero coupon / equity / N/A
  const dates: Date[] = [];
  // generate forward from purchase
  let d = addMonths(purchase, months);
  while (d.getTime() < maturity.getTime()) {
    dates.push(d);
    d = addMonths(d, months);
  }
  dates.push(maturity);
  return dates;
}

/* ─── EIR solver (Newton on price-from-cf) ───────────────── */
export function priceAtYield(
  cashFlows: { t: number; cf: number }[],
  y: number,
  periodsYear: number,
): number {
  if (periodsYear === 0) {
    // zero coupon — t is in years
    return cashFlows.reduce((s, c) => s + c.cf / Math.pow(1 + y, c.t), 0);
  }
  const r = y / periodsYear;
  return cashFlows.reduce((s, c) => s + c.cf / Math.pow(1 + r, c.t), 0);
}

export function solveEIR(
  cashFlows: { t: number; cf: number }[],
  price: number,
  periodsYear: number,
  guess = 0.1,
): number {
  let y = guess;
  for (let iter = 0; iter < 100; iter++) {
    const f = priceAtYield(cashFlows, y, periodsYear) - price;
    // numeric derivative
    const h = 1e-6;
    const fp =
      (priceAtYield(cashFlows, y + h, periodsYear) -
        priceAtYield(cashFlows, y - h, periodsYear)) /
      (2 * h);
    if (Math.abs(fp) < 1e-12) break;
    const step = f / fp;
    y -= step;
    if (Math.abs(step) < 1e-10) return y;
    if (y < -0.5) y = -0.5;
    if (y > 5) y = 5;
  }
  return y;
}

/* ─── amortisation schedule (AC / FVOCI) ─────────────────── */
export function buildAmortSchedule(
  inst: Instrument,
  valuationDate: Date,
): { schedule: AmortRow[]; eir: number } {
  const dates = couponDates(inst);
  const ppy = periodsPerYear(inst.couponFrequency);
  const couponCF = ppy > 0 ? (inst.faceValue * inst.couponRate) / ppy : 0;

  // Build cash flow array for EIR
  const cfArr = dates.map((_, i) => {
    const isFinal = i === dates.length - 1;
    return {
      t: i + 1,
      cf: couponCF + (isFinal ? inst.faceValue : 0),
    };
  });

  let eir: number;
  if (ppy === 0) {
    // zero coupon — annualised
    const years = yearsBetween(parseDate(inst.purchaseDate), dates[0]);
    eir =
      years > 0
        ? Math.pow(inst.faceValue / inst.purchasePrice, 1 / years) - 1
        : 0;
  } else {
    eir = solveEIR(cfArr, inst.purchasePrice, ppy, inst.couponRate || 0.1);
  }

  const periodRate = ppy > 0 ? eir / ppy : 0;
  const schedule: AmortRow[] = [];
  let opening = inst.purchasePrice;

  // Determine "Current" period — the one containing valuationDate
  for (let i = 0; i < dates.length; i++) {
    const eirIncome = ppy > 0 ? opening * periodRate : 0;
    const amort = eirIncome - couponCF;
    const closing = opening + amort;
    const cfDate = dates[i];

    let status: AmortRow["status"];
    const prev = i === 0 ? parseDate(inst.purchaseDate) : dates[i - 1];
    if (cfDate.getTime() < valuationDate.getTime()) status = "Past";
    else if (
      prev.getTime() <= valuationDate.getTime() &&
      cfDate.getTime() >= valuationDate.getTime()
    )
      status = "Current";
    else status = "Future";

    schedule.push({
      period: i + 1,
      date: toISO(cfDate),
      openingBalance: opening,
      eirIncome,
      couponCF,
      amortisation: amort,
      closingBalance: closing,
      status,
    });

    // force last closing to face value to remove rounding drift
    if (i === dates.length - 1) {
      schedule[i].closingBalance = inst.faceValue;
      schedule[i].amortisation = inst.faceValue - opening;
      schedule[i].eirIncome = schedule[i].amortisation + couponCF;
    }
    opening = schedule[i].closingBalance;
  }

  return { schedule, eir };
}

/* ─── AC carrying value at valuation date (linear interp) ─ */
export function interpolatedCarryingValue(
  schedule: AmortRow[],
  purchaseDate: Date,
  valuationDate: Date,
): number {
  if (schedule.length === 0) return 0;
  // find bracketing period
  let prevDate = purchaseDate;
  let prevBal = schedule[0].openingBalance;
  for (const row of schedule) {
    const rowDate = parseDate(row.date);
    if (rowDate.getTime() >= valuationDate.getTime()) {
      const total = daysBetween(prevDate, rowDate);
      const elapsed = daysBetween(prevDate, valuationDate);
      const frac = total > 0 ? elapsed / total : 0;
      return prevBal + (row.closingBalance - prevBal) * frac;
    }
    prevDate = rowDate;
    prevBal = row.closingBalance;
  }
  return prevBal;
}

/* ─── accrued interest at valuation date ────────────────── */
export function accruedInterest(
  inst: Instrument,
  schedule: AmortRow[],
  valuationDate: Date,
): number {
  const ppy = periodsPerYear(inst.couponFrequency);
  if (ppy === 0) return 0;
  const couponCF = (inst.faceValue * inst.couponRate) / ppy;

  // find current period bounds
  let periodStart = parseDate(inst.purchaseDate);
  for (const row of schedule) {
    const rowDate = parseDate(row.date);
    if (rowDate.getTime() >= valuationDate.getTime()) {
      const total = daysBetween(periodStart, rowDate);
      const elapsed = daysBetween(periodStart, valuationDate);
      const frac = total > 0 ? Math.max(0, elapsed / total) : 0;
      return couponCF * frac;
    }
    periodStart = rowDate;
  }
  return 0;
}

/* ─── yield curve interpolation ─────────────────────────── */
export function interpolateYield(
  curve: YieldCurvePoint[],
  tenorYears: number,
): number {
  if (curve.length === 0) return 0;
  if (tenorYears <= curve[0].tenorYears) return curve[0].yield;
  if (tenorYears >= curve[curve.length - 1].tenorYears)
    return curve[curve.length - 1].yield;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (tenorYears >= a.tenorYears && tenorYears <= b.tenorYears) {
      const frac = (tenorYears - a.tenorYears) / (b.tenorYears - a.tenorYears);
      return a.yield + (b.yield - a.yield) * frac;
    }
  }
  return curve[curve.length - 1].yield;
}

/* ─── cash flow schedule with PV at market yield ────────── */
export function buildCashFlowSchedule(
  inst: Instrument,
  valuationDate: Date,
  marketYield: number,
): { rows: CashFlowRow[]; totalFuturePV: number } {
  const dates = couponDates(inst);
  const ppy = periodsPerYear(inst.couponFrequency);
  const couponCF = ppy > 0 ? (inst.faceValue * inst.couponRate) / ppy : 0;

  let totalFuturePV = 0;
  const rows: CashFlowRow[] = dates.map((d, i) => {
    const isFinal = i === dates.length - 1;
    const amount =
      ppy === 0 ? inst.faceValue : couponCF + (isFinal ? inst.faceValue : 0);
    const daysToCF = daysBetween(valuationDate, d);
    const t = daysToCF / 365.25;
    const isFuture = d.getTime() >= valuationDate.getTime();
    const isCurrent = Math.abs(d.getTime() - valuationDate.getTime()) < MS_DAY;
    let pv: number | null = null;
    if (isFuture) {
      const disc = 1 / Math.pow(1 + marketYield, t);
      pv = amount * disc;
      totalFuturePV += pv;
    }
    let type: CashFlowRow["type"];
    if (ppy === 0) type = "Principal";
    else if (isFinal) type = "Coupon + Principal";
    else type = "Coupon";
    return {
      period: i + 1,
      date: toISO(d),
      type,
      amount,
      daysToCF,
      pvOfCF: pv,
      status: isCurrent
        ? "Future"
        : d.getTime() < valuationDate.getTime()
          ? "Past"
          : "Future",
    };
  });

  return { rows, totalFuturePV };
}

/* ─── OCI movement (FVOCI only) ─────────────────────────── */
export function buildOCIMovement(
  inst: Instrument,
  schedule: AmortRow[],
  marketYield: number,
): OCIRow[] {
  // For each period, FV is calculated as PV of remaining cash flows at marketYield
  const ppy = periodsPerYear(inst.couponFrequency);
  const couponCF = ppy > 0 ? (inst.faceValue * inst.couponRate) / ppy : 0;
  const dates = couponDates(inst);
  const N = dates.length;

  const rows: OCIRow[] = schedule.map((row, idx) => {
    // remaining periods from this date onward
    let fv = 0;
    for (let j = idx + 1; j < N; j++) {
      const isFinal = j === N - 1;
      const amt = couponCF + (isFinal ? inst.faceValue : 0);
      const periods = j - idx;
      const r = ppy > 0 ? marketYield / ppy : marketYield;
      fv += amt / Math.pow(1 + r, periods);
    }
    // if this is the final period, FV = faceValue (already received)
    if (idx === N - 1) fv = inst.faceValue;
    return {
      period: row.period,
      date: row.date,
      acCarryingValue: row.closingBalance,
      fairValueEst: fv,
      ociReserve: fv - row.closingBalance,
    };
  });
  return rows;
}

/* ─── risk metrics (Macaulay/Modified duration, DV01, convexity) ─── */
export function riskMetrics(
  inst: Instrument,
  rows: CashFlowRow[],
  marketYield: number,
  valuationDate: Date,
  fairValue: number,
): RiskMetrics {
  const future = rows.filter((r) => r.status === "Future" && r.pvOfCF != null);
  let mac = 0;
  let convex = 0;
  for (const r of future) {
    const t = r.daysToCF / 365.25;
    mac += t * (r.pvOfCF || 0);
    convex += t * (t + 1) * (r.pvOfCF || 0);
  }
  const macaulay = fairValue > 0 ? mac / fairValue : 0;
  const modified = macaulay / (1 + marketYield);
  const convexity =
    fairValue > 0 ? convex / (fairValue * Math.pow(1 + marketYield, 2)) : 0;
  const dv01 = modified * fairValue * 0.0001;

  const maturity = parseDate(inst.maturityDate);
  const remaining = yearsBetween(valuationDate, maturity);

  // next coupon
  const nextCF = future.find((r) => r.type !== "Principal");
  const nextCouponDate = nextCF ? nextCF.date : null;
  const nextCouponAmount = nextCF
    ? nextCF.type === "Coupon + Principal"
      ? nextCF.amount - inst.faceValue
      : nextCF.amount
    : 0;
  const daysToNext = nextCF ? nextCF.daysToCF : null;

  return {
    remainingTenorYears: remaining,
    macaulayDuration: macaulay,
    modifiedDuration: modified,
    dv01,
    convexity,
    nextCouponDate,
    nextCouponAmount,
    daysToNextCoupon: daysToNext,
  };
}

/* ─── yield curve / spread selection ────────────────────── */
function pickYieldCurve(
  inst: Instrument,
  assumptions: Assumptions,
  valuationDate: Date,
): { curve: YieldCurvePoint[]; spread: number; label: string } {
  const valDate = toISO(valuationDate);
  if (inst.currency !== "NGN") {
    return {
      curve: assumptions.usdYieldCurve,
      spread:
        inst.instrumentType === "Corporate Bond" ||
        inst.instrumentType === "Eurobond"
          ? assumptions.corporateSpread
          : 0,
      label: `USD Benchmark — ${valDate}`,
    };
  }
  let spread = 0;
  if (
    inst.instrumentType === "Corporate Bond" ||
    inst.instrumentType === "Commercial Paper" ||
    inst.instrumentType === "Promissory Note"
  )
    spread = assumptions.corporateSpread;
  else if (inst.instrumentType === "State Bond")
    spread = assumptions.stateSpread;
  return {
    curve: assumptions.fgnYieldCurve,
    spread,
    label: `FGN Sovereign — ${valDate}`,
  };
}

/* ─── FX rate ───────────────────────────────────────────── */
export function fxRate(currency: Currency, a: Assumptions): number {
  switch (currency) {
    case "NGN":
      return 1;
    case "USD":
      return a.fxUSD;
    case "GBP":
      return a.fxGBP;
    case "EUR":
      return a.fxEUR;
  }
}

/* ─── main per-instrument valuation ─────────────────────── */
export function valueInstrument(
  inst: Instrument,
  assumptions: Assumptions,
): InstrumentValuation {
  const valDate = parseDate(assumptions.valuationDate);
  const purchaseDate = parseDate(inst.purchaseDate);
  const maturity = parseDate(inst.maturityDate);

  // ─ Equity special case ─
  if (inst.instrumentType === "Equity") {
    const fv = inst.marketPrice ?? inst.purchasePrice;
    const fx = fxRate(inst.currency, assumptions);
    return {
      instrument: inst,
      eir: 0,
      discountAtPurchase: 0,
      amortSchedule: [],
      acCarryingValue: fv,
      accruedInterest: 0,
      totalBookValueDirty: fv,
      cleanFairValue: fv,
      dirtyFairValue: fv,
      cashFlowSchedule: [],
      totalFuturePV: fv,
      ociReserve: fv - inst.purchasePrice,
      ociMovement: [],
      unrealisedGL: fv - inst.purchasePrice,
      marketYieldUsed: 0,
      yieldCurveLabel: "Market Price (Equity)",
      annualEIRIncome: 0,
      risk: {
        remainingTenorYears: 0,
        macaulayDuration: 0,
        modifiedDuration: 0,
        dv01: 0,
        convexity: 0,
        nextCouponDate: null,
        nextCouponAmount: 0,
        daysToNextCoupon: null,
      },
      balanceSheetValueNGN: fv * fx,
      balanceSheetValueUSD: (fv * fx) / assumptions.fxUSD,
    };
  }

  const { schedule, eir } = buildAmortSchedule(inst, valDate);
  const ac = interpolatedCarryingValue(schedule, purchaseDate, valDate);
  const accrued = accruedInterest(inst, schedule, valDate);

  // pick market yield
  const { curve, spread, label } = pickYieldCurve(inst, assumptions, valDate);
  const remainingYrs = Math.max(0, yearsBetween(valDate, maturity));
  const interpolated =
    inst.marketYield ?? interpolateYield(curve, remainingYrs) + spread;

  const { rows, totalFuturePV } = buildCashFlowSchedule(
    inst,
    valDate,
    interpolated,
  );

  const cleanFV = inst.marketPrice ?? totalFuturePV - accrued; // dirty PV → clean
  const dirtyFV = cleanFV + accrued;

  const oci =
    inst.classification === "FVOCI"
      ? buildOCIMovement(inst, schedule, interpolated)
      : [];

  const risk = riskMetrics(inst, rows, interpolated, valDate, totalFuturePV);

  const fx = fxRate(inst.currency, assumptions);

  // Balance sheet value depends on classification
  let bsLocal: number;
  if (inst.classification === "AC") bsLocal = ac;
  else bsLocal = cleanFV;

  return {
    instrument: inst,
    eir,
    discountAtPurchase: inst.faceValue - inst.purchasePrice,
    amortSchedule: schedule,
    acCarryingValue: ac,
    accruedInterest: accrued,
    totalBookValueDirty: ac + accrued,
    cleanFairValue: cleanFV,
    dirtyFairValue: dirtyFV,
    cashFlowSchedule: rows,
    totalFuturePV,
    ociReserve: cleanFV - ac,
    ociMovement: oci,
    unrealisedGL: cleanFV - inst.purchasePrice,
    marketYieldUsed: interpolated,
    yieldCurveLabel: label,
    annualEIRIncome: ac * eir,
    risk,
    balanceSheetValueNGN: bsLocal * fx,
    balanceSheetValueUSD: (bsLocal * fx) / assumptions.fxUSD,
  };
}

/* ─── portfolio rollup ──────────────────────────────────── */
const MATURITY_BUCKETS: {
  bucket: string;
  minDays: number;
  maxDays: number;
}[] = [
  { bucket: "Matured", minDays: -100000, maxDays: 0 },
  { bucket: "0-3 Months", minDays: 0, maxDays: 90 },
  { bucket: "3-6 Months", minDays: 90, maxDays: 180 },
  { bucket: "6-12 Months", minDays: 180, maxDays: 365 },
  { bucket: "1-2 Years", minDays: 365, maxDays: 730 },
  { bucket: "2-5 Years", minDays: 730, maxDays: 1826 },
  { bucket: "5-10 Years", minDays: 1826, maxDays: 3652 },
  { bucket: "10+ Years", minDays: 3652, maxDays: 100000 },
];

export function runPortfolioEngine(
  instruments: Instrument[],
  assumptions: Assumptions,
): PortfolioResult {
  const valuations = instruments.map((i) => valueInstrument(i, assumptions));

  const totalFaceValueNGN = valuations.reduce(
    (s, v) =>
      s + v.instrument.faceValue * fxRate(v.instrument.currency, assumptions),
    0,
  );
  const totalBSValueNGN = valuations.reduce(
    (s, v) => s + v.balanceSheetValueNGN,
    0,
  );
  const totalFaceValueUSD = totalFaceValueNGN / assumptions.fxUSD;
  const totalBSValueUSD = totalBSValueNGN / assumptions.fxUSD;
  const totalOCIReserveNGN = valuations
    .filter((v) => v.instrument.classification === "FVOCI")
    .reduce(
      (s, v) => s + v.ociReserve * fxRate(v.instrument.currency, assumptions),
      0,
    );
  const totalFVTPLGLNGN = valuations
    .filter((v) => v.instrument.classification === "FVTPL")
    .reduce(
      (s, v) => s + v.unrealisedGL * fxRate(v.instrument.currency, assumptions),
      0,
    );

  /* by classification */
  const classes: Classification[] = ["AC", "FVOCI", "FVTPL"];
  const byClassification: PortfolioByClassification[] = classes.map((c) => {
    const subset = valuations.filter((v) => v.instrument.classification === c);
    return {
      classification: c,
      count: subset.length,
      faceValueNGN: subset.reduce(
        (s, v) =>
          s +
          v.instrument.faceValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      bsValueNGN: subset.reduce((s, v) => s + v.balanceSheetValueNGN, 0),
    };
  });

  /* by type */
  const typeMap = new Map<InstrumentType, PortfolioByType>();
  for (const v of valuations) {
    const t = v.instrument.instrumentType;
    const cur = typeMap.get(t) ?? {
      type: t,
      count: 0,
      faceValueNGN: 0,
      bsValueNGN: 0,
    };
    cur.count++;
    cur.faceValueNGN +=
      v.instrument.faceValue * fxRate(v.instrument.currency, assumptions);
    cur.bsValueNGN += v.balanceSheetValueNGN;
    typeMap.set(t, cur);
  }
  const byType = [...typeMap.values()].sort(
    (a, b) => b.bsValueNGN - a.bsValueNGN,
  );

  /* by sector */
  const sectorMap = new Map<string, PortfolioBySector>();
  for (const v of valuations) {
    const s = v.instrument.sector;
    const cur = sectorMap.get(s) ?? {
      sector: s,
      count: 0,
      faceValueNGN: 0,
      bsValueNGN: 0,
      pctOfPortfolio: 0,
    };
    cur.count++;
    cur.faceValueNGN +=
      v.instrument.faceValue * fxRate(v.instrument.currency, assumptions);
    cur.bsValueNGN += v.balanceSheetValueNGN;
    sectorMap.set(s, cur);
  }
  const bySector = [...sectorMap.values()].sort(
    (a, b) => b.faceValueNGN - a.faceValueNGN,
  );
  for (const r of bySector) {
    r.pctOfPortfolio =
      totalFaceValueNGN > 0 ? r.faceValueNGN / totalFaceValueNGN : 0;
  }

  /* maturity profile */
  const valDate = parseDate(assumptions.valuationDate);
  const maturityProfile: MaturityBucket[] = MATURITY_BUCKETS.map((b) => ({
    ...b,
    count: 0,
    faceValueNGN: 0,
  }));
  for (const v of valuations) {
    const days = daysBetween(valDate, parseDate(v.instrument.maturityDate));
    const bucket = maturityProfile.find(
      (b) => days > b.minDays && days <= b.maxDays,
    );
    if (bucket) {
      bucket.count++;
      bucket.faceValueNGN +=
        v.instrument.faceValue * fxRate(v.instrument.currency, assumptions);
    }
  }

  /* top exposures */
  const topExposures: TopExposure[] = [...valuations]
    .sort((a, b) => b.balanceSheetValueNGN - a.balanceSheetValueNGN)
    .slice(0, 10)
    .map((v, i) => ({
      rank: i + 1,
      id: v.instrument.id,
      name: v.instrument.name,
      type: v.instrument.instrumentType,
      classification: v.instrument.classification,
      bsValueNGN: v.balanceSheetValueNGN,
    }));

  /* income summary */
  const acSet = valuations.filter((v) => v.instrument.classification === "AC");
  const fvociSet = valuations.filter(
    (v) => v.instrument.classification === "FVOCI",
  );
  const fvtplSet = valuations.filter(
    (v) => v.instrument.classification === "FVTPL",
  );
  const income: IncomeSummary = {
    ac: {
      instruments: acSet.length,
      totalCarryingValueNGN: acSet.reduce(
        (s, v) =>
          s + v.acCarryingValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalAccruedInterestNGN: acSet.reduce(
        (s, v) =>
          s + v.accruedInterest * fxRate(v.instrument.currency, assumptions),
        0,
      ),
    },
    fvoci: {
      instruments: fvociSet.length,
      totalACCarryingValueNGN: fvociSet.reduce(
        (s, v) =>
          s + v.acCarryingValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalFairValueNGN: fvociSet.reduce(
        (s, v) =>
          s + v.cleanFairValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalOCIReserveNGN: fvociSet.reduce(
        (s, v) => s + v.ociReserve * fxRate(v.instrument.currency, assumptions),
        0,
      ),
    },
    fvtpl: {
      instruments: fvtplSet.length,
      totalFairValueNGN: fvtplSet.reduce(
        (s, v) =>
          s + v.cleanFairValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalUnrealisedGLNGN: fvtplSet.reduce(
        (s, v) =>
          s + v.unrealisedGL * fxRate(v.instrument.currency, assumptions),
        0,
      ),
    },
  };

  return {
    valuations,
    totals: {
      instruments: instruments.length,
      totalFaceValueNGN,
      totalBSValueNGN,
      totalFaceValueUSD,
      totalBSValueUSD,
      totalOCIReserveNGN,
      totalFVTPLUnrealisedGLNGN: totalFVTPLGLNGN,
    },
    byClassification,
    byType,
    bySector,
    maturityProfile,
    topExposures,
    income,
  };
}
