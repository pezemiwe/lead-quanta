/* ─────────────────────────────────────────────────────────
   Portfolio Canonical Computed Book
   Single authoritative pre-computation from all 204 instruments.
   All downstream modules (Deals, Performance, Accounting, Reporting)
   import from here rather than running the engine themselves.
   ───────────────────────────────────────────────────────── */
import { runPortfolioEngine } from "../../valuation/engine";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_FGN_CURVE,
  DEFAULT_USD_CURVE,
} from "../../valuation/engine/reference-data";
import { BOOK_INSTRUMENTS } from "./instrument-book";
import type {
  Instrument,
  InstrumentValuation,
  PortfolioResult,
} from "../../valuation/engine/types";

export const VALUATION_DATE = "2026-05-28";
export const FX_USD = 1580;

/** Pre-computed full portfolio result for all 204 instruments */
export const BOOK_COMPUTED: PortfolioResult = runPortfolioEngine(
  BOOK_INSTRUMENTS,
  DEFAULT_ASSUMPTIONS,
);

/** Flat list of per-instrument valuations — most modules need this */
export const BOOK_VALUATIONS: InstrumentValuation[] = BOOK_COMPUTED.valuations;

/** Re-export raw instruments for convenience */
export { BOOK_INSTRUMENTS };

/** Re-export yield curves */
export { DEFAULT_FGN_CURVE, DEFAULT_USD_CURVE };

export type { Instrument, InstrumentValuation, PortfolioResult };

/* ─────────────────────────────────────────────────────────
   Shared format helpers (used across all modules)
   ───────────────────────────────────────────────────────── */
export function fmtN(n: number, decimals = 0): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtCompact(n: number, ccy = "₦"): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${ccy}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${ccy}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${ccy}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${ccy}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${ccy}${abs.toFixed(0)}`;
}

export function fmtPct(n: number, dp = 2): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(dp)}%`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Open";
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() -
      new Date(a + "T00:00:00Z").getTime()) /
      86400000,
  );
}
