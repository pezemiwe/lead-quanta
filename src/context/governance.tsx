import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_AUDIT = "lq_audit_v1";
const STORAGE_APPROVALS = "lq_approvals_v1";

function loadFromStorage<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : seed;
  } catch {
    return seed;
  }
}
import {
  canDo,
  getPersonaTier,
  type CapabilityAction,
  type PlatformCapability,
} from "./platform-personas";

/* ── Permission types ─────────────────────────────────────────── */
export type Permission =
  | "deal.view"
  | "deal.create"
  | "deal.approve"
  | "deal.reject"
  | "journal.view"
  | "journal.post"
  | "journal.approve"
  | "valuation.view"
  | "valuation.override"
  | "limits.view"
  | "limits.manage"
  | "audit.view"
  | "compliance.view"
  | "report.generate"
  | "portfolio.view"
  | "portfolio.manage"
  | "admin.access";

const PERM_CAPABILITY: Partial<
  Record<Permission, { capability: PlatformCapability; action: CapabilityAction }>
> = {
  "deal.view": { capability: "dealSlip", action: "V" },
  "deal.create": { capability: "dealSlip", action: "C" },
  "deal.approve": { capability: "approval", action: "A" },
  "deal.reject": { capability: "approval", action: "A" },
  "journal.view": { capability: "acctGl", action: "V" },
  "journal.post": { capability: "acctGl", action: "P" },
  "journal.approve": { capability: "acctGl", action: "P" },
  "valuation.view": { capability: "valuation", action: "V" },
  "valuation.override": { capability: "valuation", action: "R" },
  "limits.view": { capability: "limits", action: "V" },
  "limits.manage": { capability: "limits", action: "R" },
  "audit.view": { capability: "auditAdmin", action: "V" },
  "compliance.view": { capability: "checks", action: "V" },
  "report.generate": { capability: "reports", action: "V" },
  "portfolio.view": { capability: "register", action: "V" },
  "portfolio.manage": { capability: "register", action: "S" },
  "admin.access": { capability: "auditAdmin", action: "M" },
};

export type RoleKey = string;

/* ── Audit trail ──────────────────────────────────────────────── */
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: string;
  action: string;
  detail: string;
  status: "success" | "warning" | "blocked";
  ip: string;
}

