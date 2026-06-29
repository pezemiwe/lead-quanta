import { AlertTriangle, ShieldCheck, Info } from "lucide-react";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";

// -- real computed risk metrics ------------------------------------------------
const vals = BOOK_VALUATIONS;
const totals = BOOK_COMPUTED.totals;
const bySector = BOOK_COMPUTED.bySector;

const totalBSV = totals.totalBSValueNGN;
const totalDV01 = vals.reduce((s, v) => s + v.risk.dv01, 0);
const wDur =
  vals.reduce(
    (s, v) => s + v.risk.modifiedDuration * v.balanceSheetValueNGN,
    0,
  ) / (totalBSV || 1);

// 1-day VaR approx: DV01 × 25bps shock (1-day 95%)
const varDay95 = Math.abs(totalDV01) * 25;
const varDay99 = varDay95 * 1.54;
const var10Day95 = varDay95 * Math.sqrt(10);
const cvar95 = varDay95 * 1.43;

const VAR_METRICS = [
  {
    label: "1-Day VaR (95%)",
    value: fmtCompact(varDay95),
    pct: fmtPct(varDay95 / totalBSV),
    status: varDay95 / totalBSV > 0.015 ? "watch" : "normal",
  },
  {
    label: "1-Day VaR (99%)",
    value: fmtCompact(varDay99),
    pct: fmtPct(varDay99 / totalBSV),
    status: varDay99 / totalBSV > 0.02 ? "watch" : "normal",
  },
  {
    label: "10-Day VaR (95%)",
    value: fmtCompact(var10Day95),
    pct: fmtPct(var10Day95 / totalBSV),
    status:
      var10Day95 / totalBSV > 0.04
        ? "breached"
        : var10Day95 / totalBSV > 0.03
          ? "watch"
          : "normal",
  },
  {
    label: "Expected Shortfall (CVaR 95%)",
    value: fmtCompact(cvar95),
    pct: fmtPct(cvar95 / totalBSV),
    status: "normal",
  },
];

// Top-5 issuer concentration
const issuerMap = new Map<string, number>();
BOOK_INSTRUMENTS.forEach((inst, i) => {
  const bsv = vals[i]?.balanceSheetValueNGN ?? 0;
  issuerMap.set(inst.issuer, (issuerMap.get(inst.issuer) ?? 0) + bsv);
});
const sortedIssuers = [...issuerMap.entries()].sort((a, b) => b[1] - a[1]);
const top5BSV = sortedIssuers.slice(0, 5).reduce((s, [, v]) => s + v, 0);
const top10BSV = sortedIssuers.slice(0, 10).reduce((s, [, v]) => s + v, 0);
const topIssuer = sortedIssuers[0];
const topSector = bySector[0];
const ngnBSV = BOOK_INSTRUMENTS.reduce(
  (s, inst, i) =>
    inst.currency === "NGN" ? s + (vals[i]?.balanceSheetValueNGN ?? 0) : s,
  0,
);

const CONCENTRATION = [
  {
    label: "Top 5 holdings as % of portfolio",
    value: fmtPct(top5BSV / totalBSV),
    limit: "35%",
    status:
      top5BSV / totalBSV > 0.35
        ? "breached"
        : top5BSV / totalBSV > 0.3
          ? "watch"
          : "ok",
  },
  {
    label: "Top 10 holdings as % of portfolio",
    value: fmtPct(top10BSV / totalBSV),
    limit: "60%",
    status:
      top10BSV / totalBSV > 0.6
        ? "breached"
        : top10BSV / totalBSV > 0.5
          ? "watch"
          : "ok",
  },
  {
    label: `Single issuer limit (${topIssuer[0].slice(0, 30)})`,
    value: fmtPct(topIssuer[1] / totalBSV),
    limit: "10%",
    status:
      topIssuer[1] / totalBSV > 0.1
        ? "breached"
        : topIssuer[1] / totalBSV > 0.08
          ? "watch"
          : "ok",
  },
  {
    label: `Single sector limit (${topSector?.sector ?? "—"})`,
    value: fmtPct(topSector?.pctOfPortfolio ?? 0),
    limit: "30%",
    status:
      (topSector?.pctOfPortfolio ?? 0) > 0.3
        ? "breached"
        : (topSector?.pctOfPortfolio ?? 0) > 0.25
          ? "watch"
          : "ok",
  },
  {
    label: "Single currency (NGN)",
    value: fmtPct(ngnBSV / totalBSV),
    limit: "80%",
    status:
      ngnBSV / totalBSV > 0.8
        ? "breached"
        : ngnBSV / totalBSV > 0.7
          ? "watch"
          : "ok",
  },
];

// Credit quality distribution
const fvtplCount = BOOK_INSTRUMENTS.filter(
  (i) => i.classification === "FVTPL",
).length;
const ociReserve = BOOK_COMPUTED.totals.totalOCIReserveNGN;

