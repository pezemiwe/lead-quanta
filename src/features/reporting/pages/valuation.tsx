import { useMemo } from "react";
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
  fmtDate,
} from "../../portfolio/engine/book-compute";

interface L1Row {
  level: "Level 1";
  type: string;
  count: number;
  fairValue: number;
  pct: number;
}
interface L2Row {
  level: "Level 2";
  type: string;
  count: number;
  fairValue: number;
  pct: number;
}
interface L3Row {
  level: "Level 3";
  type: string;
  count: number;
  fairValue: number;
  pct: number;
}
type HierarchyRow = (L1Row | L2Row | L3Row) & Record<string, unknown>;

const LEVEL_LABEL: Record<string, string> = {
  1: "Level 1 — Quoted prices in active markets",
  2: "Level 2 — Observable inputs",
  3: "Level 3 — Unobservable inputs",
};

export function ValuationReport() {
  const { l1, l2, l3, totalFV } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );

    type AggRow = {
      level: string;
      type: string;
      count: number;
      fairValue: number;
      pct: number;
    };
    const byTypeLevel = new Map<string, AggRow>();

    for (const inst of BOOK_INSTRUMENTS) {
      const levelKey = String(inst.ifrs13Level);
      const key = `${levelKey}|${inst.instrumentType}`;
      const val = valMap.get(inst.id);
      const fv = val?.cleanFairValue ?? inst.purchasePrice;
      const existing = byTypeLevel.get(key);
      if (existing) {
        existing.count++;
        existing.fairValue += fv;
      } else {
        byTypeLevel.set(key, {
          level: `Level ${levelKey}`,
          type: inst.instrumentType,
          count: 1,
          fairValue: fv,
          pct: 0,
        });
      }
    }

    const all = Array.from(byTypeLevel.values());
    const total = all.reduce((s, r) => s + r.fairValue, 0);
    all.forEach((r) => (r.pct = r.fairValue / total));

    return {
      l1: all
        .filter((r) => r.level === "Level 1")
        .sort((a, b) => b.fairValue - a.fairValue) as HierarchyRow[],
      l2: all
        .filter((r) => r.level === "Level 2")
        .sort((a, b) => b.fairValue - a.fairValue) as HierarchyRow[],
      l3: all
        .filter((r) => r.level === "Level 3")
        .sort((a, b) => b.fairValue - a.fairValue) as HierarchyRow[],
      totalFV: total,
    };
  }, []);

  const l1Total = l1.reduce((s, r) => s + r.fairValue, 0);
  const l2Total = l2.reduce((s, r) => s + r.fairValue, 0);
  const l3Total = l3.reduce((s, r) => s + r.fairValue, 0);

  const cols: DataTableColumn<HierarchyRow>[] = [
    {
      key: "level",
      header: "IFRS 13 Level",
      render: (r) => (
        <Badge
          variant={
            r.level === "Level 1"
              ? "success"
              : r.level === "Level 2"
                ? "info"
                : "warning"
          }
          size="sm"
        >
          {r.level}
        </Badge>
      ),
    },
    { key: "type", header: "Instrument Type" },
    { key: "count", header: "# Instruments", align: "right" },
    {
      key: "fairValue",
      header: "Fair Value (NGN)",
      align: "right",
      render: (r) => (
        <span className="font-semibold">{fmtCompact(r.fairValue)}</span>
      ),
    },
    {
      key: "pct",
      header: "% of Portfolio FV",
      align: "right",
      render: (r) => fmtPct(r.pct),
    },
  ];

  const allRows: HierarchyRow[] = [...l1, ...l2, ...l3];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Fair Value Hierarchy Report
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          IFRS 13 fair value hierarchy disclosure · Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Portfolio Fair Value"
          value={fmtCompact(totalFV)}
          subtitle="Aggregate DCF fair values (NGN)"
          variant="highlight"
        />
        <StatCard
          title="Level 1"
          value={fmtCompact(l1Total)}
          subtitle={fmtPct(l1Total / totalFV) + " · Quoted market prices"}
          variant="default"
        />
        <StatCard
          title="Level 2"
          value={fmtCompact(l2Total)}
          subtitle={fmtPct(l2Total / totalFV) + " · Observable inputs"}
          variant="default"
        />
        <StatCard
          title="Level 3"
          value={fmtCompact(l3Total)}
          subtitle={fmtPct(l3Total / totalFV) + " · Unobservable inputs"}
          variant="warning"
        />
      </StatCardGrid>

      <SectionCard
        title="Fair Value Hierarchy — All Instruments"
        description="IFRS 13 Level 1, 2 and 3 breakdown by instrument type"
      >
        <DataTable<HierarchyRow>
          columns={cols}
          data={allRows}
          keyExtractor={(r) => `${r.level}|${r.type}`}
          emptyMessage="No valuation data"
        />
      </SectionCard>
    </div>
  );
}
