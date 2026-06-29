/**
 * Deterministic entity assignment for portfolio instruments.
 * Maps each instrument to one of the five Leadway entities based on
 * instrument type, sector, and a seeded position to achieve realistic
 * AUM split: LACL ~60%, LPFA ~25%, LCIL ~10%, LHL ~5%.
 */
import type { Instrument, InstrumentType } from "../../valuation/engine/types";
import type { EntityId } from "../../../context/entity";
import { ENTITIES } from "../../../context/entity";
import { DEFAULT_FGN_CURVE } from "../../valuation/engine/reference-data";
import { LIABILITY_POLICY_CLASSES } from "../../duration-risk/engine/reference-data";

export type EntityWithBenchmark = {
  id: EntityId;
  shortName: string;
  name: string;
  regulator: string;
  colour: string;
  benchmarkLabel: string;
  benchmarkYield: number;
  benchmarkType: "liability-driven" | "market";
  liabilityWAD?: number;
};

/* ── Type → entity weight tables ─────────────────────────── */
const TYPE_WEIGHTS: Record<
  InstrumentType,
  Partial<Record<EntityId, number>>
> = {
  "FGN Bond": { lacl: 0.60, lpfa: 0.35, lhl: 0.05 },
  "State Bond": { lacl: 0.85, lpfa: 0.15 },
  "Corporate Bond": { lacl: 0.55, lcil: 0.35, lpfa: 0.10 },
  Eurobond: { lacl: 0.70, lcil: 0.30 },
  "T-Bill": { lacl: 0.20, lpfa: 0.55, lhl: 0.25 },
  "Commercial Paper": { lcil: 0.60, lacl: 0.40 },
  "Promissory Note": { lacl: 0.80, lhl: 0.20 },
  "Bank Placement": { lacl: 0.45, lpfa: 0.35, lhl: 0.20 },
  "Fixed Deposit": { lacl: 0.50, lpfa: 0.30, lhl: 0.20 },
  "Mutual Fund": { lcil: 0.75, lacl: 0.25 },
  Equity: { lcil: 0.65, lacl: 0.35 },
};

function pickEntity(inst: Instrument, index: number): EntityId {
  const weights = TYPE_WEIGHTS[inst.instrumentType] ?? { lacl: 1.0 };
  const entries = Object.entries(weights) as [EntityId, number][];
  // Use instrument index as deterministic seed
  const r = ((index * 2654435761) >>> 0) / 4294967296;
  let cumulative = 0;
  for (const [id, w] of entries) {
    cumulative += w;
    if (r < cumulative) return id;
  }
  return entries[entries.length - 1][0];
}

/** Returns entity id for every instrument at the same index as BOOK_INSTRUMENTS */
export function assignEntities(instruments: Instrument[]): EntityId[] {
  return instruments.map((inst, i) => pickEntity(inst, i));
}

/* ── Benchmark definitions per entity ───────────────────── */

// Liability-driven benchmark for LACL: rate at the liability WAD on the FGN curve
function liabilityBenchmark(): number {
  const totalValue = LIABILITY_POLICY_CLASSES.reduce((s, c) => s + c.valueNGN, 0);
  const liabilityWAD =
    totalValue > 0
      ? LIABILITY_POLICY_CLASSES.reduce((s, c) => s + c.duration * c.valueNGN, 0) / totalValue
      : 8.0;

  // Interpolate FGN curve at liability WAD
  const curve = DEFAULT_FGN_CURVE;
  for (let i = 0; i < curve.length - 1; i++) {
    const lo = curve[i];
    const hi = curve[i + 1];
    if (liabilityWAD >= lo.tenorYears && liabilityWAD <= hi.tenorYears) {
      const t = (liabilityWAD - lo.tenorYears) / (hi.tenorYears - lo.tenorYears);
      return lo.yield + t * (hi.yield - lo.yield);
    }
  }
  return curve[curve.length - 1].yield;
}

function liabilityWAD(): number {
  const totalValue = LIABILITY_POLICY_CLASSES.reduce((s, c) => s + c.valueNGN, 0);
  return totalValue > 0
    ? LIABILITY_POLICY_CLASSES.reduce((s, c) => s + c.duration * c.valueNGN, 0) / totalValue
    : 8.0;
}

export const ENTITY_BENCHMARKS: EntityWithBenchmark[] = [
  {
    id: "lacl",
    shortName: "LACL",
    name: "Leadway Assurance Company Limited",
    regulator: "NAICOM",
    colour: "#F7941D",
    benchmarkLabel: "Liability-Matched Rate",
    benchmarkYield: liabilityBenchmark(),
    benchmarkType: "liability-driven",
    liabilityWAD: liabilityWAD(),
  },
  {
    id: "lpfa",
    shortName: "LPFA",
    name: "Leadway Pensure PFA Limited",
    regulator: "PENCOM",
    colour: "#1E3A5F",
    benchmarkLabel: "PENCOM Benchmark (91-day + 200bps)",
    benchmarkYield: 0.198 + 0.02, // 91-day T-Bill rate + 200bps
    benchmarkType: "market",
  },
  {
    id: "lhl",
    shortName: "LHL",
    name: "Leadway Health Limited",
    regulator: "NHIA",
    colour: "#1A7A4A",
    benchmarkLabel: "91-Day T-Bill Yield",
    benchmarkYield: 0.198,
    benchmarkType: "market",
  },
  {
    id: "lcil",
    shortName: "LCIL",
    name: "Leadway Capital & Investments Limited",
    regulator: "SEC",
    colour: "#7A5A1A",
    benchmarkLabel: "All-Assets Benchmark (FGN 10yr)",
    benchmarkYield: 0.182,
    benchmarkType: "market",
  },
  {
    id: "consolidated",
    shortName: "Group",
    name: "Leadway Holdings Group — Consolidated",
    regulator: "Multi-Regulator",
    colour: "#3A3A6A",
    benchmarkLabel: "Blended Group Benchmark",
    benchmarkYield: 0.189, // weighted avg of entity benchmarks
    benchmarkType: "market",
  },
];

export function getEntityBenchmark(id: EntityId): EntityWithBenchmark {
  return ENTITY_BENCHMARKS.find((e) => e.id === id) ?? ENTITY_BENCHMARKS[4];
}

export function getEntityInfo(id: EntityId) {
  return ENTITIES.find((e) => e.id === id);
}