const STRESS = [
  {
    scenario: "2008 Global Financial Crisis",
    impact: fmtCompact(-totalBSV * 0.045),
    pct: "-4.5%",
    severity: "high",
  },
  {
    scenario: "2016 Nigeria Recession",
    impact: fmtCompact(-totalBSV * 0.035),
    pct: "-3.5%",
    severity: "medium",
  },
  {
    scenario: "Oil Price Crash (-50%)",
    impact: fmtCompact(-totalBSV * 0.027),
    pct: "-2.7%",
    severity: "medium",
  },
  {
    scenario: "NGN Devaluation (-30%)",
    impact: fmtCompact(-totalBSV * 0.022),
    pct: "-2.2%",
    severity: "low",
  },
  {
    scenario: `CBN Rate Hike (+300bps): DV01×300`,
    impact: fmtCompact(-Math.abs(totalDV01) * 300),
    pct: fmtPct((-Math.abs(totalDV01) * 300) / totalBSV),
    severity: "medium",
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "ok" || status === "normal")
    return (
      <span className="flex items-center gap-1 text-success text-xs">
        <ShieldCheck className="h-3.5 w-3.5" /> Within limit
      </span>
    );
  if (status === "watch")
    return (
      <span className="flex items-center gap-1 text-yellow-600 text-xs">
        <Info className="h-3.5 w-3.5" /> Near limit
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-danger text-xs">
      <AlertTriangle className="h-3.5 w-3.5" /> Breached
    </span>
  );
}

function SeverityBadge({ s }: { s: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-danger",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[s]}`}
    >
      {s}
    </span>
  );
}

export function RiskAnalytics() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Risk Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Value at Risk, concentration limits, and stress test scenarios — as at
          28 May 2026
        </p>
      </div>

      {/* key risk KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Portfolio DV01",
            value: fmtCompact(Math.abs(totalDV01)),
            sub: "₦ per 1bp",
          },
          {
            label: "Modified Duration",
            value: wDur.toFixed(2) + " yrs",
            sub: "weighted avg",
          },
          {
            label: "FVTPL Instruments",
            value: String(fvtplCount),
            sub: `${fmtPct(fvtplCount / BOOK_INSTRUMENTS.length)} mark-to-market`,
          },
          {
            label: "OCI Reserve",
            value: fmtCompact(Math.abs(ociReserve)),
            sub: ociReserve >= 0 ? "Unrealised gain" : "Unrealised loss",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="mt-2 text-xl font-bold text-dark-gray">{k.value}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* VaR */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {VAR_METRICS.map((v) => (
          <div
            key={v.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{v.label}</p>
            <p className="mt-2 text-xl font-bold text-dark-gray">{v.value}</p>
            <p className="text-xs text-gray-400">{v.pct} of AuM</p>
            <div className="mt-2">
              <StatusBadge status={v.status} />
            </div>
          </div>
        ))}
      </div>

      {/* concentration limits */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Concentration Limits
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-400">
              <th className="pb-2 text-left font-medium">Limit</th>
              <th className="pb-2 text-right font-medium">Current</th>
              <th className="pb-2 text-right font-medium">Limit</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {CONCENTRATION.map((c) => (
              <tr
                key={c.label}
                className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
              >
                <td className="py-3 text-dark-gray">{c.label}</td>
                <td className="py-3 text-right font-semibold text-dark-gray">
                  {c.value}
                </td>
                <td className="py-3 text-right text-gray-400">{c.limit}</td>
                <td className="py-3 text-right">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* top issuer concentrations */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Top Issuer Exposures
        </h2>
        <div className="space-y-2">
          {sortedIssuers.slice(0, 8).map(([issuer, bsv]) => {
            const pct = bsv / totalBSV;
            return (
              <div key={issuer} className="flex items-center gap-3">
                <span className="w-52 truncate text-xs text-gray-500">
                  {issuer}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(((pct * 100) / 15) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="w-16 text-right text-xs font-semibold text-dark-gray">
                  {fmtPct(pct)}
                </span>
                <span className="w-20 text-right text-xs text-gray-400">
                  {fmtCompact(bsv)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* stress tests */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Stress Test Scenarios
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-400">
              <th className="pb-2 text-left font-medium">Scenario</th>
              <th className="pb-2 text-right font-medium">P&L Impact (?)</th>
              <th className="pb-2 text-right font-medium">% of AuM</th>
              <th className="pb-2 text-right font-medium">Severity</th>
            </tr>
          </thead>
          <tbody>
            {STRESS.map((s) => (
              <tr
                key={s.scenario}
                className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
              >
                <td className="py-3 text-dark-gray">{s.scenario}</td>
                <td className="py-3 text-right font-semibold text-danger">
                  {s.impact}
                </td>
                <td className="py-3 text-right text-danger">{s.pct}</td>
                <td className="py-3 text-right">
                  <SeverityBadge s={s.severity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Credit quality distribution */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Credit Quality Distribution
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Sovereign / Gov't",
              count: BOOK_INSTRUMENTS.filter(
                (i) =>
                  i.issuer?.toLowerCase().includes("fgn") ||
                  i.issuer?.toLowerCase().includes("cbn") ||
                  i.issuer?.toLowerCase().includes("federal"),
              ).length,
              color: "text-success",
              note: "Zero credit risk weight",
            },
            {
              label: "Investment Grade",
              count: BOOK_INSTRUMENTS.filter(
                (i) =>
                  !i.issuer?.toLowerCase().includes("fgn") &&
                  !i.issuer?.toLowerCase().includes("cbn") &&
                  i.classification !== "FVTPL",
              ).length,
              color: "text-sky-600",
              note: "Bank & corporate bonds",
            },
            {
              label: "Mark-to-Market",
              count: fvtplCount,
              color: "text-primary",
              note: "FVTPL / equities",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-4">
              <p className={`text-sm font-semibold ${s.color}`}>{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-dark-gray">
                {s.count}
              </p>
              <p className="text-xs text-gray-400">instruments</p>
              <p className="mt-2 text-xs text-gray-500">{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
