import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMarketData } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { Activity, Percent } from "lucide-react";
import { COLORS } from "../engine";
import { fmtPct } from "../utils";

export function MarketDataInflationMpr() {
  const { state } = useMarketData();
  const { snapshot, history } = state;

  const data = history.inflationMpr.map((d) => ({
    date: d.date,
    CPI: d.cpi * 100,
    MPR: d.mpr * 100,
    Real: (d.mpr - d.cpi) * 100,
  }));

  const realRate = snapshot.mpr - snapshot.inflation;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Inflation & Monetary Policy Rate
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Nigerian CPI vs CBN MPR · 12-month trend
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="CPI Inflation (y/y)"
          value={fmtPct(snapshot.inflation, 2)}
          subtitle="NBS — latest print"
          icon={<Percent className="h-4 w-4" />}
          variant="highlight"
        />
        <StatCard
          title="CBN MPR"
          value={fmtPct(snapshot.mpr, 2)}
          subtitle="Monetary Policy Rate"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Real Policy Rate"
          value={`${realRate >= 0 ? "+" : ""}${fmtPct(realRate, 2)}`}
          subtitle={
            realRate >= 0
              ? "Positive — restrictive policy stance"
              : "Negative — accommodative in real terms"
          }
          icon={<Percent className="h-4 w-4" />}
          variant={realRate < 0 ? "warning" : "default"}
        />
      </div>

      <SectionCard
        title="CPI vs MPR · 12-month series"
        description="Bars = CPI inflation · Lines = MPR and real policy rate"
      >
        <div className="h-96">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              />
              <Tooltip formatter={(v) => `${Number(v ?? 0).toFixed(2)}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="CPI"
                fill={COLORS.ngn}
                barSize={20}
                opacity={0.85}
              />
              <Line
                type="monotone"
                dataKey="MPR"
                stroke={COLORS.usd}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Real"
                stroke={COLORS.amber}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
