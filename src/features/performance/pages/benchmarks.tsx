import { useMemo, useState } from "react";
import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";
import {
  ENTITY_BENCHMARKS,
  assignEntities,
  type EntityWithBenchmark,
} from "../engine/entity-assignment";
import { ENTITIES } from "../../../context/entity";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";

const ENTITY_ASSIGN = assignEntities(BOOK_INSTRUMENTS);

type EntityStats = {
  eb: EntityWithBenchmark;
  instruments: number;
  bsvNGN: number;
  weightedYield: number;
  weightedEIR: number;
  weightedDuration: number;
  spread: number;
  eirSpread: number;
  aboveBenchmark: number;
};

function buildEntityStats(): EntityStats[] {
  return ENTITY_BENCHMARKS.filter((eb) => eb.id !== "consolidated").map((eb) => {
    const valsForEntity = BOOK_VALUATIONS.filter((_, i) => ENTITY_ASSIGN[i] === eb.id);
    const totalBSV = valsForEntity.reduce((s, v) => s + v.balanceSheetValueNGN, 0);
    const wYield =
      totalBSV > 0
        ? valsForEntity.reduce((s, v) => s + v.marketYieldUsed * v.balanceSheetValueNGN, 0) / totalBSV
        : 0;
    const wEIR =
      totalBSV > 0
        ? valsForEntity.reduce((s, v) => s + v.eir * v.balanceSheetValueNGN, 0) / totalBSV
        : 0;
    const wDur =
      totalBSV > 0
        ? valsForEntity.reduce((s, v) => s + v.risk.modifiedDuration * v.balanceSheetValueNGN, 0) / totalBSV
        : 0;
    const aboveBenchmark = valsForEntity.filter(
      (v) => v.marketYieldUsed > eb.benchmarkYield
    ).length;

    return {
      eb,
      instruments: valsForEntity.length,
      bsvNGN: totalBSV,
      weightedYield: wYield,
      weightedEIR: wEIR,
      weightedDuration: wDur,
      spread: wYield - eb.benchmarkYield,
      eirSpread: wEIR - eb.benchmarkYield,
      aboveBenchmark,
    };
  });
}

const ENTITY_STATS = buildEntityStats();

// Consolidated stats
const CONSOLIDATED_BSV = BOOK_COMPUTED.totals.totalBSValueNGN;
const CONSOLIDATED_BLENDED_BENCHMARK =
  ENTITY_STATS.reduce((s, e) => s + e.eb.benchmarkYield * e.bsvNGN, 0) / (CONSOLIDATED_BSV || 1);
const CONSOLIDATED_WEIGHTED_YIELD =
  ENTITY_STATS.reduce((s, e) => s + e.weightedYield * e.bsvNGN, 0) / (CONSOLIDATED_BSV || 1);

function bpsDiff(a: number, b: number): string {
  const bps = Math.round((a - b) * 10000);
  return `${bps >= 0 ? "+" : ""}${bps}bps`;
}

