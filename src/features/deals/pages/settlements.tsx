import { useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtDate,
  daysBetween,
} from "../../portfolio/engine/book-compute";

const VALUATION_DATE = "2026-05-28";

interface SettlementRow {
  id: string;
  name: string;
  type: string;
  issuer: string;
  faceValue: number;
  bsValue: number;
  maturityDate: string;
  daysToMaturity: number;
  classification: string;
  currency: string;
}

type Row = SettlementRow & Record<string, unknown>;

export function Settlements() {
  const [selected, setSelected] = useState<Row | null>(null);
  const [settled, setSettled] = useState<Set<string>>(new Set());

  const markSettled = (id: string) =>
    setSettled((prev) => new Set([...prev, id]));

  const { rows, totalFace, totalBS } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );

    const result: SettlementRow[] = BOOK_INSTRUMENTS.filter(
      (i) => i.maturityDate !== null && i.status === "Active",
    )
      .map((i) => {
        const days = daysBetween(VALUATION_DATE, i.maturityDate!);
        const val = valMap.get(i.id);
        return {
          id: i.id,
          name: i.name,
          type: i.instrumentType,
          issuer: i.issuer,
          faceValue: i.faceValue,
          bsValue: val?.balanceSheetValueNGN ?? i.purchasePrice,
          maturityDate: i.maturityDate!,
          daysToMaturity: days,
          classification: i.classification,
          currency: i.currency,
        };
      })
      .filter((r) => r.daysToMaturity >= 0 && r.daysToMaturity <= 365)
      .sort((a, b) => a.daysToMaturity - b.daysToMaturity);

    return {
      rows: result as Row[],
      totalFace: result.reduce((s, r) => s + r.faceValue, 0),
      totalBS: result.reduce((s, r) => s + r.bsValue, 0),
    };
  }, []);

  const within30 = rows.filter((r) => r.daysToMaturity <= 30).length;
  const within90 = rows.filter((r) => r.daysToMaturity <= 90).length;

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
    { key: "issuer", header: "Issuer" },
    { key: "currency", header: "CCY", width: "60px" },
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
      key: "maturityDate",
      header: "Maturity Date",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "daysToMaturity",
      header: "Days to Mat.",
      align: "right",
      render: (r) => {
        const cls =
          r.daysToMaturity <= 30
            ? "font-bold text-primary"
            : r.daysToMaturity <= 90
              ? "font-semibold text-amber-600"
              : "text-dark-gray/70";
        return <span className={cls}>{r.daysToMaturity}</span>;
      },
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
      key: "_actions" as never,
      header: "",
      width: "130px",
      render: (r) => {
        if (settled.has(String(r.id)))
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              Settled
            </span>
          );
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => markSettled(String(r.id))}
              className="rounded px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
            >
              Mark Settled
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          Settlements — Maturing Instruments
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Active instruments maturing within the next 12 months · Reference date
          28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Instruments Maturing ≤ 1Y"
          value={String(rows.length)}
          subtitle="In next 365 days"
          variant="highlight"
        />
        <StatCard
          title="Due Within 30 Days"
          value={String(within30)}
          subtitle="Immediate settlement"
          variant="danger"
        />
        <StatCard
          title="Due Within 90 Days"
          value={String(within90)}
          subtitle="Near-term settlement"
          variant="warning"
        />
        <StatCard
          title="Total Face to Settle"
          value={fmtCompact(totalFace)}
          subtitle="Face value rolling off"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Settlement Schedule"
        description="Instruments sorted by days to maturity"
      >
        <DataTable<Row>
          columns={cols}
          data={rows.filter((r) => !settled.has(String(r.id)))}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments maturing in this window"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Settlement Detail"}
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
                { label: "Issuer", value: selected.issuer },
                { label: "Currency", value: selected.currency },
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
                {
                  label: "Book Value (NGN)",
                  value: fmtCompact(selected.bsValue),
                },
                {
                  label: "Maturity Date",
                  value: fmtDate(selected.maturityDate),
                },
                {
                  label: "Days to Maturity",
                  value: String(selected.daysToMaturity),
                },
              ]
            : []
        }
      />
    </div>
  );
}
