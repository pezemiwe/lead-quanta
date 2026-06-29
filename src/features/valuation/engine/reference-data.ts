import type {
  Assumptions,
  Classification,
  CouponFrequency,
  Currency,
  Instrument,
  InstrumentType,
  YieldCurvePoint,
} from "./types";

/* ─── default valuation date ────────────────────────────── */
export const DEFAULT_VALUATION_DATE = "2026-05-28";

/* ─── yield curves ──────────────────────────────────────── */
export const DEFAULT_FGN_CURVE: YieldCurvePoint[] = [
  { tenorYears: 0.25, yield: 0.198 },
  { tenorYears: 0.5, yield: 0.2005 },
  { tenorYears: 1, yield: 0.204 },
  { tenorYears: 2, yield: 0.196 },
  { tenorYears: 3, yield: 0.193 },
  { tenorYears: 5, yield: 0.1885 },
  { tenorYears: 7, yield: 0.185 },
  { tenorYears: 10, yield: 0.182 },
  { tenorYears: 15, yield: 0.179 },
  { tenorYears: 20, yield: 0.176 },
  { tenorYears: 30, yield: 0.174 },
];

export const DEFAULT_USD_CURVE: YieldCurvePoint[] = [
  { tenorYears: 0.25, yield: 0.052 },
  { tenorYears: 0.5, yield: 0.054 },
  { tenorYears: 1, yield: 0.057 },
  { tenorYears: 2, yield: 0.063 },
  { tenorYears: 3, yield: 0.066 },
  { tenorYears: 5, yield: 0.069 },
  { tenorYears: 7, yield: 0.071 },
  { tenorYears: 10, yield: 0.072 },
];

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  valuationDate: DEFAULT_VALUATION_DATE,
  fgnYieldCurve: DEFAULT_FGN_CURVE,
  usdYieldCurve: DEFAULT_USD_CURVE,
  corporateSpread: 0.025,
  stateSpread: 0.015,
  fxUSD: 1580,
  fxGBP: 1980,
  fxEUR: 1720,
  taxRate: 0.3,
};

/* ─── seeded pseudo-random for reproducibility ──────────── */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => a + rand() * (b - a);

/* ─── helpers ───────────────────────────────────────────── */
function isoDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function shiftYears(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(y + years, m, d);
}

/* ─── 4 instruments straight from the spec ──────────────── */
const SPEC_INSTRUMENTS: Instrument[] = [
  {
    id: "INV-046",
    name: "FGN Bond 13.98% 2028",
    instrumentType: "FGN Bond",
    issuer: "FGN",
    sector: "Sovereign",
    classification: "AC",
    ifrs13Level: "L1",
    currency: "NGN",
    faceValue: 1_000_000_000,
    purchasePrice: 980_000_000,
    purchaseDate: "2021-02-23",
    maturityDate: "2028-02-23",
    couponRate: 0.1398,
    couponFrequency: "Semi",
    status: "Active",
  },
  {
    id: "INV-047",
    name: "FGN Bond 14.55% 2029",
    instrumentType: "FGN Bond",
    issuer: "FGN",
    sector: "Sovereign",
    classification: "FVOCI",
    ifrs13Level: "L1",
    currency: "NGN",
    faceValue: 500_000_000,
    purchasePrice: 485_000_000,
    purchaseDate: "2022-04-15",
    maturityDate: "2029-04-15",
    couponRate: 0.1455,
    couponFrequency: "Semi",
    status: "Active",
  },
  {
    id: "INV-039",
    name: "NNPC CP 270D",
    instrumentType: "Commercial Paper",
    issuer: "NNPC Ltd",
    sector: "Energy",
    classification: "FVTPL",
    ifrs13Level: "L2",
    currency: "NGN",
    faceValue: 400_000_000,
    purchasePrice: 345_200_000,
    purchaseDate: "2025-11-01",
    maturityDate: "2026-07-28",
    couponRate: 0,
    couponFrequency: "Zero",
    status: "Active",
  },
  {
    id: "INV-091",
    name: "FGN Eurobond 6.5% 2027",
    instrumentType: "Eurobond",
    issuer: "FGN",
    sector: "Sovereign",
    classification: "FVOCI",
    ifrs13Level: "L1",
    currency: "USD",
    faceValue: 10_000_000,
    purchasePrice: 9_850_000,
    purchaseDate: "2017-11-28",
    maturityDate: "2027-11-28",
    couponRate: 0.065,
    couponFrequency: "Semi",
    status: "Active",
  },
];

