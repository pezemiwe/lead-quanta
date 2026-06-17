import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Button } from "../../../components/shared/button";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { StageBadge, Badge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";
import { fmtCompact, fmtPct } from "../utils/format";
import type {
  SecurityComputed,
  Stage,
  StageSummary,
  SpecificationSummary,
} from "../engine/types";

function exportXlsx(rows: SecurityComputed[]) {
  const headers = [
    "SN", "Counterparty", "Specification", "Currency",
    "Carrying LCY", "Rating Eq.", "Final Stage", "TTM (months)",
    "EAD[0]", "LGD[0]", "ECL", "Coverage",
  ];
  const data = rows.map((r) => [
    r.sn, r.counterparty, r.assetSpecification, r.currency,
    +r.carryingAmountLcy.toFixed(2), r.ratingEquivalent, r.finalStage,
    r.ttm, +(r.ead[0] ?? r.carryingAmountLcy).toFixed(2),
    +(r.lgd[0] ?? 0).toFixed(4), +r.ecl.toFixed(2), +r.coverageRatio.toFixed(6),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ECL Results");
  XLSX.writeFile(wb, "ifrs9-ecl-results.xlsx");
}

const STAGE_LABEL: Record<Stage | "TOTAL", string> = {
  1: "Stage 1",
  2: "Stage 2",
  3: "Stage 3",
  TOTAL: "TOTAL",
};

export function IFRS9ECLResults() {
  const { result } = useIFRS9();

  const stageCols: DataTableColumn<StageSummary & Record<string, unknown>>[] = [
    {
      key: "stage",
      header: "Stage",
      render: (r) =>
        r.stage === "TOTAL" ? (
          <Badge variant="brand" size="sm">
            TOTAL
          </Badge>
        ) : (
          <StageBadge stage={r.stage as Stage} />
        ),
    },
    { key: "count", header: "Count", align: "right" },
    {
      key: "exposure",
      header: "Exposure (LCY)",
      align: "right",
      render: (r) => fmtCompact(r.exposure),
    },
    {
      key: "impairment",
      header: "Impairment",
      align: "right",
      render: (r) => fmtCompact(r.impairment),
    },
    {
      key: "coverageRatio",
      header: "Coverage",
      align: "right",
      render: (r) => fmtPct(r.coverageRatio, 3),
    },
  ];

  const specCols: DataTableColumn<
    SpecificationSummary & Record<string, unknown>
  >[] = [
    {
      key: "specification",
      header: "Specification",
      render: (r) =>
        r.specification === "TOTAL" ? (
          <Badge variant="brand" size="sm">
            TOTAL
          </Badge>
        ) : (
          <span className="font-medium text-dark-gray">{r.specification}</span>
        ),
    },
    { key: "count", header: "Count", align: "right" },
    {
      key: "exposure",
      header: "Exposure (LCY)",
      align: "right",
      render: (r) => fmtCompact(r.exposure),
    },
    {
      key: "impairment",
      header: "Impairment",
      align: "right",
      render: (r) => fmtCompact(r.impairment),
    },
    {
      key: "coverageRatio",
      header: "Coverage",
      align: "right",
      render: (r) => fmtPct(r.coverageRatio, 3),
    },
  ];

  const itemCols: DataTableColumn<
    SecurityComputed & Record<string, unknown>
  >[] = [
    { key: "sn", header: "SN", width: "60px" },
    { key: "counterparty", header: "Counterparty" },
    {
      key: "finalStage",
      header: "Stage",
      render: (r) => <StageBadge stage={r.finalStage} />,
    },
    { key: "ttm", header: "TTM", align: "right" },
    {
      key: "ratingEquivalent",
      header: "Rating",
      render: (r) => (
        <span className="font-mono text-xs">{r.ratingEquivalent}</span>
      ),
    },
    {
      key: "lgd",
      header: "LGD[0]",
      align: "right",
      render: (r) => fmtPct(r.lgd[0] ?? 0, 1),
    },
    {
      key: "carryingAmountLcy",
      header: "Exposure",
      align: "right",
      render: (r) => fmtCompact(r.carryingAmountLcy),
    },
    {
      key: "ecl",
      header: "ECL",
      align: "right",
      render: (r) => (
        <span className="font-semibold text-deep-red">{fmtCompact(r.ecl)}</span>
      ),
    },
    {
      key: "coverageRatio",
      header: "Coverage",
      align: "right",
      render: (r) => fmtPct(r.coverageRatio, 3),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            ECL Results
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            Stage and asset-specification summaries with per-instrument expected
            credit losses.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-3.5 w-3.5" />}
          onClick={() => exportXlsx(result.rows)}
        >
          Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Stage Summary"
          description="Aggregated by IFRS 9 stage"
          noPadding
        >
          <DataTable
            columns={stageCols}
            data={
              result.byStage as unknown as (StageSummary &
                Record<string, unknown>)[]
            }
            keyExtractor={(r) => String(r.stage)}
          />
        </SectionCard>
        <SectionCard
          title="Specification Summary"
          description="Aggregated by debt-securities specification"
          noPadding
        >
          <DataTable
            columns={specCols}
            data={
              result.bySpecification as unknown as (SpecificationSummary &
                Record<string, unknown>)[]
            }
            keyExtractor={(r) => String(r.specification)}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Per-Instrument ECL"
        description={`${result.rows.length} debt securities`}
        noPadding
      >
        <DataTable
          columns={itemCols}
          data={result.rows as (SecurityComputed & Record<string, unknown>)[]}
          keyExtractor={(r) => r.sn}
        />
      </SectionCard>

      <p className="text-xs text-dark-gray/50">
        Stage 1 horizons capped at 12 months; Stage 2 up to 180 months; Stage 3
        is carrying × LGD. Discounting at monthly EIR. {STAGE_LABEL.TOTAL} ECL ={" "}
        <span className="font-semibold text-deep-red">
          {fmtCompact(result.totals.impairmentLcy)}
        </span>
        .
      </p>
    </div>
  );
}
