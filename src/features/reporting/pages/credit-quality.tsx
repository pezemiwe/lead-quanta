import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

/* ── Credit rating model ───────────────────────────────── */
type RatingBand = "Sovereign" | "AAA" | "AA" | "A" | "BBB" | "Sub-IG" | "Unrated";

const RATING_BAND_COLOR: Record<RatingBand, string> = {
  Sovereign: "#0f766e",
  AAA: "#1d4ed8",
  AA: "#0891b2",
  A: "#65a30d",
  BBB: "#d97706",
  "Sub-IG": "#dc2626",
  Unrated: "#9ca3af",
};

const RATING_BADGE_CLASS: Record<RatingBand, string> = {
  Sovereign: "bg-teal-50 text-teal-700",
  AAA: "bg-blue-50 text-blue-700",
  AA: "bg-cyan-50 text-cyan-700",
  A: "bg-green-50 text-green-700",
  BBB: "bg-amber-50 text-amber-700",
  "Sub-IG": "bg-red-50 text-red-700",
  Unrated: "bg-gray-100 text-gray-500",
};

function ratingBandForSector(sector: string, issuer: string): RatingBand {
  if (sector === "Sovereign" || issuer.startsWith("FGN") || issuer === "CBN / FGN") return "Sovereign";
  if (sector === "Government") return "AA";
  if (["GTBank", "Zenith Bank", "Access Bank", "UBA", "Stanbic IBTC"].includes(issuer)) return "A";
  if (["FCMB", "Polaris Bank", "Wema Bank", "First Bank", "FBNH"].includes(issuer)) return "BBB";
  if (sector === "Money Market" || sector === "Collective Investment") return "A";
  if (sector === "Industrials" || sector === "Telecoms") return "BBB";
  if (sector === "Energy") return "BBB";
  if (sector === "FMCG") return "A";
  if (sector === "Banking") return "A";
  return "BBB";
}

interface RatingRow {
  band: RatingBand;
  count: number;
  faceValue: number;
  bsValue: number;
  pctOfPortfolio: number;
}

interface WatchRow {
  id: string;
  name: string;
  type: string;
  issuer: string;
  rating: RatingBand;
  bsValue: number;
  reason: string;
}

type RatingRowExt = RatingRow & Record<string, unknown>;
type WatchRowExt = WatchRow & Record<string, unknown>;