/* ─── catalogues for generator ──────────────────────────── */
const ISSUERS: Partial<
  Record<InstrumentType, { issuer: string; sector: string }[]>
> = {
  "FGN Bond": [{ issuer: "FGN", sector: "Sovereign" }],
  "State Bond": [
    { issuer: "Lagos State", sector: "Government" },
    { issuer: "Abuja FCT", sector: "Government" },
    { issuer: "Kano State", sector: "Government" },
    { issuer: "Delta State", sector: "Government" },
    { issuer: "Akwa Ibom State", sector: "Government" },
    { issuer: "Bayelsa State", sector: "Government" },
    { issuer: "Ekiti State", sector: "Government" },
    { issuer: "Kwara State", sector: "Government" },
    { issuer: "Edo State", sector: "Government" },
  ],
  "Corporate Bond": [
    { issuer: "Dangote Cement", sector: "Industrials" },
    { issuer: "Airtel Africa", sector: "Telecoms" },
    { issuer: "GTBank", sector: "Banking" },
    { issuer: "Zenith Bank", sector: "Banking" },
    { issuer: "NNPC", sector: "Energy" },
    { issuer: "Seplat", sector: "Energy" },
    { issuer: "Lafarge", sector: "Industrials" },
    { issuer: "UBA", sector: "Banking" },
    { issuer: "Stanbic IBTC", sector: "Banking" },
    { issuer: "Julius Berger", sector: "Construction" },
    { issuer: "Dangote Sugar", sector: "FMCG" },
    { issuer: "WAPCO", sector: "Industrials" },
    { issuer: "Total Energies", sector: "Energy" },
    { issuer: "Coronation Merchant", sector: "Banking" },
    { issuer: "FCMB", sector: "Banking" },
    { issuer: "Polaris Bank", sector: "Banking" },
    { issuer: "Nova Merchant", sector: "Banking" },
    { issuer: "Wema Bank", sector: "Banking" },
    { issuer: "Okomu Oil", sector: "Agric" },
    { issuer: "CAP Plc", sector: "Industrials" },
  ],
  Eurobond: [
    { issuer: "FGN", sector: "Sovereign" },
    { issuer: "GTB", sector: "Banking" },
    { issuer: "Zenith", sector: "Banking" },
    { issuer: "Access", sector: "Banking" },
    { issuer: "UBA", sector: "Banking" },
    { issuer: "Dangote", sector: "Industrials" },
    { issuer: "NNPC", sector: "Energy" },
    { issuer: "Ecobank", sector: "Banking" },
    { issuer: "MTN Nigeria", sector: "Telecoms" },
  ],
  "T-Bill": [{ issuer: "CBN / FGN", sector: "Money Market" }],
  "Commercial Paper": [
    { issuer: "Dangote Cement", sector: "Money Market" },
    { issuer: "MTN Nigeria", sector: "Money Market" },
    { issuer: "Flour Mills", sector: "Money Market" },
    { issuer: "Nestle Nigeria", sector: "Money Market" },
    { issuer: "Nigerian Breweries", sector: "Money Market" },
  ],
  "Promissory Note": [
    { issuer: "FGN Promissory Note", sector: "Money Market" },
  ],
  "Bank Placement": [
    { issuer: "Access Bank", sector: "Money Market" },
    { issuer: "Zenith Bank", sector: "Money Market" },
    { issuer: "GTBank", sector: "Money Market" },
  ],
  "Fixed Deposit": [
    { issuer: "First Bank", sector: "Money Market" },
    { issuer: "FCMB", sector: "Money Market" },
    { issuer: "Stanbic IBTC", sector: "Money Market" },
  ],
  "Mutual Fund": [
    { issuer: "ARM Investment", sector: "Collective Investment" },
    { issuer: "Stanbic Money Market", sector: "Collective Investment" },
    { issuer: "FBN Heritage Fund", sector: "Collective Investment" },
  ],
  Equity: [
    { issuer: "GTBank", sector: "Banking" },
    { issuer: "Zenith Bank", sector: "Banking" },
    { issuer: "Nestle Nigeria", sector: "FMCG" },
    { issuer: "GTCO", sector: "Banking" },
    { issuer: "UACN", sector: "Conglomerate" },
    { issuer: "Dangote Cement", sector: "Industrials" },
  ],
};

