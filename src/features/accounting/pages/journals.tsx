import { useMemo, useState } from "react";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import { GovernanceBar } from "../../../components/shared/governance-bar";
import {
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

interface JournalEntry {
  ref: string;
  instrument: string;
  type: string;
  classification: string;
  eir: number;
  openingCarry: number;
  eirIncome: number;
  couponCash: number;
  closing: number;
  dr: string;
  cr: string;
}

type Row = JournalEntry & Record<string, unknown>;

export function Journals() {
  const [selected, setSelected] = useState<Row | null>(null);
  const rows = useMemo<Row[]>(() => {
    return BOOK_COMPUTED.valuations
      .filter((v) => v.annualEIRIncome > 0)
      .map((v, i) => {
        const couponCash =
          v.instrument.couponRate > 0
            ? v.instrument.faceValue * v.instrument.couponRate
            : 0;
        const isAC = v.instrument.classification === "AC";
        const isFVOCI = v.instrument.classification === "FVOCI";
        const eirIncome = v.annualEIRIncome;
        const opening = v.acCarryingValue - (eirIncome - couponCash);
        const dr = isAC
          ? "Accrued Interest / Investment (AC)"
          : isFVOCI
            ? "Accrued Interest / Investment (FVOCI)"
            : "Investment at FVTPL";
        const cr =
          isAC || isFVOCI ? "Interest Income (P&L)" : "Unrealised G/L (P&L)";
        return {
          ref: `JE-${String(i + 1).padStart(4, "0")}`,
          instrument: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: v.instrument.classification,
          eir: v.eir,
          openingCarry: opening,
          eirIncome,
          couponCash,
          closing: v.acCarryingValue,
          dr,
          cr,
        } as Row;
      })
      .sort((a, b) => b.eirIncome - a.eirIncome);
  }, []);

  const totalIncome = rows.reduce((s, r) => s + r.eirIncome, 0);
  const totalCoupon = rows.reduce((s, r) => s + r.couponCash, 0);
  const netAccretion = totalIncome - totalCoupon;

  const cols: DataTableColumn<Row>[] = [
    { key: "ref", header: "Ref", width: "80px" },
    { key: "instrument", header: "Instrument" },
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
      key: "eir",
      header: "EIR",
      align: "right",
      render: (r) => (
        <span className="text-primary font-medium">{fmtPct(r.eir)}</span>
      ),
    },
    {
      key: "openingCarry",
      header: "Opening CV",
      align: "right",
      render: (r) => fmtCompact(r.openingCarry),
    },
    {
      key: "eirIncome",
      header: "EIR Income (DR)",
      align: "right",
      render: (r) => (
        <span className="font-semibold text-dark-gray">
          {fmtCompact(r.eirIncome)}
        </span>
      ),
    },
    {
      key: "couponCash",
      header: "Coupon Cash (CR)",
      align: "right",
      render: (r) =>
        r.couponCash > 0 ? (
          fmtCompact(r.couponCash)
        ) : (
          <span className="text-dark-gray/40">—</span>
        ),
    },
    {
      key: "closing",
      header: "Closing CV",
      align: "right",
      render: (r) => fmtCompact(r.closing),
    },
    {
      key: "dr",
      header: "DR Account",
      render: (r) => <span className="text-xs text-dark-gray/70">{r.dr}</span>,
    },
    {
      key: "cr",
      header: "CR Account",
      render: (r) => <span className="text-xs text-dark-gray/70">{r.cr}</span>,
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <GovernanceBar
        requiredPermission="journal.post"
        context="maker"
        contextNote="Post EIR journals to draft → CFO checker approval → SAP GL batch"
        showPendingApprovals
      />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          EIR Journal Entries
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Effective interest rate amortisation journal entries · {rows.length}{" "}
          instruments · Year ended 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total EIR Income"
          value={fmtCompact(totalIncome)}
          subtitle="DR Accrued Interest / Investment"
          variant="highlight"
        />
        <StatCard
          title="Total Coupon Cash"
          value={fmtCompact(totalCoupon)}
          subtitle="CR Cash on coupon payments"
          variant="default"
        />
        <StatCard
          title="Net Accretion"
          value={fmtCompact(Math.abs(netAccretion))}
          subtitle={
            netAccretion >= 0
              ? "EIR premium amortisation"
              : "EIR discount accretion"
          }
          variant="default"
        />
        <StatCard
          title="Instruments with EIR"
          value={String(rows.length)}
          subtitle="AC and FVOCI instruments"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Journal Entry Log"
        description="One entry per instrument — EIR income recognition and coupon settlement"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.ref}
          emptyMessage="No EIR journal entries"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.instrument ?? "Journal Entry"}
        subtitle={selected?.ref}
        fields={
          selected
            ? [
                { label: "Reference", value: selected.ref },
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
                {
                  label: "EIR",
                  value: (
                    <span className="text-primary font-medium">
                      {fmtPct(selected.eir)}
                    </span>
                  ),
                },
                {
                  label: "Opening Carrying Value",
                  value: fmtCompact(selected.openingCarry),
                },
                {
                  label: "EIR Income (DR)",
                  value: (
                    <span className="font-semibold">
                      {fmtCompact(selected.eirIncome)}
                    </span>
                  ),
                },
                {
                  label: "Coupon Cash (CR)",
                  value:
                    selected.couponCash > 0
                      ? fmtCompact(selected.couponCash)
                      : "—",
                },
                {
                  label: "Closing Carrying Value",
                  value: fmtCompact(selected.closing),
                },
                { label: "DR Account", value: selected.dr, wide: true },
                { label: "CR Account", value: selected.cr, wide: true },
              ]
            : []
        }
      />
    </div>
  );
}
