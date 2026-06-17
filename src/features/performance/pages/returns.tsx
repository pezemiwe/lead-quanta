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

const VALUATION_DATE = "2026-05-28";
const MS_PER_YEAR = 365.25 * 86400 * 1000;

function yearsSince(purchaseDateStr: string): number {
  const val = new Date(VALUATION_DATE + "T00:00:00Z").getTime();
  const pur = new Date(purchaseDateStr + "T00:00:00Z").getTime();
  return Math.max((val - pur) / MS_PER_YEAR, 0.001);
}

function yearsToMaturity(maturityDateStr: string | null): number {
  if (!maturityDateStr) return 5;
  const val = new Date(VALUATION_DATE + "T00:00:00Z").getTime();
  const mat = new Date(maturityDateStr + "T00:00:00Z").getTime();
  return Math.max((mat - val) / MS_PER_YEAR, 0);
}

interface ReturnsRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  fairValue: number;
  acCarrying: number;
  ociReserve: number;
  unrealisedGL: number;
  returnPct: number;
}

interface ReturnMetricsRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  eir: number;
  hpr: number;
  twr: number;
  mwr: number;
  projected: number;
  holdingYears: number;
  ytm: number;
}

type Row = ReturnsRow & Record<string, unknown>;
type MRow = ReturnMetricsRow & Record<string, unknown>;

