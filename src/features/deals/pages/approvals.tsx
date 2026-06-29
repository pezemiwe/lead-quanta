import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { DataTable, type DataTableColumn } from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { PermissionStatGrid } from "../../../components/shared/permission-stat-grid";
import { usePersona } from "../../../context/persona";
import { canDo } from "../../../context/platform-personas";
import { useWorkflow } from "../../workflow/store";
import type { DealSlip } from "../../workflow/types";
import { DealSlipStatusBadge } from "../../workflow/components/status-badge";
import { DealSlipWorkspace } from "../../workflow/components/deal-slip-workspace";
import { dealSlipLabel, dealNotional } from "../../workflow/engine/fields";

type Row = DealSlip & Record<string, unknown>;

export function Approvals() {
  const { persona } = usePersona();
  const { queues, dealSlips } = useWorkflow();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reviewQueue = queues.reviewQueue(persona.role);
  const approvalQueue = queues.approvalQueue(persona.role);
  const canReview = canDo(persona.role, "checks", "R") || canDo(persona.role, "dealSlip", "R");
  const canApprove = canDo(persona.role, "approval", "A");

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "Deal slip", width: "110px" },
    { key: "label", header: "Description", render: (r) => dealSlipLabel(r.fields, r.assetClass) },
    { key: "assetClass", header: "Asset class" },
    {
      key: "status",
      header: "Status",
      render: (r) => <DealSlipStatusBadge status={r.status} />,
    },
    {
      key: "checks",
      header: "Checks",
      render: (r) => {
        const open = r.checks.filter((c) => c.status === "breach" || c.status === "pending").length;
        return open ? `${open} open` : "Clear";
      },
    },
    {
      key: "notional",
      header: "Notional",
      align: "right",
      render: (r) => dealNotional(r.fields).toLocaleString(),
    },
  ];

  const queue = canApprove ? approvalQueue : canReview ? reviewQueue : [];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-dark-gray">Review &amp; approval</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-dark-gray/55">
          Control functions review checks; approvers sign off within mandate.
        </p>
      </div>

      <PermissionStatGrid>
        {canReview && (
          <StatCard
            title="Review queue"
            value={String(reviewQueue.length)}
            subtitle="Awaiting control review"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        )}
        {canApprove && (
          <StatCard
            title="Approval queue"
            value={String(approvalQueue.length)}
            subtitle="Awaiting approver action"
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="highlight"
          />
        )}
      </PermissionStatGrid>

      {!canReview && !canApprove ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-dark-gray/55">
          Your role does not participate in deal slip review or approval.
        </div>
      ) : (
        <SectionCard title={canApprove ? "Approval queue" : "Control review queue"}>
          <DataTable columns={cols} data={queue as Row[]} onRowClick={(r) => setSelectedId(String(r.id))} />
          {queue.length === 0 && (
            <p className="py-8 text-center text-sm text-dark-gray/45">No deals pending your action.</p>
          )}
        </SectionCard>
      )}

      {canReview && (
        <SectionCard title="All in-flight deals">
          <DataTable
            columns={cols}
            data={dealSlips.filter((d) => ["Submitted", "Under Review"].includes(d.status)) as Row[]}
            onRowClick={(r) => setSelectedId(String(r.id))}
          />
        </SectionCard>
      )}

      {selectedId && (
        <DealSlipWorkspace dealId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
