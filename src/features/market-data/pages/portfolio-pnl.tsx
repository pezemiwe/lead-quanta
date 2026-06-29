import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { COLORS } from "../engine";
import { fmtCompactNGN, fmtPct, fmtShortDate } from "../utils";

export function MarketDataPortfolioPnl() {
  const { state } = useMarketData();
  const { history } = state;

  const data = history.portfolioPnl.map((d) => ({
    date: fmtShortDate(d.date),
    value: d.value / 1e9,
    pnl: d.pnl / 1e9,
  }));

  const first = history.portfolioPnl[0];
  const last = history.portfolioPnl[history.portfolioPnl.length - 1];
  const max = history.portfolioPnl.reduce(
    (m, p) => (p.pnl > m.pnl ? p : m),
    first,
  );
  const min = history.portfolioPnl.reduce(
    (m, p) => (p.pnl < m.pnl ? p : m),
    first,
  );
  const pctReturn = (last.value - first.value) / first.value;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Portfolio MTM & P&L Trajectory
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Mark-to-market value driven by NGN curve shifts · 90-day window
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current MTM"
          value={fmtCompactNGN(last.value)}
          subtitle={`From ${fmtCompactNGN(first.value)}`}
          icon={<Wallet className="h-4 w-4" />}
          variant="highlight"
        />
        <StatCard
          title="90-day P&L"
          value={fmtCompactNGN(last.pnl)}
          subtitle={`Return ${fmtPct(pctReturn, 2)}`}
          icon={
            last.pnl >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )
          }
          variant={last.pnl >= 0 ? "default" : "danger"}
        />
        <StatCard
          title="Peak gain"
          value={fmtCompactNGN(max.pnl)}
          subtitle={fmtShortDate(max.date)}
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <StatCard
          title="Trough"
          value={fmtCompactNGN(min.pnl)}
          subtitle={fmtShortDate(min.date)}
          icon={<ArrowDownRight className="h-4 w-4" />}
          variant={min.pnl < 0 ? "warning" : "default"}
        />
      </div>

      <SectionCard
        title="Portfolio value · 90-day"
        description="?B mark-to-market based on NGN curve revaluation"
      >
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.usd} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS.usd} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.ceil(data.length / 10)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `₦${v.toFixed(0)}B`}
                domain={["auto", "auto"]}
              />
              <Tooltip formatter={(v) => `₦${Number(v ?? 0).toFixed(2)}B`} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={COLORS.usd}
                fill="url(#vg)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="Cumulative P&L"
        description="Daily mark from base ?285B"
      >
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.ceil(data.length / 10)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `₦${v.toFixed(0)}B`}
              />
              <Tooltip formatter={(v) => `₦${Number(v ?? 0).toFixed(2)}B`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={COLORS.green}
                strokeWidth={2.5}
                dot={false}
                name="Cumulative P&L"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
