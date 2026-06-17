import { useMemo } from "react";
import { Users } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

interface CounterpartyRow {
  rank: number;
  issuer: string;
  instruments: number;
  sector: string;
  faceValue: number;
  bsValue: number;
  pct: number;
  classifications: string;
}

type Row = CounterpartyRow & Record<string, unknown>;

export function Counterparties() {
  const { rows, totalBS } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );
    const issuerMap = new Map<string, CounterpartyRow>();
    const grandTotal = BOOK_COMPUTED.totals.totalBSValueNGN;

    for (const inst of BOOK_INSTRUMENTS) {
      const val = valMap.get(inst.id);
      const bsValue = val?.balanceSheetValueNGN ?? inst.purchasePrice;
      const existing = issuerMap.get(inst.issuer);
      if (existing) {
        existing.instruments += 1;
        existing.faceValue += inst.faceValue;
        existing.bsValue += bsValue;
        if (!existing.classifications.includes(inst.classification)) {
          existing.classifications += `, ${inst.classification}`;
        }
      } else {
        issuerMap.set(inst.issuer, {
          rank: 0,
          issuer: inst.issuer,
          instruments: 1,
          sector: inst.sector,
          faceValue: inst.faceValue,
          bsValue,
          pct: 0,
          classifications: inst.classification,
        });
      }
    }

    const sorted = Array.from(issuerMap.values())
      .map((r) => ({ ...r, pct: r.bsValue / grandTotal }))
      .sort((a, b) => b.bsValue - a.bsValue)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    return {
      rows: sorted as Row[],
      totalBS: grandTotal,
    };
  }, []);

  const topFive = rows.slice(0, 5).reduce((s, r) => s + r.bsValue, 0);

  const cols: DataTableColumn<Row>[] = [
    { key: "rank", header: "#", width: "50px" },
    { key: "issuer", header: "Counterparty / Issuer" },
    { key: "sector", header: "Sector" },
    {
      key: "instruments",
      header: "# Instruments",
      align: "right",
    },
    {
      key: "classifications",
      header: "Classifications",
      render: (r) => (
        <span className="font-mono text-xs text-dark-gray/80">
          {r.classifications}
        </span>
      ),
    },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "bsValue",
      header: "Book Value (NGN)",
      align: "right",
      render: (r) => (
        <span className="font-medium text-dark-gray">
          {fmtCompact(r.bsValue)}
        </span>
      ),
    },
    {
      key: "pct",
      header: "Portfolio %",
      align: "right",
      render: (r) => {
        const pct = (r.pct as number) * 100;
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs font-medium">{fmtPct(r.pct)}</span>
            <div className="w-16 h-1.5 rounded-full bg-light-gray overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(100, pct * 5)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Counterparties
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Exposure aggregated by issuer / counterparty across {rows.length}{" "}
          distinct counterparties
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Distinct Counterparties"
          value={String(rows.length)}
          subtitle="Unique issuers in book"
          variant="highlight"
        />
        <StatCard
          title="Largest Counterparty"
          value={fmtCompact(rows[0]?.bsValue ?? 0)}
          subtitle={rows[0]?.issuer ?? "—"}
          variant="default"
        />
        <StatCard
          title="Top-5 Concentration"
          value={fmtPct(topFive / totalBS)}
          subtitle="Share of total book"
          variant="warning"
        />
        <StatCard
          title="Total Book Value"
          value={fmtCompact(totalBS)}
          subtitle="All counterparties combined"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Counterparty Exposure"
        description="Ranked by balance-sheet book value"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.issuer}
          emptyMessage="No counterparty data"
        />
      </SectionCard>
    </div>
  );
}
