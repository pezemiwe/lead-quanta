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
} from "../../portfolio/engine/book-compute";

interface StagingRow {
  stage: string;
  count: number;
  faceValue: number;
  bsValue: number;
  ecl: number;
  coverageRatio: number;
  pctOfPortfolio: number;
}

interface InstrumentRow {
  id: string;
  name: string;
  type: string;
  stage: string;
  faceValue: number;
  bsValue: number;
  ecl: number;
  eclRate: number;
}

type StagRow = StagingRow & Record<string, unknown>;
type InstRow = InstrumentRow & Record<string, unknown>;

export function IFRS9Disclosures() {
  const {
    stagingRows,
    stage23rows,
    totalECL,
    totalExposure,
    stage1Count,
    stage2Count,
    stage3Count,
  } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );
    type Agg = {
      count: number;
      faceValue: number;
      bsValue: number;
      ecl: number;
    };
    const agg: Record<string, Agg> = {
      "Stage 1": { count: 0, faceValue: 0, bsValue: 0, ecl: 0 },
      "Stage 2": { count: 0, faceValue: 0, bsValue: 0, ecl: 0 },
      "Stage 3": { count: 0, faceValue: 0, bsValue: 0, ecl: 0 },
    };
    const instRows: InstrumentRow[] = [];

    for (const inst of BOOK_INSTRUMENTS) {
      const stage = inst.impairmentStage ?? "Stage 1";
      const val = valMap.get(inst.id);
      const ecl = val?.instrument.eclProvision ?? 0;
      const bsValue = val?.balanceSheetValueNGN ?? inst.purchasePrice;
      if (agg[stage]) {
        agg[stage].count++;
        agg[stage].faceValue += inst.faceValue;
        agg[stage].bsValue += bsValue;
        agg[stage].ecl += ecl;
      }
      if (stage !== "Stage 1") {
        instRows.push({
          id: inst.id,
          name: inst.name,
          type: inst.instrumentType,
          stage,
          faceValue: inst.faceValue,
          bsValue,
          ecl,
          eclRate: inst.faceValue > 0 ? ecl / inst.faceValue : 0,
        });
      }
    }

    const totalBS = BOOK_COMPUTED.totals.totalBSValueNGN;
    const staging: StagingRow[] = (
      ["Stage 1", "Stage 2", "Stage 3"] as const
    ).map((s) => ({
      stage: s,
      count: agg[s].count,
      faceValue: agg[s].faceValue,
      bsValue: agg[s].bsValue,
      ecl: agg[s].ecl,
      coverageRatio: agg[s].bsValue > 0 ? agg[s].ecl / agg[s].bsValue : 0,
      pctOfPortfolio: agg[s].bsValue / totalBS,
    }));

    return {
      stagingRows: staging as StagRow[],
      stage23rows: instRows.sort((a, b) => b.ecl - a.ecl) as InstRow[],
      totalECL: BOOK_COMPUTED.totals.totalECLNGN,
      totalExposure: totalBS,
      stage1Count: agg["Stage 1"].count,
      stage2Count: agg["Stage 2"].count,
      stage3Count: agg["Stage 3"].count,
    };
  }, []);

  const stageCols: DataTableColumn<StagRow>[] = [
    {
      key: "stage",
      header: "Stage",
      render: (r) => (
        <Badge
          variant={
            r.stage === "Stage 1"
              ? "stage1"
              : r.stage === "Stage 2"
                ? "stage2"
                : "stage3"
          }
          size="sm"
        >
          {r.stage}
        </Badge>
      ),
    },
    { key: "count", header: "# Instruments", align: "right" },
    {
      key: "faceValue",
      header: "Gross Carrying Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "bsValue",
      header: "Net Book Value",
      align: "right",
      render: (r) => fmtCompact(r.bsValue),
    },
    {
      key: "ecl",
      header: "ECL Allowance",
      align: "right",
      render: (r) => (
        <span className="font-semibold text-primary">{fmtCompact(r.ecl)}</span>
      ),
    },
    {
      key: "coverageRatio",
      header: "Coverage %",
      align: "right",
      render: (r) => fmtPct(r.coverageRatio),
    },
    {
      key: "pctOfPortfolio",
      header: "Portfolio %",
      align: "right",
      render: (r) => fmtPct(r.pctOfPortfolio),
    },
  ];

  const instCols: DataTableColumn<InstRow>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument" },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.type}
        </Badge>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (r) => (
        <Badge variant={r.stage === "Stage 2" ? "stage2" : "stage3"} size="sm">
          {r.stage}
        </Badge>
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
      header: "Book Value",
      align: "right",
      render: (r) => fmtCompact(r.bsValue),
    },
    {
      key: "ecl",
      header: "ECL",
      align: "right",
      render: (r) => (
        <span className="font-semibold text-primary">{fmtCompact(r.ecl)}</span>
      ),
    },
    {
      key: "eclRate",
      header: "ECL Rate",
      align: "right",
      render: (r) => fmtPct(r.eclRate),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          IFRS 9 Disclosures
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Quantitative impairment staging and ECL disclosures · Valuation date
          28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total ECL Allowance"
          value={fmtCompact(totalECL)}
          subtitle="Aggregate expected credit loss"
          variant="highlight"
        />
        <StatCard
          title="Stage 1"
          value={String(stage1Count)}
          subtitle="12-month ECL — Performing"
          variant="default"
        />
        <StatCard
          title="Stage 2"
          value={String(stage2Count)}
          subtitle="Lifetime ECL — SICR"
          variant="warning"
        />
        <StatCard
          title="Stage 3"
          value={String(stage3Count)}
          subtitle="Lifetime ECL — Credit-impaired"
          variant="danger"
        />
      </StatCardGrid>

      <SectionCard
        title="Staging Summary"
        description="ECL allowance by IFRS 9 impairment stage"
      >
        <DataTable<StagRow>
          columns={stageCols}
          data={stagingRows}
          keyExtractor={(r) => r.stage}
          emptyMessage="No staging data"
        />
      </SectionCard>

      <SectionCard
        title="Stage 2 &amp; 3 Instruments"
        description="Elevated credit risk — disclosure required"
      >
        <DataTable<InstRow>
          columns={instCols}
          data={stage23rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No Stage 2 or Stage 3 instruments"
        />
      </SectionCard>
    </div>
  );
}
