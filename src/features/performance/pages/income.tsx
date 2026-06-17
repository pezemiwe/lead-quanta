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
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

interface IncomeRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  couponRate: number;
  eir: number;
  carryingValue: number;
  annualEIRIncome: number;
  monthlyIncome: number;
}

type Row = IncomeRow & Record<string, unknown>;

export function Income() {
  const { rows, totalAnnual, totalMonthly } = useMemo(() => {
    const result: IncomeRow[] = BOOK_COMPUTED.valuations
      .filter((v) => v.annualEIRIncome > 0)
      .map((v) => ({
        id: v.instrument.id,
        name: v.instrument.name,
        type: v.instrument.instrumentType,
        classification: v.instrument.classification,
        couponRate: v.instrument.couponRate,
        eir: v.eir,
        carryingValue: v.balanceSheetValueNGN,
        annualEIRIncome: v.annualEIRIncome,
        monthlyIncome: v.annualEIRIncome / 12,
      }))
      .sort((a, b) => b.annualEIRIncome - a.annualEIRIncome);

    return {
      rows: result as Row[],
      totalAnnual: result.reduce((s, r) => s + r.annualEIRIncome, 0),
      totalMonthly: result.reduce((s, r) => s + r.monthlyIncome, 0),
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
      key: "couponRate",
      header: "Coupon",
      align: "right",
      render: (r) =>
        r.couponRate > 0 ? (
          fmtPct(r.couponRate)
        ) : (
          <span className="text-dark-gray/40">Disc.</span>
        ),
    },
    {
      key: "eir",
      header: "EIR",
      align: "right",
      render: (r) =>
        r.eir > 0 ? (
          <span className="text-primary font-medium">{fmtPct(r.eir)}</span>
        ) : (
          <span className="text-dark-gray/40">—</span>
        ),
    },
    {
      key: "carryingValue",
      header: "Carrying Value",
      align: "right",
      render: (r) => fmtCompact(r.carryingValue),
    },
    {
      key: "annualEIRIncome",
      header: "Annual EIR Income",
      align: "right",
      render: (r) => (
        <span className="font-semibold text-dark-gray">
          {fmtCompact(r.annualEIRIncome)}
        </span>
      ),
    },
    {
      key: "monthlyIncome",
      header: "Monthly Income",
      align: "right",
      render: (r) => fmtCompact(r.monthlyIncome),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Income — Coupon &amp; EIR
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Annual and monthly EIR income for all income-generating instruments ·
          {rows.length} instruments · Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Income-Generating Instruments"
          value={String(rows.length)}
          subtitle="Non-zero EIR income"
          variant="highlight"
        />
        <StatCard
          title="Total Annual EIR Income"
          value={fmtCompact(totalAnnual)}
          subtitle="Projected full-year interest income"
          variant="default"
        />
        <StatCard
          title="Monthly Run Rate"
          value={fmtCompact(totalMonthly)}
          subtitle="Average monthly income"
          variant="default"
        />
        <StatCard
          title="Top Income Instrument"
          value={fmtCompact(rows[0]?.annualEIRIncome ?? 0)}
          subtitle={rows[0]?.name ?? "—"}
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Income Schedule"
        description="Sorted by annual EIR income (highest first)"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No income-generating instruments"
        />
      </SectionCard>
    </div>
  );
}
