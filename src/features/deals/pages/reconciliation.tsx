import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { useWorkflow } from "../../workflow/store";
import { buildReconciliationItems } from "../utils/reconciliation";
import type { ReconciliationItem, ReconciliationSeverity } from "../utils/reconciliation";
import { usePersona } from "../../../context/persona";
import { useNotifications } from "../../../context/notifications";

const RUN_DATE = "2026-06-28";

const fmtN = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

const SEV_STYLE: Record<
  ReconciliationSeverity,
  { badge: string; rowBg: string; label: string }
> = {
  critical: {
    badge: "bg-red-50 text-red-600 border border-red-200",
    rowBg: "bg-red-50/30",
    label: "Critical",
  },
  warning: {
    badge: "bg-amber-50 text-amber-600 border border-amber-200",
    rowBg: "bg-amber-50/20",
    label: "Warning",
  },
  info: {
    badge: "bg-sky-50 text-sky-600 border border-sky-200",
    rowBg: "",
    label: "Info",
  },
};

const TYPE_LABEL: Record<ReconciliationItem["type"], string> = {
  "unmatched": "Unmatched",
  "failed": "Failed",
  "partial": "Partial Settlement",
  "exception": "Exception",
  "missing-instruction": "No Instruction",
};

interface ResolvedEntry {
  itemId: string;
  resolvedAt: string;
  resolvedBy: string;
  comment: string;
}

const RESOLVE_STORAGE = "lq_recon_resolved_v1";

function loadResolved(): ResolvedEntry[] {
  try {
    const raw = localStorage.getItem(RESOLVE_STORAGE);
    return raw ? (JSON.parse(raw) as ResolvedEntry[]) : [];
  } catch {
    return [];
  }
}