/* Seed data – pre-populated audit log */
const SEED_AUDIT: AuditEntry[] = [
  {
    id: "a001",
    timestamp: "2026-05-29 08:14:22",
    user: "Fatima Aliyu",
    role: "Portfolio Analyst",
    module: "Deals",
    action: "Deal capture submitted",
    detail:
      "FGN Bond 2031 — ₦500,000,000 face value submitted for checker approval",
    status: "success",
    ip: "10.0.1.42",
  },
  {
    id: "a002",
    timestamp: "2026-05-29 08:18:05",
    user: "Amaka Osei",
    role: "Chief Financial Officer",
    module: "Deals",
    action: "Booking Approved",
    detail: "FGN Bond 2031 approved and posted to blotter. Ref: DL-2026-0104",
    status: "success",
    ip: "10.0.1.11",
  },
  {
    id: "a003",
    timestamp: "2026-05-29 09:02:44",
    user: "Chidi Okafor",
    role: "Risk Manager",
    module: "Valuation",
    action: "Valuation Override Submitted",
    detail:
      "ACCESS BANK PLC Bond — Level 3 override requested: ₦97.20 vs model ₦96.40. Submitted for CRO approval",
    status: "warning",
    ip: "10.0.1.55",
  },
  {
    id: "a004",
    timestamp: "2026-05-29 09:11:30",
    user: "Emeka Nwosu",
    role: "Chief Risk Officer",
    module: "Valuation",
    action: "Valuation Override Approved",
    detail:
      "Level 3 override for ACCESS BANK PLC Bond confirmed. Rationale: illiquid market, last trade basis.",
    status: "success",
    ip: "10.0.1.22",
  },
  {
    id: "a005",
    timestamp: "2026-05-29 09:45:10",
    user: "Fatima Aliyu",
    role: "Portfolio Analyst",
    module: "Deals",
    action: "Deal capture submitted",
    detail:
      "MTN Nigeria Bond 2028 — ₦1,200,000,000 face value — exceeds single-issuer 10% guideline",
    status: "warning",
    ip: "10.0.1.42",
  },
  {
    id: "a006",
    timestamp: "2026-05-29 10:00:00",
    user: "Amaka Osei",
    role: "Chief Financial Officer",
    module: "Deals",
    action: "Booking Rejected — Limit Breach",
    detail:
      "MTN Nigeria Bond 2028 rejected. Single-issuer concentration would reach 12.3% (limit 10%)",
    status: "blocked",
    ip: "10.0.1.11",
  },
  {
    id: "a007",
    timestamp: "2026-05-29 10:22:18",
    user: "Ngozi Adeyemi",
    role: "Compliance Officer",
    module: "Compliance",
    action: "Regulatory Check Run",
    detail:
      "Monthly CBN investment limit check — 2 warnings flagged on equities allocation (18.7% vs 20% cap)",
    status: "warning",
    ip: "10.0.1.66",
  },
  {
    id: "a008",
    timestamp: "2026-05-29 10:35:00",
    user: "Fatima Aliyu",
    role: "Portfolio Analyst",
    module: "Accounting",
    action: "Journal Entry Submitted",
    detail:
      "Accrued coupon income ₦6,842,000 for May 2026 — pending CFO approval",
    status: "success",
    ip: "10.0.1.42",
  },
  {
    id: "a009",
    timestamp: "2026-05-29 10:41:22",
    user: "Amaka Osei",
    role: "Chief Financial Officer",
    module: "Accounting",
    action: "Journal Entry Approved",
    detail:
      "May 2026 coupon accruals approved and posted to SAP GL. Batch JNL-2026-0521",
    status: "success",
    ip: "10.0.1.11",
  },
  {
    id: "a010",
    timestamp: "2026-05-29 11:00:55",
    user: "Tunde Bello",
    role: "Internal Auditor",
    module: "Audit",
    action: "Audit Trail Export",
    detail:
      "Exported audit log for period 01 May – 29 May 2026. 147 entries downloaded.",
    status: "success",
    ip: "10.0.1.77",
  },
  {
    id: "a011",
    timestamp: "2026-05-29 11:18:40",
    user: "Chidi Okafor",
    role: "Risk Manager",
    module: "Valuation",
    action: "Valuation Override Request",
    detail:
      "Stanbic IBTC Bond — manual Level 3 fair value override requested: ₦98.50 vs model ₦97.80",
    status: "warning",
    ip: "10.0.1.55",
  },
  {
    id: "a012",
    timestamp: "2026-05-29 11:30:00",
    user: "Emeka Nwosu",
    role: "Chief Risk Officer",
    module: "Valuation",
    action: "Valuation Override Approved",
    detail:
      "Level 3 override for Stanbic IBTC Bond approved. Rationale: thin market, last trade basis used.",
    status: "success",
    ip: "10.0.1.22",
  },
  {
    id: "a013",
    timestamp: "2026-05-29 12:05:14",
    user: "Ngozi Adeyemi",
    role: "Compliance Officer",
    module: "Reporting",
    action: "CBN Report Submitted",
    detail:
      "Monthly CBN Investment Return (Form A) submitted via regulatory portal. Ref: CBN-2026-05-29-001",
    status: "success",
    ip: "10.0.1.66",
  },
  {
    id: "a014",
    timestamp: "2026-05-29 13:22:05",
    user: "Fatima Aliyu",
    role: "Portfolio Analyst",
    module: "Portfolio",
    action: "Limit Exception Raised",
    detail:
      "Equities allocation at 18.7% — approaching 20% NAICOM ceiling. Exception logged for monitoring.",
    status: "warning",
    ip: "10.0.1.42",
  },
  {
    id: "a015",
    timestamp: "2026-05-29 14:00:00",
    user: "Amaka Osei",
    role: "Chief Financial Officer",
    module: "Portfolio",
    action: "Limit Exception Acknowledged",
    detail:
      "Equities limit exception reviewed. No immediate action — monitor weekly. Waiver ref: WAV-2026-001",
    status: "success",
    ip: "10.0.1.11",
  },
];

/* ── Approval workflow ────────────────────────────────────────── */
export interface ApprovalItem {
  id: string;
  type:
    | "deal"
    | "journal"
    | "valuation"
    | "limit-exception"
    | "counterparty"
    | "impairment";
  title: string;
  description: string;
  amount: number;
  maker: string;
  makerRole: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  module: string;
  priority: "high" | "medium" | "low";
  requiredApprover: RoleKey;
}

