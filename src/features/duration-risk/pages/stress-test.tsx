import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtPct } from "../../valuation/utils";
import { fmtCompactNGN, colorForShock } from "../utils";
import { PARALLEL_SHOCKS_BPS } from "../engine";

type Group = "All" | "AC" | "FVOCI" | "FVTPL";

export function DurationRiskStressTest() {
  const v = useDurationRisk();
  const [group, setGroup] = useState<Group>("All");

  const filtered = useMemo(() => {
    if (group === "All") return v.result.stressRows;
    return v.result.stressRows.filter((r) => r.classification === group);
  }, [v.result.stressRows, group]);

  if (!v.hasData) return <EmptyPortfolio />;

  const totalBase = filtered.reduce((s, r) => s + r.baseValueNGN, 0);

  const shockTotals = PARALLEL_SHOCKS_BPS.map((bps) => {
    const total = filtered.reduce((s, r) => s + (r.pnl[bps] ?? 0), 0);
    const ac = filtered
      .filter((r) => r.classification === "AC")
      .reduce((s, r) => s + (r.pnl[bps] ?? 0), 0);
    const fvoci = filtered
      .filter((r) => r.classification === "FVOCI")
      .reduce((s, r) => s + (r.pnl[bps] ?? 0), 0);
    const fvtpl = filtered
      .filter((r) => r.classification === "FVTPL")
      .reduce((s, r) => s + (r.pnl[bps] ?? 0), 0);
    return { bps, total, ac, fvoci, fvtpl };
  });

  // top 30 names by absolute +200 bps impact
  const topMovers = [...filtered]
    .sort((a, b) => Math.abs(b.pnl[200] ?? 0) - Math.abs(a.pnl[200] ?? 0))
    .slice(0, 30);

  const nonZeroBps = PARALLEL_SHOCKS_BPS.filter((b) => b !== 0);

  // colour scale for heatmap
  const heatMax = Math.max(
    ...topMovers.flatMap((r) => nonZeroBps.map((b) => Math.abs(r.pnl[b] ?? 0))),
    1,
  );

  const cellBg = (val: number) => {
    if (val === 0) return "transparent";
    const intensity = Math.min(1, Math.abs(val) / heatMax);
    const alpha = 0.15 + intensity * 0.7;
    return val >= 0
      ? `rgba(46, 204, 113, ${alpha})`
      : `rgba(231, 76, 60, ${alpha})`;
  };

  // chart data for Chart 5
  const barData = nonZeroBps.map((bps) => {
    const pnl = filtered.reduce((s, r) => s + (r.pnl[bps] ?? 0), 0);
    return { label: bps < 0 ? `${bps}bps` : `+${bps}bps`, bps, pnl };
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">
            Parallel Shock Stress Test
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Instant parallel shifts of the yield curve. AC instruments re-priced
            for economic display only; FVOCI/FVTPL flow through OCI and P&amp;L.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { value: "All" as Group, label: "All" },
            { value: "AC" as Group, label: "Amortised Cost" },
            { value: "FVOCI" as Group, label: "Fair Value (OCI)" },
            { value: "FVTPL" as Group, label: "Fair Value (P&L)" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setGroup(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                group === value
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-gray-500 hover:bg-pale-red hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart 5 — Recharts bar chart */}
      <SectionCard
        title="Chart 5 — Parallel Shock Stress Test: Portfolio P&amp;L Impact"
        description="Portfolio P&L from instantaneous parallel yield curve shifts. Green = easing (gain), red = tightening (loss)."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={barData}
            margin={{ top: 16, right: 40, left: 20, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Yield Curve Shock (Basis Points)",
                position: "insideBottom",
                offset: -4,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <YAxis
              tickFormatter={(v: number) => `₦${(v / 1e9).toFixed(1)}B`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Portfolio P&L Impact (₦ Billions)",
                angle: -90,
                position: "insideLeft",
                offset: -8,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <Tooltip
              formatter={(val) => [
                fmtCompactNGN(Number(val ?? 0)),
                "P&L Impact",
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={60}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.bps < 0 ? "#2ecc71" : "#e74c3c"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#2ecc71]" />
            Rate Cut — Portfolio Gain
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#e74c3c]" />
            Rate Hike — Portfolio Loss
          </span>
        </div>
      </SectionCard>

      {/* summary table */}
      <SectionCard title="Scenario Summary" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Scenario</th>
                <th className="px-4 py-2.5 text-right">Shock</th>
                <th className="px-4 py-2.5 text-right">Total P&amp;L (NGN)</th>
                <th className="px-4 py-2.5 text-right">% of Book</th>
                <th className="px-4 py-2.5 text-right">Amortised Cost</th>
                <th className="px-4 py-2.5 text-right">Fair Value (OCI)</th>
                <th className="px-4 py-2.5 text-right">Fair Value (P&amp;L)</th>
              </tr>
            </thead>
            <tbody>
              {shockTotals.map(({ bps, total, ac, fvoci, fvtpl }) => {
                const isBase = bps === 0;
                const lbl = isBase
                  ? "Base case"
                  : bps < 0
                    ? `Easing ${Math.abs(bps)} bp`
                    : `Tightening ${bps} bp`;
                return (
                  <tr
                    key={bps}
                    className={`border-b border-border/60 ${isBase ? "bg-pale-red/20" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium">{lbl}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      <span
                        className="rounded px-1.5 py-0.5"
                        style={{
                          backgroundColor: colorForShock(bps),
                          color: bps === 0 ? "#2c3e50" : "white",
                        }}
                      >
                        {bps > 0 ? "+" : ""}
                        {bps} bps
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-semibold ${
                        total >= 0 ? "text-success" : "text-primary"
                      }`}
                    >
                      {fmtCompactNGN(total)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {totalBase > 0 ? fmtPct(total / totalBase, 2) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {fmtCompactNGN(ac)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {fmtCompactNGN(fvoci)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {fmtCompactNGN(fvtpl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* heatmap */}
      <SectionCard
        title="Chart 7 — Stress Test Heatmap: Top 30 Instruments — Rate Scenarios"
        description="P&L impact in NGN. Green = gain, red = loss. Colour intensity scales with absolute impact."
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-gray-50 text-gray-500">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 text-left">
                  Instrument
                </th>
                {nonZeroBps.map((bps) => (
                  <th key={bps} className="px-2.5 py-2.5 text-center font-mono">
                    {bps > 0 ? "+" : ""}
                    {bps}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topMovers.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2">
                    <div className="truncate font-medium text-dark-gray">
                      {r.name}
                    </div>
                    <div className="font-mono text-[10px] text-gray-400">
                      {r.id} · {r.classification}
                    </div>
                  </td>
                  {nonZeroBps.map((bps) => {
                    const val = r.pnl[bps] ?? 0;
                    return (
                      <td
                        key={bps}
                        className="px-2 py-2 text-center font-mono"
                        style={{ backgroundColor: cellBg(val) }}
                      >
                        {fmtCompactNGN(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
