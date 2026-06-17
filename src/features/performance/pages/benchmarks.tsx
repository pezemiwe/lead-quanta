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

// Simulated benchmark: FGN curve proxy
const BENCHMARK_YIELD = 0.185; // 18.5% benchmark (FGN 10yr proxy)

type BenchmarkRow = {
  id: string;
  name: string;
  instrumentType: string;
  marketYield: number;
  benchmarkYield: number;
  spread: number;
  eir: number;
  eirVsBenchmark: number;
  duration: number;
  bsvNGN: number;
};

const ROWS: BenchmarkRow[] = BOOK_INSTRUMENTS.map((inst, i) => {
  const val = BOOK_VALUATIONS[i];
  const mktYield = val?.marketYieldUsed ?? inst.couponRate;
  const bv = BENCHMARK_YIELD;
  return {
    id: inst.id,
    name: inst.name,
    instrumentType: inst.instrumentType,
    marketYield: mktYield,
    benchmarkYield: bv,
    spread: mktYield - bv,
    eir: val?.eir ?? inst.couponRate,
    eirVsBenchmark: (val?.eir ?? inst.couponRate) - bv,
    duration: val?.risk.modifiedDuration ?? 0,
    bsvNGN: val?.balanceSheetValueNGN ?? 0,
  };
});

const totals = BOOK_COMPUTED.totals;
const totalBSV = totals.totalBSValueNGN;
const wAvgYield =
  ROWS.reduce((s, r) => s + r.marketYield * r.bsvNGN, 0) / (totalBSV || 1);
const wAvgEIR =
  ROWS.reduce((s, r) => s + r.eir * r.bsvNGN, 0) / (totalBSV || 1);
const overBenchmark = ROWS.filter((r) => r.spread > 0).length;
const avgSpread = wAvgYield - BENCHMARK_YIELD;

const COLUMNS: DataTableColumn<BenchmarkRow>[] = [
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
    key: "marketYield",
    header: "Market Yield",
    render: (r) => (
      <span className="text-xs font-semibold text-primary">
        {fmtPct(r.marketYield)}
      </span>
    ),
  },
  {
    key: "benchmarkYield",
    header: "Benchmark",
    render: (r) => (
      <span className="text-xs text-gray-400">{fmtPct(r.benchmarkYield)}</span>
    ),
  },
  {
    key: "spread",
    header: "Spread",
    render: (r) => (
      <span
        className={`text-xs font-semibold ${r.spread >= 0 ? "text-success" : "text-danger"}`}
      >
        {r.spread >= 0 ? "+" : ""}
        {(r.spread * 100 * 100).toFixed(0)}bps
      </span>
    ),
  },
  {
    key: "eir",
    header: "EIR",
    render: (r) => <span className="text-xs">{fmtPct(r.eir)}</span>,
  },
  {
    key: "eirVsBenchmark",
    header: "EIR vs Benchmark",
    render: (r) => (
      <span
        className={`text-xs font-semibold ${r.eirVsBenchmark >= 0 ? "text-success" : "text-danger"}`}
      >
        {r.eirVsBenchmark >= 0 ? "+" : ""}
        {(r.eirVsBenchmark * 100 * 100).toFixed(0)}bps
      </span>
    ),
  },
  {
    key: "duration",
    header: "Mod. Duration",
    render: (r) => (
      <span className="text-xs text-gray-400">{r.duration.toFixed(2)}</span>
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

export function Benchmarks() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Returns
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Benchmark Comparison
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Portfolio yield vs FGN curve benchmark — as at 28 May 2026
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Weighted Avg Yield",
            value: fmtPct(wAvgYield),
            sub: "portfolio market yield",
          },
          {
            label: "Benchmark (FGN 10yr)",
            value: fmtPct(BENCHMARK_YIELD),
            sub: "reference rate",
          },
          {
            label: "Portfolio Spread",
            value: `${avgSpread >= 0 ? "+" : ""}${(avgSpread * 10000).toFixed(0)}bps`,
            sub: avgSpread >= 0 ? "outperforming" : "underperforming",
          },
          {
            label: "Above Benchmark",
            value: `${overBenchmark}/${ROWS.length}`,
            sub: "instruments",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="mt-2 text-xl font-bold text-dark-gray">{k.value}</p>
            <p
              className={`text-xs ${k.label === "Portfolio Spread" && avgSpread < 0 ? "text-danger" : "text-gray-400"}`}
            >
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      <DataTable columns={COLUMNS} data={ROWS} pageSize={25} />
    </div>
  );
}