function SpreadPill({ spread }: { spread: number }) {
  const positive = spread >= 0;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
        positive ? "bg-green-100 text-success" : "bg-red-100 text-danger"
      }`}
    >
      {bpsDiff(spread + CONSOLIDATED_BLENDED_BENCHMARK, CONSOLIDATED_BLENDED_BENCHMARK)}
    </span>
  );
}

type TabId = "lacl" | "lpfa" | "lhl" | "lcil" | "group";

const TABS: { id: TabId; label: string }[] = [
  { id: "group", label: "Group Overview" },
  { id: "lacl", label: "LACL — Assurance" },
  { id: "lpfa", label: "LPFA — Pension" },
  { id: "lhl", label: "LHL — Health" },
  { id: "lcil", label: "LCIL — Capital" },
];

function GroupOverview() {
  const chartData = ENTITY_STATS.map((e) => ({
    entity: e.eb.shortName,
    portfolioYield: parseFloat((e.weightedYield * 100).toFixed(2)),
    benchmark: parseFloat((e.eb.benchmarkYield * 100).toFixed(2)),
    spread: parseFloat((e.spread * 100).toFixed(2)),
    colour: e.eb.colour,
  }));

  const radarData = ENTITY_STATS.map((e) => ({
    subject: e.eb.shortName,
    Yield: parseFloat((e.weightedYield * 100).toFixed(1)),
    Benchmark: parseFloat((e.eb.benchmarkYield * 100).toFixed(1)),
    Duration: parseFloat(e.weightedDuration.toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Group summary header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Group Weighted Yield</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">
            {fmtPct(CONSOLIDATED_WEIGHTED_YIELD)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">portfolio market yield</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Blended Benchmark</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">
            {fmtPct(CONSOLIDATED_BLENDED_BENCHMARK)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">AUM-weighted average</p>
        </div>
        <div
          className={`rounded-xl border p-4 shadow-sm ${
            CONSOLIDATED_WEIGHTED_YIELD >= CONSOLIDATED_BLENDED_BENCHMARK
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p className="text-xs text-gray-400">Group Alpha</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              CONSOLIDATED_WEIGHTED_YIELD >= CONSOLIDATED_BLENDED_BENCHMARK
                ? "text-success"
                : "text-danger"
            }`}
          >
            {bpsDiff(CONSOLIDATED_WEIGHTED_YIELD, CONSOLIDATED_BLENDED_BENCHMARK)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">vs blended benchmark</p>
        </div>
      </div>

      {/* Yield vs Benchmark bar chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-dark-gray mb-1">
          Portfolio Yield vs Entity Benchmarks
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Each entity compared to its appropriate benchmark — liability-driven (LACL) or market rate
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="entity" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis
              tickFormatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(v: unknown, name: unknown) => [
                `${Number(v).toFixed(2)}%`,
                name === "portfolioYield" ? "Portfolio Yield" : name === "benchmark" ? "Benchmark" : "Spread",
              ]}
            />
            <Legend
              formatter={(v) =>
                v === "portfolioYield" ? "Portfolio Yield" : v === "benchmark" ? "Benchmark" : "Active Spread"
              }
            />
            <Bar dataKey="portfolioYield" fill="#F7941D" name="portfolioYield" radius={[3, 3, 0, 0]} />
            <Bar dataKey="benchmark" fill="#1E3A5F" name="benchmark" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Entity scorecard table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-dark-gray">Entity Performance Scorecard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-400">Entity</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-400">Benchmark Type</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-400">Portfolio Yield</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-400">Benchmark</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-400">Spread</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-400">AUM (NAV)</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-400">Positions</th>
              </tr>
            </thead>
            <tbody>
              {ENTITY_STATS.map((e) => (
                <tr key={e.eb.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: e.eb.colour }}
                      />
                      <div>
                        <div className="font-semibold text-dark-gray">{e.eb.shortName}</div>
                        <div className="text-gray-400">{e.eb.regulator}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-600">{e.eb.benchmarkLabel}</div>
                    <span
                      className={`text-xs rounded px-1.5 py-0.5 ${
                        e.eb.benchmarkType === "liability-driven"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {e.eb.benchmarkType === "liability-driven" ? "Liability-Driven" : "Market Rate"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {fmtPct(e.weightedYield)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {fmtPct(e.eb.benchmarkYield)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        e.spread >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {bpsDiff(e.weightedYield, e.eb.benchmarkYield)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-dark-gray">
                    {fmtCompact(e.bsvNGN)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{e.instruments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EntityDetail({ stats }: { stats: EntityStats }) {
  const { eb, instruments, bsvNGN, weightedYield, weightedEIR, weightedDuration, spread, aboveBenchmark } = stats;

  const valsForEntity = BOOK_VALUATIONS.filter((_, i) => ENTITY_ASSIGN[i] === eb.id);

  // Yield distribution histogram (bucket by 200bps bands)
  const buckets: Record<string, { count: number; value: number }> = {};
  valsForEntity.forEach((v) => {
    const pct = v.marketYieldUsed * 100;
    const lo = Math.floor(pct / 2) * 2;
    const key = `${lo}–${lo + 2}%`;
    if (!buckets[key]) buckets[key] = { count: 0, value: 0 };
    buckets[key].count++;
    buckets[key].value += v.balanceSheetValueNGN;
  });
  const distData = Object.entries(buckets)
    .map(([band, d]) => ({ band, count: d.count, value: d.value / 1e9 }))
    .sort((a, b) => parseFloat(a.band) - parseFloat(b.band));

  return (
    <div className="space-y-6">
      {/* Entity header */}
      <div
        className="rounded-xl p-5 text-white shadow"
        style={{ background: eb.colour }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{eb.regulator}</p>
            <h2 className="mt-0.5 text-xl font-bold">{eb.name}</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              eb.benchmarkType === "liability-driven"
                ? "bg-white/20 text-white"
                : "bg-white/20 text-white"
            }`}
          >
            {eb.benchmarkType === "liability-driven" ? "Liability-Driven Benchmark" : "Market Benchmark"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs opacity-70">Portfolio Yield</p>
            <p className="text-2xl font-bold">{fmtPct(weightedYield)}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">{eb.benchmarkLabel}</p>
            <p className="text-2xl font-bold">{fmtPct(eb.benchmarkYield)}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Active Spread</p>
            <p className={`text-2xl font-bold ${spread >= 0 ? "" : "opacity-80"}`}>
              {bpsDiff(weightedYield, eb.benchmarkYield)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-70">AUM (NAV)</p>
            <p className="text-2xl font-bold">{fmtCompact(bsvNGN)}</p>
          </div>
        </div>
      </div>

      {/* Benchmark methodology note */}
      {eb.benchmarkType === "liability-driven" ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-semibold text-orange-700">Liability-Driven Benchmark — LACL</p>
          <p className="text-xs text-gray-600 mt-1">
            NAICOM requires that Leadway Assurance manages assets relative to the duration of insurance liabilities.
            The benchmark rate ({fmtPct(eb.benchmarkYield)}) is interpolated from the FGN yield curve at the
            weighted average liability duration{eb.liabilityWAD ? ` (${eb.liabilityWAD.toFixed(1)} years)` : ""}.
            A positive spread means the investment portfolio is earning above the required liability return.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-700">Market Benchmark — {eb.shortName}</p>
          <p className="text-xs text-gray-600 mt-1">
            {eb.id === "lpfa"
              ? `PENCOM mandates that pension fund returns exceed the 91-day T-Bill + 200bps floor. Benchmark: ${fmtPct(eb.benchmarkYield)}.`
              : eb.id === "lhl"
                ? `Health reserves are short-duration; benchmark is the 91-day T-Bill rate (${fmtPct(eb.benchmarkYield)}).`
                : `SEC-registered investment companies compare against the FGN 10-year bond yield (${fmtPct(eb.benchmarkYield)}).`}
          </p>
        </div>
      )}

      {/* Detailed KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Weighted EIR", value: fmtPct(weightedEIR), sub: "effective interest rate" },
          { label: "EIR vs Benchmark", value: bpsDiff(weightedEIR, eb.benchmarkYield), sub: "income spread", positive: weightedEIR >= eb.benchmarkYield },
          { label: "Mod. Duration (WAD)", value: `${weightedDuration.toFixed(2)}y`, sub: "interest rate sensitivity" },
          { label: "Above Benchmark", value: `${aboveBenchmark}/${instruments}`, sub: "instruments outperforming" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p
              className={`mt-2 text-xl font-bold ${
                k.positive === false ? "text-danger" : k.positive === true ? "text-success" : "text-dark-gray"
              }`}
            >
              {k.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Yield distribution chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-dark-gray mb-1">
          Yield Distribution (₦B by band)
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          How NAV is distributed across yield bands vs the {eb.benchmarkLabel} ({fmtPct(eb.benchmarkYield)})
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={distData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="band" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis
              tickFormatter={(v: unknown) => `₦${Number(v).toFixed(0)}B`}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
            />
            <Tooltip
              formatter={(v: unknown) => [`₦${Number(v).toFixed(1)}B`, "NAV"]}
              labelFormatter={(l: unknown) => `Yield band: ${l}`}
            />
            <ReferenceLine
              x={`${Math.floor(eb.benchmarkYield * 50) * 2}–${Math.floor(eb.benchmarkYield * 50) * 2 + 2}%`}
              stroke="#EF4444"
              strokeDasharray="4 2"
              label={{ value: "Benchmark", fontSize: 10, fill: "#EF4444", position: "top" }}
            />
            <Bar dataKey="value" fill={eb.colour} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top holdings for this entity */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-dark-gray">
            Top Positions — {eb.shortName} ({instruments} instruments)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-400">Instrument</th>
                <th className="px-3 py-2 text-left font-medium text-gray-400">Type</th>
                <th className="px-3 py-2 text-right font-medium text-gray-400">Yield</th>
                <th className="px-3 py-2 text-right font-medium text-gray-400">vs Benchmark</th>
                <th className="px-3 py-2 text-right font-medium text-gray-400">NAV (₦)</th>
              </tr>
            </thead>
            <tbody>
              {valsForEntity
                .sort((a, b) => b.balanceSheetValueNGN - a.balanceSheetValueNGN)
                .slice(0, 12)
                .map((v) => {
                  const sp = v.marketYieldUsed - eb.benchmarkYield;
                  return (
                    <tr key={v.instrument.id} className="border-b border-border hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-dark-gray max-w-48 truncate">
                        {v.instrument.name}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400">{v.instrument.instrumentType}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-primary">
                        {fmtPct(v.marketYieldUsed)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-semibold ${sp >= 0 ? "text-success" : "text-danger"}`}
                      >
                        {bpsDiff(v.marketYieldUsed, eb.benchmarkYield)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-dark-gray">
                        {fmtCompact(v.balanceSheetValueNGN)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {instruments > 12 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-border">
            <p className="text-xs text-gray-400">Showing top 12 of {instruments} positions</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Benchmarks() {
  const [activeTab, setActiveTab] = useState<TabId>("group");

  const activeStats = ENTITY_STATS.find((e) => e.eb.id === activeTab);

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Performance Analytics
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Actual Return vs Benchmark
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Entity-level performance attribution with liability-driven benchmarks for LACL and market benchmarks for pension, health, and capital subsidiaries
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const stats = ENTITY_STATS.find((e) => e.eb.id === tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-white text-dark-gray shadow-sm"
                  : "text-gray-500 hover:text-dark-gray"
              }`}
            >
              {tab.id !== "group" && stats && (
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0`}
                  style={{
                    background: stats.eb.colour,
                  }}
                />
              )}
              <span>{tab.label}</span>
              {tab.id !== "group" && stats && (
                <span
                  className={`rounded-full px-1.5 text-xs font-bold ${
                    stats.spread >= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {bpsDiff(stats.weightedYield, stats.eb.benchmarkYield)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "group" ? (
        <GroupOverview />
      ) : (
        activeStats && <EntityDetail stats={activeStats} />
      )}
    </div>
  );
}
