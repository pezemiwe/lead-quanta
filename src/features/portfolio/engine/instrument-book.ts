/* ─────────────────────────────────────────────────────────
   Portfolio — Canonical Instrument Book
   ───────────────────────────────────────────────────────── */
/* Single source of truth for the deal-level instrument records
   consumed by downstream modules (IFRS 9, Valuation, Duration &
   Risk, Performance, Accounting). Each downstream feature
   re-exports from here so we never duplicate the book. */

export { SAMPLE_SECURITIES as BOOK_SECURITIES } from "../../ifrs9/engine/reference-data";
export { SAMPLE_INSTRUMENTS as BOOK_INSTRUMENTS } from "../../valuation/engine/reference-data";
export { HOLDINGS as BOOK_HOLDINGS } from "./reference-data";
