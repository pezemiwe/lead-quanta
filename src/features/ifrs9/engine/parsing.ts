import type {
  AssetSpecification,
  CouponFrequency,
  PerformanceStatus,
  Security,
} from "./types";

/* ──────────────────────────────────────────────────────────────
   CSV PARSING
   ────────────────────────────────────────────────────────────── */

/** Split a single CSV line respecting double-quoted fields. */
function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Parse dd/MM/yyyy or yyyy-MM-dd dates */
function parseDate(s: string): Date {
  const t = s.trim();
  if (!t) return new Date(NaN);
  if (t.includes("/")) {
    const [d, m, y] = t.split("/").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  if (t.includes("-") && t.length >= 8) {
    // ISO yyyy-MM-dd
    const [y, m, d] = t.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  return new Date(t);
}

const num = (s: string): number => {
  const cleaned = s.replace(/[,\s]/g, "").replace(/%$/, "");
  if (cleaned === "" || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
};

/** Normalise header → canonical key */
function normaliseHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Map of canonical header → Security property */
const HEADER_MAP: Record<string, keyof Security | "_unknown"> = {
  sn: "sn",
  s_n: "sn",
  counterparty: "counterparty",
  currency: "currency",
  ccy: "currency",
  assetspecification: "assetSpecification",
  specification: "assetSpecification",
  purchaseconsiderationacy: "purchaseConsiderationAcy",
  purchaseconsiderationlcy: "purchaseConsiderationLcy",
  redemptionvalueacy: "redemptionValueAcy",
  redemptionvaluelcy: "redemptionValueLcy",
  carryingamountacy: "carryingAmountAcy",
  carryingamountlcy: "carryingAmountLcy",
  fxrate: "fxRate",
  fx: "fxRate",
  collateralamount: "collateralAmount",
  collateraltype: "collateralType",
  originationdate: "originationDate",
  maturitydate: "maturityDate",
  lastcoupondate: "lastCouponDate",
  eir: "eir",
  couponrate: "couponRate",
  ratingatorigination: "ratingAtOriginationDate",
  ratingatoriginationdate: "ratingAtOriginationDate",
  ratingagencyatorigination: "ratingAgencyAtOriginationDate",
  ratingagencyatoriginationdate: "ratingAgencyAtOriginationDate",
  ratingatreporting: "ratingAtReportingDate",
  ratingatreportingdate: "ratingAtReportingDate",
  ratingagencyatreporting: "ratingAgencyAtReportingDate",
  ratingagencyatreportingdate: "ratingAgencyAtReportingDate",
  couponrepayment: "couponRepayment",
  performancestatus: "performanceStatus",
  dayspastdue: "daysPastDue",
  dpd: "daysPastDue",
  qualitativestagingoverride: "qualitativeStagingOverride",
  override: "qualitativeStagingOverride",
};

const ASSET_SPEC_ALIASES: Record<string, AssetSpecification> = {
  corporate: "Corporate",
  sovereignfcy: "Sovereign FCY",
  sovereignlcy: "Sovereign LCY",
};

const PERF_ALIASES: Record<string, PerformanceStatus> = {
  performing: "Performing",
  watchlist: "Watchlist",
  watch: "Watchlist",
  substandard: "Substandard",
  doubtful: "Doubtful",
  loss: "Loss",
  default: "Default",
};

const FREQ_ALIASES: Record<string, CouponFrequency> = {
  monthly: "MONTHLY",
  quarterly: "QUARTERLY",
  semiannually: "SEMI-ANNUALLY",
  semiannual: "SEMI-ANNUALLY",
  halfyearly: "HALF-YEARLY",
  annually: "ANNUALLY",
  annual: "ANNUALLY",
  yearly: "YEARLY",
  bullet: "BULLET",
};

export interface ParseSecuritiesResult {
  securities: Security[];
  errors: { row: number; message: string }[];
}

export function parseSecuritiesCSV(text: string): ParseSecuritiesResult {
  const errors: { row: number; message: string }[] = [];
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    return { securities: [], errors: [{ row: 0, message: "File is empty" }] };
  }

  const headers = splitCSVLine(lines[0]).map(normaliseHeader);
  const securities: Security[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const key = HEADER_MAP[h];
      if (key && key !== "_unknown") obj[key] = cells[idx] ?? "";
    });

    const specRaw = (obj.assetSpecification || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const assetSpec = ASSET_SPEC_ALIASES[specRaw];
    if (!assetSpec) {
      errors.push({
        row: i,
        message: `Unknown asset specification "${obj.assetSpecification}"`,
      });
      continue;
    }

    const perfRaw = (obj.performanceStatus || "performing")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const performanceStatus = PERF_ALIASES[perfRaw] ?? "Performing";

    const freqRaw = (obj.couponRepayment || "bullet")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const couponRepayment = FREQ_ALIASES[freqRaw] ?? "BULLET";

    securities.push({
      sn: num(obj.sn) || i,
      counterparty: obj.counterparty || `Instrument ${i}`,
      currency: (obj.currency || "NGN").toUpperCase(),
      assetSpecification: assetSpec,
      purchaseConsiderationAcy: num(obj.purchaseConsiderationAcy),
      purchaseConsiderationLcy: num(obj.purchaseConsiderationLcy),
      redemptionValueAcy: num(obj.redemptionValueAcy),
      redemptionValueLcy: num(obj.redemptionValueLcy),
      carryingAmountAcy: num(obj.carryingAmountAcy),
      fxRate: num(obj.fxRate) || 1,
      carryingAmountLcy: num(obj.carryingAmountLcy),
      collateralAmount: num(obj.collateralAmount),
      collateralType: obj.collateralType || "UNSECURED",
      originationDate: parseDate(obj.originationDate),
      maturityDate: parseDate(obj.maturityDate),
      lastCouponDate: parseDate(obj.lastCouponDate),
      eir: num(obj.eir),
      couponRate: num(obj.couponRate),
      ratingAtOriginationDate: obj.ratingAtOriginationDate || "-",
      ratingAgencyAtOriginationDate: obj.ratingAgencyAtOriginationDate || "-",
      ratingAtReportingDate: obj.ratingAtReportingDate || "-",
      ratingAgencyAtReportingDate: obj.ratingAgencyAtReportingDate || "-",
      couponRepayment,
      performanceStatus,
      daysPastDue: num(obj.daysPastDue),
      qualitativeStagingOverride: num(obj.qualitativeStagingOverride),
    });
  }

  return { securities, errors };
}
