import * as XLSX from "xlsx";
import {
  Search,
  Download,
  SlidersHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../../features/portfolio/engine/book-compute";

type HoldingRow = {
  id: string;
  name: string;
  instrumentType: string;
  issuer: string;
  sector: string;
  classification: string;
  currency: string;
  faceValue: number;
  bookValueNGN: number;
  eirPct: number;
  couponRate: number;
  maturityDate: string | null;
  stage: string;
  status: string;
  [key: string]: unknown;
};

const valMap = new Map(
  BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
);

const ALL_ROWS: HoldingRow[] = BOOK_INSTRUMENTS.map((inst) => {
  const v = valMap.get(inst.id);
  return {
    id: inst.id,
    name: inst.name,
    instrumentType: inst.instrumentType as string,
    issuer: inst.issuer,
    sector: inst.sector,
    classification: inst.classification as string,
    currency: inst.currency as string,
    faceValue: inst.faceValue,
    bookValueNGN: v?.balanceSheetValueNGN ?? inst.faceValue,
    eirPct: v?.eir ?? 0,
    couponRate: inst.couponRate,
    maturityDate: inst.maturityDate ?? null,
    stage: inst.classification,
    status: inst.status as string,
  } as HoldingRow;
});

const ALL_TYPES = [
  "All",
  ...Array.from(new Set(BOOK_INSTRUMENTS.map((i) => i.instrumentType))),
].sort();
const ALL_CLASSIFICATIONS = ["All", "AC", "FVOCI", "FVTPL"];

const CLASS_STYLE: Record<string, { bg: string; text: string }> = {
  AC: { bg: "#FEE2E2", text: "#C8102E" },
  FVOCI: { bg: "#DBEAFE", text: "#1E3A5F" },
  FVTPL: { bg: "#FEF3C7", text: "#92400E" },
};
const CLASS_LABEL: Record<string, string> = {
  AC: "Amortised Cost",
  FVOCI: "Fair Value (OCI)",
  FVTPL: "Fair Value (P&L)",
};
const STAGE_STYLE: Record<string, string> = {
  "Stage 1": "bg-emerald-50 text-emerald-700",
  "Stage 2": "bg-amber-50 text-amber-700",
  "Stage 3": "bg-red-50 text-primary",
};

const COLUMNS: DataTableColumn<HoldingRow>[] = [
  {
    key: "id",
    header: "ID",
    width: "80px",
    render: (r) => (
      <span className="font-mono text-xs text-dark-gray/50">{r.id}</span>
    ),
  },
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="font-medium text-dark-gray text-xs">{r.name}</span>
    ),
  },
  {
    key: "classification",
    header: "Class",
    render: (r) => (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{
          background: CLASS_STYLE[r.classification]?.bg,
          color: CLASS_STYLE[r.classification]?.text,
        }}
      >
        {CLASS_LABEL[r.classification] ?? r.classification}
      </span>
    ),
  },
  {
    key: "instrumentType",
    header: "Type",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">{r.instrumentType}</span>
    ),
  },
  {
    key: "issuer",
    header: "Issuer",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">{r.issuer}</span>
    ),
  },
  {
    key: "currency",
    header: "CCY",
    align: "center",
    render: (r) => (
      <span className="text-xs text-dark-gray/60">{r.currency}</span>
    ),
  },
  {
    key: "bookValueNGN",
    header: "Book Value (₦)",
    align: "right",
    render: (r) => (
      <span className="text-xs font-semibold text-dark-gray">
        {fmtCompact(r.bookValueNGN)}
      </span>
    ),
  },
  {
    key: "eirPct",
    header: "EIR",
    align: "right",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">
        {r.eirPct > 0 ? fmtPct(r.eirPct) : "—"}
      </span>
    ),
  },
  {
    key: "couponRate",
    header: "Coupon",
    align: "right",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">
        {r.couponRate > 0 ? fmtPct(r.couponRate) : "—"}
      </span>
    ),
  },
  {
    key: "maturityDate",
    header: "Maturity",
    render: (r) => (
      <span className="text-xs text-dark-gray/60">
        {fmtDate(r.maturityDate)}
      </span>
    ),
  },
  {
    key: "stage",
    header: "Stage",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLE[r.stage] ?? "bg-gray-100 text-dark-gray/60"}`}
      >
        {r.stage}
      </span>
    ),
  },
];

export function PortfolioHoldings() {
  const [rows, setRows] = useState<HoldingRow[]>(ALL_ROWS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [selected, setSelected] = useState<HoldingRow | null>(null);
  const [editing, setEditing] = useState<HoldingRow | null>(null);
  const [deleting, setDeleting] = useState<HoldingRow | null>(null);

  const actionsColumn: DataTableColumn<HoldingRow> = {
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
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "All" && r.instrumentType !== typeFilter) return false;
      if (classFilter !== "All" && r.classification !== classFilter)
        return false;
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.issuer.toLowerCase().includes(q) &&
        !r.id.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, search, typeFilter, classFilter]);

  const totalBookValue = filtered.reduce((s, r) => s + r.bookValueNGN, 0);

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
      "Book Value (NGN)",
      "EIR %",
      "Coupon Rate %",
      "Maturity Date",
      "Stage",
      "Status",
    ];
    const data = filtered.map((r) => [
      r.id,
      r.name,
      r.issuer,
      r.instrumentType,
      r.sector,
      r.classification,
      r.currency,
      r.faceValue,
      +r.bookValueNGN.toFixed(2),
      +(r.eirPct * 100).toFixed(4),
      +(r.couponRate * 100).toFixed(4),
      r.maturityDate ?? "",
      r.stage,
      r.status,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holdings");
    XLSX.writeFile(
      wb,
      `portfolio-holdings-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Holdings</h1>
          <p className="mt-1 text-sm text-dark-gray/50">
            {filtered.length} of {ALL_ROWS.length} instruments · Book value{" "}
            <span className="font-semibold text-dark-gray">
              {fmtCompact(totalBookValue)}
            </span>
          </p>
        </div>
        <button
          onClick={exportXlsx}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/60 shadow-sm hover:border-primary hover:text-primary"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Amortised Cost",
            value: rows.filter((r) => r.classification === "AC").length,
          },
          {
            label: "Fair Value (OCI)",
            value: rows.filter((r) => r.classification === "FVOCI").length,
          },
          {
            label: "Fair Value (P&L)",
            value: rows.filter((r) => r.classification === "FVTPL").length,
          },
          {
            label: "Stage 2/3 Watch",
            value: rows.filter((r) => r.stage !== "Stage 1").length,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-dark-gray/50 font-medium">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-dark-gray">{s.value}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, issuer, ID…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary w-72"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-dark-gray/40" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
          >
            {ALL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
          >
            {ALL_CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Classifications" : (CLASS_LABEL[c] ?? c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable<HoldingRow>
        columns={[...COLUMNS, actionsColumn]}
        data={filtered}
        keyExtractor={(r) => r.id}
        pageSize={25}
        emptyMessage="No instruments match your filters"
        onRowClick={setSelected}
      />

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Holding Detail"}
        subtitle={selected?.id}
        fields={
          selected
            ? [
                { label: "ID", value: selected.id },
                { label: "Type", value: selected.instrumentType },
                { label: "Issuer", value: selected.issuer },
                { label: "Sector", value: selected.sector },
                { label: "Classification", value: selected.classification },
                { label: "Currency", value: selected.currency },
                { label: "Face Value", value: fmtCompact(selected.faceValue) },
                {
                  label: "Book Value (NGN)",
                  value: fmtCompact(selected.bookValueNGN),
                },
                {
                  label: "EIR",
                  value: selected.eirPct > 0 ? fmtPct(selected.eirPct) : "—",
                },
                {
                  label: "Coupon Rate",
                  value:
                    selected.couponRate > 0 ? fmtPct(selected.couponRate) : "—",
                },
                {
                  label: "Maturity Date",
                  value: fmtDate(selected.maturityDate),
                },
                { label: "Stage", value: selected.stage },
                { label: "Status", value: selected.status },
              ]
            : []
        }
      />

      {editing && (
        <EditHoldingDrawer
          row={editing}
          onSave={(patch) => {
            setRows((prev) =>
              prev.map((r) => (r.id === editing.id ? { ...r, ...patch } : r)),
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
              Remove Holding
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Remove{" "}
              <span className="font-medium text-dark-gray">
                {deleting.name}
              </span>{" "}
              ({deleting.id}) from the holdings list? This cannot be undone.
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
                  setRows((prev) => prev.filter((r) => r.id !== deleting.id));
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

/* --- edit holding drawer --------------------------------- */
const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function EditHoldingDrawer({
  row,
  onSave,
  onClose,
}: {
  row: HoldingRow;
  onSave: (patch: Partial<HoldingRow>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [issuer, setIssuer] = useState(row.issuer);
  const [sector, setSector] = useState(row.sector);
  const [faceValue, setFaceValue] = useState(row.faceValue);
  const [couponRate, setCouponRate] = useState(row.couponRate);
  const [stage, setStage] = useState(row.stage);
  const [status, setStatus] = useState(row.status);

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
              Edit Holding
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">{row.id}</p>
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
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Issuer
              </label>
              <input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Sector
              </label>
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className={inputCls}
              />
            </div>
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
                sector,
                faceValue,
                couponRate,
                stage,
                status,
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
