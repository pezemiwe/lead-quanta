import { useMemo, useState } from "react";
import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
  fmtN,
} from "../engine/book-compute";
import { COUNTERPARTY_MASTER } from "../../deals/data/counterparty-master";
import type { InstrumentType } from "../../valuation/engine/types";

const MM_TYPES: InstrumentType[] = [
  "T-Bill",
  "Commercial Paper",
  "Bank Placement",
  "Fixed Deposit",
  "Promissory Note",
];

const TYPE_COLORS: Record<string, string> = {
  "T-Bill": "bg-teal-100 text-teal-700",
  "Commercial Paper": "bg-blue-100 text-blue-700",
  "Bank Placement": "bg-orange-100 text-orange-700",
  "Fixed Deposit": "bg-green-100 text-green-700",
  "Promissory Note": "bg-purple-100 text-purple-700",
};

type PoolRow = {
  rank: number;
  issuer: string;
  sector: string;
  rating: string;
  cpId: string | null;
  creditLimit: number;
  instruments: number;
  byType: Record<string, number>;
  totalExposure: number;
  utilisation: number;
  watchFlag: boolean;
};

type PoolSummary = {
  totalMMValue: number;
  totalMMFace: number;
  mmPctOfPortfolio: number;
  activeCounterparties: number;
  atLimit: number;
  nearLimit: number;
  rows: PoolRow[];
  byType: { type: string; value: number; count: number }[];
};

function buildPoolData(): PoolSummary {
  const totalPortfolio = BOOK_VALUATIONS.reduce((s, v) => s + v.balanceSheetValueNGN, 0);

  // Filter to MM instruments only
  const mmValuations = BOOK_VALUATIONS.filter((v) =>
    MM_TYPES.includes(v.instrument.instrumentType)
  );
  const totalMMValue = mmValuations.reduce((s, v) => s + v.balanceSheetValueNGN, 0);
  const totalMMFace = mmValuations.reduce((s, v) => s + v.instrument.faceValue, 0);

  // Group by issuer
  const issuerMap: Record<
    string,
    { instruments: number; value: number; byType: Record<string, number> }
  > = {};
  mmValuations.forEach((v) => {
    const key = v.instrument.issuer;
    if (!issuerMap[key]) issuerMap[key] = { instruments: 0, value: 0, byType: {} };
    issuerMap[key].instruments++;
    issuerMap[key].value += v.balanceSheetValueNGN;
    const t = v.instrument.instrumentType;
    issuerMap[key].byType[t] = (issuerMap[key].byType[t] ?? 0) + v.balanceSheetValueNGN;
  });

  // Match to counterparty master (fuzzy on issuer name substrings)
  function findCp(issuer: string) {
    const lower = issuer.toLowerCase();
    return COUNTERPARTY_MASTER.find(
      (cp) =>
        lower.includes(cp.shortName.toLowerCase()) ||
        lower.includes(cp.name.toLowerCase()) ||
        cp.name.toLowerCase().includes(lower) ||
        cp.shortName.toLowerCase().includes(lower)
    ) ?? null;
  }

  // FGN sovereign: any instrument whose issuer contains "FGN" or "Federal" → map to cp010
  const fgnCp = COUNTERPARTY_MASTER.find((c) => c.id === "cp010")!;

  const rows: PoolRow[] = Object.entries(issuerMap)
    .map(([issuer, d]) => {
      const isFgn =
        issuer.toLowerCase().includes("fgn") ||
        issuer.toLowerCase().includes("federal government") ||
        issuer.toLowerCase().includes("nigerian treasury");
      const cp = isFgn ? fgnCp : findCp(issuer);
      const creditLimit = cp?.creditLimit ?? 0;
      const utilisation = creditLimit > 0 ? d.value / creditLimit : 0;
      return {
        rank: 0,
        issuer,
        sector: cp?.sector ?? "Other",
        rating: cp?.rating ?? "—",
        cpId: cp?.id ?? null,
        creditLimit,
        instruments: d.instruments,
        byType: d.byType,
        totalExposure: d.value,
        utilisation,
        watchFlag: cp?.watchFlag ?? false,
      };
    })
    .sort((a, b) => b.totalExposure - a.totalExposure)
    .slice(0, 15)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const atLimit = rows.filter((r) => r.utilisation >= 1.0).length;
  const nearLimit = rows.filter((r) => r.utilisation >= 0.8 && r.utilisation < 1.0).length;

  // By type summary
  const typeMap: Record<string, { value: number; count: number }> = {};
  mmValuations.forEach((v) => {
    const t = v.instrument.instrumentType;
    if (!typeMap[t]) typeMap[t] = { value: 0, count: 0 };
    typeMap[t].value += v.balanceSheetValueNGN;
    typeMap[t].count++;
  });
  const byType = Object.entries(typeMap)
    .map(([type, d]) => ({ type, value: d.value, count: d.count }))
    .sort((a, b) => b.value - a.value);

  return {
    totalMMValue,
    totalMMFace,
    mmPctOfPortfolio: totalPortfolio > 0 ? totalMMValue / totalPortfolio : 0,
    activeCounterparties: Object.keys(issuerMap).length,
    atLimit,
    nearLimit,
    rows,
    byType,
  };
}