export function CreditQualityReport() {
  const { ratingRows, watchList, totalIG, totalSovereign, totalBSValue, sectorRows } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );

    const bandAgg: Record<RatingBand, { count: number; faceValue: number; bsValue: number }> = {
      Sovereign: { count: 0, faceValue: 0, bsValue: 0 },
      AAA: { count: 0, faceValue: 0, bsValue: 0 },
      AA: { count: 0, faceValue: 0, bsValue: 0 },
      A: { count: 0, faceValue: 0, bsValue: 0 },
      BBB: { count: 0, faceValue: 0, bsValue: 0 },
      "Sub-IG": { count: 0, faceValue: 0, bsValue: 0 },
      Unrated: { count: 0, faceValue: 0, bsValue: 0 },
    };

    const sectorAgg: Record<string, number> = {};
    const watchItems: WatchRow[] = [];
    const total = BOOK_COMPUTED.totals.totalBSValueNGN;

    for (const inst of BOOK_INSTRUMENTS) {
      const val = valMap.get(inst.id);
      const bsValue = val?.balanceSheetValueNGN ?? inst.purchasePrice;
      const band = ratingBandForSector(inst.sector, inst.issuer);

      bandAgg[band].count++;
      bandAgg[band].faceValue += inst.faceValue;
      bandAgg[band].bsValue += bsValue;

      sectorAgg[inst.sector] = (sectorAgg[inst.sector] ?? 0) + bsValue;

      if (band === "BBB" && bsValue > 50_000_000) {
        watchItems.push({
          id: inst.id,
          name: inst.name,
          type: inst.instrumentType,
          issuer: inst.issuer,
          rating: band,
          bsValue,
          reason: "Lower investment grade — monitor for downgrade",
        });
      }
    }

    const rows: RatingRow[] = (Object.keys(bandAgg) as RatingBand[])
      .filter((b) => bandAgg[b].count > 0)
      .map((b) => ({
        band: b,
        count: bandAgg[b].count,
        faceValue: bandAgg[b].faceValue,
        bsValue: bandAgg[b].bsValue,
        pctOfPortfolio: total > 0 ? bandAgg[b].bsValue / total : 0,
      }));

    const igBands: RatingBand[] = ["Sovereign", "AAA", "AA", "A", "BBB"];
    const totalIG = rows
      .filter((r) => igBands.includes(r.band))
      .reduce((s, r) => s + r.bsValue, 0);
    const totalSovereign = bandAgg["Sovereign"].bsValue;

    const sectorRows = Object.entries(sectorAgg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([sector, value]) => ({ sector, value }));

    return {
      ratingRows: rows as RatingRowExt[],
      watchList: watchItems.sort((a, b) => b.bsValue - a.bsValue).slice(0, 10) as WatchRowExt[],
      totalIG,
      totalSovereign,
      totalBSValue: total,
      sectorRows,
    };
  }, []);

  const ratingCols: DataTableColumn<RatingRowExt>[] = [
    {
      key: "band",
      header: "Rating Band",
      render: (r) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RATING_BADGE_CLASS[r.band as RatingBand]}`}>
          {r.band}
        </span>
      ),
    },
    { key: "count", header: "# Instruments", align: "right" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "bsValue",
      header: "Book Value",
      align: "right",
      render: (r) => <span className="font-semibold">{fmtCompact(r.bsValue)}</span>,
    },
    {
      key: "pctOfPortfolio",
      header: "Portfolio %",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(r.pctOfPortfolio * 100, 100)}%`,
                background: RATING_BAND_COLOR[r.band as RatingBand],
              }}
            />
          </div>
          <span>{fmtPct(r.pctOfPortfolio)}</span>
        </div>
      ),
    },
  ];

  const watchCols: DataTableColumn<WatchRowExt>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument" },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge variant="neutral" size="sm">{r.type}</Badge>,
    },
    { key: "issuer", header: "Issuer" },
    {
      key: "rating",
      header: "Rating",
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RATING_BADGE_CLASS[r.rating as RatingBand]}`}>
          {r.rating}
        </span>
      ),
    },
    {
      key: "bsValue",
      header: "Book Value",
      align: "right",
      render: (r) => fmtCompact(r.bsValue),
    },
    {
      key: "reason",
      header: "Watch Reason",
      render: (r) => <span className="text-xs text-amber-700">{r.reason}</span>,
    },
  ];

  const pieData = (Object.keys(RATING_BAND_COLOR) as RatingBand[])
    .map((b) => ({ name: b, value: (ratingRows as RatingRow[]).find((r) => r.band === b)?.bsValue ?? 0 }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Credit Quality Analysis
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Portfolio credit quality breakdown by rating band and sector · As at 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Investment Grade %"
          value={fmtPct(totalBSValue > 0 ? totalIG / totalBSValue : 0)}
          subtitle="Sovereign through BBB"
          variant="highlight"
        />
        <StatCard
          title="Sovereign Holdings"
          value={fmtCompact(totalSovereign)}
          subtitle="FGN bonds and T-Bills"
          variant="default"
        />
        <StatCard
          title="Total Portfolio"
          value={fmtCompact(totalBSValue)}
          subtitle="Book value (NGN)"
          variant="default"
        />
        <StatCard
          title="Watch List Items"
          value={String(watchList.length)}
          subtitle="BBB or below — monitor"
          variant="warning"
        />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SectionCard title="Rating Distribution" description="Portfolio split by credit quality band">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={RATING_BAND_COLOR[entry.name as RatingBand]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => fmtCompact(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1 text-xs text-dark-gray/70">
                  <span className="h-2 w-2 rounded-full" style={{ background: RATING_BAND_COLOR[d.name as RatingBand] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard title="Sector Concentration" description="Book value by sector">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorRows} layout="vertical" margin={{ left: 16, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => fmtCompact(v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v: unknown) => fmtCompact(Number(v))} />
                  <Bar dataKey="value" fill="#F7941D" radius={[0, 4, 4, 0]} name="Book Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Rating Band Summary" description="Portfolio breakdown by credit rating classification">
        <DataTable<RatingRowExt>
          columns={ratingCols}
          data={ratingRows}
          keyExtractor={(r) => r.band}
          emptyMessage="No rating data"
        />
      </SectionCard>

      <SectionCard
        title="Credit Watch List"
        description="Instruments at BBB or below warranting active monitoring"
      >
        <DataTable<WatchRowExt>
          columns={watchCols}
          data={watchList}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments on watch list"
        />
      </SectionCard>
    </div>
  );
}
