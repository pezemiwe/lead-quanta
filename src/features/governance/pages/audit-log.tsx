import * as XLSX from "xlsx";
import { useState, useMemo } from "react";
import { Download, Search, Filter } from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { Badge } from "../../../components/shared/badge";
import { useGovernance, type AuditEntry } from "../../../context/governance";

const MODULE_FILTER = [
  "All",
  "Deals",
  "IFRS 9",
  "Accounting",
  "Valuation",
  "Portfolio",
  "Compliance",
  "Reporting",
  "Audit",
];
const STATUS_COLOUR: Record<AuditEntry["status"], string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  blocked: "bg-red-100 text-red-700",
};

export function AuditLog() {
  const { auditLog } = useGovernance();
  const [search, setSearch] = useState("");
  const [modFilter, setModFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<
    "all" | AuditEntry["status"]
  >("all");

  const filtered = useMemo(() => {
    return auditLog.filter((e) => {
      if (modFilter !== "All" && e.module !== modFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.user.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.detail.toLowerCase().includes(q) ||
          e.module.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLog, search, modFilter, statusFilter]);

  const successCount = auditLog.filter((e) => e.status === "success").length;
  const warningCount = auditLog.filter((e) => e.status === "warning").length;
  const blockedCount = auditLog.filter((e) => e.status === "blocked").length;

  const exportXlsx = () => {
    const headers = [
      "ID",
      "Timestamp",
      "User",
      "Role",
      "Module",
      "Action",
      "Detail",
      "Status",
      "IP",
    ];
    const data = filtered.map((e) => [
      e.id,
      e.timestamp,
      e.user,
      e.role,
      e.module,
      e.action,
      e.detail,
      e.status,
      e.ip,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
    XLSX.writeFile(
      wb,
      `audit-log-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            System Audit Trail
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            Immutable log of all user actions across all modules ·{" "}
            {auditLog.length} total entries
          </p>
        </div>
        <button
          onClick={exportXlsx}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray hover:bg-pale-red hover:text-primary transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Entries"
          value={String(auditLog.length)}
          subtitle="All recorded actions"
          variant="highlight"
        />
        <StatCard
          title="Successful"
          value={String(successCount)}
          subtitle="Completed without issue"
          variant="default"
        />
        <StatCard
          title="Warnings"
          value={String(warningCount)}
          subtitle="Completed with alert"
          variant="default"
        />
        <StatCard
          title="Blocked"
          value={String(blockedCount)}
          subtitle="Rejected or limit breach"
          variant="default"
        />
      </StatCardGrid>

      {/* Filters */}
      <SectionCard
        title="Audit Log"
        description="Filter and search all recorded system events"
      >
        <div className="mb-4 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dark-gray/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, detail…"
              className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 text-sm text-dark-gray placeholder:text-dark-gray/40 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {/* Module filter */}
          <select
            value={modFilter}
            onChange={(e) => setModFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-dark-gray outline-none focus:ring-2 focus:ring-primary/20"
          >
            {MODULE_FILTER.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-dark-gray outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="blocked">Blocked</option>
          </select>
          <span className="flex items-center text-xs text-dark-gray/40">
            <Filter className="mr-1 h-3.5 w-3.5" /> {filtered.length} results
          </span>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-dark-gray/40">
              No matching audit entries
            </p>
          )}
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:bg-pale-red/30 transition-colors"
            >
              {/* Status dot */}
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  entry.status === "success"
                    ? "bg-emerald-500"
                    : entry.status === "warning"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-dark-gray/40">
                    {entry.timestamp}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {entry.module}
                  </Badge>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOUR[entry.status]}`}
                  >
                    {entry.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-dark-gray">
                  <span className="text-primary">{entry.user}</span>
                  <span className="mx-1 text-dark-gray/40">·</span>
                  <span>{entry.action}</span>
                </p>
                <p className="text-xs text-dark-gray/60 mt-0.5">
                  {entry.detail}
                </p>
                <p className="text-xs text-dark-gray/30 mt-0.5">
                  {entry.role} · IP: {entry.ip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
