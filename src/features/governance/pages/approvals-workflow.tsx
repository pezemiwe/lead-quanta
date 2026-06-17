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
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { useGovernance, type ApprovalItem } from "../../../context/governance";
import { usePersona } from "../../../context/persona";
import { fmtCompact } from "../../portfolio/engine/book-compute";

const TYPE_META: Record<
  ApprovalItem["type"],
  { label: string; Icon: React.ElementType; colour: string }
> = {
  deal: { label: "Deal Booking", Icon: BarChart2, colour: "text-blue-600" },
  ecl: { label: "ECL / Staging", Icon: Shield, colour: "text-red-600" },
  journal: { label: "Journal Entry", Icon: BookOpen, colour: "text-amber-600" },
  valuation: {
    label: "Valuation Override",
    Icon: TrendingUp,
    colour: "text-purple-600",
  },
  "limit-exception": {
    label: "Limit Exception",
    Icon: AlertTriangle,
    colour: "text-orange-600",
  },
  counterparty: {
    label: "Counterparty",
    Icon: FileText,
    colour: "text-teal-600",
  },
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-50 text-red-700 border border-red-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  low: "bg-gray-100 text-gray-600 border border-gray-200",
};

export function ApprovalsWorkflow() {
  const { approvals, decideApproval, logAction } = useGovernance();
  const { persona } = usePersona();
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

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
      detail: `${item.title} — ₦${fmtCompact(item.amount)} — decision: ${decision}`,
      status: decision === "approved" ? "success" : "warning",
      ip: "10.0.1.xx",
    });
  };

  const { pending, approved, rejected } = useMemo(
    () => ({
      pending: approvals.filter((a) => a.status === "pending"),
      approved: approvals.filter((a) => a.status === "approved"),
      rejected: approvals.filter((a) => a.status === "rejected"),
    }),
    [approvals],
  );

  const displayed =
    filter === "all" ? approvals : approvals.filter((a) => a.status === filter);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Approval Workflows — Maker-Checker
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Centralised approval queue across all modules · Logged in as{" "}
          <span className="font-medium text-dark-gray">
            {persona.name || "—"}
          </span>{" "}
          ({persona.role || "—"})
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Pending Approvals"
          value={String(pending.length)}
          subtitle="Awaiting decision"
          variant="highlight"
        />
        <StatCard
          title="Approved (session)"
          value={String(approved.length)}
          subtitle="Confirmed this session"
          variant="default"
        />
        <StatCard
          title="Rejected (session)"
          value={String(rejected.length)}
          subtitle="Declined this session"
          variant="default"
        />
        <StatCard
          title="Your Approval Authority"
          value={
            pending.filter(canApprove).length === 0
              ? "None pending"
              : String(pending.filter(canApprove).length)
          }
          subtitle="Items you can action now"
          variant={
            pending.filter(canApprove).length > 0 ? "highlight" : "default"
          }
        />
      </StatCardGrid>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-surface border border-border text-dark-gray/70 hover:bg-pale-red hover:text-primary"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-1 text-xs opacity-70">
                (
                {f === "pending"
                  ? pending.length
                  : f === "approved"
                    ? approved.length
                    : rejected.length}
                )
              </span>
            )}
          </button>
        ))}
      </div>

      <SectionCard
        title="Approval Queue"
        description="All pending and completed approval requests. Only designated checkers may approve."
      >
        <div className="space-y-3">
          {displayed.length === 0 && (
            <p className="py-8 text-center text-sm text-dark-gray/40">
              No items in this category
            </p>
          )}
          {displayed.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.Icon;
            const eligible = canApprove(item);
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-4 transition-colors ${
                  item.status === "approved"
                    ? "border-emerald-200 bg-emerald-50/30"
                    : item.status === "rejected"
                      ? "border-red-200 bg-red-50/20"
                      : "border-border bg-surface"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-md bg-white border border-border p-1.5`}
                  >
                    <Icon className={`h-4 w-4 ${meta.colour}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-dark-gray">
                        {item.title}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[item.priority]}`}
                      >
                        {item.priority.toUpperCase()}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {item.module}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-dark-gray/60">
                      {item.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-dark-gray/50">
                      <span>
                        Maker:{" "}
                        <span className="font-medium text-dark-gray">
                          {item.maker}
                        </span>{" "}
                        ({item.makerRole})
                      </span>
                      <span>
                        Checker required:{" "}
                        <span className="font-medium text-dark-gray">
                          {item.requiredApprover}
                        </span>
                      </span>
                      {item.amount > 0 && (
                        <span>
                          Amount:{" "}
                          <span className="font-medium text-dark-gray">
                            ₦{fmtCompact(item.amount)}
                          </span>
                        </span>
                      )}
                      <span>Submitted: {item.submittedAt}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            eligible && handleDecide(item, "approved")
                          }
                          disabled={!eligible}
                          title={
                            !eligible
                              ? `Only ${item.requiredApprover} can approve`
                              : "Approve"
                          }
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            eligible
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            eligible && handleDecide(item, "rejected")
                          }
                          disabled={!eligible}
                          title={
                            !eligible
                              ? `Only ${item.requiredApprover} can reject`
                              : "Reject"
                          }
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            eligible
                              ? "border border-primary text-primary hover:bg-pale-red"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {item.status !== "pending" && (
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status === "approved" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </span>
                    )}
                    {item.status === "pending" && !eligible && (
                      <span className="flex items-center gap-1.5 text-xs text-dark-gray/40">
                        <Clock className="h-3.5 w-3.5" /> Awaiting{" "}
                        {item.requiredApprover.split(" ")[0]}
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
