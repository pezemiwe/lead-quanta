import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { Badge } from "../../../components/shared/badge";
import { useGovernance, INVESTMENT_LIMITS } from "../../../context/governance";
import { usePersona } from "../../../context/persona";
import {
  fmtCompact,
  fmtPct,
  BOOK_COMPUTED,
} from "../../portfolio/engine/book-compute";

const STATUS_META: Record<
  string,
  { icon: React.ElementType; cls: string; label: string }
> = {
  ok: { icon: CheckCircle, cls: "text-emerald-600", label: "Within Limit" },
  warning: {
    icon: AlertTriangle,
    cls: "text-amber-600",
    label: "Approaching Limit",
  },
  breach: { icon: XCircle, cls: "text-red-600", label: "Limit Breach" },
};

export function InvestmentLimits() {
  const { logAction } = useGovernance();
  const { persona } = usePersona();
  const [waived, setWaived] = useState<string[]>([]);

  const canManage = ["Chief Financial Officer", "Chief Risk Officer"].includes(
    persona.role,
  );

  const handleWaive = (id: string, name: string) => {
    setWaived((prev) => [...prev, id]);
    logAction({
      user: persona.name,
      role: persona.role,
      module: "Portfolio",
      action: "Limit Exception Waived",
      detail: `Waiver granted for: ${name}. Ref: WAV-${Date.now()}`,
      status: "warning",
      ip: "10.0.1.xx",
    });
  };

  const totalBSV = BOOK_COMPUTED.totals.totalBSValueNGN;
  const okCount = INVESTMENT_LIMITS.filter((l) => l.status === "ok").length;
  const warnCount = INVESTMENT_LIMITS.filter(
    (l) => l.status === "warning",
  ).length;
  const breachCount = INVESTMENT_LIMITS.filter(
    (l) => l.status === "breach",
  ).length;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Investment Limit Controls
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          NAICOM / CBN investment guidelines compliance · Total portfolio: ₦
          {fmtCompact(totalBSV)}
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Portfolio Value"
          value={`₦${fmtCompact(totalBSV)}`}
          subtitle="Book value (NGN)"
          variant="highlight"
        />
        <StatCard
          title="Limits OK"
          value={String(okCount)}
          subtitle="Within regulatory bands"
          variant="default"
        />
        <StatCard
          title="Approaching Limit"
          value={String(warnCount)}
          subtitle="Within 80% of ceiling"
          variant="default"
        />
        <StatCard
          title="Limit Breaches"
          value={String(breachCount)}
          subtitle="Require immediate action"
          variant={breachCount > 0 ? "highlight" : "default"}
        />
      </StatCardGrid>

      <SectionCard
        title="Investment Limit Dashboard"
        description="Per NAICOM Investment Guidelines and CBN Prudential Guidelines for Insurance Companies"
      >
        <div className="space-y-3">
          {INVESTMENT_LIMITS.map((lim) => {
            const meta = STATUS_META[lim.status];
            const StatusIcon = meta.icon;
            const isWaived = waived.includes(lim.id);
            const barPct =
              lim.direction === "max"
                ? Math.min((lim.currentPct / lim.limitPct) * 100, 100)
                : Math.min((lim.limitPct / lim.currentPct) * 100, 100);
            const barColour =
              lim.status === "breach"
                ? "bg-red-500"
                : lim.status === "warning"
                  ? "bg-amber-400"
                  : "bg-emerald-500";

            return (
              <div
                key={lim.id}
                className={`rounded-lg border p-4 transition-colors ${
                  lim.status === "breach"
                    ? "border-red-200 bg-red-50/30"
                    : lim.status === "warning"
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-border bg-surface"
                }`}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <p className="text-sm font-semibold text-dark-gray">
                          {lim.name}
                        </p>
                        <p className="text-xs text-dark-gray/50">
                          {lim.regulation}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-dark-gray/50">
                            {lim.direction === "max" ? "Maximum" : "Minimum"}
                          </p>
                          <p className="text-sm font-bold text-dark-gray">
                            {lim.limitPct}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-dark-gray/50">Current</p>
                          <p className={`text-sm font-bold ${meta.cls}`}>
                            {lim.currentPct.toFixed(1)}%
                          </p>
                        </div>
                        {lim.currentNGN > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-dark-gray/50">
                              Value (NGN)
                            </p>
                            <p className="text-sm font-medium text-dark-gray">
                              ₦{fmtCompact(lim.currentNGN)}
                            </p>
                          </div>
                        )}
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isWaived
                              ? "bg-blue-100 text-blue-700"
                              : lim.status === "breach"
                                ? "bg-red-100 text-red-700"
                                : lim.status === "warning"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isWaived ? "Waived" : meta.label}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-dark-gray/10">
                        <div
                          className={`h-2 rounded-full transition-all ${barColour}`}
                          style={{ width: `${Math.min(barPct, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-dark-gray/40">
                        {lim.direction === "max"
                          ? `${lim.currentPct.toFixed(1)}% used of ${lim.limitPct}% maximum`
                          : `${lim.currentPct.toFixed(1)}% held — minimum ${lim.limitPct}% required`}
                      </p>
                    </div>
                    {/* Waiver button */}
                    {lim.status === "warning" && canManage && !isWaived && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleWaive(lim.id, lim.name)}
                          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          Grant Monitoring Waiver
                        </button>
                      </div>
                    )}
                    {lim.status === "breach" && (
                      <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                        <p className="text-xs font-medium text-red-700">
                          ⚠ Limit breach — immediate rebalancing required. New
                          purchases in this category are blocked pending
                          remediation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Guideline reference */}
      <SectionCard
        title="Regulatory Reference"
        description="Key NAICOM investment guideline thresholds"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {[
            [
              "Federal Government Securities",
              "Min 25% — floors qualify as statutory deposit",
            ],
            ["State Government Bonds", "Max 10% of total investments"],
            ["Corporate Bonds (NSE-listed)", "Max 10% of total investments"],
            ["Equities (NSE/NGX listed)", "Max 20% of total investments"],
            ["Foreign Investments", "Max 10% — CBN FX guidelines apply"],
            ["Unquoted / Private", "Max 10% — includes private equity"],
            ["Single Issuer Concentration", "Max 10% in any single name"],
            ["Real Estate", "Max 25% — includes mortgage bonds"],
            ["Infrastructure Bonds", "Max 30% — encouraged asset class"],
            ["Money Market", "Max 30% — includes T-bills & placements"],
          ].map(([rule, note]) => (
            <div
              key={rule}
              className="rounded-md border border-border bg-surface p-3"
            >
              <p className="font-medium text-dark-gray">{rule}</p>
              <p className="mt-0.5 text-xs text-dark-gray/60">{note}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
