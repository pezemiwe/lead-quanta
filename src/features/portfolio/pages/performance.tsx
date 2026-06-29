import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtN,
} from "../../../features/portfolio/engine/book-compute";

const vals = BOOK_COMPUTED.valuations;
const totals = BOOK_COMPUTED.totals;

// Weighted avg EIR
const wEIR = (() => {
  let ws = 0,
    wt = 0;
  for (const v of vals) {
    if (v.eir > 0) {
      ws += v.eir * v.balanceSheetValueNGN;
      wt += v.balanceSheetValueNGN;
    }
  }
  return wt > 0 ? ws / wt : 0;
})();
// Weighted avg market yield
const wYield = (() => {
  let ws = 0,
    wt = 0;
  for (const v of vals) {
    if (v.marketYieldUsed > 0) {
      ws += v.marketYieldUsed * v.balanceSheetValueNGN;
      wt += v.balanceSheetValueNGN;
    }
  }
  return wt > 0 ? ws / wt : 0;
})();
// Portfolio duration (weighted)
const wDur = (() => {
  let ws = 0,
    wt = 0;
  for (const v of vals) {
    if (v.risk.modifiedDuration > 0) {
      ws += v.risk.modifiedDuration * v.balanceSheetValueNGN;
      wt += v.balanceSheetValueNGN;
    }
  }
  return wt > 0 ? ws / wt : 0;
})();
const totalDV01 = vals.reduce((s, v) => s + v.risk.dv01, 0);
const totalAnnualIncome = vals.reduce((s, v) => s + v.annualEIRIncome, 0);
const totalOCI = totals.totalOCIReserveNGN;
const totalFVTPL = totals.totalFVTPLUnrealisedGLNGN;

// Income by classification
const incomeByClass = [
  { name: "AC", income: BOOK_COMPUTED.income.ac.totalAccruedInterestNGN },
  {
    name: "FVOCI",
    income: BOOK_COMPUTED.income.fvoci.totalACCarryingValueNGN * wEIR,
  },
  { name: "FVTPL", income: Math.abs(totalFVTPL) },
];

// Sector income chart
const sectorIncome = BOOK_COMPUTED.bySector
  .slice(0, 8)
  .map((s) => {
    const sVals = vals.filter((v) => v.instrument.sector === s.sector);
    return {
      sector: s.sector.length > 12 ? s.sector.slice(0, 12) + "…" : s.sector,
      income: sVals.reduce((a, v) => a + v.annualEIRIncome, 0),
    };
  })
  .sort((a, b) => b.income - a.income);

const METRICS = [
  {
    label: "Weighted Avg EIR",
    value: fmtPct(wEIR),
    note: "Effective Interest Rate across book",
    positive: true,
  },
  {
    label: "Weighted Avg Market Yield",
    value: fmtPct(wYield),
    note: "Current market yield",
    positive: true,
  },
  {
    label: "EIR — Yield Spread",
    value: `${((wEIR - wYield) * 100).toFixed(0)} bps`,
    note: "Carry vs current market",
    positive: wEIR > wYield,
  },
  {
    label: "Portfolio Duration (Mod.)",
    value: `${wDur.toFixed(2)} yrs`,
    note: "Weighted modified duration",
    positive: true,
  },
  {
    label: "DV01 (Interest Rate Sens.)",
    value: fmtCompact(Math.abs(totalDV01)),
    note: "+1bp → P&L change",
    positive: false,
  },
  {
    label: "Annual Income (EIR)",
    value: fmtCompact(totalAnnualIncome),
    note: "Projected income run rate",
    positive: true,
  },
  {
    label: "OCI Reserve (FVOCI)",
    value: fmtCompact(totalOCI),
    note: "Unrealised in equity",
    positive: totalOCI >= 0,
  },
  {
    label: "FVTPL Unrealised P&L",
    value: fmtCompact(totalFVTPL),
    note: "Through P&L",
    positive: totalFVTPL >= 0,
  },
];

const PERIODS = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "Inception"];

