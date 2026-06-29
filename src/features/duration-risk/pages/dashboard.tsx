import { Activity, Clock, Gauge, TrendingDown, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtNumber, fmtPct } from "../../valuation/utils";
import { fmtCompactNGN, fmtYears, colorForSector } from "../utils";
import { PARALLEL_SHOCKS_BPS } from "../engine";

/* ─── small helpers ─────────────────────────────────────── */
function histColor(bucket: string): string {
  if (["0-6M", "6M-1Y"].includes(bucket)) return "#2ecc71";
  if (["1-2Y", "2-3Y"].includes(bucket)) return "#3498db";
  if (["3-5Y", "5-7Y"].includes(bucket)) return "#2ecc71";
  return "#95a5a6";
}

function shockBarColor(bps: number): string {
  if (bps < 0) return "#2ecc71";
  if (bps > 0) return "#e74c3c";
  return "#95a5a6";
}

const fmtNGNBillions = (v: number) => {
  const b = v / 1e9;
  return `₦${Math.abs(b).toFixed(1)}B`;
};

export function DurationRiskDashboard() {
  const v = useDurationRisk();
  if (!v.hasData) return <EmptyPortfolio />;
  const {
    totals,
    stressRows,
    bySector,
    byClassification,
    cashflowBuckets,
    durationHistogram,
  } = v.result;

  // total stress P&L per shock
  const shockData = PARALLEL_SHOCKS_BPS.filter((b) => b !== 0).map((bps) => {
    const pnl = stressRows.reduce((s, r) => s + (r.pnl[bps] ?? 0), 0);
    const label = bps < 0 ? `${bps}bps` : `+${bps}bps`;
    return { label, bps, pnl };
  });
  const totalBase = stressRows.reduce((s, r) => s + r.baseValueNGN, 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Duration &amp; Risk Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Portfolio interest-rate risk as at {v.assumptions.valuationDate}{" "}
          {totals.instruments} duration-eligible instruments
        </p>
      </div>

      {/* top KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Portfolio DV01"
          value={fmtCompactNGN(totals.totalDV01)}
          subtitle="NGN per basis point"
          icon={<Zap className="h-4 w-4" />}
          variant="highlight"
        />
        <StatCard
          title="Modified Duration"
          value={fmtYears(totals.wtdModifiedDur, 2)}
          subtitle={`Macaulay: ${fmtYears(totals.wtdMacaulayDur, 2)}`}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="+100 bp Shock"
          value={fmtCompactNGN(totals.ir100bp)}
          subtitle={
            totalBase > 0
              ? `${fmtPct(totals.ir100bp / totalBase, 2)} of book`
              : " "
          }
          icon={<TrendingDown className="h-4 w-4" />}
          variant={totals.ir100bp < 0 ? "danger" : "default"}
        />
        <StatCard
          title="+200 bp Shock"
          value={fmtCompactNGN(totals.ir200bp)}
          subtitle={
            totalBase > 0
              ? `${fmtPct(totals.ir200bp / totalBase, 2)} of book`
              : " "
          }
          icon={<Gauge className="h-4 w-4" />}
          variant={totals.ir200bp < 0 ? "danger" : "default"}
        />
      </div>

      {/* Chart 5   Parallel Shock P&L */}
      <SectionCard
        title="Chart 5   Parallel Shock Stress Test: Portfolio P&L Impact"
        description="NGN P&L from instantaneous parallel yield curve shifts. Green = rate cut (gain), red = tightening (loss)."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={shockData}
            margin={{ top: 16, right: 40, left: 20, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtNGNBillions}
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
              formatter={(val) => [fmtCompactNGN(Number(val ?? 0)), "P&L"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={60}>
              {shockData.map((entry, i) => (
                <Cell key={i} fill={shockBarColor(entry.bps)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#2ecc71]" />
            Rate Cut Portfolio Gain
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#e74c3c]" />
            Rate Hike Portfolio Loss
          </span>
        </div>
      </SectionCard>

      {/* Chart 4   Duration Distribution Histogram */}
      <SectionCard
        title="Chart 4   Duration Distribution Across Portfolio"
        description="Number of duration-eligible instruments by modified-duration bucket."
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={durationHistogram}
            margin={{ top: 16, right: 24, left: 16, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Modified Duration Bucket",
                position: "insideBottom",
                offset: -2,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Number of Instruments",
                angle: -90,
                position: "insideLeft",
                offset: -4,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <Tooltip
              formatter={(v) => [v, "Instruments"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar
              dataKey="count"
              radius={[3, 3, 0, 0]}
              maxBarSize={64}
              label={{ position: "top", fontSize: 11, fill: "#374151" }}
            >
              {durationHistogram.map((entry, i) => (
                <Cell key={i} fill={histColor(entry.bucket)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Chart 3   Cash Flow Projection */}
      <SectionCard
        title="Chart 3   Cash Flow Projection by Maturity Bucket"
        description="Future coupon (blue) and principal (orange) inflows in ₦."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={cashflowBuckets}
            margin={{ top: 16, right: 24, left: 20, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `₦${(v / 1e9).toFixed(0)}B`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Cash Flow (₦ Billions)",
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="coupon"
              name="Coupon Cash Flows"
              fill="#4e79a7"
              radius={[2, 2, 0, 0]}
              maxBarSize={56}
            />
            <Bar
              dataKey="principal"
              name="Principal Cash Flows"
              fill="#f28e2b"
              radius={[2, 2, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* by classification */}
        <SectionCard title="Duration by Classification" noPadding>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Class</th>
                <th className="px-4 py-2.5 text-right">Count</th>
                <th className="px-4 py-2.5 text-right">Mod Dur</th>
                <th className="px-4 py-2.5 text-right">DV01 (NGN)</th>
              </tr>
            </thead>
            <tbody>
              {byClassification.map((r) => (
                <tr key={r.group} className="border-b border-border/60">
                  <td className="px-4 py-2.5 font-semibold">{r.group}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.count}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.wtdModified.toFixed(2)}y
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {fmtCompactNGN(r.totalDV01)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* top sector concentrations */}
        <SectionCard title="DV01 Concentration by Sector" noPadding>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Sector</th>
                <th className="px-4 py-2.5 text-right">Mod Dur</th>
                <th className="px-4 py-2.5 text-right">DV01 (NGN)</th>
                <th className="px-4 py-2.5 text-left w-28">Share</th>
              </tr>
            </thead>
            <tbody>
              {bySector.slice(0, 7).map((r) => {
                const pct =
                  totals.totalDV01 > 0
                    ? (r.totalDV01 / totals.totalDV01) * 100
                    : 0;
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
                      {r.wtdModified.toFixed(2)}y
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {fmtCompactNGN(r.totalDV01)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, pct)}%`,
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
        </SectionCard>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Convexity (weighted): {fmtNumber(totals.wtdConvexity, 4)}
      </div>
    </div>
  );
}
