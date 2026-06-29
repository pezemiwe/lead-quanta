import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const totals = BOOK_COMPUTED.totals;
const byClass = BOOK_COMPUTED.byClassification;
const bySector = BOOK_COMPUTED.bySector;
const matProfile = BOOK_COMPUTED.maturityProfile;

const wEIR =
  BOOK_VALUATIONS.reduce((s, v) => s + v.eir * v.balanceSheetValueNGN, 0) /
  (totals.totalBSValueNGN || 1);

const wDur =
  BOOK_VALUATIONS.reduce(
    (s, v) => s + v.risk.modifiedDuration * v.balanceSheetValueNGN,
    0,
  ) / (totals.totalBSValueNGN || 1);

const totalAnnualIncome = BOOK_VALUATIONS.reduce(
  (s, v) => s + v.annualEIRIncome,
  0,
);

const topHoldings = [...BOOK_VALUATIONS]
  .map((v, i) => ({
    name: BOOK_INSTRUMENTS[i].name,
    bsv: v.balanceSheetValueNGN,
  }))
  .sort((a, b) => b.bsv - a.bsv)
  .slice(0, 10);

export function InvestmentCommittee() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-dark-gray">
            Investment Committee Pack
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quarter 2 2026 Portfolio Summary as at 28 May 2026
          </p>
        </div>
        <button className="rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary">
          Export PDF
        </button>
      </div>

      {/* section 1: executive kpis */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-dark-gray uppercase tracking-wider">
          Executive Summary
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total AuM",
              value: fmtCompact(totals.totalBSValueNGN),
              sub: "? balance sheet value",
            },
            {
              label: "No. of Instruments",
              value: String(totals.instruments),
              sub: "across all classifications",
            },
            {
              label: "Weighted EIR",
              value: fmtPct(wEIR),
              sub: "effective interest rate",
            },
            {
              label: "Annual Income (est.)",
              value: fmtCompact(totalAnnualIncome),
              sub: "? p.a.",
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
      </div>

      {/* section 2: classification breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-dark-gray uppercase tracking-wider">
          IFRS 9 Classification
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {byClass.map((c) => (
            <div
              key={c.classification}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <p className="text-lg font-bold text-primary">
                {c.classification}
              </p>
              <p className="text-xs text-gray-400">{c.count} instruments</p>
              <p className="mt-2 text-xl font-bold text-dark-gray">
                {fmtCompact(c.bsValueNGN)}
              </p>
              <p className="text-xs text-gray-400">
                {fmtPct(c.bsValueNGN / totals.totalBSValueNGN)} of book
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* section 3: top 10 holdings */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-dark-gray uppercase tracking-wider">
          Top 10 Holdings
        </h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">
                  #
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">
                  Instrument
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
                  BS Value (₦)
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
                  % of Book
                </th>
              </tr>
            </thead>
            <tbody>
              {topHoldings.map((h, i) => (
                <tr
                  key={h.name}
                  className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
                >
                  <td className="px-5 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 text-xs font-medium text-dark-gray">
                    {h.name}
                  </td>
                  <td className="px-5 py-3 text-right text-xs font-semibold">
                    {fmtCompact(h.bsv)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-400">
                    {fmtPct(h.bsv / totals.totalBSValueNGN)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* section 4: maturity profile */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-dark-gray uppercase tracking-wider">
          Maturity Profile
        </h2>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={matProfile}
              margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E2" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => fmtCompact(v as number)}
              />
              <Tooltip
                formatter={((v: number) => fmtCompact(v as number)) as any}
              />
              <Bar
                dataKey="faceValueNGN"
                fill="#F7941D"
                radius={[4, 4, 0, 0]}
                name="Face Value (₦)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* section 5: Credit & Counterparty Quality */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-dark-gray uppercase tracking-wider">
          Credit &amp; Counterparty Quality
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Sovereign / FGN Holdings",
              value: fmtPct(totals.totalBSValueNGN > 0 ? (byClass.find(c => c.classification === "AC")?.bsValueNGN ?? 0) / totals.totalBSValueNGN : 0),
              sub: "lowest credit risk",
            },
            {
              label: "OCI Reserve",
              value: fmtCompact(totals.totalOCIReserveNGN),
              sub: "FVOCI unrealised",
            },
            {
              label: "Modified Duration",
              value: wDur.toFixed(2) + " yrs",
              sub: "weighted avg",
            },
            {
              label: "Investment Grade",
              value: "94.3%",
              sub: "of book by value",
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
      </div>

      {/* section 6: sector concentration */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-dark-gray uppercase tracking-wider">
          Sector Concentration
        </h2>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-2">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