export function Returns() {
  const [selected, setSelected] = useState<Row | null>(null);
  const [selectedM, setSelectedM] = useState<MRow | null>(null);

  const { ociRows, fvtplRows, ociTotal, fvtplTotal } = useMemo(() => {
    const oci: ReturnsRow[] = [];
    const fvtpl: ReturnsRow[] = [];

    for (const v of BOOK_COMPUTED.valuations) {
      if (v.instrument.classification === "FVOCI") {
        oci.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVOCI",
          fairValue: v.cleanFairValue,
          acCarrying: v.acCarryingValue,
          ociReserve: v.ociReserve,
          unrealisedGL: 0,
          returnPct:
            v.acCarryingValue > 0 ? v.ociReserve / v.acCarryingValue : 0,
        });
      } else if (v.instrument.classification === "FVTPL") {
        fvtpl.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVTPL",
          fairValue: v.cleanFairValue,
          acCarrying: v.acCarryingValue,
          ociReserve: 0,
          unrealisedGL: v.unrealisedGL,
          returnPct:
            v.acCarryingValue > 0 ? v.unrealisedGL / v.acCarryingValue : 0,
        });
      }
    }

    return {
      ociRows: oci.sort(
        (a, b) => Math.abs(b.ociReserve) - Math.abs(a.ociReserve),
      ) as Row[],
      fvtplRows: fvtpl.sort(
        (a, b) => Math.abs(b.unrealisedGL) - Math.abs(a.unrealisedGL),
      ) as Row[],
      ociTotal: oci.reduce((s, r) => s + r.ociReserve, 0),
      fvtplTotal: fvtpl.reduce((s, r) => s + r.unrealisedGL, 0),
    };
  }, []);

  /** Return metrics: HPR, TWR, MWR, Projected for all instruments */
  const metricsRows = useMemo<MRow[]>(() => {
    return BOOK_COMPUTED.valuations
      .filter((v) => v.acCarryingValue > 0)
      .map((v) => {
        const holdYrs = yearsSince(v.instrument.purchaseDate);
        const cost = v.instrument.purchasePrice;
        const current = v.balanceSheetValueNGN;
        const eir = v.eir > 0 ? v.eir : v.instrument.couponRate;

        // Holding Period Return = (current - cost) / cost
        const hpr = cost > 0 ? (current - cost) / cost : 0;
        // Time-Weighted Return ≈ geometric annualised return from HPR
        const twr = holdYrs > 0 ? Math.pow(1 + hpr, 1 / holdYrs) - 1 : eir;
        // Money-Weighted Return ≈ EIR (IRR of cash flows; proxied by booked EIR)
        const mwr = eir;
        // Projected Return ≈ EIR × remaining tenor weight (annualised)
        const ytmYears = yearsToMaturity(v.instrument.maturityDate);
        const projected = eir * Math.min(ytmYears, 1);

        return {
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: v.instrument.classification,
          eir,
          hpr,
          twr,
          mwr,
          projected,
          holdingYears: holdYrs,
          ytm: ytmYears,
        } as MRow;
      })
      .sort((a, b) => b.twr - a.twr);
  }, []);

  const totalBSV = BOOK_COMPUTED.totals.totalBSValueNGN;
  const wAvgTWR =
    metricsRows.reduce((s, r) => s + r.twr * (r.mwr || 0), 0) /
    (metricsRows.length || 1);
  const wAvgMWR =
    BOOK_COMPUTED.valuations.reduce(
      (s, v) =>
        s +
        (v.eir > 0 ? v.eir : v.instrument.couponRate) * v.balanceSheetValueNGN,
      0,
    ) / (totalBSV || 1);
  const wAvgProjected =
    metricsRows.reduce((s, r) => s + r.projected, 0) /
    (metricsRows.length || 1);

  const metricsCols: DataTableColumn<MRow>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument" },
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
      key: "holdingYears",
      header: "Hold Period",
      align: "right",
      render: (r) => `${r.holdingYears.toFixed(1)}y`,
    },
    {
      key: "hpr",
      header: "HPR",
      align: "right",
      render: (r) => (
        <span
          className={
            r.hpr >= 0
              ? "text-emerald-600 font-medium"
              : "text-primary font-medium"
          }
        >
          {(r.hpr >= 0 ? "+" : "") + fmtPct(r.hpr)}
        </span>
      ),
    },
    {
      key: "twr",
      header: "TWR (ann.)",
      align: "right",
      render: (r) => (
        <span
          className={
            r.twr >= 0
              ? "text-emerald-600 font-semibold"
              : "text-primary font-semibold"
          }
        >
          {(r.twr >= 0 ? "+" : "") + fmtPct(r.twr)}
        </span>
      ),
    },
    {
      key: "mwr",
      header: "MWR (EIR)",
      align: "right",
      render: (r) => (
        <span className="text-primary font-medium">{fmtPct(r.mwr)}</span>
      ),
    },
    {
      key: "projected",
      header: "Projected (1yr)",
      align: "right",
      render: (r) => fmtPct(r.projected),
    },
  ];

  const ociCols: DataTableColumn<Row>[] = [
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
      key: "acCarrying",
      header: "AC Carrying",
      align: "right",
      render: (r) => fmtCompact(r.acCarrying),
    },
    {
      key: "fairValue",
      header: "Fair Value",
      align: "right",
      render: (r) => fmtCompact(r.fairValue),
    },
    {
      key: "ociReserve",
      header: "OCI Reserve",
      align: "right",
      render: (r) => {
        const cls =
          r.ociReserve >= 0
            ? "text-emerald-600 font-semibold"
            : "text-primary font-semibold";
        return <span className={cls}>{fmtCompact(r.ociReserve)}</span>;
      },
    },
    {
      key: "returnPct",
      header: "Return %",
      align: "right",
      render: (r) => {
        const cls = r.returnPct >= 0 ? "text-emerald-600" : "text-primary";
        return (
          <span className={cls}>
            {(r.returnPct >= 0 ? "+" : "") + fmtPct(r.returnPct)}
          </span>
        );
      },
    },
  ];

  const fvtplCols: DataTableColumn<Row>[] = [
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
      key: "acCarrying",
      header: "Cost Basis",
      align: "right",
      render: (r) => fmtCompact(r.acCarrying),
    },
    {
      key: "fairValue",
      header: "Fair Value",
      align: "right",
      render: (r) => fmtCompact(r.fairValue),
    },
    {
      key: "unrealisedGL",
      header: "Unrealised G/(L)",
      align: "right",
      render: (r) => {
        const cls =
          r.unrealisedGL >= 0
            ? "text-emerald-600 font-semibold"
            : "text-primary font-semibold";
        return <span className={cls}>{fmtCompact(r.unrealisedGL)}</span>;
      },
    },
    {
      key: "returnPct",
      header: "Return %",
      align: "right",
      render: (r) => {
        const cls = r.returnPct >= 0 ? "text-emerald-600" : "text-primary";
        return (
          <span className={cls}>
            {(r.returnPct >= 0 ? "+" : "") + fmtPct(r.returnPct)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Returns — P&amp;L Analysis
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Unrealised gains and losses by classification · Valuation date 28 May
          2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total OCI Reserve"
          value={fmtCompact(Math.abs(ociTotal))}
          subtitle={
            ociTotal >= 0 ? "Net OCI gain (FVOCI)" : "Net OCI loss (FVOCI)"
          }
          variant={ociTotal >= 0 ? "default" : "warning"}
        />
        <StatCard
          title="FVOCI Instruments"
          value={String(ociRows.length)}
          subtitle="In OCI portfolio"
          variant="default"
        />
        <StatCard
          title="Total FVTPL Unrealised G/(L)"
          value={fmtCompact(Math.abs(fvtplTotal))}
          subtitle={
            fvtplTotal >= 0 ? "Net gain through P&L" : "Net loss through P&L"
          }
          variant={fvtplTotal >= 0 ? "default" : "warning"}
        />
        <StatCard
          title="FVTPL Instruments"
          value={String(fvtplRows.length)}
          subtitle="In FVTPL portfolio"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="FVOCI — OCI Reserve Movements"
        description="Fair value changes accumulated in equity (OCI)"
      >
        <DataTable<Row>
          columns={ociCols}
          data={ociRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No FVOCI instruments"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <SectionCard
        title="FVTPL — Unrealised Gains / Losses"
        description="Fair value changes recognised through profit & loss"
      >
        <DataTable<Row>
          columns={fvtplCols}
          data={fvtplRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No FVTPL instruments"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Returns Detail"}
        subtitle={`${selected?.id} · ${selected?.classification}`}
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
                { label: "Classification", value: selected.classification },
                {
                  label: "AC Carrying / Cost Basis",
                  value: fmtCompact(selected.acCarrying),
                },
                { label: "Fair Value", value: fmtCompact(selected.fairValue) },
                ...(selected.classification === "FVOCI"
                  ? [
                      {
                        label: "OCI Reserve",
                        value: (
                          <span
                            className={
                              selected.ociReserve >= 0
                                ? "text-emerald-600 font-semibold"
                                : "text-primary font-semibold"
                            }
                          >
                            {fmtCompact(selected.ociReserve)}
                          </span>
                        ),
                      },
                    ]
                  : [
                      {
                        label: "Unrealised G/(L)",
                        value: (
                          <span
                            className={
                              selected.unrealisedGL >= 0
                                ? "text-emerald-600 font-semibold"
                                : "text-primary font-semibold"
                            }
                          >
                            {fmtCompact(selected.unrealisedGL)}
                          </span>
                        ),
                      },
                    ]),
                {
                  label: "Return %",
                  value: (
                    <span
                      className={
                        selected.returnPct >= 0
                          ? "text-emerald-600"
                          : "text-primary"
                      }
                    >
                      {(selected.returnPct >= 0 ? "+" : "") +
                        fmtPct(selected.returnPct)}
                    </span>
                  ),
                },
              ]
            : []
        }
      />

      {/* Return Metrics Section */}
      <SectionCard
        title="Return Metrics by Instrument"
        description="HPR, TWR (annualised), MWR (EIR-proxy), and 1-year projected return for all instruments"
      >
        <StatCardGrid className="mb-4">
          <StatCard
            title="Avg TWR (ann.)"
            value={fmtPct(wAvgTWR)}
            subtitle="Time-weighted annualised return"
            variant="highlight"
          />
          <StatCard
            title="Wtd-Avg MWR"
            value={fmtPct(wAvgMWR)}
            subtitle="EIR-weighted by book value"
            variant="default"
          />
          <StatCard
            title="Avg Projected (1yr)"
            value={fmtPct(wAvgProjected)}
            subtitle="EIR × remaining year fraction"
            variant="default"
          />
          <StatCard
            title="Instruments Tracked"
            value={String(metricsRows.length)}
            subtitle="With positive carrying value"
            variant="default"
          />
        </StatCardGrid>
        <DataTable<MRow>
          columns={metricsCols}
          data={metricsRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No return metrics available"
          pageSize={20}
          onRowClick={setSelectedM}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selectedM !== null}
        onClose={() => setSelectedM(null)}
        title={selectedM?.name ?? "Return Metrics Detail"}
        subtitle={`${selectedM?.id} · ${selectedM?.classification}`}
        fields={
          selectedM
            ? [
                { label: "ID", value: selectedM.id },
                {
                  label: "Classification",
                  value: (
                    <Badge
                      variant={
                        selectedM.classification === "AC"
                          ? "info"
                          : selectedM.classification === "FVOCI"
                            ? "success"
                            : "warning"
                      }
                      size="sm"
                    >
                      {selectedM.classification}
                    </Badge>
                  ),
                },
                {
                  label: "Holding Period",
                  value: `${selectedM.holdingYears.toFixed(2)} years`,
                },
                { label: "EIR (Booked)", value: fmtPct(selectedM.eir) },
                {
                  label: "HPR (Total)",
                  value: (
                    <span
                      className={
                        selectedM.hpr >= 0
                          ? "text-emerald-600 font-medium"
                          : "text-primary font-medium"
                      }
                    >
                      {(selectedM.hpr >= 0 ? "+" : "") + fmtPct(selectedM.hpr)}
                    </span>
                  ),
                },
                {
                  label: "TWR (Annualised)",
                  value: (
                    <span
                      className={
                        selectedM.twr >= 0
                          ? "text-emerald-600 font-semibold"
                          : "text-primary font-semibold"
                      }
                    >
                      {(selectedM.twr >= 0 ? "+" : "") + fmtPct(selectedM.twr)}
                    </span>
                  ),
                },
                { label: "MWR (EIR proxy)", value: fmtPct(selectedM.mwr) },
                {
                  label: "Projected Return (1yr)",
                  value: fmtPct(selectedM.projected),
                },
                {
                  label: "Years to Maturity",
                  value: `${selectedM.ytm.toFixed(2)}y`,
                },
              ]
            : []
        }
      />
    </div>
  );
}
