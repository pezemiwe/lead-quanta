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
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";
import { WorkflowRegisterBanner } from "../../../components/shared/workflow-register-banner";
import { useWorkflow } from "../../workflow/store";

interface AccrualRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  couponRate: number;
  faceValue: number;
  accruedInterest: number;
  monthlyAccrual: number;
}

type Row = AccrualRow & Record<string, unknown>;

export function Accruals() {
  const [selected, setSelected] = useState<Row | null>(null);
  const { register } = useWorkflow();
  const rows = useMemo<Row[]>(() => {
    return BOOK_COMPUTED.valuations
      .filter((v) => v.accruedInterest > 0)
      .map((v) => ({
        id: v.instrument.id,
        name: v.instrument.name,
        type: v.instrument.instrumentType,
        classification: v.instrument.classification,
        couponRate: v.instrument.couponRate,
        faceValue: v.instrument.faceValue,
        accruedInterest: v.accruedInterest,
        monthlyAccrual: (v.instrument.faceValue * v.instrument.couponRate) / 12,
      }))
      .sort((a, b) => b.accruedInterest - a.accruedInterest) as Row[];
  }, []);

  const totalAccrued = rows.reduce((s, r) => s + r.accruedInterest, 0);
  const totalMonthly = rows.reduce((s, r) => s + r.monthlyAccrual, 0);

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
      key: "classification",
      header: "Class",
      render: (r) => (
        <Badge
          variant={
            r.classification === "AC"
              ? "info"
              : r.classification === "FVOCI"
                ? "success"
                : "warning"
          }
          size="sm"
        >
          {r.classification}
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
      key: "couponRate",
      header: "Coupon Rate",
      align: "right",
      render: (r) => fmtPct(r.couponRate),
    },
    {
      key: "monthlyAccrual",
      header: "Monthly Accrual",
      align: "right",
      render: (r) => fmtCompact(r.monthlyAccrual),
    },
    {
      key: "accruedInterest",
      header: "Accrued to Date",
      align: "right",
      render: (r) => (
        <span className="font-semibold text-primary">
          {fmtCompact(r.accruedInterest)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Interest Accruals
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Finance triggers from approved, settled register positions. Legacy seed book shown below;{" "}
          {register.length} workflow-settled position(s) in register.
        </p>
      </div>

      <WorkflowRegisterBanner />

      <StatCardGrid>
        <StatCard
          title="Accruing Instruments"
          value={String(rows.length)}
          subtitle="With positive accrued interest"
          variant="highlight"
        />
        <StatCard
          title="Total Accrued Interest"
          value={fmtCompact(totalAccrued)}
          subtitle="DR Accrued interest receivable"
          variant="default"
        />
        <StatCard
          title="Monthly Accrual Rate"
          value={fmtCompact(totalMonthly)}
          subtitle="Aggregate monthly income"
          variant="default"
        />
        <StatCard
          title="Annualised Run Rate"
          value={fmtCompact(totalMonthly * 12)}
          subtitle="Projected annual coupon income"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Accrued Interest Schedule"
        description="Sorted by accrued amount (highest first)"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No accruals"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Accrual Detail"}
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
                {
                  label: "Classification",
                  value: (
                    <Badge
                      variant={
                        selected.classification === "AC"
                          ? "info"
                          : selected.classification === "FVOCI"
                            ? "success"
                            : "warning"
                      }
                      size="sm"
                    >
                      {selected.classification}
                    </Badge>
                  ),
                },
                { label: "Face Value", value: fmtCompact(selected.faceValue) },
                { label: "Coupon Rate", value: fmtPct(selected.couponRate) },
                {
                  label: "Monthly Accrual",
                  value: fmtCompact(selected.monthlyAccrual),
                },
                {
                  label: "Accrued to Date",
                  value: (
                    <span className="font-semibold text-primary">
                      {fmtCompact(selected.accruedInterest)}
                    </span>
                  ),
                },
              ]
            : []
        }
      />
    </div>
  );
}
