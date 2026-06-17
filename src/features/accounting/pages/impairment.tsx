import { useMemo, useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

interface ImpairmentRow {
  id: string;
  name: string;
  type: string;
  stage: string;
  faceValue: number;
  bsValue: number;
  ecl: number;
  eclRate: number;
}

type Row = ImpairmentRow & Record<string, unknown>;

export function Impairment() {
  const [selected, setSelected] = useState<Row | null>(null);
  const { stage1, stage2, stage3, totalECL, totalExposure } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );

    const toRow = (i: (typeof BOOK_INSTRUMENTS)[number]): ImpairmentRow => {
      const val = valMap.get(i.id);
      const ecl = val?.instrument.eclProvision ?? 0;
      const bsValue = val?.balanceSheetValueNGN ?? i.purchasePrice;
      return {
        id: i.id,
        name: i.name,
        type: i.instrumentType,
        stage: i.impairmentStage ?? "N/A",
        faceValue: i.faceValue,
        bsValue,
        ecl,
        eclRate: i.faceValue > 0 ? ecl / i.faceValue : 0,
      };
    };

    return {
      stage1: BOOK_INSTRUMENTS.filter(
        (i) => i.impairmentStage === "Stage 1",
      ).map(toRow) as Row[],
      stage2: BOOK_INSTRUMENTS.filter(
        (i) => i.impairmentStage === "Stage 2",
      ).map(toRow) as Row[],
      stage3: BOOK_INSTRUMENTS.filter(
        (i) => i.impairmentStage === "Stage 3",
      ).map(toRow) as Row[],
      totalECL: BOOK_COMPUTED.totals.totalECLNGN,
      totalExposure: BOOK_COMPUTED.totals.totalBSValueNGN,
    };
  }, []);

  const cols: DataTableColumn<Row>[] = [
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
      header: "ECL Provision",
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

  const stageSummary = [
    { label: "Stage 1", items: stage1, variant: "stage1" as const },
    { label: "Stage 2", items: stage2, variant: "stage2" as const },
    { label: "Stage 3", items: stage3, variant: "stage3" as const },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Impairment &amp; ECL Provisions
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Expected credit loss by IFRS 9 stage · Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total ECL Provision"
          value={fmtCompact(totalECL)}
          subtitle="Aggregate expected credit loss"
          variant="highlight"
        />
        <StatCard
          title="Stage 1 Instruments"
          value={String(stage1.length)}
          subtitle="12-month ECL"
          variant="default"
        />
        <StatCard
          title="Stage 2 Instruments"
          value={String(stage2.length)}
          subtitle="Lifetime ECL — SICR"
          variant="warning"
        />
        <StatCard
          title="Stage 3 Instruments"
          value={String(stage3.length)}
          subtitle="Lifetime ECL — Credit-impaired"
          variant="danger"
        />
      </StatCardGrid>

      {stageSummary.map(({ label, items, variant }) => (
        <SectionCard
          key={label}
          title={`${label} — ECL Provisions`}
          description={`${items.length} instruments · Total ECL: ${fmtCompact(
            items.reduce((s, r) => s + r.ecl, 0),
          )}`}
        >
          <DataTable<Row>
            columns={cols}
            data={items}
            keyExtractor={(r) => r.id}
            emptyMessage={`No ${label} instruments`}
            pageSize={20}
            onRowClick={setSelected}
          />
        </SectionCard>
      ))}

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Impairment Detail"}
        subtitle={selected?.id}
        fields={
          selected
            ? [
                { label: "ID", value: selected.id },
                {
                  label: "Type",
                  value: (
                    <Badge variant="neutral" size="sm">
                      {selected.type}
                    </Badge>
                  ),
                },
                { label: "Stage", value: selected.stage },
                { label: "Face Value", value: fmtCompact(selected.faceValue) },
                { label: "Book Value", value: fmtCompact(selected.bsValue) },
                {
                  label: "ECL Provision",
                  value: (
                    <span className="font-semibold text-primary">
                      {fmtCompact(selected.ecl)}
                    </span>
                  ),
                },
                { label: "ECL Rate", value: fmtPct(selected.eclRate) },
              ]
            : []
        }
      />
    </div>
  );
}
