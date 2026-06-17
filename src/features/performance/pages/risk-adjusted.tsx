import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";
import {
  DataTable,
  DataTableColumn,
} from "../../../components/shared/data-table";

// Risk-free rate proxy (91-day T-bill)
const RISK_FREE = 0.22;

type RiskAdjRow = {
  id: string;
  name: string;
  instrumentType: string;
  eir: number;
  excessReturn: number;
  modDuration: number;
  sharpe: number;
  dv01: number;
  bsvNGN: number;
  classification: string;
};

const ROWS: RiskAdjRow[] = BOOK_INSTRUMENTS.map((inst, i) => {
  const val = BOOK_VALUATIONS[i];
  const eir = val?.eir ?? inst.couponRate;
  const excess = eir - RISK_FREE;
  const dur = val?.risk.modifiedDuration ?? 1;
  // Sharpe-like: excess return / duration volatility proxy (dur * 0.01)
  const durationVol = Math.max(dur * 0.01, 0.001);
  const sharpe = excess / durationVol;
  return {
    id: inst.id,
    name: inst.name,
    instrumentType: inst.instrumentType,
    eir,
    excessReturn: excess,
    modDuration: dur,
    sharpe,
    dv01: val?.risk.dv01 ?? 0,
    bsvNGN: val?.balanceSheetValueNGN ?? 0,
    classification: inst.classification,
  };
});

const sortedRows = [...ROWS].sort((a, b) => b.sharpe - a.sharpe);

const totals = BOOK_COMPUTED.totals;
const totalBSV = totals.totalBSValueNGN;
const portEIR =
  ROWS.reduce((s, r) => s + r.eir * r.bsvNGN, 0) / (totalBSV || 1);
const portExcess = portEIR - RISK_FREE;
const portDur =
  ROWS.reduce((s, r) => s + r.modDuration * r.bsvNGN, 0) / (totalBSV || 1);
const portSharpe = portExcess / Math.max(portDur * 0.01, 0.001);
const positiveAlpha = ROWS.filter((r) => r.excessReturn > 0).length;

const COLUMNS: DataTableColumn<RiskAdjRow>[] = [
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="text-xs font-medium text-dark-gray">{r.name}</span>
    ),
  },
  {
    key: "instrumentType",
    header: "Type",
    render: (r) => (
      <span className="text-xs text-gray-400">{r.instrumentType}</span>
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
    key: "excessReturn",
    header: "Excess Return",
    render: (r) => (
      <span
        className={`text-xs font-semibold ${r.excessReturn >= 0 ? "text-success" : "text-danger"}`}
      >
        {r.excessReturn >= 0 ? "+" : ""}
        {fmtPct(r.excessReturn)}
      </span>
    ),
  },
  {
    key: "modDuration",
    header: "Mod. Duration",
    render: (r) => (
      <span className="text-xs text-gray-400">{r.modDuration.toFixed(2)}</span>
    ),
  },
  {
    key: "sharpe",
    header: "Sharpe-like Ratio",
    render: (r) => (
      <span
        className={`text-xs font-semibold ${r.sharpe >= 1 ? "text-success" : r.sharpe >= 0 ? "text-yellow-600" : "text-danger"}`}
      >
        {r.sharpe.toFixed(2)}
      </span>
    ),
  },
  {
    key: "dv01",
    header: "DV01 (₦)",
    render: (r) => (
      <span className="text-xs text-gray-400 text-right block">
        {fmtCompact(Math.abs(r.dv01))}
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
];

export function RiskAdjusted() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Advanced
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Risk-Adjusted Returns
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Sharpe-like ratios and excess returns over risk-free rate (22.0%
          T-bill proxy) — as at 28 May 2026
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Risk-Free Rate",
            value: fmtPct(RISK_FREE),
            sub: "91-day T-bill proxy",
          },
          {
            label: "Portfolio EIR",
            value: fmtPct(portEIR),
            sub: "weighted average",
          },
          {
            label: "Portfolio Sharpe",
            value: portSharpe.toFixed(2),
            sub: "excess return / dur vol",
          },
          {
            label: "Positive Alpha",
            value: `${positiveAlpha}/${ROWS.length}`,
            sub: "above risk-free",
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

      {/* top 10 by sharpe */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Top 10 by Risk-Adjusted Return
        </h2>
        <div className="space-y-2">
          {sortedRows.slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center gap-3">
              <span className="w-52 truncate text-xs text-gray-500">
                {r.name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${r.sharpe >= 1 ? "bg-success" : "bg-yellow-400"}`}
                  style={{
                    width: `${Math.min((r.sharpe / Math.max(sortedRows[0].sharpe, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="w-12 text-right text-xs font-semibold">
                {r.sharpe.toFixed(2)}
              </span>
              <span className="w-16 text-right text-xs text-gray-400">
                {fmtPct(r.eir)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DataTable columns={COLUMNS} data={sortedRows} pageSize={25} />
    </div>
  );
}
