/** Canonical platform personas from developer spec. */
export type PersonaRole =
  | "Money Market Trader"
  | "Fixed Income Trader"
  | "Equity Trader"
  | "Alternative Investment Officer"
  | "Portfolio Manager"
  | "Head of Investments"
  | "Middle Office"
  | "Risk Management"
  | "Compliance"
  | "Back Office"
  | "Finance"
  | "Treasury Cash Management"
  | "Investment Committee / ALCO"
  | "Internal Audit"
  | "System Administrator";

export type CapabilityAction = "C" | "R" | "A" | "S" | "P" | "M" | "V";

export type PlatformCapability =
  | "blotter"
  | "dealSlip"
  | "checks"
  | "approval"
  | "settle"
  | "register"
  | "accrual"
  | "valuation"
  | "limits"
  | "acctGl"
  | "reports"
  | "auditAdmin";

export type CapabilityMatrix = Partial<Record<PlatformCapability, CapabilityAction[]>>;

/** C=Create R=Review A=Approve S=Settle P=Post M=Maintain V=View */
export const PERSONA_ACCESS: Record<PersonaRole, CapabilityMatrix> = {
  "Money Market Trader": {
    blotter: ["C", "V"],
    dealSlip: ["C", "V"],
    checks: ["V"],
    register: ["V"],
    accrual: ["V"],
    limits: ["V"],
    reports: ["V"],
  },
  "Fixed Income Trader": {
    blotter: ["C", "V"],
    dealSlip: ["C", "V"],
    checks: ["V"],
    register: ["V"],
    accrual: ["V"],
    valuation: ["V"],
    limits: ["V"],
    reports: ["V"],
  },
  "Equity Trader": {
    blotter: ["C", "V"],
    dealSlip: ["C", "V"],
    checks: ["V"],
    register: ["V"],
    valuation: ["V"],
    limits: ["V"],
    reports: ["V"],
  },
  "Alternative Investment Officer": {
    blotter: ["C", "V"],
    dealSlip: ["C", "V"],
    checks: ["V"],
    register: ["V"],
    valuation: ["V"],
    limits: ["V"],
    reports: ["V"],
  },
  "Portfolio Manager": {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    approval: ["A"],
    register: ["V"],
    accrual: ["V"],
    valuation: ["V"],
    limits: ["V"],
    reports: ["V"],
  },
  "Head of Investments": {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    checks: ["V"],
    approval: ["A"],
    register: ["V"],
    accrual: ["V"],
    valuation: ["V"],
    limits: ["V"],
    reports: ["V"],
  },
  "Middle Office": {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    checks: ["R"],
    register: ["V"],
    accrual: ["V"],
    valuation: ["R"],
    limits: ["R"],
    reports: ["V"],
  },
  "Risk Management": {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    checks: ["R"],
    register: ["V"],
    valuation: ["R"],
    limits: ["R"],
    reports: ["V"],
  },
  Compliance: {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    checks: ["R"],
    register: ["V"],
    limits: ["R"],
    reports: ["V"],
  },
  "Back Office": {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    settle: ["S"],
    register: ["S"],
    reports: ["V"],
  },
  Finance: {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    register: ["V"],
    accrual: ["R"],
    valuation: ["R"],
    acctGl: ["P"],
    reports: ["V"],
  },
  "Treasury Cash Management": {
    blotter: ["V"],
    register: ["V"],
    reports: ["V"],
  },
  "Investment Committee / ALCO": {
    blotter: ["V"],
    dealSlip: ["R", "V"],
    checks: ["V"],
    approval: ["A"],
    register: ["V"],
    accrual: ["V"],
    valuation: ["V"],
    limits: ["V"],
    reports: ["V"],
  },
  "Internal Audit": {
    blotter: ["V"],
    dealSlip: ["V"],
    checks: ["V"],
    approval: ["V"],
    settle: ["V"],
    register: ["V"],
    accrual: ["V"],
    valuation: ["V"],
    limits: ["V"],
    acctGl: ["V"],
    reports: ["V"],
    auditAdmin: ["V"],
  },
  "System Administrator": {
    auditAdmin: ["M"],
  },
};

export function canDo(
  role: string,
  capability: PlatformCapability,
  action: CapabilityAction,
): boolean {
  const matrix = PERSONA_ACCESS[role as PersonaRole];
  if (!matrix) return false;
  const actions = matrix[capability];
  return actions?.includes(action) ?? false;
}

export function isFrontOfficeTrader(role: string): boolean {
  return (
    role === "Money Market Trader" ||
    role === "Fixed Income Trader" ||
    role === "Equity Trader" ||
    role === "Alternative Investment Officer"
  );
}

export const TRADER_DESK_LABEL: Partial<Record<PersonaRole, string>> = {
  "Money Market Trader": "Money Market Desk",
  "Fixed Income Trader": "Fixed Income Desk",
  "Equity Trader": "Equities Desk",
  "Alternative Investment Officer": "Alternatives Desk",
};

export function getTraderDeskLabel(role: string): string {
  return TRADER_DESK_LABEL[role as PersonaRole] ?? role;
}

/** Map persona to workflow tier for UI hints. */
export function getPersonaTier(
  role: string,
): "maker" | "checker" | "approver" | "settler" | "finance" | "oversight" | "admin" | "viewer" {
  if (canDo(role, "dealSlip", "C")) return "maker";
  if (canDo(role, "settle", "S")) return "settler";
  if (canDo(role, "acctGl", "P")) return "finance";
  if (canDo(role, "approval", "A")) return "approver";
  if (canDo(role, "checks", "R")) return "checker";
  if (canDo(role, "auditAdmin", "M")) return "admin";
  if (role === "Internal Audit" || role === "Treasury Cash Management") return "oversight";
  return "viewer";
}

export const PERSONA_HOME_QUEUES: Record<PersonaRole, string[]> = {
  "Money Market Trader": ["My deal slips", "Maturity tracker", "Rollover queue"],
  "Fixed Income Trader": ["My deal slips", "Coupon calendar", "Inventory"],
  "Equity Trader": ["My deal slips", "Sector exposure"],
  "Alternative Investment Officer": ["Commitments", "Capital calls", "Distributions"],
  "Portfolio Manager": ["Approval queue", "Allocation impact", "Maturity ladder"],
  "Head of Investments": ["Executive approvals", "Exceptions", "Breaches"],
  "Middle Office": ["Control review queue", "Pricing checks", "Breach tracker"],
  "Risk Management": ["Risk review queue", "Concentration", "Stress exceptions"],
  Compliance: ["Compliance review", "Waiver register", "Policy exceptions"],
  "Back Office": ["Settlement queue", "Document matching", "Maturity processing"],
  Finance: ["Accrual queue", "Journal posting", "GL reconciliation"],
  "Treasury Cash Management": ["Cash flow calendar", "Liquidity ladder", "Settlement cash"],
  "Investment Committee / ALCO": ["Exception approvals", "ALCO pack", "Limit overrides"],
  "Internal Audit": ["Audit trail", "Workflow logs", "Settlement evidence"],
  "System Administrator": ["User roles", "Workflow config", "Master data"],
};
