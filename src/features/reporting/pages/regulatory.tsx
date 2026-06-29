import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";
import { ShieldCheck, AlertTriangle, Info } from "lucide-react";

const totals = BOOK_COMPUTED.totals;
const bySector = BOOK_COMPUTED.bySector;
const totalBSV = totals.totalBSValueNGN;

// Top issuer concentrations
const issuerMap = new Map<string, number>();
BOOK_INSTRUMENTS.forEach((inst, i) => {
  const bsv = BOOK_VALUATIONS[i]?.balanceSheetValueNGN ?? 0;
  issuerMap.set(inst.issuer, (issuerMap.get(inst.issuer) ?? 0) + bsv);
});
const sortedIssuers = [...issuerMap.entries()].sort((a, b) => b[1] - a[1]);

// Assumed capital base: 20% of AuM as proxy
const capitalBase = totalBSV * 0.2;

type LimitRow = {
  category: string;
  entity: string;
  exposure: number;
  limit: number;
  limitPct: number;
  exposurePct: number;
  utilisation: number;
  status: "ok" | "watch" | "breached";
};

const ISSUER_LIMITS: LimitRow[] = sortedIssuers
  .slice(0, 8)
  .map(([issuer, bsv]) => {
    const limitPct = 0.1;
    const limit = totalBSV * limitPct;
    const util = bsv / limit;
    return {
      category: "Issuer Limit",
      entity: issuer,
      exposure: bsv,
      limit,
      limitPct,
      exposurePct: bsv / totalBSV,
      utilisation: util,
      status: util > 1 ? "breached" : util > 0.85 ? "watch" : "ok",
    };
  });

const SECTOR_LIMITS: LimitRow[] = bySector.slice(0, 6).map((s) => {
  const limitPct = 0.3;
  const limit = totalBSV * limitPct;
  const util = s.bsValueNGN / limit;
  return {
    category: "Sector Limit",
    entity: s.sector,
    exposure: s.bsValueNGN,
    limit,
    limitPct,
    exposurePct: s.pctOfPortfolio,
    utilisation: util,
    status: util > 1 ? "breached" : util > 0.85 ? "watch" : "ok",
  };
});

// Currency limits
const ccy = new Map<string, number>();
BOOK_INSTRUMENTS.forEach((inst, i) => {
  const bsv = BOOK_VALUATIONS[i]?.balanceSheetValueNGN ?? 0;
  ccy.set(inst.currency, (ccy.get(inst.currency) ?? 0) + bsv);
});
const CURRENCY_LIMITS: LimitRow[] = [...ccy.entries()].map(
  ([currency, bsv]) => {
    const limitPct = currency === "NGN" ? 0.8 : 0.25;
    const limit = totalBSV * limitPct;
    const util = bsv / limit;
    return {
      category: "Currency Limit",
      entity: currency,
      exposure: bsv,
      limit,
      limitPct,
      exposurePct: bsv / totalBSV,
      utilisation: util,
      status: util > 1 ? "breached" : util > 0.85 ? "watch" : "ok",
    };
  },
);

const ALL_LIMITS = [...ISSUER_LIMITS, ...SECTOR_LIMITS, ...CURRENCY_LIMITS];
const breaches = ALL_LIMITS.filter((l) => l.status === "breached").length;
const warnings = ALL_LIMITS.filter((l) => l.status === "watch").length;

function StatusBadge({ s }: { s: "ok" | "watch" | "breached" }) {
  if (s === "ok")
    return (
      <span className="flex items-center gap-1 text-success text-xs">
        <ShieldCheck className="h-3.5 w-3.5" /> OK
      </span>
    );
  if (s === "watch")
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

function LimitTable({ rows, title }: { rows: LimitRow[]; title: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-dark-gray">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">
              Entity
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
              Exposure (₦)
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
              Limit
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
              Utilisation
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.entity}
              className="border-t border-border/40 hover:bg-pale-red/20"
            >
              <td className="px-5 py-3 text-dark-gray font-medium">
                {r.entity}
              </td>
              <td className="px-5 py-3 text-right text-gray-500">
                {fmtCompact(r.exposure)}
              </td>
              <td className="px-5 py-3 text-right text-gray-400">
                {fmtPct(r.limitPct)} · {fmtCompact(r.limit)}
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${r.utilisation > 1 ? "bg-danger" : r.utilisation > 0.85 ? "bg-yellow-400" : "bg-success"}`}
                      style={{
                        width: `${Math.min(r.utilisation * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold">
                    {(r.utilisation * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="px-5 py-3 text-right">
                <StatusBadge s={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RegulatoryLimits() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Regulatory
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Regulatory Investment Limit Monitoring
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Concentration and investment limits — as at 28 May 2026
        </p>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Limits Monitored",
            value: String(ALL_LIMITS.length),
            sub: "issuer + sector + currency",
          },
          {
            label: "Breaches",
            value: String(breaches),
            sub: "limit exceeded",
            color: breaches > 0 ? "text-danger" : "text-success",
          },
          {
            label: "Near Limit (Warnings)",
            value: String(warnings),
            sub: ">85% utilisation",
            color: warnings > 0 ? "text-yellow-600" : "text-dark-gray",
          },
          {
            label: "Within Limit",
            value: String(ALL_LIMITS.length - breaches - warnings),
            sub: "fully compliant",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <p
              className={`mt-2 text-xl font-bold ${(k as any).color ?? "text-dark-gray"}`}
            >
              {k.value}
            </p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <LimitTable
        rows={ISSUER_LIMITS}
        title="Issuer Concentration Limits (10% of AuM)"
      />
      <LimitTable
        rows={SECTOR_LIMITS}
        title="Sector Concentration Limits (30% of AuM)"
      />
      <LimitTable
        rows={CURRENCY_LIMITS}
        title="Currency Limits (NGN ≤80%, FCY ≤25%)"
      />
    </div>
  );
}
