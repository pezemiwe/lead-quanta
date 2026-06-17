import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

const COLORS = [
  "#C8102E",
  "#E85C75",
  "#FF9B9B",
  "#FFC5C5",
  "#1E3A5F",
  "#2563EB",
  "#60A5FA",
  "#BFDBFE",
];

function fmtAxis(v: number) {
  if (v >= 1e9) return `?${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `?${(v / 1e6).toFixed(0)}M`;
  return `?${v.toFixed(0)}`;
}

export function PerformanceDashboard() {
  const { totals, byType, bySector, byClassification, income } = BOOK_COMPUTED;

  // Weighted portfolio yield
  const weightedYield = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const v of BOOK_COMPUTED.valuations) {
      if (v.marketYieldUsed > 0) {
        const w = v.balanceSheetValueNGN;
        weightedSum += v.marketYieldUsed * w;
        totalWeight += w;
      }
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, []);

  // Weighted duration
  const weightedDuration = useMemo(() => {
    let dSum = 0;
    let dWeight = 0;
    for (const v of BOOK_COMPUTED.valuations) {
      if (v.risk.modifiedDuration > 0) {
        const w = v.balanceSheetValueNGN;
        dSum += v.risk.modifiedDuration * w;
        dWeight += w;
      }
    }
    return dWeight > 0 ? dSum / dWeight : 0;
  }, []);

  const totalOCI = BOOK_COMPUTED.totals.totalOCIReserveNGN;
  const totalFVTPL = BOOK_COMPUTED.totals.totalFVTPLUnrealisedGLNGN;
  const totalPnL = totalOCI + totalFVTPL;

  const pieData = byClassification.map((b) => ({
    name: b.classification,
    value: b.bsValueNGN,
  }));

  const typeData = byType
    .filter((t) => t.bsValueNGN > 0)
    .sort((a, b) => b.bsValueNGN - a.bsValueNGN)
    .slice(0, 10);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Performance Dashboard
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Portfolio Management book · {BOOK_INSTRUMENTS.length} instruments ·
          Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Book Value"
          value={fmtCompact(totals.totalBSValueNGN)}
          subtitle="Balance-sheet carrying amount (NGN)"
          variant="highlight"
        />
        <StatCard
          title="Weighted Portfolio Yield"
          value={fmtPct(weightedYield)}
          subtitle="Market-yield weighted average"
          variant="default"
        />
        <StatCard
          title="Weighted Mod. Duration"
          value={weightedDuration.toFixed(2) + " yrs"}
          subtitle="Interest rate sensitivity"
          variant="default"
        />
        <StatCard
          title="Total P&L / OCI"
          value={fmtCompact(Math.abs(totalPnL))}
          subtitle={
            totalPnL >= 0 ? "Net unrealised gain" : "Net unrealised loss"
          }
          variant={totalPnL >= 0 ? "default" : "warning"}
        />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Classification donut */}
        <SectionCard
          title="Portfolio by Classification"
          description="IFRS 9 measurement category breakdown"
        >
          <div className="mt-2 space-y-3">
            {byClassification.map((b, i) => (
              <div key={b.classification} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-dark-gray">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <Badge
                      variant={
                        b.classification === "AC"
                          ? "info"
                          : b.classification === "FVOCI"
                            ? "success"
                            : "warning"
                      }
                      size="sm"
                    >
                      {b.classification}
                    </Badge>
                    <span className="text-xs text-dark-gray/55">
                      {b.count} instruments
                    </span>
                  </span>
                  <span className="text-xs font-medium text-dark-gray/70">
                    {fmtCompact(b.bsValueNGN)}{" "}
                    {fmtPct(b.bsValueNGN / totals.totalBSValueNGN)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-light-gray overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(b.bsValueNGN / totals.totalBSValueNGN) * 100}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* By type */}
        <SectionCard
          title="Exposure by Instrument Type"
          description="Book value by asset type (top 10)"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={typeData}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={fmtAxis}
              />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 10 }}
                width={110}
              />
              <Tooltip
                formatter={
                  ((v: number) => [
                    fmtCompact(v as number),
                    "Book Value",
                  ]) as any
                }
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="bsValueNGN" fill="#C8102E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Income summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="AC Portfolio"
          description="Amortised cost instruments"
        >
          <div className="space-y-3 mt-2">
            <Row label="Instruments" value={String(income.ac.instruments)} />
            <Row
              label="Carrying Value"
              value={fmtCompact(income.ac.totalCarryingValueNGN)}
            />
            <Row
              label="Accrued Interest"
              value={fmtCompact(income.ac.totalAccruedInterestNGN)}
            />
            <Row
              label="ECL Provision"
              value={fmtCompact(income.ac.totalECLNGN)}
              bold
            />
          </div>
        </SectionCard>
        <SectionCard
          title="FVOCI Portfolio"
          description="Fair value through OCI"
        >
          <div className="space-y-3 mt-2">
            <Row label="Instruments" value={String(income.fvoci.instruments)} />
            <Row
              label="AC Carrying Value"
              value={fmtCompact(income.fvoci.totalACCarryingValueNGN)}
            />
            <Row
              label="Fair Value"
              value={fmtCompact(income.fvoci.totalFairValueNGN)}
            />
            <Row
              label="OCI Reserve"
              value={fmtCompact(income.fvoci.totalOCIReserveNGN)}
              bold
            />
          </div>
        </SectionCard>
        <SectionCard
          title="FVTPL Portfolio"
          description="Fair value through P&L"
        >
          <div className="space-y-3 mt-2">
            <Row label="Instruments" value={String(income.fvtpl.instruments)} />
            <Row
              label="Fair Value"
              value={fmtCompact(income.fvtpl.totalFairValueNGN)}
            />
            <Row
              label="Unrealised G/(L)"
              value={fmtCompact(income.fvtpl.totalUnrealisedGLNGN)}
              bold
              pos={income.fvtpl.totalUnrealisedGLNGN >= 0}
            />
          </div>
        </SectionCard>
      </div>

      {/* Sector bar */}
      <SectionCard
        title="Sector Allocation"
        description="Portfolio weight by sector"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={BOOK_COMPUTED.bySector.slice(0, 12)}
            margin={{ left: 0, right: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="sector"
              tick={{ fontSize: 9 }}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              formatter={
                ((v: number) => [`${(v * 100).toFixed(2)}%`, "Weight"]) as any
              }
              contentStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="pctOfPortfolio"
              fill="#1E3A5F"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  pos,
}: {
  label: string;
  value: string;
  bold?: boolean;
  pos?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-dark-gray/60">{label}</span>
      <span
        className={
          bold
            ? pos === false
              ? "font-semibold text-primary"
              : pos === true
                ? "font-semibold text-emerald-600"
                : "font-semibold text-dark-gray"
            : "text-dark-gray"
        }
      >
        {value}
      </span>
    </div>
  );
}
