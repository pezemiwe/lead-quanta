import {
  CartesianGrid,
  Line,
  LineChart,
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
import { fmtCompactNGN, fmtYears } from "../utils";
import { fmtNumber, fmtPct } from "../../valuation/utils";
import { Activity } from "lucide-react";

export function DurationRiskConvexity() {
  const v = useDurationRisk();
  if (!v.hasData) return <EmptyPortfolio />;
  const { convexityCurve, totals } = v.result;

  const basePoint = convexityCurve.find((p) => p.shock === 0);
  const baseNGN = basePoint?.portfolioNGN ?? 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Price / Yield Convexity Curve
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          How portfolio value and percentage change respond to parallel yield
          shocks — illustrating duration linearity and convexity's second-order
          benefit.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Portfolio Base Value"
          value={fmtCompactNGN(baseNGN)}
          subtitle="at zero shock"
          icon={<Activity className="h-4 w-4" />}
          variant="highlight"
        />
        <StatCard
          title="Modified Duration"
          value={fmtYears(totals.wtdModifiedDur, 3)}
          subtitle="linear price sensitivity"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Weighted Convexity"
          value={fmtNumber(totals.wtdConvexity, 4)}
          subtitle="second-order curvature"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Chart 6 — two panels */}
      <SectionCard title="Chart 6 — Price / Yield Convexity Curve">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left — portfolio value vs shock */}
          <div>
            <p className="mb-3 text-center text-xs font-semibold text-gray-600">
              Portfolio Value vs Yield Shock
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={convexityCurve}
                margin={{ top: 8, right: 24, left: 24, bottom: 24 }}
              >
                <defs>
                  <linearGradient id="gainFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2ecc71" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="lossFill" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="5%" stopColor="#e74c3c" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#e74c3c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis
                  dataKey="shock"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(v: number) => `${v}`}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Yield Shock (bps)",
                    position: "insideBottom",
                    offset: -12,
                    style: { fontSize: 11, fill: "#6b7280" },
                  }}
                />
                <YAxis
                  tickFormatter={(v: number) => `?${(v / 1e9).toFixed(1)}B`}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Portfolio Value (? Billions)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -12,
                    style: { fontSize: 10, fill: "#6b7280" },
                  }}
                />
                <Tooltip
                  formatter={(val) => [
                    fmtCompactNGN(Number(val ?? 0)),
                    "Portfolio Value",
                  ]}
                  labelFormatter={(l) => `Shock: ${l} bps`}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <ReferenceLine
                  x={0}
                  stroke="#374151"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
                <ReferenceLine
                  y={baseNGN}
                  stroke="#374151"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                />
                <Line
                  type="linear"
                  dataKey="portfolioNGN"
                  stroke="#3b4fe4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3b4fe4" }}
                  activeDot={{ r: 6 }}
                  name="Portfolio Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Right — % change vs shock */}
          <div>
            <p className="mb-3 text-center text-xs font-semibold text-gray-600">
              % Change vs Yield Shock (Convexity Curve)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={convexityCurve}
                margin={{ top: 8, right: 24, left: 24, bottom: 24 }}
              >
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis
                  dataKey="shock"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Yield Shock (bps)",
                    position: "insideBottom",
                    offset: -12,
                    style: { fontSize: 11, fill: "#6b7280" },
                  }}
                />
                <YAxis
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Portfolio Value Change (%)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -12,
                    style: { fontSize: 10, fill: "#6b7280" },
                  }}
                />
                <Tooltip
                  formatter={(val) => [
                    `${Number(val ?? 0).toFixed(3)}%`,
                    "% Change",
                  ]}
                  labelFormatter={(l) => `Shock: ${l} bps`}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <ReferenceLine
                  x={0}
                  stroke="#374151"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
                <ReferenceLine
                  y={0}
                  stroke="#374151"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                />
                <Line
                  type="linear"
                  dataKey="pct"
                  stroke="#7b2d8b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#7b2d8b" }}
                  activeDot={{ r: 6 }}
                  name="% Change"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* interpretation table */}
      <SectionCard title="Shock Sensitivity Table" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Scenario</th>
                <th className="px-4 py-2.5 text-right">Shock (bps)</th>
                <th className="px-4 py-2.5 text-right">Portfolio Value</th>
                <th className="px-4 py-2.5 text-right">P&L vs Base</th>
                <th className="px-4 py-2.5 text-right">% Change</th>
                <th className="px-4 py-2.5 text-right">Duration Approx.</th>
                <th className="px-4 py-2.5 text-right">Convexity Adj.</th>
              </tr>
            </thead>
            <tbody>
              {convexityCurve.map((pt) => {
                const pnl = pt.portfolioNGN - baseNGN;
                const durApprox =
                  -totals.wtdModifiedDur * (pt.shock / 10_000) * baseNGN;
                const convAdj = pt.shock !== 0 ? pnl - durApprox : 0;
                const isBase = pt.shock === 0;
                return (
                  <tr
                    key={pt.shock}
                    className={`border-b border-border/60 ${isBase ? "bg-pale-red/20" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {isBase
                        ? "Base Case"
                        : pt.shock < 0
                          ? `Easing ${Math.abs(pt.shock)} bp`
                          : `Tightening ${pt.shock} bp`}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {pt.shock > 0 ? "+" : ""}
                      {pt.shock}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {fmtCompactNGN(pt.portfolioNGN)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-semibold ${pnl >= 0 ? "text-success" : "text-primary"}`}
                    >
                      {fmtCompactNGN(pnl)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono text-xs ${pt.pct >= 0 ? "text-success" : "text-primary"}`}
                    >
                      {fmtPct(pt.pct / 100, 2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-500">
                      {isBase ? "—" : fmtCompactNGN(durApprox)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono text-xs ${convAdj >= 0 ? "text-success" : "text-primary"}`}
                    >
                      {isBase ? "—" : fmtCompactNGN(convAdj)}
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
