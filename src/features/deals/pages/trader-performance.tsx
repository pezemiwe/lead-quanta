import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Award,
  ChevronLeft,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { useWorkflow } from "../../workflow/store";
import {
  computeVwapMap,
  dealVwapInfo,
  counterpartyOrIssuer,
  fmtMoney,
  rateOrPrice,
  tradeDate,
} from "../utils/blotter-metrics";
import { dealNotional } from "../../workflow/engine/fields";
import { DealSlipStatusBadge } from "../../workflow/components/status-badge";

interface TraderStat {
  name: string;
  role: string;
  dealCount: number;
  totalVolume: number;
  avgBps: number;
  favCount: number;
  unfavCount: number;
  grade: "A+" | "A" | "B" | "C" | "D";
}

function executionGrade(avgBps: number): TraderStat["grade"] {
  if (avgBps >= 15) return "A+";
  if (avgBps >= 5) return "A";
  if (avgBps >= -5) return "B";
  if (avgBps >= -15) return "C";
  return "D";
}

const GRADE_STYLE: Record<TraderStat["grade"], string> = {
  "A+": "bg-green-100 text-green-800 border border-green-200",
  "A": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "B": "bg-blue-100 text-blue-700 border border-blue-200",
  "C": "bg-amber-100 text-amber-700 border border-amber-200",
  "D": "bg-red-100 text-red-700 border border-red-200",
};

const GRADE_DESC: Record<TraderStat["grade"], string> = {
  "A+": "Exceptional — consistently beating VWAP by 15bps+",
  "A": "Strong — above VWAP on average",
  "B": "Satisfactory — pricing around market average",
  "C": "Below average — some trades above market",
  "D": "Poor — consistently buying above VWAP",
};

