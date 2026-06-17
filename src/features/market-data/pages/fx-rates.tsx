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
import { StatCard } from "../../../components/shared/stat-card";
import { Coins } from "lucide-react";
import { COLORS } from "../engine";
import { fmtFx, fmtShortDate } from "../utils";

const PAIRS = [
  { code: "USD-NGN", label: "US Dollar", color: COLORS.ngn },
  { code: "EUR-NGN", label: "Euro", color: COLORS.usd },
  { code: "GBP-NGN", label: "Pound Sterling", color: COLORS.purple },
];

export function MarketDataFx() {
  const { state } = useMarketData();
  const { snapshot, history } = state;
  const data = history.fx.map((d) => ({
    date: fmtShortDate(d.date),
    "USD-NGN": d.rates["USD-NGN"],
    "EUR-NGN": d.rates["EUR-NGN"],
    "GBP-NGN": d.rates["GBP-NGN"],
  }));

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">FX Rates</h1>
        <p className="mt-1 text-sm text-gray-500">
          90-day Naira cross history · CBN Investors' & Exporters' window
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PAIRS.map((p) => {
          const today = snapshot.fx.find((f) => f.pair === p.code)!;
          const start = history.fx[0].rates[p.code];
          const pct = ((today.rate - start) / start) * 100;
          return (
            <StatCard
              key={p.code}
              title={`${p.code.slice(0, 3)} / NGN`}
              value={`?${fmtFx(today.rate)}`}
              subtitle={`${p.label} · 90-day ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
              icon={<Coins className="h-4 w-4" />}
              trend={{
                direction: pct > 0 ? "up" : pct < 0 ? "down" : "neutral",
                label: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
              }}
            />
          );
        })}
      </div>

      <SectionCard
        title="FX rates · 90-day history"
        description="All quotes expressed as NGN per unit of foreign currency"
      >
        <div className="h-96">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.ceil(data.length / 10)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `?${v.toFixed(0)}`}
              />
              <Tooltip formatter={(v) => `?${fmtFx(Number(v ?? 0))}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {PAIRS.map((p) => (
                <Line
                  key={p.code}
                  type="monotone"
                  dataKey={p.code}
                  stroke={p.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
