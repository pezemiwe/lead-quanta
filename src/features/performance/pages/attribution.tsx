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
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import {
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

interface SectorRow {
  sector: string;
  instruments: number;
  bsValueNGN: number;
  pctOfPortfolio: number;
  totalECL: number;
}

type Row = {
  bsValueNGN: number;
  sector: string;
  pctOfPortfolio: number;
  [key: string]: unknown;
};

export function Attribution() {
  const rows: Row[] = BOOK_COMPUTED.bySector
    .filter((s) => s.bsValueNGN > 0)
    .sort((a, b) => b.bsValueNGN - a.bsValueNGN) as unknown as Row[];

  const topSector = rows[0];
  const hhi = rows.reduce((s, r) => s + Math.pow(r.pctOfPortfolio, 2), 0);
  const concentration = hhi > 0.18 ? "High" : hhi > 0.1 ? "Moderate" : "Low";

  const cols: DataTableColumn<Row>[] = [
    { key: "sector", header: "Sector" },
    { key: "instruments", header: "# Instruments", align: "right" },
    {
      key: "bsValueNGN",
      header: "Book Value (NGN)",
      align: "right",
      render: (r) => (
        <span className="font-medium">{fmtCompact(r.bsValueNGN)}</span>
      ),
    },
    {
      key: "pctOfPortfolio",
      header: "Portfolio Weight",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm">{fmtPct(r.pctOfPortfolio)}</span>
          <div className="w-20 h-1.5 rounded-full bg-light-gray overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${r.pctOfPortfolio * 100 * 5}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Sector Attribution
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Portfolio weight by sector Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Sectors"
          value={String(rows.length)}
          subtitle="Distinct sectors in book"
          variant="highlight"
        />
        <StatCard
          title="Largest Sector"
          value={topSector?.sector ?? " "}
          subtitle={fmtPct(topSector?.pctOfPortfolio ?? 0) + " of portfolio"}
          variant="default"
        />
        <StatCard
          title="HHI Score"
          value={hhi.toFixed(4)}
          subtitle="Herfindahl index (lower = more diversified)"
          variant="default"
        />
        <StatCard
          title="Concentration"
          value={concentration}
          subtitle="Based on HHI threshold"
          variant={concentration === "High" ? "warning" : "default"}
        />
      </StatCardGrid>

      <SectionCard
        title="Sector Allocation Bar Chart"
        description="Book value weight across all sectors"
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="sector"
              tick={{ fontSize: 9 }}
              angle={-35}
              textAnchor="end"
              height={56}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) =>
                `${((v as number) * 100).toFixed(0)}%`
              }
            />
            <Tooltip
              formatter={
                ((v: number) => [`${(v * 100).toFixed(2)}%`, "Weight"]) as any
              }
              contentStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="pctOfPortfolio"
              fill="#C8102E"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Sector Detail" description="Breakdown table">
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.sector}
          emptyMessage="No sector data"
        />
      </SectionCard>
    </div>
  );
}
