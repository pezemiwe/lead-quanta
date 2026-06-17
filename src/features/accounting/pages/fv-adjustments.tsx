import { useMemo, type ReactNode } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { AcronymTip } from "../../../components/shared/acronym-tip";
import {
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

interface FVRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  acCarrying: number;
  fairValue: number;
  movement: number;
  movementPct: number;
  account: string;
}

type Row = FVRow & Record<string, unknown>;

export function FVAdjustments() {
  const { ociRows, fvtplRows, totalOCI, totalFVTPL } = useMemo(() => {
    const oci: FVRow[] = [];
    const fvtpl: FVRow[] = [];

    for (const v of BOOK_COMPUTED.valuations) {
      if (v.instrument.classification === "FVOCI" && v.ociReserve !== 0) {
        oci.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVOCI",
          acCarrying: v.acCarryingValue,
          fairValue: v.cleanFairValue,
          movement: v.ociReserve,
          movementPct:
            v.acCarryingValue > 0 ? v.ociReserve / v.acCarryingValue : 0,
          account: "OCI Unrealised Gain/(Loss) on FVOCI Assets",
        });
      } else if (v.instrument.classification === "FVTPL") {
        fvtpl.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVTPL",
          acCarrying: v.acCarryingValue,
          fairValue: v.cleanFairValue,
          movement: v.unrealisedGL,
          movementPct:
            v.acCarryingValue > 0 ? v.unrealisedGL / v.acCarryingValue : 0,
          account: "P&L Unrealised Gain/(Loss) on FVTPL Assets",
        });
      }
    }

    return {
      ociRows: oci.sort(
        (a, b) => Math.abs(b.movement) - Math.abs(a.movement),
      ) as Row[],
      fvtplRows: fvtpl.sort(
        (a, b) => Math.abs(b.movement) - Math.abs(a.movement),
      ) as Row[],
      totalOCI: oci.reduce((s, r) => s + r.movement, 0),
      totalFVTPL: fvtpl.reduce((s, r) => s + r.movement, 0),
    };
  }, []);

  const cols = (
    acLabel: ReactNode,
    mvLabel: ReactNode,
  ): DataTableColumn<Row>[] => [
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
      header: acLabel,
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
      key: "movement",
      header: mvLabel,
      align: "right",
      render: (r) => {
        const cls =
          r.movement >= 0
            ? "text-emerald-600 font-semibold"
            : "text-primary font-semibold";
        return <span className={cls}>{fmtCompact(r.movement)}</span>;
      },
    },
    {
      key: "movementPct",
      header: "% Movement",
      align: "right",
      render: (r) => {
        const cls = r.movementPct >= 0 ? "text-emerald-600" : "text-primary";
        return (
          <span className={cls}>
            {(r.movementPct >= 0 ? "+" : "") + fmtPct(r.movementPct)}
          </span>
        );
      },
    },
    {
      key: "account",
      header: "Accounting Entry",
      render: (r) => (
        <span className="text-xs text-dark-gray/65">{r.account}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Fair Value Adjustments
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          <AcronymTip term="OCI" /> reserve movements (
          <AcronymTip term="FVOCI" />) and unrealised gain/(loss) (
          <AcronymTip term="FVTPL" />) · Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Fair Value (OCI) Adjustments"
          value={String(ociRows.length)}
          subtitle="Instruments with OCI reserve movement"
          variant="default"
        />
        <StatCard
          title="Net OCI Reserve"
          value={fmtCompact(Math.abs(totalOCI))}
          subtitle={totalOCI >= 0 ? "Net OCI gain" : "Net OCI loss"}
          variant={totalOCI >= 0 ? "default" : "warning"}
        />
        <StatCard
          title="Fair Value (P&L) Adjustments"
          value={String(fvtplRows.length)}
          subtitle="Instruments with unrealised gain/(loss)"
          variant="default"
        />
        <StatCard
          title="Net Unrealised Gain/(Loss)"
          value={fmtCompact(Math.abs(totalFVTPL))}
          subtitle={
            totalFVTPL >= 0 ? "Net unrealised gain" : "Net unrealised loss"
          }
          variant={totalFVTPL >= 0 ? "default" : "warning"}
        />
      </StatCardGrid>

      <SectionCard
        title="Fair Value through OCI — Reserve Movements"
        description="Dr / Cr: FVOCI Investment Account / OCI Equity Reserve (recycled to P&L on disposal)"
      >
        <DataTable<Row>
          columns={cols(
            <>
              <AcronymTip term="AC" /> Carrying Value
            </>,
            <>
              <AcronymTip term="OCI" /> Reserve
            </>,
          )}
          data={ociRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No FVOCI adjustments"
        />
      </SectionCard>

      <SectionCard
        title="Fair Value through P&L — Unrealised Gains / Losses"
        description="Dr / Cr: FVTPL Investment Account / Unrealised Gain or Loss (recognised in Profit & Loss)"
      >
        <DataTable<Row>
          columns={cols("Cost Basis", "Unrealised Gain/(Loss)")}
          data={fvtplRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No FVTPL adjustments"
        />
      </SectionCard>
    </div>
  );
}
