import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../../features/portfolio/engine/book-compute";
import {
  DataTable,
  DataTableColumn,
} from "../../../components/shared/data-table";

type EIRRow = {
  id: string;
  name: string;
  classification: string;
  purchaseDate: string;
  maturityDate: string;
  faceValue: number;
  purchasePrice: number;
  eir: number;
  carryingValue: number;
  annualAmort: number;
  accruedInterest: number;
  status: string;
};

const ROWS: EIRRow[] = BOOK_INSTRUMENTS.filter(
  (i) => i.classification === "AC" || i.classification === "FVOCI",
).map((inst, idx) => {
  const allIdx = BOOK_INSTRUMENTS.indexOf(inst);
  const val = BOOK_VALUATIONS[allIdx];
  return {
    id: inst.id,
    name: inst.name,
    classification: inst.classification,
    purchaseDate: inst.purchaseDate,
    maturityDate: inst.maturityDate ?? "—",
    faceValue: inst.faceValue,
    purchasePrice: inst.purchasePrice,
    eir: val?.eir ?? inst.couponRate,
    carryingValue: val?.acCarryingValue ?? inst.faceValue * inst.purchasePrice,
    annualAmort: val?.annualEIRIncome ?? 0,
    accruedInterest: val?.accruedInterest ?? 0,
    status: inst.status,
  };
});

const CLASS_STYLE: Record<string, string> = {
  AC: "bg-blue-100 text-blue-700",
  FVOCI: "bg-purple-100 text-purple-700",
};
const CLASS_LABEL: Record<string, string> = {
  AC: "Amortised Cost",
  FVOCI: "Fair Value (OCI)",
};

const COLUMNS: DataTableColumn<EIRRow>[] = [
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="text-xs font-medium text-dark-gray">{r.name}</span>
    ),
  },
  {
    key: "classification",
    header: "Class",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASS_STYLE[r.classification]}`}
      >
        {CLASS_LABEL[r.classification] ?? r.classification}
      </span>
    ),
  },
  {
    key: "eir",
    header: "EIR",
    render: (r) => (
      <span className="text-xs font-semibold text-primary">
        {fmtPct(r.eir)}
      </span>
    ),
  },
  {
    key: "carryingValue",
    header: "Carrying Value (₦)",
    render: (r) => (
      <span className="text-xs text-right block">
        {fmtCompact(r.carryingValue)}
      </span>
    ),
  },
  {
    key: "annualAmort",
    header: "Annual EIR Income (₦)",
    render: (r) => (
      <span className="text-xs font-semibold text-success text-right block">
        {fmtCompact(r.annualAmort)}
      </span>
    ),
  },
  {
    key: "accruedInterest",
    header: "Accrued Interest (₦)",
    render: (r) => (
      <span className="text-xs text-right block">
        {fmtCompact(r.accruedInterest)}
      </span>
    ),
  },
  {
    key: "purchaseDate",
    header: "Purchase Date",
    render: (r) => (
      <span className="text-xs text-gray-400">{fmtDate(r.purchaseDate)}</span>
    ),
  },
  {
    key: "maturityDate",
    header: "Maturity",
    render: (r) => (
      <span className="text-xs text-gray-400">
        {r.maturityDate !== "—" ? fmtDate(r.maturityDate) : "—"}
      </span>
    ),
  },
];

const totalCarrying = ROWS.reduce((s, r) => s + r.carryingValue, 0);
const totalIncome = ROWS.reduce((s, r) => s + r.annualAmort, 0);
const totalAccrued = ROWS.reduce((s, r) => s + r.accruedInterest, 0);
const avgEIR =
  ROWS.reduce((s, r) => s + r.eir * r.carryingValue, 0) / (totalCarrying || 1);

export function EIRAmortisation() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          General Ledger
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          EIR Amortisation Schedule
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Effective interest rate schedules for {ROWS.length} Amortised Cost and
          Fair Value (OCI) instruments as at 28 May 2026
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Instruments",
            value: String(ROWS.length),
            sub: "Amortised Cost + Fair Value (OCI)",
          },
          {
            label: "Total Carrying Value",
            value: fmtCompact(totalCarrying),
            sub: "at amortised cost",
          },
          {
            label: "Annual EIR Income",
            value: fmtCompact(totalIncome),
            sub: "? p.a.",
          },
          {
            label: "Weighted Avg EIR",
            value: fmtPct(avgEIR),
            sub: "portfolio avg",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="mt-2 text-xl font-bold text-dark-gray">{k.value}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <DataTable columns={COLUMNS} data={ROWS} pageSize={25} />
    </div>
  );
}
