import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtCompactNGN, colorForSector } from "../utils";

/* ── colour palette for DV01 pie/bar ───────────────────── */
const PALETTE = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

function paletteColor(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export function DurationRiskBySector() {
  const v = useDurationRisk();
  if (!v.hasData) return <EmptyPortfolio />;
  const { bySector, byType, totals, stressRows } = v.result;

  const maxSectorDV01 = Math.max(...bySector.map((r) => r.totalDV01), 1);

  // Chart 1   duration by type (horizontal bars, sorted descending)
  const durationByType = [...byType]
    .filter((r) => r.wtdModified > 0)
    .sort((a, b) => b.wtdModified - a.wtdModified);

  // Chart 2   DV01 by type
  const dv01ByType = [...byType]
    .filter((r) => r.totalDV01 > 0)
    .sort((a, b) => a.totalDV01 - b.totalDV01); // ascending for horizontal bar

  // Chart 8   stress P&L by sector for -200, -100, +100, +200 bps
  const sectorNames = bySector.map((r) => r.group);
  const stressBySector = sectorNames.map((sector) => {
    const rows = stressRows.filter((r) => r.sector === sector);
    return {
      sector,
      "-200bps (Easing)": rows.reduce((s, r) => s + (r.pnl[-200] ?? 0), 0),
      "-100bps (Easing)": rows.reduce((s, r) => s + (r.pnl[-100] ?? 0), 0),
      "+100bps (Tightening)": rows.reduce((s, r) => s + (r.pnl[100] ?? 0), 0),
      "+200bps (Tightening)": rows.reduce((s, r) => s + (r.pnl[200] ?? 0), 0),
    };
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Duration &amp; DV01 by Group
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Weighted modified duration and DV01 concentration grouped by sector
          and instrument type.
        </p>
      </div>

      {/* Chart 1   Duration Profile by Instrument Type */}
      <SectionCard
        title="Chart 1   Duration Profile by Instrument Type"
        description="Weighted average modified duration per instrument type with portfolio average reference line."
      >
        <ResponsiveContainer
          width="100%"
          height={Math.max(220, durationByType.length * 38)}
        >
          <BarChart
            layout="vertical"
            data={durationByType}
            margin={{ top: 8, right: 80, left: 120, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Weighted Average Modified Duration (Years)",
                position: "insideBottom",
                offset: -4,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <YAxis
              type="category"
              dataKey="group"
              tick={{ fontSize: 12, fill: "#374151" }}
              width={115}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [
                `${Number(v ?? 0).toFixed(3)} yrs`,
                "Mod Duration",
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <ReferenceLine
              x={totals.wtdModifiedDur}
              stroke="#e74c3c"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `Portfolio Avg: ${totals.wtdModifiedDur.toFixed(2)} yrs`,
                position: "insideTopRight",
                fontSize: 10,
                fill: "#e74c3c",
              }}
            />
            <Bar
              dataKey="wtdModified"
              fill="#1f77b4"
              radius={[0, 3, 3, 0]}
              maxBarSize={28}
              label={{
                position: "right",
                fontSize: 11,
                fill: "#374151",
                formatter: (v: unknown) =>
                  typeof v === "number" ? `${v.toFixed(2)} yrs` : "",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Chart 2   DV01 Contribution */}
      <SectionCard title="Chart 2   DV01 Contribution Analysis">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 2a   Pie */}
          <div>
            <p className="mb-2 text-center text-xs font-semibold text-gray-600">
              Chart 2a DV01 Share by Type
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={byType.filter((r) => r.totalDV01 > 0)}
                  dataKey="totalDV01"
                  nameKey="group"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                  }
                  labelLine
                >
                  {byType
                    .filter((r) => r.totalDV01 > 0)
                    .map((_, i) => (
                      <Cell key={i} fill={paletteColor(i)} />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [fmtCompactNGN(Number(val ?? 0)), "DV01"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 2b   Horizontal bar */}
          <div>
            <p className="mb-2 text-center text-xs font-semibold text-gray-600">
              Chart 2b DV01 by Instrument Type (₦)
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={dv01ByType}
                margin={{ top: 4, right: 80, left: 120, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => fmtCompactNGN(v)}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Total DV01",
                    position: "insideBottom",
                    offset: -2,
                    style: { fontSize: 10, fill: "#6b7280" },
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="group"
                  tick={{ fontSize: 11, fill: "#374151" }}
                  width={115}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [fmtCompactNGN(Number(val ?? 0)), "DV01"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar
                  dataKey="totalDV01"
                  radius={[0, 3, 3, 0]}
                  maxBarSize={24}
                  label={{
                    position: "right",
                    fontSize: 10,
                    fill: "#374151",
                    formatter: (v: unknown) =>
                      fmtCompactNGN(typeof v === "number" ? v : 0),
                  }}
                >
                  {dv01ByType.map((_, i) => (
                    <Cell
                      key={i}
                      fill={paletteColor(dv01ByType.length - 1 - i)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* Chart 8   Stress by Sector */}
      <SectionCard
        title="Chart 8   Stress Test Impact by Sector"
        description="P&L impact (₦ billions) for selected easing/tightening scenarios by sector."
      >
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={stressBySector}
            margin={{ top: 16, right: 24, left: 24, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="sector"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `₦${(v / 1e9).toFixed(1)}B`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "P&L Impact (₦ Billions)",
                angle: -90,
                position: "insideLeft",
                offset: -8,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <Tooltip
              formatter={(val, name) => [fmtCompactNGN(Number(val ?? 0)), name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
            <Bar
              dataKey="-200bps (Easing)"
              fill="#2ecc71"
              radius={[2, 2, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="-100bps (Easing)"
              fill="#82ca9d"
              radius={[2, 2, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="+100bps (Tightening)"
              fill="#f4a261"
              radius={[2, 2, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="+200bps (Tightening)"
              fill="#e74c3c"
              radius={[2, 2, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Sector detail table */}
      <SectionCard title="By Sector   Detail Table" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Sector</th>
                <th className="px-4 py-2.5 text-right">Count</th>
                <th className="px-4 py-2.5 text-right">Mac Dur</th>
                <th className="px-4 py-2.5 text-right">Mod Dur</th>
                <th className="px-4 py-2.5 text-right">DV01 (NGN)</th>
                <th className="px-4 py-2.5 text-right">% DV01</th>
                <th className="px-4 py-2.5 text-left w-40">Share</th>
              </tr>
            </thead>
            <tbody>
              {bySector.map((r) => {
                const pct =
                  totals.totalDV01 > 0
                    ? (r.totalDV01 / totals.totalDV01) * 100
                    : 0;
                const width = (r.totalDV01 / maxSectorDV01) * 100;
                return (
                  <tr key={r.group} className="border-b border-border/60">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: colorForSector(r.group) }}
                        />
                        {r.group}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {r.count}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {r.wtdMacaulay.toFixed(2)}y
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">
                      {r.wtdModified.toFixed(2)}y
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {fmtCompactNGN(r.totalDV01)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: colorForSector(r.group),
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
