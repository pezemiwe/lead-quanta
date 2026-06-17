import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";
import {
  DataTable,
  DataTableColumn,
} from "../../../components/shared/data-table";

const totals = BOOK_COMPUTED.totals;
const bySector = BOOK_COMPUTED.bySector;
const matProfile = BOOK_COMPUTED.maturityProfile;

// IFRS 7 credit risk: by stage
const stage1Insts = BOOK_INSTRUMENTS.filter(
  (i) => i.impairmentStage === "Stage 1",
);
const stage2Insts = BOOK_INSTRUMENTS.filter(
  (i) => i.impairmentStage === "Stage 2",
);
const stage3Insts = BOOK_INSTRUMENTS.filter(
  (i) => i.impairmentStage === "Stage 3",
);

const bsvByStage = (stage: string) =>
  BOOK_INSTRUMENTS.filter((i) => i.impairmentStage === stage).reduce(
    (s, inst) => {
      const idx = BOOK_INSTRUMENTS.indexOf(inst);
      return s + (BOOK_VALUATIONS[idx]?.balanceSheetValueNGN ?? 0);
    },
    0,
  );

// market risk: IFRS 7 sensitivity
const totalDV01 = BOOK_VALUATIONS.reduce((s, v) => s + v.risk.dv01, 0);

// FVTPL mark-to-market
const fvtplInsts = BOOK_INSTRUMENTS.filter((i) => i.classification === "FVTPL");
const totalFVTPLbsv = fvtplInsts.reduce((s, inst) => {
  const idx = BOOK_INSTRUMENTS.indexOf(inst);
  return s + (BOOK_VALUATIONS[idx]?.balanceSheetValueNGN ?? 0);
}, 0);

type LiqRow = { bucket: string; count: number; faceValue: number; pct: number };
const LIQ_ROWS: LiqRow[] = matProfile.map((b) => ({
  bucket: b.bucket,
  count: b.count,
  faceValue: b.faceValueNGN,
  pct: b.faceValueNGN / totals.totalBSValueNGN,
}));

const LIQ_COLS: DataTableColumn<LiqRow>[] = [
  {
    key: "bucket",
    header: "Maturity Band",
    render: (r) => (
      <span className="text-xs font-medium text-dark-gray">{r.bucket}</span>
    ),
  },
  {
    key: "count",
    header: "Instruments",
    render: (r) => <span className="text-xs text-gray-500">{r.count}</span>,
  },
  {
    key: "faceValue",
    header: "Nominal Amount (₦)",
    render: (r) => (
      <span className="text-xs font-semibold text-right block">
        {fmtCompact(r.faceValue)}
      </span>
    ),
  },
  {
    key: "pct",
    header: "% of Book",
    render: (r) => (
      <span className="text-xs text-right block text-gray-500">
        {fmtPct(r.pct)}
      </span>
    ),
  },
];

export function IFRS7Disclosures() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Disclosures
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          IFRS 7 Financial Instruments Disclosures
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quantitative risk disclosures for the investment book — as at 28 May
          2026
        </p>
      </div>

      {/* credit risk section */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-dark-gray border-b border-border pb-2">
          Credit Risk Exposure
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              stage: "Stage 1 — Performing",
              count: stage1Insts.length,
              bsv: bsvByStage("Stage 1"),
              color: "text-success",
            },
            {
              stage: "Stage 2 — Underperforming",
              count: stage2Insts.length,
              bsv: bsvByStage("Stage 2"),
              color: "text-yellow-600",
            },
            {
              stage: "Stage 3 — Non-Performing",
              count: stage3Insts.length,
              bsv: bsvByStage("Stage 3"),
              color: "text-danger",
            },
          ].map((s) => (
            <div
              key={s.stage}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <p className={`text-xs font-semibold ${s.color}`}>{s.stage}</p>
              <p className="mt-2 text-xl font-bold text-dark-gray">
                {s.count} instruments
              </p>
              <p className="text-sm font-semibold text-gray-500">
                {fmtCompact(s.bsv)}
              </p>
              <p className="text-xs text-gray-400">
                {fmtPct(s.bsv / totals.totalBSValueNGN)} of book
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Total ECL Provision",
              value: fmtCompact(totals.totalECLNGN),
            },
            {
              label: "ECL / Book Value",
              value: fmtPct(totals.totalECLNGN / totals.totalBSValueNGN),
            },
            {
              label: "Net Book Value (after ECL)",
              value: fmtCompact(totals.totalBSValueNGN - totals.totalECLNGN),
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <p className="text-xs text-gray-400">{k.label}</p>
              <p className="mt-1 text-lg font-bold text-dark-gray">{k.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* liquidity risk section */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-dark-gray border-b border-border pb-2">
          Liquidity Risk — Maturity Analysis
        </h2>
        <DataTable columns={LIQ_COLS} data={LIQ_ROWS} />
      </section>

      {/* market risk section */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-dark-gray border-b border-border pb-2">
          Market Risk Sensitivities
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "DV01 (₦ per 1bp)",
              value: fmtCompact(Math.abs(totalDV01)),
            },
            {
              label: "+100bps Impact (₦)",
              value: fmtCompact(Math.abs(totalDV01) * 100),
            },
            { label: "FVTPL Book Value", value: fmtCompact(totalFVTPLbsv) },
            {
              label: "OCI Reserve (FVOCI)",
              value: fmtCompact(totals.totalOCIReserveNGN),
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <p className="text-xs text-gray-400">{k.label}</p>
              <p className="mt-1 text-lg font-bold text-dark-gray">{k.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* categories of financial instruments */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-dark-gray border-b border-border pb-2">
          Categories of Financial Instruments
        </h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">
                  Category
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
                  Instruments
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
                  Carrying Amount (₦)
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody>
              {BOOK_COMPUTED.byClassification.map((c) => (
                <tr
                  key={c.classification}
                  className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
                >
                  <td className="px-5 py-3 font-medium text-dark-gray">
                    {c.classification === "AC"
                      ? "Amortised Cost (AC)"
                      : c.classification === "FVOCI"
                        ? "Fair Value through OCI (FVOCI)"
                        : "Fair Value through P&L (FVTPL)"}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {c.count}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {fmtCompact(c.bsValueNGN)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400">
                    {fmtPct(c.bsValueNGN / totals.totalBSValueNGN)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* concentration by sector */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-dark-gray border-b border-border pb-2">
          Sector Concentration
        </h2>
        <div className="space-y-2">
          {bySector.slice(0, 8).map((s) => (
            <div key={s.sector} className="flex items-center gap-3">
              <span className="w-44 truncate text-xs text-gray-500">
                {s.sector}
              </span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.min(s.pctOfPortfolio * 100, 100)}%` }}
                />
              </div>
              <span className="w-14 text-right text-xs font-semibold text-dark-gray">
                {fmtPct(s.pctOfPortfolio)}
              </span>
              <span className="w-20 text-right text-xs text-gray-400">
                {fmtCompact(s.bsValueNGN)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
