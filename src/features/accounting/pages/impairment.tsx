import { useState } from "react";
import { AlertTriangle, ShieldCheck, Eye } from "lucide-react";
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

type Row = {
  id: string;
  name: string;
  type: string;
  sector: string;
  bsValue: number;
  ociReserve: number;
  rating: string;
  flag: "watch" | "review" | "ok";
} & Record<string, unknown>;

const RATING_MAP: Record<string, string> = {
  "Government / FGN": "Sovereign",
  "Financial Services": "AA",
  Banking: "AA",
  "Oil & Gas": "A",
  Telecoms: "A",
  "Real Estate": "BBB",
  Equities: "Unrated",
  "Consumer Goods": "BBB",
};

export function Impairment() {
  const [selected, setSelected] = useState<Row | null>(null);

  const valMap = new Map(
    BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
  );

  const watchRows: Row[] = BOOK_INSTRUMENTS.map((inst) => {
    const val = valMap.get(inst.id);
    const bsValue = val?.balanceSheetValueNGN ?? inst.purchasePrice;
    const ociReserve = val?.ociReserve ?? 0;
    const rating = RATING_MAP[inst.sector] ?? "BBB";
    const flag: "watch" | "review" | "ok" =
      inst.classification === "FVTPL" || bsValue < inst.purchasePrice * 0.92
        ? "watch"
        : ociReserve < -inst.purchasePrice * 0.05
          ? "review"
          : "ok";
    return {
      id: inst.id,
      name: inst.name,
      type: inst.instrumentType,
      sector: inst.sector,
      bsValue,
      ociReserve,
      rating,
      flag,
    } as Row;
  });

  const watchList = watchRows.filter((r) => r.flag !== "ok");
  const reviewList = watchRows.filter((r) => r.flag === "review");
  const okList = watchRows.filter((r) => r.flag === "ok");

  const totalBSV = BOOK_COMPUTED.totals.totalBSValueNGN;
  const totalOCI = BOOK_COMPUTED.totals.totalOCIReserveNGN;

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
    { key: "sector", header: "Sector" },
    {
      key: "rating",
      header: "Credit Rating",
      render: (r) => (
        <Badge
          variant={
            r.rating === "Sovereign"
              ? "success"
              : r.rating === "Unrated"
                ? "neutral"
                : r.rating === "BBB"
                  ? "warning"
                  : "info"
          }
          size="sm"
        >
          {r.rating}
        </Badge>
      ),
    },
    {
      key: "bsValue",
      header: "Book Value",
      align: "right",
      render: (r) => fmtCompact(r.bsValue),
    },
    {
      key: "ociReserve",
      header: "OCI Reserve",
      align: "right",
      render: (r) => (
        <span
          className={
            r.ociReserve < 0 ? "font-semibold text-danger" : "text-success"
          }
        >
          {r.ociReserve !== 0 ? fmtCompact(r.ociReserve) : "—"}
        </span>
      ),
    },
    {
      key: "flag",
      header: "Status",
      render: (r) =>
        r.flag === "watch" ? (
          <span className="flex items-center gap-1 text-xs text-danger">
            <AlertTriangle className="h-3.5 w-3.5" /> Watch
          </span>
        ) : r.flag === "review" ? (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <Eye className="h-3.5 w-3.5" /> Review
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> OK
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Impairment Monitoring
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Credit watch, OCI reserve tracking, and specific provision management
          · Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total OCI Reserve"
          value={fmtCompact(Math.abs(totalOCI))}
          subtitle={totalOCI >= 0 ? "Unrealised gain" : "Unrealised loss"}
          variant={totalOCI < 0 ? "danger" : "default"}
        />
        <StatCard
          title="OCI as % of Book"
          value={fmtPct(Math.abs(totalOCI) / totalBSV)}
          subtitle="FVOCI reserve ratio"
          variant="default"
        />
        <StatCard
          title="Credit Watch"
          value={String(watchList.length)}
          subtitle="Instruments flagged for review"
          variant="warning"
        />
        <StatCard
          title="Clean Book"
          value={String(okList.length)}
          subtitle="No impairment indicators"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Credit Watch List"
        description={`${watchList.length} instruments with impairment indicators or elevated OCI losses`}
      >
        <DataTable<Row>
          columns={cols}
          data={watchList}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments on credit watch"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      {reviewList.length > 0 && (
        <SectionCard
          title="Under Review — Specific Provision Candidates"
          description={`${reviewList.length} instruments with material OCI losses — management review required`}
        >
          <DataTable<Row>
            columns={cols}
            data={reviewList}
            keyExtractor={(r) => r.id}
            pageSize={20}
            onRowClick={setSelected}
          />
        </SectionCard>
      )}

      <SectionCard
        title="Full Investment Book"
        description={`${watchRows.length} instruments · Total book value: ${fmtCompact(totalBSV)}`}
      >
        <DataTable<Row>
          columns={cols}
          data={watchRows}
          keyExtractor={(r) => r.id}
          pageSize={15}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Instrument Detail"}
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
                { label: "Sector", value: selected.sector },
                { label: "Credit Rating", value: selected.rating },
                { label: "Book Value", value: fmtCompact(selected.bsValue) },
                {
                  label: "OCI Reserve",
                  value: fmtCompact(selected.ociReserve),
                },
                {
                  label: "Status",
                  value:
                    selected.flag === "watch"
                      ? "Credit Watch"
                      : selected.flag === "review"
                        ? "Under Review"
                        : "No Concerns",
                },
              ]
            : []
        }
      />
    </div>
  );
}