const TYPE_DEFAULTS: Record<
  InstrumentType,
  {
    classification: Classification[];
    coupon: { min: number; max: number };
    freq: CouponFrequency;
    tenorYears: { min: number; max: number };
    faceMin: number;
    faceMax: number;
    discountPct: { min: number; max: number };
    level: "L1" | "L2" | "L3";
  }
> = {
  "FGN Bond": {
    classification: ["AC", "FVOCI"],
    coupon: { min: 0.12, max: 0.225 },
    freq: "Semi",
    tenorYears: { min: 2, max: 25 },
    faceMin: 100_000_000,
    faceMax: 1_000_000_000,
    discountPct: { min: -0.05, max: 0.05 },
    level: "L1",
  },
  "State Bond": {
    classification: ["FVOCI"],
    coupon: { min: 0.135, max: 0.18 },
    freq: "Semi",
    tenorYears: { min: 4, max: 10 },
    faceMin: 50_000_000,
    faceMax: 500_000_000,
    discountPct: { min: -0.04, max: 0.04 },
    level: "L2",
  },
  "Corporate Bond": {
    classification: ["AC", "FVOCI"],
    coupon: { min: 0.14, max: 0.185 },
    freq: "Semi",
    tenorYears: { min: 3, max: 8 },
    faceMin: 30_000_000,
    faceMax: 500_000_000,
    discountPct: { min: -0.05, max: 0.05 },
    level: "L2",
  },
  Eurobond: {
    classification: ["FVOCI", "FVTPL"],
    coupon: { min: 0.0625, max: 0.095 },
    freq: "Semi",
    tenorYears: { min: 3, max: 12 },
    faceMin: 5_000_000,
    faceMax: 20_000_000,
    discountPct: { min: -0.02, max: 0.02 },
    level: "L1",
  },
  "T-Bill": {
    classification: ["AC", "FVTPL"],
    coupon: { min: 0, max: 0 },
    freq: "Zero",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 100_000_000,
    faceMax: 500_000_000,
    discountPct: { min: 0.05, max: 0.2 },
    level: "L1",
  },
  "Commercial Paper": {
    classification: ["FVTPL", "AC"],
    coupon: { min: 0, max: 0 },
    freq: "Zero",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 100_000_000,
    faceMax: 400_000_000,
    discountPct: { min: 0.06, max: 0.18 },
    level: "L2",
  },
  "Promissory Note": {
    classification: ["AC"],
    coupon: { min: 0, max: 0 },
    freq: "Zero",
    tenorYears: { min: 1, max: 3 },
    faceMin: 100_000_000,
    faceMax: 300_000_000,
    discountPct: { min: 0.05, max: 0.15 },
    level: "L2",
  },
  "Bank Placement": {
    classification: ["AC"],
    coupon: { min: 0.14, max: 0.22 },
    freq: "Quarterly",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 80_000_000,
    faceMax: 250_000_000,
    discountPct: { min: 0, max: 0 },
    level: "L2",
  },
  "Fixed Deposit": {
    classification: ["AC"],
    coupon: { min: 0.13, max: 0.2 },
    freq: "Quarterly",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 50_000_000,
    faceMax: 250_000_000,
    discountPct: { min: 0, max: 0 },
    level: "L2",
  },
  "Mutual Fund": {
    classification: ["FVTPL"],
    coupon: { min: 0, max: 0 },
    freq: "N/A",
    tenorYears: { min: 1, max: 5 },
    faceMin: 50_000_000,
    faceMax: 200_000_000,
    discountPct: { min: -0.2, max: -0.05 },
    level: "L2",
  },
  Equity: {
    classification: ["FVOCI", "FVTPL"],
    coupon: { min: 0, max: 0 },
    freq: "N/A",
    tenorYears: { min: 10, max: 20 },
    faceMin: 5_000_000,
    faceMax: 70_000_000,
    discountPct: { min: -0.2, max: -0.05 },
    level: "L1",
  },
};

const VALUATION_REFERENCE = new Date("2026-05-28T00:00:00Z");

