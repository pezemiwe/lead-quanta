/**
 * Module-level RBAC mapped to canonical platform personas.
 * Fine-grained workflow actions use platform-personas.ts (C/R/A/S/P/M/V).
 */

import type { PersonaRole } from "./platform-personas";

export type ModuleId =
  | "portfolio"
  | "deal-capture"
  | "market-data"
  | "valuation"
  | "performance"
  | "duration-risk"
  | "accounting"
  | "reporting"
  | "governance";

export type AccessLevel = "full" | "read-only" | "none";

type RoleMatrix = Record<ModuleId, AccessLevel>;

const FO_TRADER: RoleMatrix = {
  portfolio: "read-only",
  "deal-capture": "full",
  "market-data": "read-only",
  valuation: "read-only",
  performance: "read-only",
  "duration-risk": "none",
  accounting: "none",
  reporting: "read-only",
  governance: "none",
};

const PM: RoleMatrix = {
  portfolio: "full",
  "deal-capture": "read-only",
  "market-data": "read-only",
  valuation: "read-only",
  performance: "full",
  "duration-risk": "read-only",
  accounting: "read-only",
  reporting: "full",
  governance: "none",
};

const CONTROL: RoleMatrix = {
  portfolio: "read-only",
  "deal-capture": "read-only",
  "market-data": "read-only",
  valuation: "read-only",
  performance: "read-only",
  "duration-risk": "read-only",
  accounting: "read-only",
  reporting: "read-only",
  governance: "read-only",
};

const ALL_READ: RoleMatrix = {
  portfolio: "read-only",
  "deal-capture": "read-only",
  "market-data": "read-only",
  valuation: "read-only",
  performance: "read-only",
  "duration-risk": "read-only",
  accounting: "read-only",
  reporting: "read-only",
  governance: "read-only",
};

export const ROLE_ACCESS: Record<PersonaRole, RoleMatrix> = {
  "Money Market Trader": FO_TRADER,
  "Fixed Income Trader": { ...FO_TRADER, valuation: "read-only", "duration-risk": "read-only" },
  "Equity Trader": FO_TRADER,
  "Alternative Investment Officer": FO_TRADER,
  "Portfolio Manager": PM,
  "Head of Investments": { ...PM, governance: "read-only" },
  "Middle Office": CONTROL,
  "Risk Management": {
    ...CONTROL,
    "duration-risk": "full",
    valuation: "full",
  },
  Compliance: CONTROL,
  "Back Office": {
    ...CONTROL,
    "deal-capture": "full",
  },
  Finance: {
    portfolio: "read-only",
    "deal-capture": "read-only",
    "market-data": "none",
    valuation: "read-only",
    performance: "none",
    "duration-risk": "none",
    accounting: "full",
    reporting: "read-only",
    governance: "none",
  },
  "Treasury Cash Management": {
    portfolio: "read-only",
    "deal-capture": "read-only",
    "market-data": "read-only",
    valuation: "none",
    performance: "none",
    "duration-risk": "none",
    accounting: "read-only",
    reporting: "read-only",
    governance: "none",
  },
  "Investment Committee / ALCO": {
    portfolio: "read-only",
    "deal-capture": "read-only",
    "market-data": "read-only",
    valuation: "read-only",
    performance: "read-only",
    "duration-risk": "read-only",
    accounting: "read-only",
    reporting: "full",
    governance: "read-only",
  },
  "Internal Audit": ALL_READ,
  "System Administrator": {
    portfolio: "none",
    "deal-capture": "none",
    "market-data": "none",
    valuation: "none",
    performance: "none",
    "duration-risk": "none",
    accounting: "none",
    reporting: "none",
    governance: "full",
  },
};

export function getModuleAccess(role: string, moduleId: ModuleId): AccessLevel {
  return ROLE_ACCESS[role as PersonaRole]?.[moduleId] ?? "none";
}

export function canWrite(role: string, moduleId: ModuleId): boolean {
  return getModuleAccess(role, moduleId) === "full";
}
