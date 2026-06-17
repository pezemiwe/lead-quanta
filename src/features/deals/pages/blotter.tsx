import * as XLSX from "xlsx";
import { useState, useMemo } from "react";
import { Search, Filter, Download, Pencil, Trash2, X } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { AcronymTip } from "../../../components/shared/acronym-tip";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../portfolio/engine/book-compute";
import type { Instrument } from "../../portfolio/engine/book-compute";

const CLF_COLOR: Record<string, "info" | "success" | "warning"> = {
  AC: "info",
  FVOCI: "success",
  FVTPL: "warning",
};

type Row = Instrument & Record<string, unknown>;

export function DealBlotter() {
  const [instruments, setInstruments] = useState<Instrument[]>([
    ...BOOK_INSTRUMENTS,
  ]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [clfFilter, setClfFilter] = useState("All");
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const types = useMemo(
    () => [
      "All",
      ...Array.from(new Set(instruments.map((i) => i.instrumentType))).sort(),
    ],
    [instruments],
  );

  const rows = useMemo<Row[]>(() => {
    return instruments.filter((i) => {
      const matchType = typeFilter === "All" || i.instrumentType === typeFilter;
      const matchClf = clfFilter === "All" || i.classification === clfFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.issuer.toLowerCase().includes(q);
      return matchType && matchClf && matchSearch;
    }) as Row[];
  }, [instruments, search, typeFilter, clfFilter]);

  const totals = BOOK_COMPUTED.totals;

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument Name" },
    {
      key: "instrumentType",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.instrumentType}
        </Badge>
      ),
    },
    { key: "issuer", header: "Issuer / Counterparty" },
    {
      key: "classification",
      header: "Classification",
      render: (r) => (
        <AcronymTip term={r.classification}>
          <Badge variant={CLF_COLOR[r.classification]} size="sm">
            {r.classification}
          </Badge>
        </AcronymTip>
      ),
    },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "couponRate",
      header: "Coupon",
      align: "right",
      render: (r) =>
        r.couponRate > 0 ? (
          fmtPct(r.couponRate)
        ) : (
          <span className="text-gray-400">Disc.</span>
        ),
    },
    { key: "couponFrequency", header: "Freq", width: "80px" },
    {
      key: "purchaseDate",
      header: "Purchase",
      render: (r) => fmtDate(r.purchaseDate),
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "impairmentStage",
      header: "Stage",
      render: (r) => {
        const stage = r.impairmentStage ?? "N/A";
        const v =
          stage === "Stage 1"
            ? "stage1"
            : stage === "Stage 2"
              ? "stage2"
              : stage === "Stage 3"
                ? "stage3"
                : "neutral";
        return (
          <Badge variant={v as never} size="sm">
            {stage}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant="performing" size="sm">
          {r.status}
        </Badge>
      ),
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

  const exportXlsx = () => {
    const headers = [
      "ID",
      "Instrument",
      "Issuer",
      "Type",
      "Sector",
      "Classification",
      "Currency",
      "Face Value",
      "Purchase Price",
      "Purchase Date",
      "Maturity Date",
      "Coupon Rate %",
      "Coupon Frequency",
      "Status",
      "Stage",
    ];
    const data = rows.map((r) => [
      r.id,
      r.name,
      r.issuer,
      r.instrumentType,
      r.sector,
      r.classification,
      r.currency,
      r.faceValue,
      r.purchasePrice,
      r.purchaseDate,
      r.maturityDate,
      r.couponRate > 0 ? +(r.couponRate * 100).toFixed(4) : 0,
      r.couponFrequency,
      r.status,
      r.impairmentStage ?? "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trade Blotter");
    XLSX.writeFile(
      wb,
      `trade-blotter-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            Trade Blotter
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            {rows.length} of {instruments.length} instruments · Portfolio
            Management book · 28 May 2026
          </p>
        </div>
        <button
          onClick={exportXlsx}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/70 hover:border-primary hover:text-primary"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Instruments"
          value={String(instruments.length)}
          subtitle="Portfolio Management book"
          variant="highlight"
        />
        <StatCard
          title="Total Face Value"
          value={fmtCompact(totals.totalFaceValueNGN)}
          subtitle="NGN equivalent"
          variant="default"
        />
        <StatCard
          title="Total Book Value"
          value={fmtCompact(totals.totalBSValueNGN)}
          subtitle="Balance-sheet carrying amount"
          variant="default"
        />
        <StatCard
          title="Filtered Rows"
          value={String(rows.length)}
          subtitle="After current filters"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard title="Instrument Book">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name or issuer…"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm text-dark-gray placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
            >
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={clfFilter}
              onChange={(e) => setClfFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
            >
              <option value="All">All Classifications</option>
              <option value="AC">AC \u2014 Amortised Cost</option>
              <option value="FVOCI">FVOCI \u2014 Fair Value (OCI)</option>
              <option value="FVTPL">FVTPL \u2014 Fair Value (P&L)</option>
            </select>
          </div>
        </div>

        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments match your filters"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Instrument Detail"}
        subtitle={selected?.id}
        fields={
          selected
            ? [
                { label: "ID", value: selected.id },
                {
                  label: "Type",
                  value: (
                    <Badge variant="neutral" size="sm">
                      {selected.instrumentType}
                    </Badge>
                  ),
                },
                { label: "Issuer / Counterparty", value: selected.issuer },
                {
                  label: "Classification",
                  value: (
                    <AcronymTip term={selected.classification}>
                      <Badge
                        variant={CLF_COLOR[selected.classification]}
                        size="sm"
                      >
                        {selected.classification}
                      </Badge>
                    </AcronymTip>
                  ),
                },
                { label: "Currency", value: selected.currency },
                { label: "Face Value", value: fmtCompact(selected.faceValue) },
                {
                  label: "Coupon Rate",
                  value:
                    selected.couponRate > 0
                      ? fmtPct(selected.couponRate)
                      : "Discount",
                },
                { label: "Coupon Frequency", value: selected.couponFrequency },
                {
                  label: "Purchase Date",
                  value: fmtDate(selected.purchaseDate),
                },
                {
                  label: "Maturity Date",
                  value: fmtDate(selected.maturityDate),
                },
                { label: "Stage", value: selected.impairmentStage ?? "N/A" },
                {
                  label: "Status",
                  value: (
                    <Badge variant="performing" size="sm">
                      {selected.status}
                    </Badge>
                  ),
                },
              ]
            : []
        }
      />

      {editing && (
        <EditBlotterDrawer
          row={editing}
          onSave={(patch) => {
            setInstruments((prev) =>
              prev.map((i) => (i.id === editing.id ? { ...i, ...patch } : i)),
            );
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
              Remove Trade
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Remove{" "}
              <span className="font-medium text-dark-gray">
                {String(deleting.name)}
              </span>{" "}
              ({String(deleting.id)}) from the blotter? This cannot be undone.
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
                  setInstruments((prev) =>
                    prev.filter((i) => i.id !== String(deleting.id)),
                  );
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

/* ─── edit blotter drawer ───────────────────────────────── */
const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function EditBlotterDrawer({
  row,
  onSave,
  onClose,
}: {
  row: Row;
  onSave: (patch: Partial<Instrument>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(String(row.name ?? ""));
  const [issuer, setIssuer] = useState(String(row.issuer ?? ""));
  const [faceValue, setFaceValue] = useState(Number(row.faceValue ?? 0));
  const [couponRate, setCouponRate] = useState(Number(row.couponRate ?? 0));
  const [stage, setStage] = useState(String(row.impairmentStage ?? "Stage 1"));
  const [status, setStatus] = useState(String(row.status ?? "Active"));

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
              Edit Trade
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">{String(row.id)}</p>
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
              Instrument Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Issuer / Counterparty
            </label>
            <input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Face Value (NGN)
              </label>
              <input
                type="number"
                value={faceValue}
                onChange={(e) => setFaceValue(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Coupon Rate
              </label>
              <input
                type="number"
                step="0.001"
                value={couponRate}
                onChange={(e) => setCouponRate(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Impairment Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className={inputCls}
              >
                <option>Stage 1</option>
                <option>Stage 2</option>
                <option>Stage 3</option>
                <option>N/A</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                <option>Active</option>
                <option>Matured</option>
                <option>Disposed</option>
              </select>
            </div>
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
                name,
                issuer,
                faceValue,
                couponRate,
                impairmentStage: stage as never,
                status: status as never,
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
