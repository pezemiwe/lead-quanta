import type { ReactNode } from "react";
import { Tooltip } from "./tooltip";

/** Full expansions for common finance acronyms used throughout the platform. */
export const GLOSSARY: Record<string, string> = {
  AC: "Amortised Cost",
  FVOCI: "Fair Value through Other Comprehensive Income",
  FVTPL: "Fair Value through Profit & Loss",
  OCI: "Other Comprehensive Income",
  EIR: "Effective Interest Rate",
  DV01: "Dollar Value of 1 Basis Point — ₦ change per 1bp yield move",
  PV01: "Price Value of 1 Basis Point",
  ECL: "Expected Credit Loss",
  "P&L": "Profit & Loss",
  GL: "General Ledger",
  NAV: "Net Asset Value",
  PD: "Probability of Default",
  LGD: "Loss Given Default",
  EAD: "Exposure at Default",
  SICR: "Significant Increase in Credit Risk",
  BS: "Balance Sheet",
  CCY: "Currency",
  Freq: "Coupon Payment Frequency",
  YTM: "Yield to Maturity",
  YTD: "Year to Date",
  "G/L": "Gain / (Loss)",
  GIPS: "Global Investment Performance Standards",
  ALCO: "Asset & Liability Committee",
  IC: "Investment Committee",
  CBN: "Central Bank of Nigeria",
  SEC: "Securities & Exchange Commission",
  IPS: "Investment Policy Statement",
  IFRS: "International Financial Reporting Standards",
};

type AcronymTipProps = {
  /** The acronym to look up in the glossary, or label for `full` override. */
  term: string;
  /** Override the tooltip text (bypasses GLOSSARY lookup). */
  full?: string;
  /** Optional children — wraps them in the tooltip instead of rendering term text. */
  children?: ReactNode;
};

/**
 * Wraps an acronym with a tooltip showing its full expansion.
 *
 * - Without `children`: renders the term with a subtle dotted underline as a hint.
 * - With `children`: wraps them in the tooltip (e.g. around a Badge).
 */
export function AcronymTip({ term, full, children }: AcronymTipProps) {
  const tooltip = full ?? GLOSSARY[term] ?? term;

  if (children) {
    return (
      <Tooltip content={tooltip} delay={200}>
        <span>{children}</span>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={tooltip} delay={200}>
      <span className="cursor-help border-b border-dashed border-current/40">
        {term}
      </span>
    </Tooltip>
  );
}