export function PortfolioPerformance() {
  const [period, setPeriod] = useState("YTD");

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Performance Analytics
        </h1>
        <p className="mt-1 text-sm text-dark-gray/50">
          Yield, EIR, duration, income, and P&L analytics across{" "}
          <span className="font-medium text-dark-gray">
            {totals.instruments} instruments
          </span>
        </p>
      </div>

      {/* period selector */}
      <div className="flex items-center gap-1 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              period === p
                ? "bg-primary text-white"
                : "bg-gray-100 text-dark-gray/50 hover:bg-pale-red hover:text-primary"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Annual Income",
            value: fmtCompact(totalAnnualIncome),
            sub: "EIR income run rate",
          },
          { label: "Wt. Avg EIR", value: fmtPct(wEIR), sub: "Effective yield" },
          {
            label: "Portfolio Duration",
            value: `${wDur.toFixed(2)}y`,
            sub: "Modified duration",
          },
          {
            label: "DV01",
            value: fmtCompact(Math.abs(totalDV01)),
            sub: "Per 1bp rate move",
          },
        ].map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-dark-gray/50 font-medium">{t.label}</p>
            <p className="mt-1 text-xl font-bold text-dark-gray">{t.value}</p>
            <p className="mt-0.5 text-xs text-dark-gray/40">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* income by sector chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Annual EIR Income by Sector (Top 8)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sectorIncome} margin={{ left: 0, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `₦${(v / 1e9).toFixed(0)}B`}
            />
            <Tooltip
              formatter={
                ((v: number) => [fmtCompact(v), "Annual Income"]) as any
              }
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="income" fill="#C8102E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* metrics table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-dark-gray">
            Portfolio Performance Metrics
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dark-gray/40">
                Metric
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-dark-gray/40">
                Value
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dark-gray/40 hidden sm:table-cell">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr
                key={m.label}
                className="border-b border-border/50 last:border-0 hover:bg-pale-red/20"
              >
                <td className="px-5 py-3.5 font-medium text-dark-gray text-sm">
                  {m.label}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className={`text-sm font-bold ${m.positive ? "text-primary" : "text-emerald-600"}`}
                  >
                    {m.value}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-dark-gray/50 hidden sm:table-cell">
                  {m.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OCI / FVTPL breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-dark-gray">
            FVOCI OCI Reserve
          </h2>
          <p className="text-2xl font-bold text-dark-gray">
            {fmtCompact(totalOCI)}
          </p>
          <p className="mt-1 text-xs text-dark-gray/50">
            Unrealised fair value movement recognised in Other Comprehensive
            Income. Recycled to P&L on disposal.
          </p>
          <div className="mt-3 text-xs flex gap-4">
            <span className="text-dark-gray/50">
              Instruments:{" "}
              <span className="font-medium text-dark-gray">
                {BOOK_COMPUTED.byClassification.find(
                  (c) => c.classification === "FVOCI",
                )?.count ?? 0}
              </span>
            </span>
            <span className="text-dark-gray/50">
              Book Value:{" "}
              <span className="font-medium text-dark-gray">
                {fmtCompact(
                  BOOK_COMPUTED.byClassification.find(
                    (c) => c.classification === "FVOCI",
                  )?.bsValueNGN ?? 0,
                )}
              </span>
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-dark-gray">
            FVTPL Unrealised P&L
          </h2>
          <p
            className={`text-2xl font-bold ${totalFVTPL >= 0 ? "text-emerald-600" : "text-primary"}`}
          >
            {fmtCompact(totalFVTPL)}
          </p>
          <p className="mt-1 text-xs text-dark-gray/50">
            Unrealised fair value movement recognised through P&amp;L. Realised
            on disposal.
          </p>
          <div className="mt-3 text-xs flex gap-4">
            <span className="text-dark-gray/50">
              Instruments:{" "}
              <span className="font-medium text-dark-gray">
                {BOOK_COMPUTED.byClassification.find(
                  (c) => c.classification === "FVTPL",
                )?.count ?? 0}
              </span>
            </span>
            <span className="text-dark-gray/50">
              Book Value:{" "}
              <span className="font-medium text-dark-gray">
                {fmtCompact(
                  BOOK_COMPUTED.byClassification.find(
                    (c) => c.classification === "FVTPL",
                  )?.bsValueNGN ?? 0,
                )}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