function randomPurchaseAndMaturity(tenor: { min: number; max: number }): {
  purchase: string;
  maturity: string;
} {
  const totalTenor = between(tenor.min, tenor.max);
  // for some, the purchase date is in the past; for others may be recent
  const yearsHeld = between(0.1, Math.min(totalTenor - 0.1, 6));
  const purchaseDate = new Date(
    VALUATION_REFERENCE.getTime() - yearsHeld * 365.25 * 86_400_000,
  );
  const maturityDate = new Date(
    purchaseDate.getTime() + totalTenor * 365.25 * 86_400_000,
  );
  return {
    purchase: purchaseDate.toISOString().slice(0, 10),
    maturity: maturityDate.toISOString().slice(0, 10),
  };
}

function generateInstrument(id: string, type: InstrumentType): Instrument {
  const def = TYPE_DEFAULTS[type];
  const cat = ISSUERS[type] || [{ issuer: "Unknown", sector: "Other" }];
  const issuerInfo = pick(cat);
  const classification = pick(def.classification);
  const { purchase, maturity } = randomPurchaseAndMaturity(def.tenorYears);
  const faceValue =
    Math.round(between(def.faceMin, def.faceMax) / 1_000_000) * 1_000_000;
  const discountPct = between(def.discountPct.min, def.discountPct.max);
  const purchasePrice = Math.round(faceValue * (1 - discountPct));
  const coupon =
    def.coupon.max === 0
      ? 0
      : Math.round(between(def.coupon.min, def.coupon.max) * 10000) / 10000;

  const currency: Currency = type === "Eurobond" ? "USD" : "NGN";

  return {
    id,
    name: makeName(type, issuerInfo.issuer, coupon, maturity),
    instrumentType: type,
    issuer: issuerInfo.issuer,
    sector: issuerInfo.sector,
    classification,
    ifrs13Level: def.level,
    currency,
    faceValue:
      currency === "USD" ? Math.round(faceValue / 1000) * 1000 : faceValue,
    purchasePrice:
      currency === "USD"
        ? Math.round(purchasePrice / 1000) * 1000
        : purchasePrice,
    purchaseDate: purchase,
    maturityDate: maturity,
    couponRate: coupon,
    couponFrequency: def.freq,
    status: "Active",
  };
}

function makeName(
  type: InstrumentType,
  issuer: string,
  coupon: number,
  maturity: string,
): string {
  const yr = maturity.slice(0, 4);
  const pct = (coupon * 100).toFixed(2).replace(/\.00$/, "");
  switch (type) {
    case "FGN Bond":
      return `FGN Bond ${pct}% ${yr}`;
    case "State Bond":
      return `${issuer} Bond ${pct}% ${yr}`;
    case "Corporate Bond":
      return `${issuer} Bond ${pct}% ${yr}`;
    case "Eurobond":
      return `${issuer} Eurobond ${pct}% ${yr}`;
    case "T-Bill":
      return `T-Bill ${yr}`;
    case "Commercial Paper":
      return `${issuer} CP ${yr}`;
    case "Promissory Note":
      return `${issuer} ${yr}`;
    case "Bank Placement":
      return `${issuer} Placement ${pct}%`;
    case "Fixed Deposit":
      return `${issuer} FD ${pct}%`;
    case "Mutual Fund":
      return `${issuer} Fund`;
    case "Equity":
      return `${issuer} Equity`;
  }
}

/* ─── distribution of 200 instruments ───────────────────── */
const TYPE_PLAN: { type: InstrumentType; count: number }[] = [
  { type: "FGN Bond", count: 20 },
  { type: "Corporate Bond", count: 31 },
  { type: "Fixed Deposit", count: 25 },
  { type: "T-Bill", count: 15 },
  { type: "Commercial Paper", count: 15 },
  { type: "State Bond", count: 15 },
  { type: "Bank Placement", count: 15 },
  { type: "Mutual Fund", count: 15 },
  { type: "Promissory Note", count: 10 },
  { type: "Equity", count: 24 },
  { type: "Eurobond", count: 15 },
];

export const SAMPLE_INSTRUMENTS: Instrument[] = (() => {
  const list: Instrument[] = [...SPEC_INSTRUMENTS];
  const usedIds = new Set(list.map((i) => i.id));
  let n = 1;
  for (const { type, count } of TYPE_PLAN) {
    let added = 0;
    while (added < count) {
      let id = `INV-${String(n).padStart(3, "0")}`;
      n++;
      if (usedIds.has(id)) continue;
      list.push(generateInstrument(id, type));
      usedIds.add(id);
      added++;
    }
  }
  // sort by id
  list.sort((a, b) => a.id.localeCompare(b.id));
  return list;
})();
