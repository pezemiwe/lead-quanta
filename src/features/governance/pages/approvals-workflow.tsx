import { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart2,
  BookOpen,
  TrendingUp,
  Shield,
  CornerUpLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { useGovernance, type ApprovalItem } from "../../../context/governance";
import { usePersona } from "../../../context/persona";
import { fmtCompact } from "../../portfolio/engine/book-compute";

const TYPE_META: Record<
  ApprovalItem["type"],
  { label: string; Icon: React.ElementType; colour: string; bg: string }
> = {
  deal: { label: "Deal Booking", Icon: BarChart2, colour: "text-blue-600", bg: "bg-blue-50" },
  impairment: { label: "Impairment Review", Icon: Shield, colour: "text-orange-600", bg: "bg-orange-50" },
  journal: { label: "Journal Entry", Icon: BookOpen, colour: "text-amber-600", bg: "bg-amber-50" },
  valuation: { label: "Valuation Override", Icon: TrendingUp, colour: "text-purple-600", bg: "bg-purple-50" },
  "limit-exception": { label: "Limit Exception", Icon: AlertTriangle, colour: "text-red-600", bg: "bg-red-50" },
  counterparty: { label: "Counterparty", Icon: FileText, colour: "text-teal-600", bg: "bg-teal-50" },
};

const PRIORITY_STYLE: Record<string, { badge: string; dot: string }> = {
  high: { badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  medium: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  low: { badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
};

function slaHours(submittedAt: string): number {
  return Math.floor(
    (Date.now() - new Date(submittedAt.includes("T") ? submittedAt : submittedAt + "T09:00:00").getTime()) /
      3_600_000,
  );
}

function SLABadge({ submittedAt, status }: { submittedAt: string; status: ApprovalItem["status"] }) {
  if (status !== "pending") return null;
  const hrs = slaHours(submittedAt);
  const colour = hrs >= 48 ? "text-red-600 bg-red-50" : hrs >= 24 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${colour}`}>
      <Clock className="h-2.5 w-2.5" />
      {hrs < 1 ? "<1h" : `${hrs}h`} ago
      {hrs >= 48 && " — OVERDUE"}
    </span>
  );
}

type FilterType = "all" | "pending" | "approved" | "rejected";

export function ApprovalsWorkflow() {
  const { approvals, decideApproval, logAction } = useGovernance();
  const { persona } = usePersona();
  const [filter, setFilter] = useState<FilterType>("pending");
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const canApprove = (item: ApprovalItem) =>
    item.requiredApprover === persona.role && item.status === "pending";

  const handleDecide = (
    item: ApprovalItem,
    decision: "approved" | "rejected",
  ) => {
    decideApproval(item.id, decision);
    logAction({
      user: persona.name,
      role: persona.role,
      module: item.module,
      action:
        decision === "approved"
          ? `${item.type.toUpperCase()} Approved`
          : `${item.type.toUpperCase()} Rejected`,
      detail: `${item.title} — ₦${fmtCompact(item.amount)} — decision: ${decision}${comment ? ` — Note: ${comment}` : ""}`,
      status: decision === "approved" ? "success" : "warning",
      ip: "10.0.1.xx",
    });
    setComment("");
  };

  const { pending, approved, rejected } = useMemo(
    () => ({
      pending: approvals.filter((a) => a.status === "pending"),
      approved: approvals.filter((a) => a.status === "approved"),
      rejected: approvals.filter((a) => a.status === "rejected"),
    }),
    [approvals],
  );

  const displayed = useMemo(
    () => (filter === "all" ? approvals : approvals.filter((a) => a.status === filter)),
    [approvals, filter],
  );

  const selectedItem = useMemo(
    () => (selected ? approvals.find((a) => a.id === selected) ?? null : null),
    [approvals, selected],
  );

  const myPending = pending.filter(canApprove);

  const FILTERS: { id: FilterType; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "approved", label: "Approved", count: approved.length },
    { id: "rejected", label: "Rejected", count: rejected.length },
    { id: "all", label: "All", count: approvals.length },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* ── Page Header ── */}
      <div className="border-b border-border bg-surface px-5 py-5 lg:px-7">
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
          Governance
        </p>
        <h1 className="text-xl font-bold tracking-tight text-dark-gray">
          Maker-Checker Approval Queue
        </h1>
        <p className="mt-1 text-xs text-dark-gray/45">
          Centralised approval workflow across all modules · Signed in as{" "}
          <span className="font-semibold text-dark-gray">{persona.name}</span> ({persona.role})
        </p>
      </div>

      {/* ── KPI Strip ── */}
      <div className="border-b border-border bg-surface px-5 py-4 lg:px-7">
        <StatCardGrid>
          <StatCard
            title="Pending Decisions"
            value={String(pending.length)}
            subtitle="Awaiting approval"
            variant={pending.length > 0 ? "highlight" : "default"}
          />
          <StatCard
            title="Your Authority"
            value={myPending.length === 0 ? "None" : String(myPending.length)}
            subtitle="Items you can action"
            variant={myPending.length > 0 ? "highlight" : "default"}
          />
          <StatCard
            title="Approved"
            value={String(approved.length)}
            subtitle="This session"
          />
          <StatCard
            title="Rejected"
            value={String(rejected.length)}
            subtitle="This session"
          />
        </StatCardGrid>
      </div>

      {/* ── Two-Panel Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — queue list */}
        <div className="flex w-80 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto lg:w-96">
          {/* Filter pills */}
          <div className="flex gap-1 border-b border-border p-3">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                  filter === f.id
                    ? "bg-primary text-white"
                    : "text-dark-gray/50 hover:bg-surface-muted hover:text-dark-gray"
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span
                    className={`rounded-full px-1 text-[9px] ${
                      filter === f.id ? "bg-white/20" : "bg-surface-muted"
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <CheckCircle2 className="h-8 w-8 text-dark-gray/15" />
              <p className="text-xs text-dark-gray/35">No items in this category</p>
            </div>
          ) : (
            <div className="flex-1">
              {displayed.map((item) => {
                const meta = TYPE_META[item.type];
                const Icon = meta.Icon;
                const isSelected = selected === item.id;
                const eligible = canApprove(item);
                const priority = PRIORITY_STYLE[item.priority];

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(isSelected ? null : item.id)}
                    className={`flex w-full items-start gap-3 border-b border-border/50 px-4 py-3.5 text-left transition-colors last:border-0 ${
                      isSelected
                        ? "bg-pale-red"
                        : "hover:bg-surface-muted"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${meta.colour}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-dark-gray truncate leading-snug">
                          {item.title}
                        </p>
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 mt-0.5 transition-transform ${
                            isSelected ? "rotate-90 text-primary" : "text-dark-gray/25"
                          }`}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-dark-gray/45 truncate">
                        {meta.label} · {item.module}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${priority.badge}`}
                        >
                          {item.priority}
                        </span>
                        {item.status === "pending" ? (
                          <SLABadge submittedAt={item.submittedAt} status={item.status} />
                        ) : (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                              item.status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {item.status === "approved" ? (
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            ) : (
                              <XCircle className="h-2.5 w-2.5" />
                            )}
                            {item.status}
                          </span>
                        )}
                        {eligible && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                            Action required
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel — detail */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-surface-muted/30">
          {!selectedItem ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-border">
                <FileText className="h-7 w-7 text-dark-gray/20" />
              </div>
              <p className="text-sm font-semibold text-dark-gray/40">Select an item to review</p>
              <p className="text-xs text-dark-gray/30">
                Click any approval request from the list on the left
              </p>
            </div>
          ) : (
            <DetailPanel
              item={selectedItem}
              canAct={canApprove(selectedItem)}
              comment={comment}
              onCommentChange={setComment}
              onDecide={(d) => handleDecide(selectedItem, d)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({
  item,
  canAct,
  comment,
  onCommentChange,
  onDecide,
}: {
  item: ApprovalItem;
  canAct: boolean;
  comment: string;
  onCommentChange: (v: string) => void;
  onDecide: (d: "approved" | "rejected") => void;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.Icon;
  const hrs = slaHours(item.submittedAt);

  return (
    <div className="flex flex-col gap-0">
      {/* Detail header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}
          >
            <Icon className={`h-5 w-5 ${meta.colour}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-dark-gray leading-snug">{item.title}</h2>
            <p className="mt-0.5 text-xs text-dark-gray/50">{meta.label} · {item.module}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="neutral" size="sm">{item.id}</Badge>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                  PRIORITY_STYLE[item.priority].badge
                }`}
              >
                {item.priority} priority
              </span>
              {item.status !== "pending" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {item.status === "approved" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {item.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="p-6 space-y-5">
        {/* Description */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-dark-gray/40">
            Description
          </p>
          <p className="text-sm text-dark-gray/70 leading-relaxed">{item.description}</p>
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[
            { label: "Amount", value: item.amount > 0 ? `₦${fmtCompact(item.amount)}` : "—" },
            { label: "Submitted", value: item.submittedAt },
            {
              label: "SLA",
              value: item.status === "pending" ? `${hrs}h elapsed` : "Resolved",
              highlight: item.status === "pending" && hrs >= 24,
            },
            { label: "Maker", value: `${item.maker} (${item.makerRole})` },
            { label: "Required Checker", value: item.requiredApprover },
            { label: "Module", value: item.module },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="rounded-lg border border-border bg-surface p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-dark-gray/35">
                {label}
              </p>
              <p className={`text-xs font-semibold ${highlight ? "text-red-600" : "text-dark-gray"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* SLA warning */}
        {item.status === "pending" && hrs >= 24 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">
              <strong>SLA Breach:</strong> This approval has been pending for {hrs} hours, exceeding
              the 24-hour target. Escalate to {item.requiredApprover} or department head.
            </p>
          </div>
        )}

        {/* Roles info */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-dark-gray/40">
            Workflow Parties
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              { role: "Maker", name: item.maker, roleTitle: item.makerRole, done: true },
              { role: "Checker", name: item.requiredApprover, roleTitle: item.requiredApprover, done: item.status !== "pending" },
            ].map(({ role, name, roleTitle, done }) => (
              <div key={role} className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    done ? "bg-emerald-100" : "bg-surface-muted border border-border"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-dark-gray/30" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-dark-gray">{role}: {name}</p>
                  <p className="text-[10px] text-dark-gray/40">{roleTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action area */}
        {item.status === "pending" && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-dark-gray/40">
              Decision Comment
            </p>
            <textarea
              className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-dark-gray placeholder-dark-gray/35 focus:border-primary focus:outline-none"
              rows={2}
              placeholder="Optional: add a note to accompany your decision…"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              disabled={!canAct}
            />

            {!canAct && (
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-dark-gray/40">
                <Clock className="h-3 w-3" />
                Awaiting {item.requiredApprover} — you are signed in as {"{persona.role}"}
              </p>
            )}

            <div className="mt-3 flex gap-3">
              <button
                onClick={() => onDecide("rejected")}
                disabled={!canAct}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-bold transition ${
                  canAct
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "cursor-not-allowed border-border bg-surface-muted text-dark-gray/30"
                }`}
              >
                <CornerUpLeft className="h-3.5 w-3.5" /> Return / Reject
              </button>
              <button
                onClick={() => onDecide("approved")}
                disabled={!canAct}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white transition ${
                  canAct
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "cursor-not-allowed bg-dark-gray/20"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
