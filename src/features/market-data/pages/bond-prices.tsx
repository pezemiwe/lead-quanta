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
import { BOND_UNIVERSE, COLORS } from "../engine";
import { fmtBps, fmtPct, fmtShortDate } from "../utils";

const PALETTE = [
  COLORS.ngn,
  COLORS.usd,
  COLORS.green,
  COLORS.amber,
  COLORS.purple,
  COLORS.blue,
];

export function MarketDataBondPrices() {
  const { state } = useMarketData();
  const { history, snapshot } = state;
  const data = history.bondPrices.map((d) => {
    const row: Record<string, number | string> = { date: fmtShortDate(d.date) };
    for (const b of BOND_UNIVERSE) row[b.id] = d.prices[b.id];
    return row;
  });

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Bond Prices & Quotes
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          FGN bonds & corporate selection · clean prices per ?100 face · 90-day
          history
        </p>
      </div>

      <SectionCard title="Live quotes" description={`As at ${snapshot.asOf}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2">Bond</th>
                <th className="px-3 py-2 text-right">Yield</th>
                <th className="px-3 py-2 text-right">Clean Price</th>
                <th className="px-3 py-2 text-right">? 1d</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.bonds.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="px-3 py-2">
                    <p className="font-medium text-dark-gray">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.id}</p>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {fmtPct(b.yield, 3)}
                  </td>
                  <td className="px-3 py-2 text-right">{b.price.toFixed(2)}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      b.changeBps > 0
                        ? "text-emerald-600"
                        : b.changeBps < 0
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {fmtBps(b.changeBps)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Price history"
        description="Clean price (?) per 100 face · 90-day series"
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
                tickFormatter={(v: number) => v.toFixed(0)}
                domain={["auto", "auto"]}
              />
              <Tooltip formatter={(v) => Number(v ?? 0).toFixed(2)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {BOND_UNIVERSE.map((b, i) => (
                <Line
                  key={b.id}
                  type="monotone"
                  dataKey={b.id}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={1.8}
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
