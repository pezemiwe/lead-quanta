/**
 * Role-based access control for all Leadway Quanta modules.
 * AccessLevel:
 *   "full"      — read + write + all CRUD actions
 *   "read-only" — can view all data, no mutations
 *   "none"      — module hidden/locked; direct URL navigated to /modules
 */

export type ModuleId =
  | "portfolio"
  | "deal-capture"
  | "market-data"
  | "valuation"
  | "ifrs9"
  | "performance"
  | "duration-risk"
  | "accounting"
  | "reporting"
  | "governance";

export type AccessLevel = "full" | "read-only" | "none";

type RoleMatrix = Record<ModuleId, AccessLevel>;

const ALL_FULL: RoleMatrix = {
  portfolio: "full",
  "deal-capture": "full",
  "market-data": "full",
  valuation: "full",
  ifrs9: "full",
  performance: "full",
  "duration-risk": "full",
  accounting: "full",
  reporting: "full",
  governance: "none",
};

const ALL_READ: RoleMatrix = {
  portfolio: "read-only",
  "deal-capture": "read-only",
  "market-data": "read-only",
  valuation: "read-only",
  ifrs9: "read-only",
  performance: "read-only",
  "duration-risk": "read-only",
  accounting: "read-only",
  reporting: "read-only",
  governance: "none",
};

/**
 * Permissions matrix keyed by persona role string.
 * Roles match exactly those defined in login.tsx PERSONAS.
 */
export const ROLE_ACCESS: Record<string, RoleMatrix> = {
  /** CFO — unrestricted across the full platform */
  "Chief Financial Officer": ALL_FULL,

  /**
   * CRO — risk, credit loss, valuation and market data.
   * No access to front-office deal capture or accounting GL.
   */
  "Chief Risk Officer": {
    portfolio: "read-only",
    "deal-capture": "none",
    "market-data": "full",
    valuation: "full",
    ifrs9: "full",
    performance: "full",
    "duration-risk": "full",
    accounting: "none",
    reporting: "full",
    governance: "none",
  },

  /**
   * Portfolio Analyst — owns portfolio, deals, market data and performance.
   * No access to credit risk (IFRS9), duration risk or accounting GL.
   */
  "Portfolio Analyst": {
    portfolio: "full",
    "deal-capture": "full",
    "market-data": "full",
    valuation: "read-only",
    ifrs9: "none",
    performance: "full",
    "duration-risk": "none",
    accounting: "none",
    reporting: "read-only",
    governance: "none",
  },

  /**
   * Risk Manager — IFRS 9, valuation and duration risk are primary domains.
   * Portfolio and performance are read-only reference views.
   * No deal capture or accounting access.
   */
  "Risk Manager": {
    portfolio: "read-only",
    "deal-capture": "none",
    "market-data": "full",
    valuation: "full",
    ifrs9: "full",
    performance: "read-only",
    "duration-risk": "full",
    accounting: "none",
    reporting: "read-only",
    governance: "none",
  },

  /**
   * Compliance Officer — broad read access for oversight & regulatory review.
   * Full write access only in the Reporting hub.
   */
  "Compliance Officer": {
    portfolio: "read-only",
    "deal-capture": "read-only",
    "market-data": "read-only",
    valuation: "read-only",
    ifrs9: "read-only",
    performance: "read-only",
    "duration-risk": "read-only",
    accounting: "read-only",
    reporting: "full",
    governance: "none",
  },

  /**
   * Internal Auditor — read-only access to every module for audit trail review.
   * No write operations permitted anywhere.
   */
  "Internal Auditor": ALL_READ,

  /**
   * System Admin — exclusive access to Governance & Controls only.
   * No access to financial analysis modules.
   */
  "System Admin": {
    portfolio: "none",
    "deal-capture": "none",
    "market-data": "none",
    valuation: "none",
    ifrs9: "none",
    performance: "none",
    "duration-risk": "none",
    accounting: "none",
    reporting: "none",
    governance: "full",
  },
};

/** Returns the access level for a given role + module, defaulting to "none". */
export function getModuleAccess(role: string, moduleId: ModuleId): AccessLevel {
  return ROLE_ACCESS[role]?.[moduleId] ?? "none";
}

/** True if the persona can perform write/CRUD actions in this module. */
export function canWrite(role: string, moduleId: ModuleId): boolean {
  return getModuleAccess(role, moduleId) === "full";
}