function GradeBadge({ grade }: { grade: TraderStat["grade"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${GRADE_STYLE[grade]}`}>
      {grade}
    </span>
  );
}

function BpsCell({ bps, favourable }: { bps: number; favourable: boolean }) {
  const sign = bps >= 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${favourable ? "text-success" : "text-danger"}`}>
      {favourable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {sign}{bps.toFixed(1)} bps
    </span>
  );
}

export function TraderPerformance() {
  const { dealSlips } = useWorkflow();
  const [selected, setSelected] = useState<string | null>(null);

  const vwapMap = useMemo(() => computeVwapMap(dealSlips), [dealSlips]);

  // Build per-trader stats
  const traderStats = useMemo<TraderStat[]>(() => {
    const map = new Map<string, { bpsSum: number; count: number; volume: number; role: string; fav: number; unfav: number }>();
    for (const d of dealSlips) {
      if (d.status === "Draft" || d.status === "Rejected") continue;
      const info = dealVwapInfo(d, vwapMap);
      const key = d.createdBy;
      const existing = map.get(key) ?? { bpsSum: 0, count: 0, volume: 0, role: d.createdByRole, fav: 0, unfav: 0 };
      map.set(key, {
        bpsSum: existing.bpsSum + (info ? info.bps : 0),
        count: existing.count + 1,
        volume: existing.volume + dealNotional(d.fields),
        role: d.createdByRole,
        fav: existing.fav + (info?.favourable ? 1 : 0),
        unfav: existing.unfav + (info && !info.favourable ? 1 : 0),
      });
    }
    return Array.from(map.entries()).map(([name, s]) => {
      const avgBps = s.count > 0 ? s.bpsSum / s.count : 0;
      return {
        name,
        role: s.role,
        dealCount: s.count,
        totalVolume: s.volume,
        avgBps,
        favCount: s.fav,
        unfavCount: s.unfav,
        grade: executionGrade(avgBps),
      };
    }).sort((a, b) => b.avgBps - a.avgBps);
  }, [dealSlips, vwapMap]);

  // Group KPIs
  const totalVolume = traderStats.reduce((s, t) => s + t.totalVolume, 0);
  const avgGroupBps = traderStats.length > 0
    ? traderStats.reduce((s, t) => s + t.avgBps * t.dealCount, 0) /
      traderStats.reduce((s, t) => s + t.dealCount, 0)
    : 0;
  const bestTrader = traderStats[0];

  // Chart data
  const chartData = traderStats.map((t) => ({
    name: t.name.split(" ")[0],
    fullName: t.name,
    bps: parseFloat(t.avgBps.toFixed(1)),
  }));

  // Drilldown — deals for selected trader
  const drillDeals = useMemo(() => {
    if (!selected) return [];
    return dealSlips.filter(
      (d) => d.createdBy === selected && d.status !== "Draft" && d.status !== "Rejected",
    );
  }, [dealSlips, selected]);

  if (selected) {
    const stat = traderStats.find((t) => t.name === selected);
    return (
      <div className="p-4 md:p-6 xl:p-8 space-y-6">
        {/* Back header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
            All Traders
          </button>
          <div className="h-4 w-px bg-border" />
          <div>
            <p className="text-xs text-gray-400">{stat?.role}</p>
            <h1 className="text-xl font-bold text-dark-gray">{selected}</h1>
          </div>
          {stat && <GradeBadge grade={stat.grade} />}
        </div>

        {/* Trader KPIs */}
        {stat && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-xs text-gray-400">Deals executed</p>
              <p className="mt-2 text-2xl font-bold text-dark-gray">{stat.dealCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-xs text-gray-400">Total volume</p>
              <p className="mt-2 text-xl font-bold text-dark-gray">{fmtMoney(stat.totalVolume)}</p>
            </div>
            <div className={`rounded-xl border p-4 shadow-sm ${stat.avgBps >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <p className="text-xs text-gray-400">Avg VWAP deviation</p>
              <p className={`mt-2 text-xl font-bold ${stat.avgBps >= 0 ? "text-success" : "text-danger"}`}>
                {stat.avgBps >= 0 ? "+" : ""}{stat.avgBps.toFixed(1)} bps
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-xs text-gray-400">Execution quality</p>
              <p className="mt-2"><GradeBadge grade={stat.grade} /></p>
              <p className="text-xs text-gray-400 mt-1">{GRADE_DESC[stat.grade]}</p>
            </div>
          </div>
        )}

        {/* Deal table for trader */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-gray-50">
            <p className="text-sm font-semibold text-dark-gray">All Deals — {selected}</p>
            <p className="text-xs text-gray-400 mt-0.5">VWAP deviation per trade. Positive bps = priced above class average (good for FI buyer; bad for equity buyer)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Reference</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Asset class</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Counterparty</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-400">Notional</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Rate / Price</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">VWAP</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Deviation</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Trade date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drillDeals.map((d) => {
                  const info = dealVwapInfo(d, vwapMap);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-dark-gray">{d.id}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-32 truncate">
                        {d.assetClass.replace(" and call deposits", "").replace(" and commercial papers", "")}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{counterpartyOrIssuer(d)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{dealNotional(d.fields).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold">{rateOrPrice(d)}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {info ? `${info.vwap.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {info ? (
                          <BpsCell bps={info.bps} favourable={info.favourable} />
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{tradeDate(d)}</td>
                      <td className="px-4 py-3">
                        <DealSlipStatusBadge status={d.status} />
                      </td>
                    </tr>
                  );
                })}
                {drillDeals.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-gray-400">
                      No active deals for this trader.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Trading Desk</p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">Trader Performance & Execution Quality</h1>
        <p className="mt-1 text-sm text-gray-500">
          VWAP-based price execution analysis across all traders. Measures whether each trader is obtaining
          better or worse rates/prices than the volume-weighted average for their asset class.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Active traders</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{traderStats.length}</p>
          <p className="text-xs text-gray-400">on desk this period</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total volume traded</p>
          <p className="mt-2 text-xl font-bold text-dark-gray">{fmtMoney(totalVolume)}</p>
          <p className="text-xs text-gray-400">all asset classes</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${avgGroupBps >= 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
          <p className="text-xs text-gray-400">Group avg deviation</p>
          <p className={`mt-2 text-xl font-bold ${avgGroupBps >= 0 ? "text-success" : "text-warning"}`}>
            {avgGroupBps >= 0 ? "+" : ""}{avgGroupBps.toFixed(1)} bps
          </p>
          <p className="text-xs text-gray-400">vs VWAP</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Best executor</p>
          {bestTrader ? (
            <>
              <p className="mt-2 text-base font-bold text-dark-gray">{bestTrader.name.split(" ")[0]}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <GradeBadge grade={bestTrader.grade} />
                <span className="text-xs text-success">+{bestTrader.avgBps.toFixed(1)} bps</span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-400">No data</p>
          )}
        </div>
      </div>

      {/* VWAP deviation chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm font-semibold text-dark-gray mb-1">Execution Quality — Avg VWAP Deviation by Trader</p>
          <p className="text-xs text-gray-400 mb-4">
            Bars above zero = trader priced above class VWAP (positive for FI yield; see table for equity context).
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}bps`}
                width={52}
              />
              <Tooltip
                formatter={(v: unknown) => [`${Number(v).toFixed(1)} bps`, "Avg deviation"]}
                labelFormatter={(label: unknown) => {
                  const item = chartData.find((c) => c.name === label);
                  return item?.fullName ?? String(label);
                }}
              />
              <ReferenceLine y={0} stroke="#6B7280" strokeWidth={1} strokeDasharray="4 2" />
              <Bar
                dataKey="bps"
                radius={[4, 4, 0, 0]}
                fill="#F7941D"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trader table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-dark-gray">Trader Scorecard</p>
          <p className="text-xs text-gray-400">Click a row to drill into individual trades</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-gray-400">Trader</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 hidden sm:table-cell">Role</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Deals</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400 hidden md:table-cell">Volume</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Fav / Unfav</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Avg deviation</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Grade</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {traderStats.map((t) => (
              <tr
                key={t.name}
                onClick={() => setSelected(t.name)}
                className="cursor-pointer hover:bg-primary/[0.03] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-dark-gray">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{t.role}</td>
                <td className="px-4 py-3 text-right font-bold text-dark-gray">{t.dealCount}</td>
                <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell tabular-nums">
                  {fmtMoney(t.totalVolume)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-success font-semibold">{t.favCount}↑</span>
                  {" / "}
                  <span className="text-danger font-semibold">{t.unfavCount}↓</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold tabular-nums ${t.avgBps >= 0 ? "text-success" : "text-danger"}`}>
                    {t.avgBps >= 0 ? "+" : ""}{t.avgBps.toFixed(1)} bps
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <GradeBadge grade={t.grade} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-primary hover:underline">Drill in →</span>
                </td>
              </tr>
            ))}
            {traderStats.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                  No trader data available for the current period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Grade legend */}
      <div className="rounded-xl border border-border bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-dark-gray">Execution Grade Reference</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(["A+", "A", "B", "C", "D"] as const).map((g) => (
            <div key={g} className="flex items-start gap-2">
              <GradeBadge grade={g} />
              <p className="text-xs text-gray-500 leading-tight">{GRADE_DESC[g]}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 border-t border-border pt-3">
          VWAP deviation is calculated as (deal rate − class VWAP) × 100. For fixed income, positive bps = higher yield obtained = better execution. For equities, lower price = better execution. Grades apply to the net beneficial deviation from the buyer's perspective.
        </p>
      </div>
    </div>
  );
}
