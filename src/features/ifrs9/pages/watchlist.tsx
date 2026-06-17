import { useState, useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { StageBadge, Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import { AlertTriangle, ShieldAlert, Eye, CheckCircle2 } from "lucide-react";
import { useIFRS9 } from "../store";
import type { SecurityComputed } from "../engine/types";
import { fmtCompact, fmtPct } from "../utils/format";

const VALUATION_DATE = "28 May 2026";

// Management actions that can be assigned to watchlisted instruments
const ACTIONS = [
  "Engage issuer for status update",
  "Request financial statements",
  "Escalate to credit committee",
  "Initiate recovery proceedings",
  "Obtain additional collateral",
  "Place on non-accrual",
  "Monitor — no action required",
];

interface WatchRow extends Record<string, unknown> {
  sn: number;
  counterparty: string;
  assetSpecification: string;
  currency: string;
  carryingAmountLcy: number;
  performanceStatus: string;
  daysPastDue: number;
  finalStage: 1 | 2 | 3;
  ecl: number;
  coverageRatio: number;
  ratingEquivalent: string;
  action: string;
  addedToWatchlist: string;
}

const DEFAULT_ACTIONS: Record<number, string> = {
  // Stage 3
  3: "Initiate recovery proceedings",
  // Stage 2
  2: "Engage issuer for status update",
};

function toWatchRow(r: SecurityComputed, idx: number): WatchRow {
  const added = new Date(
    new Date("2026-05-28").getTime() - (idx % 14) * 24 * 3600 * 1000,
  )
    .toISOString()
    .slice(0, 10);
  return {
    sn: r.sn,
    counterparty: r.counterparty,
    assetSpecification: r.assetSpecification,
    currency: r.currency,
    carryingAmountLcy: r.carryingAmountLcy,
    performanceStatus: r.performanceStatus,
    daysPastDue: r.daysPastDue,
    finalStage: r.finalStage,
    ecl: r.ecl,
    coverageRatio: r.coverageRatio,
    ratingEquivalent: r.ratingEquivalent,
    action: DEFAULT_ACTIONS[r.finalStage] ?? "Monitor — no action required",
    addedToWatchlist: added,
  };
}

const PERF_VARIANT: Record<
  string,
  "danger" | "warning" | "neutral" | "success"
> = {
  Performing: "success",
  Watchlist: "warning",
  Substandard: "warning",
  Doubtful: "danger",
  Loss: "danger",
  Default: "danger",
};

export function IFRS9Watchlist() {
  const { result } = useIFRS9();
  const [selected, setSelected] = useState<WatchRow | null>(null);
  const [actionMap, setActionMap] = useState<Record<number, string>>({});

  const { stage2Rows, stage3Rows, watchlistRows } = useMemo(() => {
    const s2: WatchRow[] = [];
    const s3: WatchRow[] = [];
    const wl: WatchRow[] = [];

    result.rows.forEach((r, i) => {
      if (r.finalStage === 3) {
        s3.push(toWatchRow(r, i));
      } else if (r.finalStage === 2) {
        s2.push(toWatchRow(r, i));
      } else if (r.performanceStatus === "Watchlist") {
        wl.push(toWatchRow(r, i));
      }
    });

    return {
      stage2Rows: s2 as WatchRow[],
      stage3Rows: s3 as WatchRow[],
      watchlistRows: wl as WatchRow[],
    };
  }, [result.rows]);

  const totalStage23 =
    stage2Rows.length + stage3Rows.length + watchlistRows.length;
  const totalExposure = [...stage2Rows, ...stage3Rows, ...watchlistRows].reduce(
    (s, r) => s + r.carryingAmountLcy,
    0,
  );
  const totalECL = [...stage2Rows, ...stage3Rows, ...watchlistRows].reduce(
    (s, r) => s + r.ecl,
    0,
  );
  const avgCoverage = totalExposure > 0 ? totalECL / totalExposure : 0;

  const cols: DataTableColumn<WatchRow>[] = [
    { key: "sn", header: "SN", width: "55px" },
    { key: "counterparty", header: "Counterparty" },
    {
      key: "assetSpecification",
      header: "Specification",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.assetSpecification}
        </Badge>
      ),
    },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "carryingAmountLcy",
      header: "Carrying (LCY)",
      align: "right",
      render: (r) => fmtCompact(r.carryingAmountLcy),
    },
    { key: "daysPastDue", header: "DPD", align: "right" },
    {
      key: "performanceStatus",
      header: "Performance",
      render: (r) => (
        <Badge
          variant={PERF_VARIANT[r.performanceStatus] ?? "neutral"}
          size="sm"
        >
          {r.performanceStatus}
        </Badge>
      ),
    },
    {
      key: "finalStage",
      header: "Stage",
      render: (r) => <StageBadge stage={r.finalStage} />,
    },
    {
      key: "ecl",
      header: "ECL (LCY)",
      align: "right",
      render: (r) => (
        <span className="text-primary font-medium">{fmtCompact(r.ecl)}</span>
      ),
    },
    {
      key: "coverageRatio",
      header: "Coverage",
      align: "right",
      render: (r) => fmtPct(r.coverageRatio),
    },
    {
      key: "action",
      header: "Management Action",
      render: (r) => (
        <select
          className="text-xs rounded border border-border bg-white px-2 py-1 text-dark-gray focus:outline-none focus:border-primary"
          value={actionMap[r.sn] ?? r.action}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            setActionMap((prev) => ({ ...prev, [r.sn]: e.target.value }));
          }}
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            IFRS 9 — Credit Risk Monitoring
          </p>
          <h1 className="mt-1 text-2xl font-bold text-dark-gray">
            Watchlist Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Instruments under heightened credit monitoring · Reporting date:{" "}
            {VALUATION_DATE}
          </p>
        </div>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Watchlisted"
          value={String(totalStage23)}
          subtitle="Stage 2, Stage 3 & Watchlist"
          variant="warning"
        />
        <StatCard
          title="Stage 3 (Credit-Impaired)"
          value={String(stage3Rows.length)}
          subtitle="Requires impairment committee review"
          variant="danger"
        />
        <StatCard
          title="Stage 2 (SICR)"
          value={String(stage2Rows.length)}
          subtitle="Significant increase in credit risk"
          variant="warning"
        />
        <StatCard
          title="Total Exposure"
          value={fmtCompact(totalExposure)}
          subtitle={`ECL: ${fmtCompact(totalECL)} · Coverage: ${fmtPct(avgCoverage)}`}
          variant="default"
        />
      </StatCardGrid>

      {/* Stage 3 — Credit Impaired */}
      {stage3Rows.length > 0 && (
        <SectionCard
          title="Stage 3 — Credit-Impaired Instruments"
          description="Lifetime ECL applied. Impairment committee approval required for material movements."
        >
          <DataTable<WatchRow>
            columns={cols}
            data={stage3Rows}
            keyExtractor={(r) => String(r.sn)}
            pageSize={20}
            onRowClick={setSelected}
          />
        </SectionCard>
      )}

      {/* Stage 2 — SICR */}
      {stage2Rows.length > 0 && (
        <SectionCard
          title="Stage 2 — Significant Increase in Credit Risk"
          description="Lifetime ECL. Management review required. Instruments must be monitored until downgrade or upgrade resolved."
        >
          <DataTable<WatchRow>
            columns={cols}
            data={stage2Rows}
            keyExtractor={(r) => String(r.sn)}
            pageSize={20}
            onRowClick={setSelected}
          />
        </SectionCard>
      )}

      {/* Performance Status Watchlist */}
      {watchlistRows.length > 0 && (
        <SectionCard
          title="Stage 1 — Performance Status: Watchlist"
          description="Currently Stage 1 but flagged as Watchlist by credit analyst. Monitor for SICR indicators."
        >
          <DataTable<WatchRow>
            columns={cols}
            data={watchlistRows}
            keyExtractor={(r) => String(r.sn)}
            pageSize={20}
            onRowClick={setSelected}
          />
        </SectionCard>
      )}

      {totalStage23 === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success mb-3" />
          <p className="text-base font-semibold text-dark-gray">
            No instruments on watchlist
          </p>
          <p className="mt-1 text-sm text-gray-400">
            All instruments are currently performing in Stage 1.
          </p>
        </div>
      )}

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.counterparty ?? "Watchlist Detail"}
        subtitle={`SN ${selected?.sn} · Added ${selected?.addedToWatchlist}`}
        fields={
          selected
            ? [
                { label: "SN", value: String(selected.sn) },
                {
                  label: "Specification",
                  value: (
                    <Badge variant="neutral" size="sm">
                      {selected.assetSpecification}
                    </Badge>
                  ),
                },
                { label: "Currency", value: selected.currency },
                {
                  label: "Carrying Amount (LCY)",
                  value: fmtCompact(selected.carryingAmountLcy),
                },
                { label: "Days Past Due", value: String(selected.daysPastDue) },
                {
                  label: "Performance Status",
                  value: (
                    <Badge
                      variant={
                        PERF_VARIANT[selected.performanceStatus] ?? "neutral"
                      }
                      size="sm"
                    >
                      {selected.performanceStatus}
                    </Badge>
                  ),
                },
                {
                  label: "Final Stage",
                  value: <StageBadge stage={selected.finalStage} />,
                },
                {
                  label: "Rating Equivalent",
                  value: selected.ratingEquivalent,
                },
                {
                  label: "ECL (LCY)",
                  value: (
                    <span className="text-primary font-semibold">
                      {fmtCompact(selected.ecl)}
                    </span>
                  ),
                },
                {
                  label: "Coverage Ratio",
                  value: fmtPct(selected.coverageRatio),
                },
                {
                  label: "Management Action",
                  value: actionMap[selected.sn] ?? selected.action,
                  wide: true,
                },
                {
                  label: "Added to Watchlist",
                  value: selected.addedToWatchlist,
                },
              ]
            : []
        }
      />
    </div>
  );
}
