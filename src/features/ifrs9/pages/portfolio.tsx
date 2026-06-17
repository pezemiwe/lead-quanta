import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge, StageBadge } from "../../../components/shared/badge";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import { useIFRS9 } from "../store";
import { fmtCompact, fmtDate, fmtPct } from "../utils/format";
import type { SecurityComputed, PerformanceStatus } from "../engine/types";

type Row = SecurityComputed & Record<string, unknown>;

export function IFRS9Portfolio() {
  const { result, updateSecurity, removeSecurity } = useIFRS9();
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const cols: DataTableColumn<Row>[] = [
    { key: "sn", header: "SN", width: "60px" },
    { key: "counterparty", header: "Counterparty" },
    {
      key: "assetSpecification",
      header: "Specification",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.assetSpecification}
        </Badge>
      ),
    },
    { key: "currency", header: "CCY", width: "70px" },
    {
      key: "carryingAmountLcy",
      header: "Carrying (LCY)",
      align: "right",
      render: (r) => fmtCompact(r.carryingAmountLcy),
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "ratingEquivalent",
      header: "Rating",
      render: (r) => (
        <span className="font-mono text-xs font-medium text-dark-gray/80">
          {r.ratingEquivalent}
        </span>
      ),
    },
    {
      key: "performanceStatus",
      header: "Status",
      render: (r) => {
        const map: Record<
          string,
          | "performing"
          | "watch"
          | "substandard"
          | "doubtful"
          | "loss"
          | "default"
        > = {
          Performing: "performing",
          Watchlist: "watch",
          Substandard: "substandard",
          Doubtful: "doubtful",
          Loss: "loss",
          Default: "default",
        };
        return (
          <Badge variant={map[r.performanceStatus] ?? "neutral"} size="sm">
            {r.performanceStatus}
          </Badge>
        );
      },
    },
    {
      key: "daysPastDue",
      header: "DPD",
      align: "right",
      render: (r) => r.daysPastDue,
    },
    {
      key: "finalStage",
      header: "Stage",
      render: (r) => <StageBadge stage={r.finalStage} />,
    },
    {
      key: "ecl",
      header: "ECL",
      align: "right",
      render: (r) => (
        <span className="font-medium text-deep-red">{fmtCompact(r.ecl)}</span>
      ),
    },
    {
      key: "coverageRatio",
      header: "Coverage",
      align: "right",
      render: (r) => fmtPct(r.coverageRatio, 2),
    },
    {
      key: "_actions" as never,
      header: "",
      width: "72px",
      render: (r) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditing(r)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleting(r)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Debt Securities Portfolio
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          {result.rows.length} instruments · live ECL recomputed against current
          assumptions.
        </p>
      </div>

      <SectionCard noPadding>
        <DataTable
          columns={cols}
          data={result.rows as Row[]}
          keyExtractor={(r) => r.sn}
          emptyMessage="No instruments uploaded"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.counterparty ?? "Instrument Detail"}
        subtitle={`SN ${selected?.sn} · ${selected?.assetSpecification ?? ""}`}
        fields={
          selected
            ? [
                { label: "SN", value: String(selected.sn) },
                { label: "Counterparty", value: selected.counterparty },
                {
                  label: "Specification",
                  value: (
                    <Badge variant="neutral" size="sm">
                      {selected.assetSpecification}
                    </Badge>
                  ),
                },
                { label: "Currency", value: selected.currency },
                {
                  label: "Carrying Amount (LCY)",
                  value: fmtCompact(selected.carryingAmountLcy),
                },
                {
                  label: "Maturity Date",
                  value: fmtDate(selected.maturityDate),
                },
                { label: "Rating", value: selected.ratingEquivalent },
                {
                  label: "Performance Status",
                  value: selected.performanceStatus,
                },
                { label: "Days Past Due", value: String(selected.daysPastDue) },
                {
                  label: "Stage",
                  value: <StageBadge stage={selected.finalStage} />,
                },
                {
                  label: "ECL",
                  value: (
                    <span className="font-medium text-deep-red">
                      {fmtCompact(selected.ecl)}
                    </span>
                  ),
                },
                {
                  label: "Coverage Ratio",
                  value: fmtPct(selected.coverageRatio, 2),
                },
              ]
            : []
        }
      />

      {editing && (
        <EditSecurityDrawer
          row={editing}
          onSave={(patch) => {
            updateSecurity(editing.sn as number, patch);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDeleting(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-dark-gray">
              Remove Security
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Remove{" "}
              <span className="font-medium text-dark-gray">
                SN {String(deleting.sn)} — {String(deleting.counterparty)}
              </span>{" "}
              from the portfolio? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeSecurity(deleting.sn as number);
                  setDeleting(null);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── edit security drawer ──────────────────────────────── */
const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function EditSecurityDrawer({
  row,
  onSave,
  onClose,
}: {
  row: Row;
  onSave: (patch: {
    counterparty?: string;
    performanceStatus?: PerformanceStatus;
    daysPastDue?: number;
    ratingAtReportingDate?: string;
  }) => void;
  onClose: () => void;
}) {
  const [counterparty, setCounterparty] = useState(
    String(row.counterparty ?? ""),
  );
  const [performanceStatus, setPerformanceStatus] = useState<PerformanceStatus>(
    (row.performanceStatus as PerformanceStatus) ?? "Performing",
  );
  const [daysPastDue, setDaysPastDue] = useState(Number(row.daysPastDue ?? 0));
  const [rating, setRating] = useState(String(row.ratingAtReportingDate ?? ""));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-dark-gray">
              Edit Security
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              SN {String(row.sn)} — changes recompute ECL immediately.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Counterparty
            </label>
            <input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Performance Status
            </label>
            <select
              value={performanceStatus}
              onChange={(e) =>
                setPerformanceStatus(e.target.value as PerformanceStatus)
              }
              className={inputCls}
            >
              {(
                [
                  "Performing",
                  "Watchlist",
                  "Substandard",
                  "Doubtful",
                  "Loss",
                  "Default",
                ] as PerformanceStatus[]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Days Past Due
            </label>
            <input
              type="number"
              min={0}
              value={daysPastDue}
              onChange={(e) => setDaysPastDue(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Rating at Reporting Date
            </label>
            <input
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className={inputCls}
              placeholder="e.g. BBB+"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                counterparty,
                performanceStatus,
                daysPastDue,
                ratingAtReportingDate: rating,
              })
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