const SEED_APPROVALS: ApprovalItem[] = [
  {
    id: "ap001",
    type: "deal",
    title: "FGN Bond 2033 Purchase",
    description:
      "FGN Apr 2033 — ₦750M face value — AC classification. First purchase in this ISIN.",
    amount: 750_000_000,
    maker: "Fatima Aliyu",
    makerRole: "Portfolio Analyst",
    submittedAt: "2026-05-29 07:55:00",
    status: "pending",
    module: "Deals",
    priority: "high",
    requiredApprover: "Chief Financial Officer",
  },
  {
    id: "ap002",
    type: "deal",
    title: "FBNH Commercial Paper Rollover",
    description:
      "First Bank of Nigeria Commercial Paper — 90-day rollover — ₦200M. Previous tranche matured yesterday.",
    amount: 200_000_000,
    maker: "Fatima Aliyu",
    makerRole: "Portfolio Analyst",
    submittedAt: "2026-05-29 08:40:00",
    status: "pending",
    module: "Deals",
    priority: "medium",
    requiredApprover: "Chief Financial Officer",
  },
  {
    id: "ap003",
    type: "impairment",
    title: "DANGOTE CEMENT PLC — Credit Watch",
    description:
      "DSR ratio deteriorated from 2.1x to 1.4x. Recommend credit watch classification and impairment review for bond holding.",
    amount: 28_700_000,
    maker: "Chidi Okafor",
    makerRole: "Risk Manager",
    submittedAt: "2026-05-29 09:50:00",
    status: "pending",
    module: "Valuation",
    priority: "high",
    requiredApprover: "Chief Risk Officer",
  },
  {
    id: "ap004",
    type: "journal",
    title: "May 2026 FV Adjustment Batch",
    description:
      "Fair value mark-to-market for 47 FVOCI instruments. Net OCI movement ₦(124.3M). Fair value adjustment journals.",
    amount: 124_300_000,
    maker: "Fatima Aliyu",
    makerRole: "Portfolio Analyst",
    submittedAt: "2026-05-29 10:05:00",
    status: "pending",
    module: "Accounting",
    priority: "high",
    requiredApprover: "Chief Financial Officer",
  },
  {
    id: "ap005",
    type: "valuation",
    title: "UBA Eurobond Level 3 Override",
    description:
      "Manual fair value input ₦98.20 (model: ₦96.50). Illiquid market — last observed trade 14 days ago.",
    amount: 450_000_000,
    maker: "Chidi Okafor",
    makerRole: "Risk Manager",
    submittedAt: "2026-05-28 16:30:00",
    status: "pending",
    module: "Valuation",
    priority: "medium",
    requiredApprover: "Chief Risk Officer",
  },
  {
    id: "ap006",
    type: "limit-exception",
    title: "Equities Allocation Waiver Request",
    description:
      "Current equities allocation 18.7% approaching NAICOM 20% ceiling. Requesting monitoring waiver pending Q3 rebalancing.",
    amount: 0,
    maker: "Fatima Aliyu",
    makerRole: "Portfolio Analyst",
    submittedAt: "2026-05-29 13:22:00",
    status: "pending",
    module: "Portfolio",
    priority: "low",
    requiredApprover: "Chief Financial Officer",
  },
  {
    id: "ap007",
    type: "counterparty",
    title: "New Counterparty Onboarding — Vetiva Capital",
    description:
      "Vetiva Capital Management Ltd — new broker-dealer. AML screening passed. KYC documentation complete.",
    amount: 0,
    maker: "Fatima Aliyu",
    makerRole: "Portfolio Analyst",
    submittedAt: "2026-05-28 14:00:00",
    status: "pending",
    module: "Deals",
    priority: "low",
    requiredApprover: "Chief Financial Officer",
  },
];

/* ── Investment limits ────────────────────────────────────────── */
export interface InvestmentLimit {
  id: string;
  name: string;
  regulation: string;
  limitPct: number;
  currentPct: number;
  currentNGN: number;
  status: "ok" | "warning" | "breach";
  direction: "max" | "min";
}

