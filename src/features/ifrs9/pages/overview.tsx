import { Wallet, ShieldAlert, Layers, AlertTriangle } from "lucide-react";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";
import { fmtCompact, fmtPct } from "../utils/format";
import type { Stage } from "../engine/types";

const STAGE_LABELS: Record<Stage, string> = {
  1: "Stage 1 — Performing",
  2: "Stage 2 — Underperforming",
  3: "Stage 3 — Credit-impaired",
};

const STAGE_TONE: Record<Stage, "stage1" | "stage2" | "stage3"> = {
  1: "stage1",
  2: "stage2",
  3: "stage3",
};

export function IFRS9Overview() {
  const { result, assumptions } = useIFRS9();
  const { totals, byStage, bySpecification } = result;

  const stage3 = byStage.find((s) => s.stage === 3);
  const stage2 = byStage.find((s) => s.stage === 2);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            IFRS 9 & ECL — Debt Securities
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            Reporting date ·{" "}
            {assumptions.reportingDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {" · "}Sovereign recovery{" "}
            {fmtPct(assumptions.sovereignRecoveryRate, 0)}
          </p>
        </div>
        <Badge variant="brand" size="lg">
          {totals.instrumentCount} instruments under measurement
        </Badge>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Exposure (LCY)"
          value={fmtCompact(totals.exposureLcy)}
          subtitle="Carrying amount, all stages"
          icon={<Wallet className="h-4 w-4" />}
          variant="highlight"
        />
        <StatCard
          title="Total ECL (LCY)"
          value={fmtCompact(totals.impairmentLcy)}
          subtitle={`Coverage ${fmtPct(totals.coverageRatio, 2)}`}
          icon={<ShieldAlert className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="Stage 2 Exposure"
          value={fmtCompact(stage2?.exposure ?? 0)}
          subtitle={`${stage2?.count ?? 0} instruments · ${fmtPct(stage2?.coverageRatio ?? 0, 2)}`}
          icon={<Layers className="h-4 w-4" />}
          variant="warning"
        />
        <StatCard
          title="Stage 3 Exposure"
          value={fmtCompact(stage3?.exposure ?? 0)}
          subtitle={`${stage3?.count ?? 0} instruments · ${fmtPct(stage3?.coverageRatio ?? 0, 2)}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="danger"
        />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Stage Distribution"
          description="Exposure & impairment by IFRS 9 stage"
        >
          <div className="space-y-3">
            {([1, 2, 3] as Stage[]).map((st) => {
              const row = byStage.find((b) => b.stage === st);
              const exposure = row?.exposure ?? 0;
              const pct =
                totals.exposureLcy > 0 ? exposure / totals.exposureLcy : 0;
              return (
                <div key={st} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-dark-gray">
                      <Badge variant={STAGE_TONE[st]} size="sm" dot>
                        {STAGE_LABELS[st]}
                      </Badge>
                      <span className="text-xs text-dark-gray/55">
                        {row?.count ?? 0} items
                      </span>
                    </span>
                    <span className="text-xs font-medium text-dark-gray/70">
                      {fmtCompact(exposure)} · {fmtPct(pct, 1)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-light-gray">
                    <div
                      className={
                        st === 1
                          ? "h-full bg-emerald-500"
                          : st === 2
                            ? "h-full bg-amber-500"
                            : "h-full bg-primary"
                      }
                      style={{ width: `${Math.min(100, pct * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-dark-gray/55">
                    ECL:{" "}
                    <span className="font-medium text-dark-gray/75">
                      {fmtCompact(row?.impairment ?? 0)}
                    </span>
                    {"  ·  "}Coverage {fmtPct(row?.coverageRatio ?? 0, 2)}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="By Asset Specification"
          description="Exposure & impairment across debt securities"
        >
          <div className="space-y-3">
            {bySpecification
              .filter((s) => s.specification !== "TOTAL")
              .map((row) => {
                const pct =
                  totals.exposureLcy > 0
                    ? row.exposure / totals.exposureLcy
                    : 0;
                return (
                  <div key={row.specification} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-dark-gray">
                        {row.specification}
                        <span className="ml-2 text-xs text-dark-gray/55">
                          {row.count} items
                        </span>
                      </span>
                      <span className="text-xs font-medium text-dark-gray/70">
                        {fmtCompact(row.exposure)} · {fmtPct(pct, 1)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-light-gray">
                      <div
                        className="h-full bg-deep-red"
                        style={{ width: `${Math.min(100, pct * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-dark-gray/55">
                      ECL:{" "}
                      <span className="font-medium text-dark-gray/75">
                        {fmtCompact(row.impairment)}
                      </span>
                      {"  ·  "}Coverage {fmtPct(row.coverageRatio, 2)}
                    </div>
                  </div>
                );
              })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