function saveResolved(entries: ResolvedEntry[]) {
  try {
    localStorage.setItem(RESOLVE_STORAGE, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function ReconciliationPage() {
  const { dealSlips, exceptions } = useWorkflow();
  const { persona } = usePersona();
  const { addNotification } = useNotifications();
  const [resolved, setResolved] = useState<ResolvedEntry[]>(loadResolved);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"open" | "resolved">("open");

  const allItems = useMemo(
    () => buildReconciliationItems(dealSlips, exceptions),
    [dealSlips, exceptions],
  );

  const resolvedIds = useMemo(() => new Set(resolved.map((r) => r.itemId)), [resolved]);

  const openItems = useMemo(
    () => allItems.filter((i) => !resolvedIds.has(i.id)),
    [allItems, resolvedIds],
  );

  const resolvedItems = useMemo(
    () =>
      allItems
        .filter((i) => resolvedIds.has(i.id))
        .map((i) => ({
          ...i,
          resolution: resolved.find((r) => r.itemId === i.id)!,
        })),
    [allItems, resolvedIds, resolved],
  );

  const criticalCount = openItems.filter((i) => i.severity === "critical").length;
  const warningCount = openItems.filter((i) => i.severity === "warning").length;
  const totalVariance = openItems.reduce((s, i) => s + (i.amount ?? 0), 0);

  function markResolved() {
    if (!resolvingId) return;
    const entry: ResolvedEntry = {
      itemId: resolvingId,
      resolvedAt: new Date().toISOString(),
      resolvedBy: persona.name,
      comment: comment.trim() || "Resolved — no comment.",
    };
    const next = [...resolved, entry];
    setResolved(next);
    saveResolved(next);
    setResolvingId(null);
    setComment("");
    addNotification({
      type: "settlement",
      severity: "info",
      title: "Reconciliation Break Resolved",
      body: `Item ${resolvingId} marked resolved by ${persona.name}. ${entry.comment}`,
      link: "/deal-capture/reconciliation",
    });
  }

  return (
    <div className="space-y-6 p-5 lg:p-7">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
            Deal Capture
          </p>
          <h1 className="text-xl font-bold tracking-tight text-dark-gray">
            Reconciliation
          </h1>
          <p className="mt-1 text-xs text-dark-gray/45">
            Settlement breaks, unmatched instructions, and exceptions as at {RUN_DATE}.
            All breaks require resolution before period close.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-dark-gray/40">
          <RefreshCw className="h-3.5 w-3.5" />
          Run: {RUN_DATE} · {allItems.length} total items
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <StatCardGrid>
        <StatCard
          title="Total Open Breaks"
          value={String(openItems.length)}
          subtitle="Requiring action"
          icon={<ShieldAlert className="h-4 w-4" />}
          variant={openItems.length > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Critical Breaks"
          value={String(criticalCount)}
          subtitle="Immediate escalation required"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={criticalCount > 0 ? "danger" : "default"}
        />
        <StatCard
          title="Warnings"
          value={String(warningCount)}
          subtitle="Require monitoring"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          title="Total Variance"
          value={totalVariance > 0 ? fmtN(totalVariance) : "—"}
          subtitle="Across open breaks"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </StatCardGrid>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {[
          { id: "open" as const, label: `Open Breaks (${openItems.length})` },
          { id: "resolved" as const, label: `Resolved (${resolvedItems.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-surface text-dark-gray shadow-sm"
                : "text-dark-gray/50 hover:text-dark-gray"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Open Breaks ── */}
      {tab === "open" && (
        <SectionCard
          title="Open Reconciliation Breaks"
          description="Sorted by severity · Click 'Resolve' to close a break"
        >
          {openItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-semibold text-dark-gray/50">
                All breaks resolved. Clean book.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Type", "Deal ID", "Break", "Amount", "Custodian", "Severity", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          className="pb-2.5 pr-4 text-left font-semibold uppercase tracking-wider text-dark-gray/40 first:pl-0 last:pr-0 last:text-right"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...openItems]
                    .sort(
                      (a, b) =>
                        (a.severity === "critical" ? 0 : a.severity === "warning" ? 1 : 2) -
                        (b.severity === "critical" ? 0 : b.severity === "warning" ? 1 : 2),
                    )
                    .map((item) => {
                      const sev = SEV_STYLE[item.severity];
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-border/40 last:border-0 ${sev.rowBg}`}
                        >
                          <td className="py-3 pr-4">
                            <Badge variant="neutral" size="sm">
                              {TYPE_LABEL[item.type]}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 font-mono text-dark-gray/60">
                            {item.dealSlipId}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-dark-gray">{item.label}</p>
                            <p className="text-[10px] text-dark-gray/45 max-w-56 truncate">
                              {item.detail}
                            </p>
                          </td>
                          <td className="py-3 pr-4 tabular-nums font-semibold text-dark-gray">
                            {item.amount ? fmtN(item.amount) : <span className="text-dark-gray/25">—</span>}
                          </td>
                          <td className="py-3 pr-4 text-dark-gray/60">
                            {item.custodian ?? <span className="text-dark-gray/25">—</span>}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sev.badge}`}
                            >
                              {item.severity === "critical" && (
                                <AlertTriangle className="h-2.5 w-2.5" />
                              )}
                              {sev.label}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setResolvingId(item.id);
                                setComment("");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Resolve
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Resolved breaks ── */}
      {tab === "resolved" && (
        <SectionCard
          title="Resolved Breaks"
          description="Closed reconciliation items with resolution commentary"
        >
          {resolvedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <ShieldAlert className="h-7 w-7 text-dark-gray/15" />
              <p className="text-xs text-dark-gray/35">No resolved breaks yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Type", "Deal ID", "Break", "Amount", "Resolved By", "Comment"].map((h) => (
                      <th
                        key={h}
                        className="pb-2.5 pr-4 text-left font-semibold uppercase tracking-wider text-dark-gray/40 first:pl-0 last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resolvedItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/40 last:border-0">
                      <td className="py-3 pr-4">
                        <Badge variant="success" size="sm">
                          {TYPE_LABEL[item.type]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-mono text-dark-gray/60">
                        {item.dealSlipId}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-dark-gray/70">{item.label}</p>
                        <p className="text-[10px] text-dark-gray/35">{item.detail}</p>
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-dark-gray/60">
                        {item.amount ? fmtN(item.amount) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-dark-gray/70">
                          {item.resolution.resolvedBy}
                        </p>
                        <p className="text-[10px] text-dark-gray/35">
                          {new Date(item.resolution.resolvedAt).toLocaleDateString("en-NG", {
                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="py-3 text-dark-gray/50">{item.resolution.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Resolve modal ── */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-gray/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-sm font-bold text-dark-gray">Resolve Break</p>
                <p className="text-[10px] text-dark-gray/45">{resolvingId}</p>
              </div>
              <button
                onClick={() => setResolvingId(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-dark-gray/40 transition hover:bg-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="mb-2 text-xs font-semibold text-dark-gray">Resolution comment</p>
              <textarea
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-dark-gray placeholder-dark-gray/35 focus:border-primary focus:outline-none"
                rows={3}
                placeholder="Describe how this break was resolved (e.g. 'Custodian confirmed receipt. DVP matched. No further action required.')"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <p className="mt-1.5 text-[10px] text-dark-gray/35">
                Resolving as: {persona.name} · {new Date().toLocaleDateString("en-NG")}
              </p>
            </div>
            <div className="flex gap-3 border-t border-border px-5 py-4">
              <button
                onClick={() => setResolvingId(null)}
                className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-dark-gray/60 transition hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                onClick={markResolved}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
