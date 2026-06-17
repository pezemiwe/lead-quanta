import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { StageBadge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import { Layers, AlertTriangle, ShieldAlert } from "lucide-react";
import { useIFRS9 } from "../store";
import type { SecurityComputed, Stage } from "../engine/types";

interface StagingRow extends Record<string, unknown> {
  sn: number;
  counterparty: string;
  dpd: number;
  dpdStage: Stage;
  performanceStatus: string;
  performanceStage: Stage;
  expiryStage: Stage | null;
  modelStage: Stage;
  override: number;
  finalStage: Stage;
}

const toRow = (r: SecurityComputed): StagingRow => ({
  sn: r.sn,
  counterparty: r.counterparty,
  dpd: r.daysPastDue,
  dpdStage: r.dpdStage,
  performanceStatus: r.performanceStatus,
  performanceStage: r.performanceStage,
  expiryStage: r.expiryStage,
  modelStage: r.modelStage,
  override: r.qualitativeStagingOverride,
  finalStage: r.finalStage,
});

export function IFRS9Staging() {
  const { result, updateSecurity } = useIFRS9();
  const rows = result.rows.map(toRow);
  const [selected, setSelected] = useState<StagingRow | null>(null);

  const counts: Record<Stage, number> = { 1: 0, 2: 0, 3: 0 };
  for (const r of rows) counts[r.finalStage] += 1;

  const cols: DataTableColumn<StagingRow>[] = [
    { key: "sn", header: "SN", width: "60px" },
    { key: "counterparty", header: "Counterparty" },
    { key: "dpd", header: "DPD", align: "right" },
    {
      key: "dpdStage",
      header: "DPD Stage",
      render: (r) => <StageBadge stage={r.dpdStage} />,
    },
    { key: "performanceStatus", header: "Performance" },
    {
      key: "performanceStage",
      header: "Perf. Stage",
      render: (r) => <StageBadge stage={r.performanceStage} />,
    },
    {
      key: "expiryStage",
      header: "Expiry",
      render: (r) =>
        r.expiryStage ? (
          <StageBadge stage={r.expiryStage} />
        ) : (
          <span className="text-xs text-dark-gray/40">—</span>
        ),
    },
    {
      key: "modelStage",
      header: "Model",
      render: (r) => <StageBadge stage={r.modelStage} />,
    },
    {
      key: "override",
      header: "Override",
      align: "center",
      render: (r) => (
        <select
          value={r.override}
          onChange={(e) =>
            updateSecurity(r.sn, {
              qualitativeStagingOverride: Number(e.target.value),
            })
          }
          onClick={(e) => e.stopPropagation()}
          className={`rounded-md border px-1.5 py-0.5 text-xs font-medium outline-none focus:border-primary ${
            r.override > 0
              ? "border-yellow-400 bg-yellow-50 text-yellow-700"
              : "border-border bg-surface text-gray-500"
          }`}
          title="Qualitative override: 0 = none, 1–3 = force stage"
        >
          <option value={0}>—</option>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      ),
    },
    {
      key: "finalStage",
      header: "Final",
      render: (r) => <StageBadge stage={r.finalStage} />,
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Staging Decomposition
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Worst-of DPD, performance status and lifetime-expiry indicators, with
          qualitative override.
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Stage 1 instruments"
          value={counts[1]}
          variant="default"
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          title="Stage 2 instruments"
          value={counts[2]}
          variant="warning"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <StatCard
          title="Stage 3 instruments"
          value={counts[3]}
          variant="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          title="Overrides applied"
          value={rows.filter((r) => r.override > 0).length}
          variant="highlight"
        />
      </StatCardGrid>

      <SectionCard noPadding>
        <DataTable
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.sn}
          emptyMessage="No staging output"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.counterparty ?? "Staging Detail"}
        subtitle={`SN ${selected?.sn}`}
        fields={
          selected
            ? [
                { label: "SN", value: String(selected.sn) },
                { label: "Counterparty", value: selected.counterparty },
                { label: "Days Past Due", value: String(selected.dpd) },
                {
                  label: "DPD Stage",
                  value: <StageBadge stage={selected.dpdStage} />,
                },
                {
                  label: "Performance Status",
                  value: selected.performanceStatus,
                },
                {
                  label: "Performance Stage",
                  value: <StageBadge stage={selected.performanceStage} />,
                },
                {
                  label: "Expiry Stage",
                  value: selected.expiryStage ? (
                    <StageBadge stage={selected.expiryStage} />
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Model Stage",
                  value: <StageBadge stage={selected.modelStage} />,
                },
                {
                  label: "Override",
                  value:
                    selected.override > 0
                      ? `Stage ${selected.override}`
                      : "None",
                },
                {
                  label: "Final Stage",
                  value: <StageBadge stage={selected.finalStage} />,
                },
              ]
            : []
        }
      />
    </div>
  );
}
