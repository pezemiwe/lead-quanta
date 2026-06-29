import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Activity,
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { Badge } from "../../../components/shared/badge";
import { usePersona } from "../../../context/persona";

interface ComplianceItem {
  id: string;
  category: string;
  check: string;
  regulation: string;
  status: "compliant" | "exception" | "breach" | "pending";
  detail: string;
  dueDate?: string;
  owner: string;
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: "c001",
    category: "Investment Limits",
    check: "NAICOM Asset Allocation Compliance",
    regulation: "NAICOM Guidelines 2022",
    status: "compliant",
    detail:
      "All asset class allocations within prescribed limits. FGN bonds 62.4% ≥ 25% min. Equities 18.7% < 20% max.",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c002",
    category: "Investment Limits",
    check: "Single Issuer Concentration",
    regulation: "NAICOM Prudential §7.2",
    status: "exception",
    detail:
      "FGN sovereign exposure at 62.4% — exceeds 10% single issuer cap. NAICOM exempts FGN bonds from concentration limit.",
    dueDate: "2026-06-30",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c003",
    category: "Reporting",
    check: "Monthly CBN Investment Return (Form A)",
    regulation: "CBN Investment Regulations 2019",
    status: "compliant",
    detail: "May 2026 return filed 29 May 2026. Ref: CBN-2026-05-29-001",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c004",
    category: "Reporting",
    check: "NAICOM Quarterly Investment Return",
    regulation: "NAICOM Returns Circular 2021",
    status: "pending",
    detail: "Q2 2026 return due 31 July 2026. Data preparation in progress.",
    dueDate: "2026-07-31",
    owner: "Amaka Osei",
  },
  {
    id: "c005",
    category: "Reporting",
    check: "IFRS 7 Credit Risk Disclosure",
    regulation: "IFRS 7",
    status: "compliant",
    detail:
      "H1 2026 IFRS 7 credit risk disclosures prepared. Credit quality analysis, counterparty exposure, and fair value hierarchy tables complete.",
    owner: "Chidi Okafor",
  },
  {
    id: "c006",
    category: "Risk Management",
    check: "Investment Policy Statement (IPS) Review",
    regulation: "NAICOM Guidelines §3",
    status: "compliant",
    detail: "IPS last reviewed March 2026. Annual review due February 2027.",
    owner: "Emeka Nwosu",
  },
  {
    id: "c007",
    category: "Risk Management",
    check: "Stress Test — Quarterly Interest Rate Shock",
    regulation: "CBN Risk Management Framework",
    status: "compliant",
    detail:
      "Q1 2026 stress test completed. 200bps shock produces MTM loss of ₦2.3B (within tolerance).",
    owner: "Emeka Nwosu",
  },
  {
    id: "c008",
    category: "Audit & Controls",
    check: "Segregation of Duties — Maker-Checker",
    regulation: "NAICOM Internal Controls §8",
    status: "compliant",
    detail:
      "All deal bookings and journal entries pass through maker-checker workflow. No conflicts identified.",
    owner: "Tunde Bello",
  },
  {
    id: "c009",
    category: "Audit & Controls",
    check: "Quarterly Internal Audit of Investment Book",
    regulation: "NAICOM Internal Audit Circular",
    status: "pending",
    detail:
      "Q2 2026 audit scheduled for 15 June 2026. Scope: deal capture, valuation overrides, and settlement reconciliation.",
    dueDate: "2026-06-15",
    owner: "Tunde Bello",
  },
  {
    id: "c010",
    category: "Valuation",
    check: "Independent Price Verification (IPV)",
    regulation: "IFRS 13 / NAICOM Guidelines",
    status: "compliant",
    detail:
      "Monthly IPV completed for all Level 2 and Level 3 instruments. 2 Level 3 overrides approved with documentation.",
    owner: "Chidi Okafor",
  },
  {
    id: "c011",
    category: "Valuation",
    check: "IFRS 13 Fair Value Hierarchy Classification",
    regulation: "IFRS 13",
    status: "compliant",
    detail:
      "94.7% Level 1/2 assets. Level 3 at 5.3% — below 20% threshold requiring additional disclosure.",
    owner: "Chidi Okafor",
  },
  {
    id: "c012",
    category: "AML / KYC",
    check: "Counterparty KYC Refresh (Annual)",
    regulation: "CBN AML/CFT Regulations 2022",
    status: "exception",
    detail:
      "3 counterparties have KYC documents expiring within 30 days. Renewal requests sent.",
    dueDate: "2026-06-10",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c013",
    category: "AML / KYC",
    check: "Transaction Monitoring — Unusual Patterns",
    regulation: "NFIU/CBN Guidelines",
    status: "compliant",
    detail:
      "No suspicious transactions flagged in May 2026 monitoring run. 204 transactions reviewed.",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c014",
    category: "Governance",
    check: "Investment Committee Meeting (Monthly)",
    regulation: "NAICOM Governance Framework",
    status: "compliant",
    detail:
      "May 2026 IC meeting held 22 May 2026. Minutes and investment decisions documented.",
    owner: "Amaka Osei",
  },
  {
    id: "c015",
    category: "Governance",
    check: "Board Risk Committee Reporting",
    regulation: "NAICOM Corporate Governance 2018",
    status: "pending",
    detail:
      "Q2 2026 board pack preparation in progress. Due to board risk committee 5 June 2026.",
    dueDate: "2026-06-05",
    owner: "Amaka Osei",
  },
];

