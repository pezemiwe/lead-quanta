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
import { COLORS } from "../engine";
import { fmtPct, fmtTenor } from "../utils";

export function MarketDataSpreadAnalysis() {
  const { state } = useMarketData();
  const { snapshot } = state;

  const data = snapshot.spreads.map((s) => ({
    tenor: fmtTenor(s.tenor),
    NGN: s.ngn * 100,
    USD: s.usd * 100,
    Spread: s.spread * 100,
  }));

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          NGN vs USD Spread Analysis
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Sovereign yield differential by tenor · indicator of country risk
          premium
        </p>
      </div>

      <SectionCard
        title="Spread curve"
        description="NGN sovereign yield minus equivalent UST yield"
      >
        <div className="h-96">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="tenor" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              />
              <Tooltip formatter={(v) => `${Number(v ?? 0).toFixed(2)}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Spread" fill={COLORS.amber} barSize={28} />
              <Line
                type="monotone"
                dataKey="NGN"
                stroke={COLORS.ngn}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="USD"
                stroke={COLORS.usd}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Spread table">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2">Tenor</th>
                <th className="px-3 py-2 text-right">NGN</th>
                <th className="px-3 py-2 text-right">USD (UST)</th>
                <th className="px-3 py-2 text-right">Spread</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.spreads.map((s) => (
                <tr key={s.tenor} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium text-dark-gray">
                    {fmtTenor(s.tenor)}
                  </td>
                  <td className="px-3 py-2 text-right">{fmtPct(s.ngn, 3)}</td>
                  <td className="px-3 py-2 text-right">{fmtPct(s.usd, 3)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-amber-700">
                    {fmtPct(s.spread, 3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
