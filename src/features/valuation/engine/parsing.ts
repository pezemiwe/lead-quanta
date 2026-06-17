import type {
  Classification,
  CouponFrequency,
  Currency,
  Instrument,
  InstrumentType,
} from "./types";

export interface ParseResult {
  instruments: Instrument[];
  errors: { row: number; message: string }[];
}

const REQUIRED = [
  "id",
  "name",
  "instrumentType",
  "issuer",
  "sector",
  "classification",
  "currency",
  "faceValue",
  "purchasePrice",
  "purchaseDate",
  "maturityDate",
  "couponRate",
  "couponFrequency",
];

const TYPE_VALUES: InstrumentType[] = [
  "FGN Bond",
  "Corporate Bond",
  "State Bond",
  "Eurobond",
  "T-Bill",
  "Commercial Paper",
  "Promissory Note",
  "Bank Placement",
  "Fixed Deposit",
  "Mutual Fund",
  "Equity",
];

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export function parseInstrumentsCSV(text: string): ParseResult {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim());
  const errors: { row: number; message: string }[] = [];
  if (lines.length < 2)
    return { instruments: [], errors: [{ row: 0, message: "Empty file" }] };
  const header = splitCSVLine(lines[0]).map((h) => h.trim());
  for (const req of REQUIRED) {
    if (!header.includes(req))
      errors.push({ row: 0, message: `Missing column: ${req}` });
  }
  if (errors.length) return { instruments: [], errors };

  const instruments: Instrument[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitCSVLine(lines[r]);
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h] = (cells[i] ?? "").trim()));
    try {
      const inst: Instrument = {
        id: obj.id,
        name: obj.name,
        instrumentType: (TYPE_VALUES.includes(
          obj.instrumentType as InstrumentType,
        )
          ? obj.instrumentType
          : "Corporate Bond") as InstrumentType,
        issuer: obj.issuer,
        sector: obj.sector,
        classification: (obj.classification as Classification) || "AC",
        ifrs13Level: (obj.ifrs13Level as Instrument["ifrs13Level"]) || "L2",
        currency: (obj.currency as Currency) || "NGN",
        faceValue: Number(obj.faceValue),
        purchasePrice: Number(obj.purchasePrice),
        purchaseDate: obj.purchaseDate,
        maturityDate: obj.maturityDate,
        couponRate: Number(obj.couponRate),
        couponFrequency: (obj.couponFrequency as CouponFrequency) || "Semi",
        status: (obj.status as Instrument["status"]) || "Active",
        impairmentStage:
          (obj.impairmentStage as Instrument["impairmentStage"]) || "Stage 1",
        eclProvision: obj.eclProvision ? Number(obj.eclProvision) : 0,
      };
      if (!inst.id || !inst.name) {
        errors.push({ row: r + 1, message: "Missing id or name" });
        continue;
      }
      instruments.push(inst);
    } catch (e: unknown) {
      errors.push({ row: r + 1, message: String(e) });
    }
  }
  return { instruments, errors };
}

export const CSV_TEMPLATE_HEADER = REQUIRED.concat([
  "ifrs13Level",
  "status",
  "impairmentStage",
  "eclProvision",
]).join(",");

export function buildSampleCSV(): string {
  return `${CSV_TEMPLATE_HEADER}
INV-046,FGN Bond 13.98% 2028,FGN Bond,FGN,Sovereign,AC,NGN,1000000000,980000000,2021-02-23,2028-02-23,0.1398,Semi,L1,Active,Stage 2,2500000
INV-047,FGN Bond 14.55% 2029,FGN Bond,FGN,Sovereign,FVOCI,NGN,500000000,485000000,2022-04-15,2029-04-15,0.1455,Semi,L1,Active,Stage 2,1250000
INV-039,NNPC CP 270D,Commercial Paper,NNPC Ltd,Energy,FVTPL,NGN,400000000,345200000,2025-11-01,2026-07-28,0,Zero,L2,Active,N/A,0`;
}
