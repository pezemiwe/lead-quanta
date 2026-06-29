import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { Badge } from "../../../components/shared/badge";
import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

const totals = BOOK_COMPUTED.totals;

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-border py-2 text-sm last:border-0">
      <span className="text-dark-gray/60">{label}</span>
      <span
        className={bold ? "font-semibold text-dark-gray" : "text-dark-gray"}
      >
        {value}
      </span>
    </div>
  );
}

export function ReportingDashboard() {
  const maturityData = BOOK_COMPUTED.maturityProfile.map((m) => ({
    bucket: m.bucket,
    faceValue: m.faceValueNGN,
    count: m.count,
  }));

  const byClass = BOOK_COMPUTED.byClassification;
  const bySector = BOOK_COMPUTED.bySector.slice(0, 8);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Executive Summary
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Investment portfolio overview {BOOK_INSTRUMENTS.length} instruments
          Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Portfolio Value"
          value={fmtCompact(totals.totalBSValueNGN)}
          subtitle="Balance-sheet carrying amount (NGN)"
          variant="highlight"
        />
        <StatCard
          title="Total Face Value"
          value={fmtCompact(totals.totalFaceValueNGN)}
          subtitle="Notional amount"
          variant="default"
        />
        <StatCard
          title="OCI Reserve"
          value={fmtCompact(totals.totalOCIReserveNGN)}
          subtitle="Unrealised fair value movements"
          variant="warning"
        />
        <StatCard
          title="Net OCI + FVTPL"
          value={fmtCompact(
            Math.abs(
              totals.totalOCIReserveNGN + totals.totalFVTPLUnrealisedGLNGN,
            ),
          )}
          subtitle="Total fair value movements"
          variant="default"
        />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Portfolio summary */}
        <SectionCard
          title="Portfolio Snapshot"
          description="Key metrics as at valuation date"
        >
          <div className="mt-1">
            <SummaryRow
              label="Total instruments"
              value={String(totals.instruments)}
              bold
            />
            <SummaryRow
              label="Total face value"
              value={fmtCompact(totals.totalFaceValueNGN)}
            />
            <SummaryRow
              label="Total carrying value (NGN)"
              value={fmtCompact(totals.totalBSValueNGN)}
              bold
            />
            <SummaryRow
              label="FVTPL unrealised G/L"
              value={fmtCompact(totals.totalFVTPLUnrealisedGLNGN)}
            />
            <SummaryRow
              label="OCI reserve (FVOCI)"
              value={fmtCompact(totals.totalOCIReserveNGN)}
            />
            <SummaryRow
              label="Unrealised G/L (FVTPL)"
              value={fmtCompact(totals.totalFVTPLUnrealisedGLNGN)}
            />
          </div>
        </SectionCard>

        {/* Classification */}
        <SectionCard
          title="IFRS 9 Classification"
          description="By measurement category"
        >
          <div className="mt-1 space-y-3">
            {byClass.map((b) => (
              <div key={b.classification}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
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
                    <span className="text-dark-gray/55 text-xs">
                      {b.count} instruments
                    </span>
                  </span>
                  <span className="text-xs font-medium">
                    {fmtCompact(b.bsValueNGN)}{" "}
                    {fmtPct(b.bsValueNGN / totals.totalBSValueNGN)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-light-gray overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(b.bsValueNGN / totals.totalBSValueNGN) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Maturity profile */}
      <SectionCard
        title="Maturity Profile"
        description="Face value by maturity bucket"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={maturityData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `₦${(v / 1e9).toFixed(1)}B`}
            />
            <Tooltip
              formatter={
                ((v: number) => [fmtCompact(v as number), "Face Value"]) as any
              }
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="faceValue" fill="#C8102E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Sector */}
      <SectionCard title="Top Sectors" description="By portfolio weight">
        <div className="space-y-2 mt-2">
          {bySector.map((s) => (
            <div key={s.sector} className="flex items-center gap-3 text-sm">
              <span className="w-40 truncate text-dark-gray/70 text-xs">
                {s.sector}
              </span>
              <div className="flex-1 h-2 rounded-full bg-light-gray overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, s.pctOfPortfolio * 100 * 5)}%`,
                  }}
                />
              </div>
              <span className="w-14 text-right text-xs font-medium">
                {fmtPct(s.pctOfPortfolio)}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
