import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMarketData } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { COLORS, NGN_TENORS, nsYield, USD_TENORS } from "../engine";
import { fmtBps, fmtPct, fmtTenor } from "../utils";

type CurrencyTab = "NGN" | "USD";

export function MarketDataYieldCurve() {
  const { state } = useMarketData();
  const [tab, setTab] = useState<CurrencyTab>("NGN");
  const snap = state.snapshot;

  const tenors = tab === "NGN" ? NGN_TENORS : USD_TENORS;
  const curve = tab === "NGN" ? snap.ngnCurve : snap.usdCurve;
  const params = tab === "NGN" ? snap.ngnNelsonSiegel : snap.usdNelsonSiegel;
  const hist = tab === "NGN" ? state.history.ngnCurve : state.history.usdCurve;

  const today = hist[hist.length - 1];
  const t30 = hist[Math.max(0, hist.length - 31)];
  const t90 = hist[0];

  const chartData = useMemo(() => {
    const fineTenors: number[] = [];
    for (let t = 0.1; t <= 30; t += 0.25)
      fineTenors.push(Math.round(t * 100) / 100);
    return fineTenors.map((t) => ({
      tenor: t,
      tenorLabel: t < 1 ? `${Math.round(t * 12)}M` : `${t}Y`,
      fit: nsYield(params, t) * 100,
    }));
  }, [params]);

  const observed = curve.map((p) => ({
    tenor: p.tenor,
    yield: p.yield * 100,
    label: fmtTenor(p.tenor),
  }));

  const compareData = tenors.map((t) => ({
    tenor: fmtTenor(t),
    today: (today.yields[t] ?? 0) * 100,
    "30d ago": (t30.yields[t] ?? 0) * 100,
    "90d ago": (t90.yields[t] ?? 0) * 100,
  }));

  const lastBps = (t: number) =>
    Math.round(((today.yields[t] ?? 0) - (t90.yields[t] ?? 0)) * 10000);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Yield Curve</h1>
          <p className="mt-1 text-sm text-gray-500">
            Nelson-Siegel calibrated · {tab} sovereign curve · as at {snap.asOf}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {(["NGN", "USD"] as CurrencyTab[]).map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === c
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:text-dark-gray"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            β0 (level)
          </p>
          <p className="mt-1 text-lg font-semibold text-dark-gray">
            {fmtPct(params.beta0, 2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            β1 (slope)
          </p>
          <p className="mt-1 text-lg font-semibold text-dark-gray">
            {params.beta1.toFixed(4)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            β2 (curvature)
          </p>
          <p className="mt-1 text-lg font-semibold text-dark-gray">
            {params.beta2.toFixed(4)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            t (decay)
          </p>
          <p className="mt-1 text-lg font-semibold text-dark-gray">
            {params.tau.toFixed(2)}
          </p>
        </div>
      </div>

      <SectionCard
        title="Fitted curve vs observed quotes"
        description="Continuous line = Nelson-Siegel · dots = observed FMDQ / DMO quotes"
      >
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis
                dataKey="tenor"
                type="number"
                domain={[0, 30]}
                tick={{ fontSize: 11 }}
                ticks={[0.25, 1, 2, 5, 10, 15, 20, 30]}
                tickFormatter={(v: number) => fmtTenor(v)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              />
              <Tooltip
                labelFormatter={(v) => `Tenor ${fmtTenor(Number(v))}`}
                formatter={(v, n) => [
                  `${Number(v ?? 0).toFixed(2)}%`,
                  n === "fit" ? "NS fit" : "Observed",
                ]}
              />
              <Line
                data={chartData}
                dataKey="fit"
                stroke={tab === "NGN" ? COLORS.ngn : COLORS.usd}
                strokeWidth={2.5}
                dot={false}
                name="fit"
              />
              <Line
                data={observed}
                dataKey="yield"
                stroke={tab === "NGN" ? COLORS.ngn : COLORS.usd}
                strokeWidth={0}
                dot={{ r: 4, strokeWidth: 1, fill: "#fff" }}
                name="observed"
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="Historical comparison: today vs 30d / 90d ago"
        description="Parallel and twist movements across the curve"
      >
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart
              data={compareData}
              margin={{ left: 4, right: 12, top: 8 }}
            >
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="tenor" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              />
              <Tooltip formatter={(v) => `${Number(v ?? 0).toFixed(2)}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="today"
                stroke={tab === "NGN" ? COLORS.ngn : COLORS.usd}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="30d ago"
                stroke={COLORS.amber}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="90d ago"
                stroke={COLORS.gray}
                strokeWidth={1.5}
                strokeDasharray="2 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="Tenor detail"
        description="Today's yields with 90-day change"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2">Tenor</th>
                <th className="px-3 py-2 text-right">Today</th>
                <th className="px-3 py-2 text-right">30d ago</th>
                <th className="px-3 py-2 text-right">90d ago</th>
                <th className="px-3 py-2 text-right">? 90d</th>
              </tr>
            </thead>
            <tbody>
              {tenors.map((t) => {
                const bps = lastBps(t);
                return (
                  <tr key={t} className="border-b border-border/60">
                    <td className="px-3 py-2 font-medium text-dark-gray">
                      {fmtTenor(t)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtPct(today.yields[t], 3)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {fmtPct(t30.yields[t], 3)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {fmtPct(t90.yields[t], 3)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${
                        bps > 0
                          ? "text-red-600"
                          : bps < 0
                            ? "text-emerald-600"
                            : "text-gray-500"
                      }`}
                    >
                      {fmtBps(bps)}
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
