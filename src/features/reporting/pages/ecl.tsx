import {
  BOOK_COMPUTED,
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
import { useState, useMemo } from "react";

const totals = BOOK_COMPUTED.totals;

type ECLRow = {
  id: string;
  name: string;
  issuer: string;
  classification: string;
  stageLabel: string;
  stageNum: number;
  bsvNGN: number;
  eclNGN: number;
  eclPct: number;
  maturityDate: string;
};

const ALL_ROWS: ECLRow[] = BOOK_INSTRUMENTS.map((inst, i) => {
  const val = BOOK_VALUATIONS[i];
  const bsv = val?.balanceSheetValueNGN ?? 0;
  const ecl = inst.eclProvision ?? 0;
  const eclNGN = ecl * bsv;
  const stageLabel = inst.impairmentStage ?? "Stage 1";
  const stageNum =
    stageLabel === "Stage 3" ? 3 : stageLabel === "Stage 2" ? 2 : 1;
  return {
    id: inst.id,
    name: inst.name,
    issuer: inst.issuer,
    classification: inst.classification,
    stageLabel,
    stageNum,
    bsvNGN: bsv,
    eclNGN,
    eclPct: bsv > 0 ? eclNGN / bsv : 0,
    maturityDate: inst.maturityDate ?? "—",
  };
}).sort((a, b) => b.eclNGN - a.eclNGN);

const STAGE_STYLE: Record<number, string> = {
  1: "bg-green-100 text-success",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-danger",
};

const COLUMNS: DataTableColumn<ECLRow>[] = [
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="text-xs font-medium text-dark-gray">{r.name}</span>
    ),
  },
  {
    key: "issuer",
    header: "Issuer",
    render: (r) => <span className="text-xs text-gray-500">{r.issuer}</span>,
  },
  {
    key: "classification",
    header: "Class",
    render: (r) => (
      <span className="text-xs text-gray-400">{r.classification}</span>
    ),
  },
  {
    key: "stageNum",
    header: "Stage",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLE[r.stageNum]}`}
      >
        {r.stageLabel}
      </span>
    ),
  },
  {
    key: "bsvNGN",
    header: "BS Value (₦)",
    render: (r) => (
      <span className="text-xs text-right block">{fmtCompact(r.bsvNGN)}</span>
    ),
  },
  {
    key: "eclNGN",
    header: "ECL Provision (₦)",
    render: (r) => (
      <span className="text-xs font-semibold text-danger text-right block">
        {fmtCompact(r.eclNGN)}
      </span>
    ),
  },
  {
    key: "eclPct",
    header: "Coverage %",
    render: (r) => (
      <span className="text-xs font-semibold text-right block">
        {fmtPct(r.eclPct)}
      </span>
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

// Stage totals
const stageTotals = [1, 2, 3].map((s) => {
  const rows = ALL_ROWS.filter((r) => r.stageNum === s);
  return {
    stage: s,
    count: rows.length,
    bsv: rows.reduce((a, r) => a + r.bsvNGN, 0),
    ecl: rows.reduce((a, r) => a + r.eclNGN, 0),
  };
});

export function ECLReports() {
  const [stageFilter, setStageFilter] = useState<number | "All">("All");

  const filtered = useMemo(
    () =>
      stageFilter === "All"
        ? ALL_ROWS
        : ALL_ROWS.filter((r) => r.stageNum === stageFilter),
    [stageFilter],
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Operations
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          ECL Provision Report
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Expected Credit Loss register for {ALL_ROWS.length} instruments — as
          at 28 May 2026
        </p>
      </div>

      {/* stage cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stageTotals.map((s) => (
          <div
            key={s.stage}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p
              className={`text-xs font-semibold ${s.stage === 1 ? "text-success" : s.stage === 2 ? "text-yellow-600" : "text-danger"}`}
            >
              Stage {s.stage}
            </p>
            <p className="mt-1 text-xl font-bold text-dark-gray">
              {s.count} instruments
            </p>
            <p className="text-sm text-gray-500">
              BS Value: {fmtCompact(s.bsv)}
            </p>
            <p className="mt-1 text-sm font-semibold text-danger">
              ECL: {fmtCompact(s.ecl)}
            </p>
            <p className="text-xs text-gray-400">
              Coverage: {fmtPct(s.bsv > 0 ? s.ecl / s.bsv : 0)}
            </p>
          </div>
        ))}
      </div>

      {/* portfolio totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total ECL Provision",
            value: fmtCompact(totals.totalECLNGN),
            sub: "₦ total",
          },
          {
            label: "ECL Coverage Ratio",
            value: fmtPct(totals.totalECLNGN / totals.totalBSValueNGN),
            sub: "provision / book value",
          },
          {
            label: "Net Book Value",
            value: fmtCompact(totals.totalBSValueNGN - totals.totalECLNGN),
            sub: "after ECL deduction",
          },
          {
            label: "Stage 3 Ratio",
            value: fmtPct(stageTotals[2].count / ALL_ROWS.length),
            sub: "non-performing rate",
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

      {/* stage filter */}
      <div className="flex items-center gap-1">
        {(["All", 1, 2, 3] as const).map((s) => (
          <button
            key={String(s)}
            onClick={() => setStageFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              stageFilter === s
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-500 hover:bg-pale-red hover:text-primary"
            }`}
          >
            {s === "All" ? "All Stages" : `Stage ${s}`}
          </button>
        ))}
      </div>

      <DataTable columns={COLUMNS} data={filtered} pageSize={25} />
    </div>
  );
}