const STATUS_META = {
  compliant: {
    icon: CheckCircle,
    label: "Compliant",
    cls: "text-emerald-600",
    bg: "bg-emerald-100 text-emerald-700",
  },
  exception: {
    icon: AlertTriangle,
    label: "Exception",
    cls: "text-amber-600",
    bg: "bg-amber-100 text-amber-700",
  },
  breach: {
    icon: XCircle,
    label: "Breach",
    cls: "text-red-600",
    bg: "bg-red-100 text-red-700",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    cls: "text-blue-600",
    bg: "bg-blue-100 text-blue-700",
  },
};

const CATEGORIES = [
  "All",
  "Investment Limits",
  "Reporting",
  "Risk Management",
  "Audit & Controls",
  "Valuation",
  "AML / KYC",
  "Governance",
];

export function ComplianceMonitoring() {
  const { persona } = usePersona();
  const [catFilter, setCatFilter] = useState("All");

  const displayed =
    catFilter === "All"
      ? COMPLIANCE_ITEMS
      : COMPLIANCE_ITEMS.filter((c) => c.category === catFilter);

  const compliantCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "compliant",
  ).length;
  const exceptionCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "exception",
  ).length;
  const pendingCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "pending",
  ).length;
  const breachCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "breach",
  ).length;
  const score = Math.round((compliantCount / COMPLIANCE_ITEMS.length) * 100);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Compliance Monitoring
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Real-time regulatory & internal compliance status · NAICOM · CBN ·
          IFRS 9 · AML
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Compliance Score"
          value={`${score}%`}
          subtitle={`${compliantCount} of ${COMPLIANCE_ITEMS.length} checks passing`}
          variant="highlight"
        />
        <StatCard
          title="Compliant"
          value={String(compliantCount)}
          subtitle="No action required"
          variant="default"
        />
        <StatCard
          title="Exceptions"
          value={String(exceptionCount)}
          subtitle="Monitored deviations"
          variant="default"
        />
        <StatCard
          title="Pending Actions"
          value={String(pendingCount)}
          subtitle="Upcoming deadlines"
          variant="default"
        />
      </StatCardGrid>

      {/* Compliance score bar */}
      <SectionCard
        title="Overall Compliance Health"
        description="Aggregate view across all regulatory and internal checks"
      >
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-dark-gray">Compliance Score</span>
            <span className="font-bold text-emerald-700">{score}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-dark-gray/10">
            <div
              className="h-3 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-emerald-600">{compliantCount} Compliant</span>
            <span className="text-amber-600">{exceptionCount} Exceptions</span>
            <span className="text-blue-600">{pendingCount} Pending</span>
            {breachCount > 0 && (
              <span className="text-red-600">{breachCount} Breach</span>
            )}
          </div>
        </div>

        {/* Category summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.slice(1).map((cat) => {
            const catItems = COMPLIANCE_ITEMS.filter((c) => c.category === cat);
            const catOK = catItems.filter(
              (c) => c.status === "compliant",
            ).length;
            const catIssues = catItems.filter(
              (c) => c.status !== "compliant",
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(cat === catFilter ? "All" : cat)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  catFilter === cat
                    ? "border-primary bg-pale-red"
                    : "border-border bg-surface hover:bg-pale-red/40"
                }`}
              >
                <p className="text-xs font-semibold text-dark-gray">{cat}</p>
                <p className="mt-0.5 text-xs text-dark-gray/60">
                  {catOK}/{catItems.length} OK
                  {catIssues > 0 && (
                    <span className="ml-1 text-amber-600">
                      {catIssues} issues
                    </span>
                  )}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Compliance checklist */}
      <SectionCard
        title="Compliance Checklist"
        description={
          catFilter === "All" ? "All categories" : `Filtered: ${catFilter}`
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                catFilter === c
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-dark-gray/70 hover:bg-pale-red hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {displayed.map((item) => {
            const meta = STATUS_META[item.status];
            const StatusIcon = meta.icon;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  item.status === "breach"
                    ? "border-red-200 bg-red-50/30"
                    : item.status === "exception"
                      ? "border-amber-200 bg-amber-50/20"
                      : item.status === "pending"
                        ? "border-blue-200 bg-blue-50/10"
                        : "border-border bg-surface"
                }`}
              >
                <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-dark-gray">
                      {item.check}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg}`}
                    >
                      {meta.label}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-dark-gray/50">
                    Regulation: {item.regulation}
                  </p>
                  <p className="mt-1 text-xs text-dark-gray/70">
                    {item.detail}
                  </p>
                  <div className="mt-1 flex gap-4 text-xs text-dark-gray/40">
                    <span>
                      Owner:{" "}
                      <span className="font-medium text-dark-gray">
                        {item.owner}
                      </span>
                    </span>
                    {item.dueDate && (
                      <span>
                        Due:{" "}
                        <span className="font-medium text-dark-gray">
                          {item.dueDate}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
