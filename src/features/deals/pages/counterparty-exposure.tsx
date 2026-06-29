import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { useWorkflow } from "../../workflow/store";
import {
  COUNTERPARTY_MASTER,
  COUNTERPARTY_NAME_MAP,
} from "../data/counterparty-master";

const fmtN = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

const fmtFull = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);

function utilColor(pct: number) {
  if (pct >= 100) return { bar: "#DC2626", text: "text-red-600", bg: "bg-red-50" };
  if (pct >= 80) return { bar: "#D97706", text: "text-amber-600", bg: "bg-amber-50" };
  return { bar: "#16A34A", text: "text-emerald-600", bg: "bg-emerald-50" };
}

function UtilBar({ pct }: { pct: number }) {
  const c = utilColor(pct);
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, background: c.bar }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${c.text}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

interface ExposureRow {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  rating: string;
  exposure: number;
  limit: number;
  utilPct: number;
  dealCount: number;
  watchFlag?: boolean;
  deals: Array<{ id: string; assetClass: string; amount: number; status: string }>;
}

export function CounterpartyExposure() {
  const { dealSlips } = useWorkflow();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo<ExposureRow[]>(() => {
    const exposureMap = new Map<
      string,
      { exposure: number; dealCount: number; deals: ExposureRow["deals"] }
    >();

    for (const slip of dealSlips) {
      const cpName = slip.fields["counterparty"] ?? slip.fields["issuer"] ?? "";
      const cpId = COUNTERPARTY_NAME_MAP[cpName];
      if (!cpId) continue;

      const amountRaw = slip.fields["amount"] ?? slip.fields["faceValue"] ?? "0";
      const amount = parseFloat(amountRaw.replace(/[^0-9.]/g, "")) || 0;

      const existing = exposureMap.get(cpId);
      const dealEntry = {
        id: slip.id,
        assetClass: slip.assetClass,
        amount,
        status: slip.status,
      };

      if (existing) {
        existing.exposure += amount;
        existing.dealCount += 1;
        existing.deals.push(dealEntry);
      } else {
        exposureMap.set(cpId, { exposure: amount, dealCount: 1, deals: [dealEntry] });
      }
    }

    return COUNTERPARTY_MASTER.map((cp) => {
      const data = exposureMap.get(cp.id) ?? { exposure: 0, dealCount: 0, deals: [] };
      return {
        id: cp.id,
        name: cp.name,
        shortName: cp.shortName,
        sector: cp.sector,
        rating: cp.rating,
        exposure: data.exposure,
        limit: cp.creditLimit,
        utilPct: cp.creditLimit > 0 ? (data.exposure / cp.creditLimit) * 100 : 0,
        dealCount: data.dealCount,
        watchFlag: cp.watchFlag,
        deals: data.deals,
      };
    }).sort((a, b) => b.exposure - a.exposure);
  }, [dealSlips]);

  const totalExposure = useMemo(
    () => rows.reduce((s, r) => s + r.exposure, 0),
    [rows],
  );
  const breachCount = rows.filter((r) => r.utilPct >= 100).length;
  const warningCount = rows.filter((r) => r.utilPct >= 80 && r.utilPct < 100).length;
  const highestRow = rows[0];
  const activeCount = rows.filter((r) => r.dealCount > 0).length;

  return (
    <div className="space-y-6 p-5 lg:p-7">
      {/* ── Header ── */}
      <div>
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
          Deal Capture
        </p>
        <h1 className="text-xl font-bold tracking-tight text-dark-gray">
          Counterparty Exposure Monitor
        </h1>
        <p className="mt-1 text-xs text-dark-gray/45">
          Aggregated credit exposure vs. approved limits across all active deal counterparties.
          Limits set per NAICOM investment guidelines and internal credit policy.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <StatCardGrid>
        <StatCard
          title="Total Counterparty Exposure"
          value={fmtN(totalExposure)}
          subtitle="Across all deal counterparties"
          icon={<Users className="h-4 w-4" />}
          trend={{ label: "Live", direction: "neutral" }}
        />
        <StatCard
          title="Active Counterparties"
          value={activeCount.toString()}
          subtitle={`of ${COUNTERPARTY_MASTER.length} in master file`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Highest Single Exposure"
          value={highestRow ? fmtN(highestRow.exposure) : "—"}
          subtitle={highestRow?.shortName ?? ""}
          icon={<ShieldAlert className="h-4 w-4" />}
          trend={
            highestRow && highestRow.utilPct >= 80
              ? { label: `${highestRow.utilPct.toFixed(0)}% utilisation`, direction: "down" }
              : undefined
          }
        />
        <StatCard
          title="Limit Breaches / Warnings"
          value={`${breachCount} / ${warningCount}`}
          subtitle="Breach ≥ 100% · Warning ≥ 80%"
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={
            breachCount > 0
              ? { label: `${breachCount} breach`, direction: "down" }
              : { label: "No breaches", direction: "up" }
          }
        />
      </StatCardGrid>

      {/* ── Exposure Table ── */}
      <SectionCard
        title="Counterparty Exposure vs. Limit"
        description="Click a row to see per-deal breakdown · Limits per NAICOM Reg 17"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-195 text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                {[
                  "Counterparty",
                  "Sector",
                  "Rating",
                  "Exposure",
                  "Credit Limit",
                  "Utilisation",
                  "Deals",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="pb-2.5 pr-4 font-semibold uppercase tracking-wider text-dark-gray/40 first:pl-0 last:pr-0 last:text-right"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const c = utilColor(row.utilPct);
                const isExpanded = expandedId === row.id;
                const statusLabel =
                  row.utilPct >= 100
                    ? "Breach"
                    : row.utilPct >= 80
                      ? "Warning"
                      : row.dealCount === 0
                        ? "No Exposure"
                        : "OK";
                const statusVariant =
                  row.utilPct >= 100
                    ? "danger"
                    : row.utilPct >= 80
                      ? "warning"
                      : row.dealCount === 0
                        ? "neutral"
                        : "success";

                return (
                  <>
                    <tr
                      key={row.id}
                      onClick={() =>
                        row.dealCount > 0
                          ? setExpandedId(isExpanded ? null : row.id)
                          : undefined
                      }
                      className={`border-b border-border/50 transition-colors ${
                        row.dealCount > 0 ? "cursor-pointer hover:bg-surface-muted" : ""
                      } ${isExpanded ? "bg-pale-red/40" : ""}`}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {row.dealCount > 0 ? (
                            isExpanded ? (
                              <ChevronUp className="h-3 w-3 shrink-0 text-dark-gray/30" />
                            ) : (
                              <ChevronDown className="h-3 w-3 shrink-0 text-dark-gray/30" />
                            )
                          ) : (
                            <span className="h-3 w-3 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-dark-gray">
                              {row.shortName}
                              {row.watchFlag && (
                                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold uppercase text-amber-600 bg-amber-50">
                                  Watch
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-dark-gray/40 truncate max-w-40">
                              {row.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-dark-gray/60">{row.sector}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-dark-gray/80">{row.rating}</span>
                      </td>
                      <td className="py-3 pr-4 font-semibold tabular-nums text-dark-gray">
                        {row.exposure > 0 ? fmtN(row.exposure) : <span className="text-dark-gray/30">—</span>}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-dark-gray/60">
                        {fmtN(row.limit)}
                      </td>
                      <td className="py-3 pr-4">
                        {row.dealCount > 0 ? (
                          <UtilBar pct={row.utilPct} />
                        ) : (
                          <span className="text-dark-gray/30">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center tabular-nums text-dark-gray/60">
                        {row.dealCount > 0 ? row.dealCount : <span className="text-dark-gray/30">—</span>}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </td>
                    </tr>

                    {/* ── Expanded deal breakdown ── */}
                    {isExpanded && row.deals.length > 0 && (
                      <tr key={`${row.id}-detail`} className="bg-surface-muted/60">
                        <td colSpan={8} className="px-8 py-4">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-dark-gray/40">
                            Deal Breakdown — {row.shortName}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-130 text-xs">
                              <thead>
                                <tr className="border-b border-border/50">
                                  {["Deal ID", "Asset Class", "Amount", "Status"].map((h) => (
                                    <th
                                      key={h}
                                      className="pb-1.5 pr-4 text-left font-semibold uppercase tracking-wider text-dark-gray/30 last:pr-0 last:text-right"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {row.deals.map((d) => (
                                  <tr key={d.id} className="border-b border-border/30 last:border-0">
                                    <td className="py-2 pr-4 font-mono text-dark-gray/60">
                                      {d.id}
                                    </td>
                                    <td className="py-2 pr-4 text-dark-gray/70">
                                      {d.assetClass}
                                    </td>
                                    <td className="py-2 pr-4 font-semibold tabular-nums text-dark-gray">
                                      {d.amount > 0 ? fmtFull(d.amount) : "—"}
                                    </td>
                                    <td className="py-2 text-right">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          d.status === "Settled" || d.status === "Active"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : d.status === "Approved" || d.status === "Pending Settlement"
                                              ? "bg-sky-50 text-sky-700"
                                              : d.status === "Rejected" || d.status === "Returned for Amendment"
                                                ? "bg-red-50 text-red-600"
                                                : "bg-amber-50 text-amber-700"
                                        }`}
                                      >
                                        {d.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Limit summary */}
                          <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${c.bg}`}>
                            {row.utilPct >= 100 ? (
                              <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${c.text}`} />
                            ) : (
                              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${c.text}`} />
                            )}
                            <span className={c.text}>
                              Total exposure {fmtFull(row.exposure)} of {fmtFull(row.limit)} limit
                              ({row.utilPct.toFixed(1)}% utilisation)
                              {row.utilPct >= 100
                                ? " — LIMIT BREACHED. Escalate to CRO immediately."
                                : row.utilPct >= 80
                                  ? " — approaching limit. Review before additional exposure."
                                  : " — within approved limit."}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Legend ── */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-dark-gray/35">
            Utilisation
          </p>
          {[
            { label: "OK (< 80%)", color: "#16A34A" },
            { label: "Warning (80–99%)", color: "#D97706" },
            { label: "Breach (≥ 100%)", color: "#DC2626" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: color }}
              />
              <span className="text-[10px] text-dark-gray/50">{label}</span>
            </div>
          ))}
          <span className="ml-auto text-[10px] text-dark-gray/35">
            Limits per NAICOM Regulation 17 & internal credit policy · Click row for deal detail
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
