import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  LineChart as LineChartIcon,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMarketData } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { COLORS, NGN_TENORS } from "../engine";
import {
  fmtBps,
  fmtCompactNGN,
  fmtFx,
  fmtPct,
  fmtShortDate,
  fmtTenor,
} from "../utils";

export function MarketDataDashboard() {
  const { state, asOf } = useMarketData();
  const { snapshot, history } = state;

  const usdNgn = snapshot.fx.find((f) => f.pair === "USD-NGN")!;
  const usdNgnHist = history.fx.map((d) => ({
    date: fmtShortDate(d.date),
    rate: d.rates["USD-NGN"],
  }));
  const usdNgnPrev = history.fx[0].rates["USD-NGN"];
  const fxChange = ((usdNgn.rate - usdNgnPrev) / usdNgnPrev) * 100;

  const ten = snapshot.ngnCurve.find((p) => p.tenor === 10)!;
  const tenPrev = history.ngnCurve[0].yields[10];
  const tenChangeBps = Math.round((ten.yield - tenPrev) * 10000);

  const pnlLatest = history.portfolioPnl[history.portfolioPnl.length - 1];

  const curveData = snapshot.ngnCurve.map((p) => ({
    tenor: fmtTenor(p.tenor),
    yield: p.yield * 100,
  }));

  const pnlData = history.portfolioPnl.map((p) => ({
    date: fmtShortDate(p.date),
    pnl: p.pnl / 1e9,
  }));

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Market Data & Trend Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Live market state as at {asOf} · {history.alerts.length} active alert
          {history.alerts.length === 1 ? "" : "s"} · source: {state.source}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="USD/NGN"
          value={fmtFx(usdNgn.rate)}
          subtitle={`90-day · ${fxChange >= 0 ? "+" : ""}${fxChange.toFixed(2)}%`}
          icon={<Coins className="h-4 w-4" />}
          variant="highlight"
          trend={{
            direction: fxChange > 0 ? "up" : fxChange < 0 ? "down" : "neutral",
            label: `${fxChange >= 0 ? "+" : ""}${fxChange.toFixed(2)}%`,
          }}
        />
        <StatCard
          title="10Y NGN Yield"
          value={fmtPct(ten.yield, 2)}
          subtitle={`90-day · ${fmtBps(tenChangeBps)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            direction:
              tenChangeBps > 0 ? "up" : tenChangeBps < 0 ? "down" : "neutral",
            label: fmtBps(tenChangeBps),
          }}
        />
        <StatCard
          title="CBN MPR & Inflation"
          value={`${fmtPct(snapshot.mpr, 2)} / ${fmtPct(snapshot.inflation, 2)}`}
          subtitle={
            snapshot.mpr - snapshot.inflation >= 0
              ? `Real rate +${fmtPct(snapshot.mpr - snapshot.inflation, 2)}`
              : `Real rate ${fmtPct(snapshot.mpr - snapshot.inflation, 2)}`
          }
          icon={<Activity className="h-4 w-4" />}
          variant={
            snapshot.mpr - snapshot.inflation < 0 ? "warning" : "default"
          }
        />
        <StatCard
          title="Portfolio MTM (90d)"
          value={fmtCompactNGN(pnlLatest.pnl)}
          subtitle={fmtCompactNGN(pnlLatest.value)}
          icon={
            pnlLatest.pnl >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )
          }
          variant={pnlLatest.pnl >= 0 ? "default" : "danger"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="NGN Sovereign Yield Curve"
          description={`Nelson-Siegel calibrated · ${NGN_TENORS.length} tenors`}
        >
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart
                data={curveData}
                margin={{ left: 4, right: 12, top: 8 }}
              >
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="tenor" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                  tick={{ fontSize: 12 }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(v) => `${Number(v ?? 0).toFixed(2)}%`}
                  labelStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke={COLORS.ngn}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="USD/NGN 90-day"
          description={`Latest: ₦${fmtFx(usdNgn.rate)} per USD`}
        >
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart
                data={usdNgnHist}
                margin={{ left: 4, right: 12, top: 8 }}
              >
                <defs>
                  <linearGradient id="fxg" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={COLORS.ngn}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={COLORS.ngn}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  interval={Math.ceil(usdNgnHist.length / 8)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => v.toFixed(0)}
                />
                <Tooltip formatter={(v) => `₦${fmtFx(Number(v ?? 0))}`} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={COLORS.ngn}
                  fill="url(#fxg)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Portfolio Mark-to-Market — 90-day P&L Trajectory"
        description={`Base value: ${fmtCompactNGN(history.portfolioPnl[0].value)}`}
      >
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={pnlData} margin={{ left: 4, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="pnlg" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={COLORS.green}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor={COLORS.green}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.ceil(pnlData.length / 10)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `₦${v.toFixed(0)}B`}
              />
              <Tooltip
                formatter={(v) => `₦${Number(v ?? 0).toFixed(2)}B`}
                labelStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={COLORS.green}
                strokeWidth={2.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="none"
                fill="url(#pnlg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {history.alerts.length > 0 && (
        <SectionCard
          title="Active Yield Alerts"
          description={`Triggers when move exceeds ${25} bps`}
          actions={
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {history.alerts.length} alert
              {history.alerts.length === 1 ? "" : "s"}
            </span>
          }
        >
          <ul className="divide-y divide-border">
            {history.alerts.map((a) => (
              <li
                key={a.tenor}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                      a.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <LineChartIcon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-medium text-dark-gray">{a.message}</p>
                    <p className="text-xs text-gray-500">
                      {fmtPct(a.oldYield, 3)} → {fmtPct(a.newYield, 3)} ·{" "}
                      {a.timestamp}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    a.changeBps > 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {fmtBps(a.changeBps)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