const POOL_DATA = buildPoolData();

function UtilBar({ pct }: { pct: number }) {
  const pctCapped = Math.min(pct, 1);
  const color =
    pct >= 1.0
      ? "bg-danger"
      : pct >= 0.8
        ? "bg-warning"
        : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctCapped * 100}%` }} />
      </div>
      <span
        className={`text-xs font-semibold ${
          pct >= 1.0 ? "text-danger" : pct >= 0.8 ? "text-warning" : "text-success"
        }`}
      >
        {(pct * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function StatusBadge({ utilisation, watchFlag }: { utilisation: number; watchFlag: boolean }) {
  if (utilisation >= 1.0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-danger">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        Breach
      </span>
    );
  if (utilisation >= 0.8)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Near Limit
      </span>
    );
  if (watchFlag)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        Watch
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      OK
    </span>
  );
}

export function LiquidityPools() {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const { totalMMValue, totalMMFace, mmPctOfPortfolio, activeCounterparties, atLimit, nearLimit, rows, byType } = POOL_DATA;

  const selectedPool = rows.find((r) => r.issuer === selectedRow);

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Liquidity Management
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">Liquidity Pools</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cash & money market investments — top 15 counterparties by exposure as at 28 May 2026
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border-2 border-primary bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Total Liquidity Pool</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{fmtCompact(totalMMValue)}</p>
          <p className="text-xs text-gray-500 mt-0.5">NAV · all MM positions</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">% of Portfolio</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{fmtPct(mmPctOfPortfolio)}</p>
          <p className="text-xs text-gray-400">vs total AUM</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Counterparties</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{activeCounterparties}</p>
          <p className="text-xs text-gray-400">active issuers</p>
        </div>
        <div
          className={`rounded-xl border p-4 shadow-sm ${
            atLimit > 0
              ? "border-red-300 bg-red-50"
              : nearLimit > 0
                ? "border-amber-300 bg-amber-50"
                : "border-border bg-surface"
          }`}
        >
          <p
            className={`text-xs ${atLimit > 0 ? "text-danger" : nearLimit > 0 ? "text-warning" : "text-gray-400"}`}
          >
            Limit Alerts
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${atLimit > 0 ? "text-danger" : nearLimit > 0 ? "text-warning" : "text-dark-gray"}`}
          >
            {atLimit + nearLimit}
          </p>
          <p className="text-xs text-gray-400">
            {atLimit} breach · {nearLimit} near limit
          </p>
        </div>
      </div>

      {/* Pool type breakdown + table layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Type breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold text-dark-gray">By Instrument Type</h2>
          <p className="text-xs text-gray-400 mb-4 mt-0.5">Composition of liquidity pool</p>
          <div className="space-y-3">
            {byType.map((t) => {
              const pct = totalMMValue > 0 ? t.value / totalMMValue : 0;
              return (
                <div key={t.type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{t.type}</span>
                    <span className="text-xs font-semibold text-dark-gray">{fmtCompact(t.value)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        t.type === "T-Bill"
                          ? "bg-teal-500"
                          : t.type === "Bank Placement"
                            ? "bg-orange-400"
                            : t.type === "Fixed Deposit"
                              ? "bg-green-500"
                              : t.type === "Commercial Paper"
                                ? "bg-blue-400"
                                : "bg-purple-400"
                      }`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs text-gray-400">{t.count} positions</span>
                    <span className="text-xs text-gray-400">{(pct * 100).toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-gray-400">Face Value (Total)</p>
            <p className="text-sm font-bold text-dark-gray mt-0.5">{fmtCompact(totalMMFace)}</p>
            <p className="text-xs text-gray-400 mt-3">Regulatory Requirement</p>
            <p className="text-xs text-gray-500 mt-0.5">
              NAICOM requires insurers to hold ≥25% of technical reserves in liquid assets (T-Bills, FGN Bonds, Bank Placements).
            </p>
          </div>
        </div>

        {/* Counterparty table */}
        <div className="rounded-xl border border-border bg-surface shadow-sm lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-dark-gray">Top {rows.length} Counterparties by Exposure</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click a row to see instrument breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-400">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-400">Counterparty</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-400 hidden sm:table-cell">Rating</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-400">Exposure</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-400 hidden md:table-cell">Limit</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400">Utilisation</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isSelected = selectedRow === r.issuer;
                  return (
                    <>
                      <tr
                        key={r.issuer}
                        onClick={() => setSelectedRow(isSelected ? null : r.issuer)}
                        className={`border-b border-border cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-orange-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-3 py-3 font-semibold text-gray-400">{r.rank}</td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-dark-gray">{r.issuer}</div>
                          <div className="text-gray-400 text-xs">{r.sector}</div>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                            {r.rating}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-dark-gray">
                          {fmtCompact(r.totalExposure)}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-400 hidden md:table-cell">
                          {r.creditLimit > 0 ? fmtCompact(r.creditLimit) : "—"}
                        </td>
                        <td className="px-3 py-3">
                          {r.creditLimit > 0 ? (
                            <UtilBar pct={r.utilisation} />
                          ) : (
                            <span className="text-gray-300 text-xs">No limit set</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge utilisation={r.utilisation} watchFlag={r.watchFlag} />
                        </td>
                      </tr>
                      {isSelected && selectedPool && (
                        <tr key={`${r.issuer}-detail`} className="bg-orange-50 border-b border-border">
                          <td colSpan={7} className="px-4 py-3">
                            <div>
                              <p className="text-xs font-semibold text-dark-gray mb-2">
                                Instrument breakdown — {r.issuer}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(selectedPool.byType).map(([type, val]) => (
                                  <span
                                    key={type}
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600"}`}
                                  >
                                    {type}: {fmtCompact(val)}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-2 text-xs text-gray-400">
                                {selectedPool.instruments} instrument{selectedPool.instruments !== 1 ? "s" : ""} ·{" "}
                                {selectedPool.creditLimit > 0
                                  ? `Credit limit: ${fmtCompact(selectedPool.creditLimit)} · Remaining headroom: ${fmtCompact(Math.max(0, selectedPool.creditLimit - selectedPool.totalExposure))}`
                                  : "No credit limit configured for this counterparty"}
                              </p>
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

          {/* Aggregate footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-border flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Top {rows.length} counterparties
            </span>
            <span className="text-xs font-semibold text-dark-gray">
              Total: {fmtCompact(rows.reduce((s, r) => s + r.totalExposure, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Alert banner if any breaches */}
      {(atLimit > 0 || nearLimit > 0) && (
        <div
          className={`rounded-xl border p-4 ${
            atLimit > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <p
            className={`text-sm font-semibold ${atLimit > 0 ? "text-danger" : "text-warning"}`}
          >
            {atLimit > 0 ? "Credit Limit Breach Detected" : "Counterparties Approaching Limit"}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {atLimit > 0
              ? `${atLimit} counterpart${atLimit > 1 ? "ies have" : "y has"} exceeded its credit limit. Escalate to CRO and restrict further deployment until resolved.`
              : `${nearLimit} counterpart${nearLimit > 1 ? "ies are" : "y is"} above 80% of assigned credit limit. Review before placing additional funds.`}
          </p>
        </div>
      )}
    </div>
  );
}
