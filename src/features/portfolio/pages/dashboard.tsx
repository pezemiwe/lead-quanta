import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart2,
  Activity,
} from "lucide-react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";
import { WorkflowRegisterBanner } from "../../../components/shared/workflow-register-banner";

const { totals, byClassification, bySector, maturityProfile } = BOOK_COMPUTED;

const CLASSIFICATION_COLORS: Record<string, string> = {
  AC: "#C8102E",
  FVOCI: "#1E3A5F",
  FVTPL: "#E8563A",
};

function getWeightedYield() {
  let ws = 0,
    wt = 0;
  for (const v of BOOK_COMPUTED.valuations) {
    if (v.marketYieldUsed > 0) {
      ws += v.marketYieldUsed * v.balanceSheetValueNGN;
      wt += v.balanceSheetValueNGN;
    }
  }
  return wt > 0 ? ws / wt : 0;
}

const weightedYield = getWeightedYield();
const totalAnnualIncome = BOOK_COMPUTED.valuations.reduce(
  (s, v) => s + v.annualEIRIncome,
  0,
);
const totalUnrealisedPL =
  totals.totalOCIReserveNGN + totals.totalFVTPLUnrealisedGLNGN;

interface Props {
  persona: { name: string; role: string; avatar: string };
}

export function PortfolioDashboard({ persona }: Props) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = persona.name.split(" ")[0];

  const top5 = [...BOOK_COMPUTED.valuations]
    .sort((a, b) => b.balanceSheetValueNGN - a.balanceSheetValueNGN)
    .slice(0, 5);

  const KPI_CARDS = [
    {
      label: "Total Portfolio Value",
      value: fmtCompact(totals.totalBSValueNGN),
      change: `${totalUnrealisedPL >= 0 ? "+" : ""}${fmtCompact(totalUnrealisedPL)}`,
      positive: totalUnrealisedPL >= 0,
      sub: "unrealised P&L",
      icon: <DollarSign className="h-5 w-5" />,
      accent: "#C8102E",
    },
    {
      label: "Weighted Avg Yield",
      value: fmtPct(weightedYield),
      change: fmtCompact(totals.totalOCIReserveNGN),
      positive: true,
      sub: "OCI reserve",
      icon: <Percent className="h-5 w-5" />,
      accent: "#1E3A5F",
    },
    {
      label: "Total Instruments",
      value: String(totals.instruments),
      change: `${byClassification.length} IFRS classifications`,
      positive: true,
      sub: "across the book",
      icon: <BarChart2 className="h-5 w-5" />,
      accent: "#9A3412",
    },
    {
      label: "Annual Income (EIR)",
      value: fmtCompact(totalAnnualIncome),
      change: fmtCompact(totalAnnualIncome / 12),
      positive: true,
      sub: "monthly run rate",
      icon: <Activity className="h-5 w-5" />,
      accent: "#E07B12",
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-gray/50">
            {greeting}, {firstName}.
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-dark-gray">
            Portfolio Dashboard
          </h1>
        </div>
      </div>

      <WorkflowRegisterBanner />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-dark-gray/50 uppercase tracking-wider">
                {k.label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ background: k.accent }}
              >
                {k.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-dark-gray">{k.value}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {k.positive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
              )}
              <span
                className={`text-xs font-semibold ${k.positive ? "text-emerald-600" : "text-primary"}`}
              >
                {k.change}
              </span>
              <span className="text-xs text-dark-gray/40">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Maturity profile */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Maturity Profile Face Value by Bucket
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <ReBarChart data={maturityProfile} margin={{ left: 0, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => `₦${(v / 1e9).toFixed(0)}B`}
              />
              <Tooltip
                formatter={
                  ((v: number) => [
                    fmtCompact(v as number),
                    "Face Value",
                  ]) as any
                }
                contentStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="faceValueNGN"
                fill="#C8102E"
                radius={[4, 4, 0, 0]}
              />
            </ReBarChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio classification */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Portfolio Classification
          </h2>
          <div className="space-y-4">
            {byClassification.map((b) => (
              <div key={b.classification}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-dark-gray flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{
                        background: CLASSIFICATION_COLORS[b.classification],
                      }}
                    />
                    {b.classification}
                    <span className="text-dark-gray/40">({b.count})</span>
                  </span>
                  <span className="text-dark-gray/60 font-medium">
                    {fmtPct(b.bsValueNGN / totals.totalBSValueNGN)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(b.bsValueNGN / totals.totalBSValueNGN) * 100}%`,
                      background: CLASSIFICATION_COLORS[b.classification],
                    }}
                  />
                </div>
                <p className="mt-0.5 text-right text-xs text-dark-gray/50">
                  {fmtCompact(b.bsValueNGN)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 holdings */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-dark-gray">
              Top 5 Holdings by Book Value
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-gray-50">
                {["Instrument", "Class", "Book Value", "Weight"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-dark-gray/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top5.map((v, i) => (
                <tr
                  key={v.instrument.id}
                  className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
                >
                  <td className="px-4 py-3 text-xs font-medium text-dark-gray">
                    <span className="mr-1.5 text-dark-gray/30 font-mono text-[11px]">
                      {i + 1}.
                    </span>
                    {v.instrument.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        background:
                          CLASSIFICATION_COLORS[v.instrument.classification] +
                          "22",
                        color:
                          CLASSIFICATION_COLORS[v.instrument.classification],
                      }}
                    >
                      {v.instrument.classification}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-dark-gray">
                    {fmtCompact(v.balanceSheetValueNGN)}
                  </td>
                  <td className="px-4 py-3 text-xs text-dark-gray/60">
                    {fmtPct(v.balanceSheetValueNGN / totals.totalBSValueNGN)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sector concentration */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Sector Concentration
          </h2>
          <div className="space-y-2.5">
            {bySector.slice(0, 8).map((s) => (
              <div key={s.sector} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs text-dark-gray/70">
                  {s.sector}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, s.pctOfPortfolio * 500)}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-medium text-dark-gray/70">
                  {fmtPct(s.pctOfPortfolio)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit quality summary */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex flex-wrap gap-6">
        <div>
          <p className="text-xs font-semibold text-sky-800">
            OCI Reserve (FVOCI)
          </p>
          <p className="mt-0.5 text-xs text-sky-700">
            Total unrealised:{" "}
            <span className="font-bold">{fmtCompact(totals.totalOCIReserveNGN)}</span>{" "}
            Share:{" "}
            <span className="font-bold">
              {fmtPct(Math.abs(totals.totalOCIReserveNGN) / totals.totalBSValueNGN)}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-sky-800">
            Classification Mix
          </p>
          <p className="mt-0.5 text-xs text-sky-700">
            {BOOK_INSTRUMENTS.filter((i) => i.classification === "AC").length}{" "}
            AC ·{" "}
            {BOOK_INSTRUMENTS.filter((i) => i.classification === "FVOCI").length}{" "}
            FVOCI ·{" "}
            {BOOK_INSTRUMENTS.filter((i) => i.classification === "FVTPL").length}{" "}
            FVTPL
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-800">
            OCI &amp; FVTPL
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            OCI:{" "}
            <span className="font-bold">
              {fmtCompact(totals.totalOCIReserveNGN)}
            </span>{" "}
            FVTPL:{" "}
            <span className="font-bold">
              {fmtCompact(totals.totalFVTPLUnrealisedGLNGN)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
