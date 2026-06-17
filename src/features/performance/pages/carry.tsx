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

interface CarryRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  couponRate: number;
  marketYield: number;
  carrySpread: number;
  carryIncome: number;
  bsValue: number;
}

type Row = CarryRow & Record<string, unknown>;

export function Carry() {
  const [selected, setSelected] = useState<Row | null>(null);
  const { rows, positiveCarry, negativeCarry, totalCarryIncome } =
    useMemo(() => {
      const result: CarryRow[] = BOOK_COMPUTED.valuations
        .filter((v) => v.instrument.couponRate > 0 && v.marketYieldUsed > 0)
        .map((v) => {
          const carrySpread = v.instrument.couponRate - v.marketYieldUsed;
          return {
            id: v.instrument.id,
            name: v.instrument.name,
            type: v.instrument.instrumentType,
            classification: v.instrument.classification,
            couponRate: v.instrument.couponRate,
            marketYield: v.marketYieldUsed,
            carrySpread,
            carryIncome: v.balanceSheetValueNGN * carrySpread,
            bsValue: v.balanceSheetValueNGN,
          };
        })
        .sort((a, b) => b.carrySpread - a.carrySpread);

      return {
        rows: result as Row[],
        positiveCarry: result.filter((r) => r.carrySpread > 0),
        negativeCarry: result.filter((r) => r.carrySpread < 0),
        totalCarryIncome: result.reduce((s, r) => s + r.carryIncome, 0),
      };
    }, []);

  const avgSpread =
    rows.reduce((s, r) => s + r.carrySpread, 0) / (rows.length || 1);

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
      header: "Coupon Rate",
      align: "right",
      render: (r) => fmtPct(r.couponRate),
    },
    {
      key: "marketYield",
      header: "Market Yield",
      align: "right",
      render: (r) => fmtPct(r.marketYield),
    },
    {
      key: "carrySpread",
      header: "Carry Spread",
      align: "right",
      render: (r) => {
        const cls =
          r.carrySpread >= 0
            ? "text-emerald-600 font-semibold"
            : "text-primary font-semibold";
        const sign = r.carrySpread >= 0 ? "+" : "";
        return (
          <span className={cls}>
            {sign}
            {fmtPct(r.carrySpread)}
          </span>
        );
      },
    },
    {
      key: "bsValue",
      header: "Book Value",
      align: "right",
      render: (r) => fmtCompact(r.bsValue),
    },
    {
      key: "carryIncome",
      header: "Annual Carry Income",
      align: "right",
      render: (r) => {
        const cls =
          r.carryIncome >= 0
            ? "text-emerald-600 font-semibold"
            : "text-primary font-semibold";
        return (
          <span className={cls}>{fmtCompact(Math.abs(r.carryIncome))}</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Carry Analysis
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Coupon rate vs market yield spread for all coupon-bearing instruments
          ·{rows.length} instruments · Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Positive Carry"
          value={String(positiveCarry.length)}
          subtitle="Coupon &gt; market yield"
          variant="default"
        />
        <StatCard
          title="Negative Carry"
          value={String(negativeCarry.length)}
          subtitle="Coupon &lt; market yield"
          variant="warning"
        />
        <StatCard
          title="Avg Carry Spread"
          value={(avgSpread >= 0 ? "+" : "") + fmtPct(avgSpread)}
          subtitle="Simple average across coupon instruments"
          variant={avgSpread >= 0 ? "default" : "warning"}
        />
        <StatCard
          title="Total Annual Carry Income"
          value={fmtCompact(Math.abs(totalCarryIncome))}
          subtitle={
            totalCarryIncome >= 0 ? "Net positive carry" : "Net negative carry"
          }
          variant={totalCarryIncome >= 0 ? "default" : "warning"}
        />
      </StatCardGrid>

      <SectionCard
        title="Carry Spread Table"
        description="Sorted by carry spread (highest first)"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No coupon-bearing instruments with market yield"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Carry Detail"}
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
                { label: "Coupon Rate", value: fmtPct(selected.couponRate) },
                { label: "Market Yield", value: fmtPct(selected.marketYield) },
                {
                  label: "Carry Spread",
                  value: (
                    <span
                      className={
                        selected.carrySpread >= 0
                          ? "text-emerald-600 font-semibold"
                          : "text-primary font-semibold"
                      }
                    >
                      {(selected.carrySpread >= 0 ? "+" : "") +
                        fmtPct(selected.carrySpread)}
                    </span>
                  ),
                },
                {
                  label: "Book Value (NGN)",
                  value: fmtCompact(selected.bsValue),
                },
                {
                  label: "Annual Carry Income",
                  value: (
                    <span
                      className={
                        selected.carryIncome >= 0
                          ? "text-emerald-600 font-semibold"
                          : "text-primary font-semibold"
                      }
                    >
                      {fmtCompact(Math.abs(selected.carryIncome))}
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