export const INVESTMENT_LIMITS: InvestmentLimit[] = [
  {
    id: "lim001",
    name: "Federal Government Securities",
    regulation: "NAICOM Investment Guidelines §4.1",
    limitPct: 25,
    currentPct: 62.4,
    currentNGN: 186_000_000_000,
    status: "ok",
    direction: "min",
  },
  {
    id: "lim002",
    name: "Equities (Listed NSE/NGX)",
    regulation: "NAICOM Investment Guidelines §4.3",
    limitPct: 20,
    currentPct: 18.7,
    currentNGN: 55_800_000_000,
    status: "warning",
    direction: "max",
  },
  {
    id: "lim003",
    name: "Corporate Bonds (Listed)",
    regulation: "NAICOM Investment Guidelines §4.4",
    limitPct: 10,
    currentPct: 7.2,
    currentNGN: 21_500_000_000,
    status: "ok",
    direction: "max",
  },
  {
    id: "lim004",
    name: "State Government Bonds",
    regulation: "NAICOM Investment Guidelines §4.2",
    limitPct: 10,
    currentPct: 5.8,
    currentNGN: 17_300_000_000,
    status: "ok",
    direction: "max",
  },
  {
    id: "lim005",
    name: "Foreign Currency Investments",
    regulation: "CBN Guidelines / NAICOM §5.1",
    limitPct: 10,
    currentPct: 3.1,
    currentNGN: 9_250_000_000,
    status: "ok",
    direction: "max",
  },
  {
    id: "lim006",
    name: "Unquoted / Private Placements",
    regulation: "NAICOM Investment Guidelines §4.7",
    limitPct: 10,
    currentPct: 2.4,
    currentNGN: 7_160_000_000,
    status: "ok",
    direction: "max",
  },
  {
    id: "lim007",
    name: "Single Issuer Concentration (max)",
    regulation: "NAICOM Prudential Guidelines §7.2",
    limitPct: 10,
    currentPct: 8.9,
    currentNGN: 26_570_000_000,
    status: "warning",
    direction: "max",
  },
  {
    id: "lim008",
    name: "Mutual Funds / Collective Schemes",
    regulation: "NAICOM Investment Guidelines §4.5",
    limitPct: 5,
    currentPct: 1.8,
    currentNGN: 5_370_000_000,
    status: "ok",
    direction: "max",
  },
  {
    id: "lim009",
    name: "Infrastructure Bonds",
    regulation: "NAICOM Investment Guidelines §4.6",
    limitPct: 30,
    currentPct: 0,
    currentNGN: 0,
    status: "ok",
    direction: "max",
  },
  {
    id: "lim010",
    name: "Money Market / Placements",
    regulation: "CBN MPR Regulations",
    limitPct: 30,
    currentPct: 9.1,
    currentNGN: 27_160_000_000,
    status: "ok",
    direction: "max",
  },
];

/* ── Context types ────────────────────────────────────────────── */
interface GovernanceContextValue {
  auditLog: AuditEntry[];
  logAction: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;
  approvals: ApprovalItem[];
  decideApproval: (id: string, decision: "approved" | "rejected") => void;
  hasPermission: (role: string, perm: Permission) => boolean;
  getTier: (role: string) => "maker" | "checker" | "viewer" | "admin";
  pendingCount: number;
}

const GovernanceContext = createContext<GovernanceContextValue | null>(null);

let _eid = 100;
function nextId() {
  return `a${String(++_eid).padStart(3, "0")}`;
}

export function GovernanceProvider({ children }: { children: ReactNode }) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() =>
    loadFromStorage(STORAGE_AUDIT, SEED_AUDIT),
  );
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() =>
    loadFromStorage(STORAGE_APPROVALS, SEED_APPROVALS),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLog));
  }, [auditLog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_APPROVALS, JSON.stringify(approvals));
  }, [approvals]);

  const logAction = useCallback(
    (entry: Omit<AuditEntry, "id" | "timestamp">) => {
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      setAuditLog((prev) => [
        { ...entry, id: nextId(), timestamp: ts },
        ...prev,
      ]);
    },
    [],
  );

  const decideApproval = useCallback(
    (id: string, decision: "approved" | "rejected") => {
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision } : a)),
      );
    },
    [],
  );

  const hasPermission = useCallback((role: string, perm: Permission) => {
    const mapped = PERM_CAPABILITY[perm];
    if (mapped) return canDo(role, mapped.capability, mapped.action);
    return false;
  }, []);

  const getTier = useCallback((role: string) => {
    const tier = getPersonaTier(role);
    if (tier === "admin") return "admin" as const;
    if (tier === "maker") return "maker" as const;
    if (tier === "checker" || tier === "approver" || tier === "settler" || tier === "finance")
      return "checker" as const;
    return "viewer" as const;
  }, []);

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <GovernanceContext.Provider
      value={{
        auditLog,
        logAction,
        approvals,
        decideApproval,
        hasPermission,
        getTier,
        pendingCount,
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
}

export function useGovernance() {
  const ctx = useContext(GovernanceContext);
  if (!ctx)
    throw new Error("useGovernance must be used inside GovernanceProvider");
  return ctx;
}
