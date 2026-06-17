import { Check, X, ShieldCheck, Users } from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import {
  ROLE_PERMISSIONS,
  ROLE_TIER,
  type Permission,
  type RoleKey,
} from "../../../context/governance";

const ROLES: { key: RoleKey; name: string; avatar: string; email: string }[] = [
  {
    key: "Chief Financial Officer",
    name: "Amaka Osei",
    avatar: "AO",
    email: "a.osei@leadwayholdings.com",
  },
  {
    key: "Chief Risk Officer",
    name: "Emeka Nwosu",
    avatar: "EN",
    email: "e.nwosu@leadwayholdings.com",
  },
  {
    key: "Portfolio Analyst",
    name: "Fatima Aliyu",
    avatar: "FA",
    email: "f.aliyu@leadwayholdings.com",
  },
  {
    key: "Risk Manager",
    name: "Chidi Okafor",
    avatar: "CO",
    email: "c.okafor@leadwayholdings.com",
  },
  {
    key: "Compliance Officer",
    name: "Ngozi Adeyemi",
    avatar: "NA",
    email: "n.adeyemi@leadwayholdings.com",
  },
  {
    key: "Internal Auditor",
    name: "Tunde Bello",
    avatar: "TB",
    email: "t.bello@leadwayholdings.com",
  },
];

const PERMISSION_GROUPS: {
  label: string;
  perms: { key: Permission; label: string }[];
}[] = [
  {
    label: "Deal Management",
    perms: [
      { key: "deal.view", label: "View Deals" },
      { key: "deal.create", label: "Create / Book Deals" },
      { key: "deal.approve", label: "Approve Deals (Checker)" },
      { key: "deal.reject", label: "Reject Deals" },
    ],
  },
  {
    label: "IFRS 9 / ECL",
    perms: [
      { key: "ecl.view", label: "View ECL / Staging" },
      { key: "ecl.modify", label: "Modify Stage / PD Parameters" },
      { key: "ecl.approve", label: "Approve ECL Changes (Checker)" },
    ],
  },
  {
    label: "Accounting & Journals",
    perms: [
      { key: "journal.view", label: "View Journals" },
      { key: "journal.post", label: "Post / Submit Journals (Maker)" },
      { key: "journal.approve", label: "Approve Journals (Checker)" },
    ],
  },
  {
    label: "Valuation",
    perms: [
      { key: "valuation.view", label: "View Valuations" },
      { key: "valuation.override", label: "Override Valuation (Level 3)" },
    ],
  },
  {
    label: "Portfolio & Limits",
    perms: [
      { key: "portfolio.view", label: "View Portfolio" },
      { key: "portfolio.manage", label: "Manage Allocations" },
      { key: "limits.view", label: "View Investment Limits" },
      { key: "limits.manage", label: "Manage Limits / Waivers" },
    ],
  },
  {
    label: "Oversight & Reporting",
    perms: [
      { key: "audit.view", label: "View Audit Trail" },
      { key: "compliance.view", label: "View Compliance Monitoring" },
      { key: "report.generate", label: "Generate & Export Reports" },
      { key: "admin.access", label: "System Administration" },
    ],
  },
];

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  admin: {
    label: "Admin",
    cls: "bg-primary/10 text-primary border border-primary/20",
  },
  checker: {
    label: "Checker",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  maker: {
    label: "Maker",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  viewer: {
    label: "Viewer",
    cls: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

export function AccessControl() {
  const totalRoles = ROLES.length;
  const adminCount = ROLES.filter((r) => ROLE_TIER[r.key] === "admin").length;
  const checkerCount = ROLES.filter(
    (r) => ROLE_TIER[r.key] === "checker",
  ).length;
  const makerCount = ROLES.filter((r) => ROLE_TIER[r.key] === "maker").length;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Access Control & Role-Based Permissions
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Segregation of duties matrix — defines what each system persona may
          view, create, or approve
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="System Users"
          value={String(totalRoles)}
          subtitle="Active personas configured"
          variant="highlight"
        />
        <StatCard
          title="Admin / Full Access"
          value={String(adminCount)}
          subtitle="Approve all workflows"
          variant="default"
        />
        <StatCard
          title="Checker Roles"
          value={String(checkerCount)}
          subtitle="Second-line approvers"
          variant="default"
        />
        <StatCard
          title="Maker / Analyst Roles"
          value={String(makerCount)}
          subtitle="Initiate transactions"
          variant="default"
        />
      </StatCardGrid>

      {/* User roster */}
      <SectionCard
        title="User Roster & Role Tiers"
        description="Segregation of duties — no maker may also be checker for the same transaction"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => {
            const tier = ROLE_TIER[r.key];
            const tb = TIER_BADGE[tier];
            const permCount = ROLE_PERMISSIONS[r.key].length;
            return (
              <div
                key={r.key}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {r.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark-gray">
                    {r.name}
                  </p>
                  <p className="text-xs text-dark-gray/60">{r.key}</p>
                  <p className="mt-0.5 truncate text-xs text-dark-gray/40">
                    {r.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${tb.cls}`}
                    >
                      {tb.label}
                    </span>
                    <span className="text-xs text-dark-gray/50">
                      {permCount} permissions
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Permission matrix */}
      {PERMISSION_GROUPS.map((grp) => (
        <SectionCard
          key={grp.label}
          title={grp.label}
          description="Role-level permission matrix for this domain"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-medium text-dark-gray/60 w-48">
                    Permission
                  </th>
                  {ROLES.map((r) => (
                    <th key={r.key} className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-xs font-bold text-primary flex items-center justify-center">
                          {r.avatar}
                        </div>
                        <span className="text-xs text-dark-gray/60 leading-tight">
                          {r.key.split(" ").slice(-1)[0]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grp.perms.map((p) => (
                  <tr
                    key={p.key}
                    className="border-b border-border/50 last:border-0 hover:bg-surface/60"
                  >
                    <td className="py-2 pr-4 text-dark-gray text-sm">
                      {p.label}
                    </td>
                    {ROLES.map((r) => {
                      const has = ROLE_PERMISSIONS[r.key].includes(p.key);
                      return (
                        <td key={r.key} className="px-3 py-2 text-center">
                          {has ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-600" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-dark-gray/20" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ))}

      {/* SoD rules */}
      <SectionCard
        title="Segregation of Duties Rules"
        description="Enforced maker-checker constraints preventing conflicts of interest"
      >
        <div className="space-y-3">
          {[
            {
              rule: "Deal booking",
              maker: "Portfolio Analyst",
              checker: "Chief Financial Officer",
              note: "No analyst may approve their own trade booking",
            },
            {
              rule: "ECL staging change",
              maker: "Risk Manager",
              checker: "Chief Risk Officer",
              note: "Risk manager submits; CRO or CFO approves",
            },
            {
              rule: "Journal posting",
              maker: "Portfolio Analyst",
              checker: "Chief Financial Officer",
              note: "Maker cannot also approve their own journals",
            },
            {
              rule: "Valuation override (L3)",
              maker: "Risk Manager",
              checker: "Chief Risk Officer",
              note: "Independent second opinion required for Level 3 inputs",
            },
            {
              rule: "Limit exception waiver",
              maker: "Portfolio Analyst",
              checker: "Chief Financial Officer",
              note: "Analyst flags; CFO or CRO authorises waiver",
            },
            {
              rule: "Counterparty onboarding",
              maker: "Portfolio Analyst",
              checker: "Chief Financial Officer",
              note: "New counterparty requires CFO sign-off",
            },
          ].map((s) => (
            <div
              key={s.rule}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-dark-gray">{s.rule}</p>
                <p className="text-xs text-dark-gray/60">
                  <span className="font-medium text-blue-700">Maker:</span>{" "}
                  {s.maker} &nbsp;→&nbsp;
                  <span className="font-medium text-emerald-700">
                    Checker:
                  </span>{" "}
                  {s.checker}
                </p>
                <p className="text-xs text-dark-gray/50 mt-0.5">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
