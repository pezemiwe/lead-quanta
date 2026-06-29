import { useMemo } from "react";
import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtN,
} from "../engine/book-compute";
import { ENTITIES } from "../../../context/entity";
import { assignEntities } from "../../performance/engine/entity-assignment";

const FX_USD = 1580;
const FX_GBP = 1980;
const FX_EUR = 1720;

const ENTITY_ASSIGN = assignEntities(BOOK_INSTRUMENTS);

type CurrencyRow = { currency: string; label: string; faceNGN: number; bsvNGN: number; pct: number };
type TypeRow = { type: string; count: number; bsvNGN: number; pct: number };
type EntityRow = {
  id: string;
  shortName: string;
  name: string;
  regulator: string;
  colour: string;
  instruments: number;
  faceValueNGN: number;
  bsvNGN: number;
  bsvUSD: number;
  pct: number;
};

const TYPE_COLORS: Record<string, string> = {
  "FGN Bond": "bg-orange-500",
  "State Bond": "bg-orange-300",
  "Corporate Bond": "bg-blue-500",
  Eurobond: "bg-blue-300",
  "T-Bill": "bg-teal-500",
  "Commercial Paper": "bg-teal-300",
  "Bank Placement": "bg-green-500",
  "Fixed Deposit": "bg-green-300",
  "Promissory Note": "bg-purple-400",
  "Mutual Fund": "bg-indigo-400",
  Equity: "bg-pink-400",
};

function BarRow({
  label,
  value,
  pct,
  color,
  secondary,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 text-xs text-gray-600 truncate">{label}</div>
      <div className="flex-1">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.max(pct * 100, 0.5)}%` }}
          />
        </div>
      </div>
      <div className="w-20 shrink-0 text-right text-xs font-semibold text-dark-gray">
        {value}
      </div>
      <div className="w-10 shrink-0 text-right text-xs text-gray-400">
        {(pct * 100).toFixed(1)}%
      </div>
      {secondary && (
        <div className="w-24 shrink-0 text-right text-xs text-gray-400">{secondary}</div>
      )}
    </div>
  );
}

export function InvestmentPosition() {
  const {
    totalFaceNGN,
    totalBSVNGN,
    totalFaceUSD,
    totalBSVUSD,
    netGLNGN,
    byCurrency,
    byType,
    byEntity,
  } = useMemo(() => {
    const totals = BOOK_COMPUTED.totals;
    const totalFaceNGN = totals.totalFaceValueNGN;
    const totalBSVNGN = totals.totalBSValueNGN;
    const totalFaceUSD = totals.totalFaceValueUSD;
    const totalBSVUSD = totals.totalBSValueUSD;
    const netGLNGN = totals.totalOCIReserveNGN + totals.totalFVTPLUnrealisedGLNGN;

    // Currency breakdown
    const ccyMap: Record<string, { label: string; face: number; bsv: number }> = {};
    BOOK_VALUATIONS.forEach((v) => {
      const ccy = v.instrument.currency;
      const fxMult =
        ccy === "USD" ? FX_USD : ccy === "GBP" ? FX_GBP : ccy === "EUR" ? FX_EUR : 1;
      const faceNGN = v.instrument.faceValue * fxMult;
      if (!ccyMap[ccy]) {
        const labels: Record<string, string> = {
          NGN: "Nigerian Naira",
          USD: "US Dollar",
          GBP: "British Pound",
          EUR: "Euro",
        };
        ccyMap[ccy] = { label: labels[ccy] ?? ccy, face: 0, bsv: 0 };
      }
      ccyMap[ccy].face += faceNGN;
      ccyMap[ccy].bsv += v.balanceSheetValueNGN;
    });
    const byCurrency: CurrencyRow[] = Object.entries(ccyMap)
      .map(([currency, d]) => ({
        currency,
        label: d.label,
        faceNGN: d.face,
        bsvNGN: d.bsv,
        pct: totalBSVNGN > 0 ? d.bsv / totalBSVNGN : 0,
      }))
      .sort((a, b) => b.bsvNGN - a.bsvNGN);

    // Asset type breakdown
    const typeMap: Record<string, { count: number; bsv: number }> = {};
    BOOK_VALUATIONS.forEach((v) => {
      const t = v.instrument.instrumentType;
      if (!typeMap[t]) typeMap[t] = { count: 0, bsv: 0 };
      typeMap[t].count++;
      typeMap[t].bsv += v.balanceSheetValueNGN;
    });
    const byType: TypeRow[] = Object.entries(typeMap)
      .map(([type, d]) => ({
        type,
        count: d.count,
        bsvNGN: d.bsv,
        pct: totalBSVNGN > 0 ? d.bsv / totalBSVNGN : 0,
      }))
      .sort((a, b) => b.bsvNGN - a.bsvNGN);

    // Entity breakdown
    const entityMap: Record<string, { count: number; face: number; bsv: number }> = {};
    ENTITIES.filter((e) => e.id !== "consolidated").forEach((e) => {
      entityMap[e.id] = { count: 0, face: 0, bsv: 0 };
    });
    BOOK_VALUATIONS.forEach((v, i) => {
      const eid = ENTITY_ASSIGN[i];
      if (eid !== "consolidated" && entityMap[eid]) {
        const fxMult =
          v.instrument.currency === "USD" ? FX_USD
            : v.instrument.currency === "GBP" ? FX_GBP
            : v.instrument.currency === "EUR" ? FX_EUR
            : 1;
        entityMap[eid].count++;
        entityMap[eid].face += v.instrument.faceValue * fxMult;
        entityMap[eid].bsv += v.balanceSheetValueNGN;
      }
    });
    const byEntity: EntityRow[] = ENTITIES.filter((e) => e.id !== "consolidated").map((e) => {
      const d = entityMap[e.id] ?? { count: 0, face: 0, bsv: 0 };
      return {
        id: e.id,
        shortName: e.shortName,
        name: e.name,
        regulator: e.regulator,
        colour: e.colour,
        instruments: d.count,
        faceValueNGN: d.face,
        bsvNGN: d.bsv,
        bsvUSD: d.bsv / FX_USD,
        pct: totalBSVNGN > 0 ? d.bsv / totalBSVNGN : 0,
      };
    });

    return { totalFaceNGN, totalBSVNGN, totalFaceUSD, totalBSVUSD, netGLNGN, byCurrency, byType, byEntity };
  }, []);

  const ccyColors = ["bg-orange-500", "bg-blue-500", "bg-teal-500", "bg-purple-400"];
  const ccyTextColors = ["text-orange-600", "text-blue-600", "text-teal-600", "text-purple-600"];

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Investment Position
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Gross AUM & Net Asset Value
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Group consolidated investment position as at 28 May 2026 · FX: ₦1,580/$ · ₦1,980/£ · ₦1,720/€
        </p>
      </div>

      {/* Primary KPI hero cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="col-span-2 rounded-xl border-2 border-primary bg-orange-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Gross AUM — Naira
          </p>
          <p className="mt-2 text-3xl font-bold text-dark-gray">
            {fmtCompact(totalFaceNGN)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Total face value · all 204 positions · group consolidated
          </p>
        </div>
        <div className="col-span-2 rounded-xl border-2 border-blue-400 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Gross AUM — USD Equivalent
          </p>
          <p className="mt-2 text-3xl font-bold text-dark-gray">
            ${fmtN(Math.round(totalFaceUSD / 1e6))}M
          </p>
          <p className="mt-1 text-xs text-gray-500">At spot rate ₦1,580 per USD</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Net Asset Value (₦)</p>
          <p className="mt-2 text-xl font-bold text-dark-gray">
            {fmtCompact(totalBSVNGN)}
          </p>
          <p className="text-xs text-gray-400">balance sheet fair value</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Net Asset Value ($)</p>
          <p className="mt-2 text-xl font-bold text-dark-gray">
            ${fmtN(Math.round(totalBSVUSD / 1e6))}M
          </p>
          <p className="text-xs text-gray-400">balance sheet fair value</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Unrealised P&L</p>
          <p
            className={`mt-2 text-xl font-bold ${netGLNGN >= 0 ? "text-success" : "text-danger"}`}
          >
            {netGLNGN >= 0 ? "+" : ""}
            {fmtCompact(Math.abs(netGLNGN))}
          </p>
          <p className="text-xs text-gray-400">OCI + FVTPL net</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Active Positions</p>
          <p className="mt-2 text-xl font-bold text-dark-gray">
            {fmtN(BOOK_COMPUTED.totals.instruments)}
          </p>
          <p className="text-xs text-gray-400">across all entities</p>
        </div>
      </div>

      {/* Entity + Currency breakdown side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Entity breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-dark-gray">AUM by Legal Entity (NAV)</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-5">Balance sheet value per subsidiary</p>
          <div className="space-y-5">
            {byEntity.map((e) => (
              <div key={e.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: e.colour }}
                    />
                    <span className="text-xs font-semibold text-dark-gray">{e.shortName}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                      {e.regulator}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-dark-gray">{fmtCompact(e.bsvNGN)}</span>
                    <span className="ml-2 text-xs text-gray-400">${fmtN(Math.round(e.bsvUSD / 1e6))}M</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(e.pct * 100, 0.5)}%`, background: e.colour }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{e.instruments} instruments</span>
                  <span className="text-xs text-gray-400">{(e.pct * 100).toFixed(1)}% of group</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Currency breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-dark-gray">AUM by Currency</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-5">NAV expressed in NGN equivalent</p>
          <div className="space-y-4">
            {byCurrency.map((c, idx) => (
              <div key={c.currency}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${ccyColors[idx] ?? "bg-gray-400"}`}
                    />
                    <span className="text-xs font-semibold text-dark-gray">{c.currency}</span>
                    <span className="text-xs text-gray-400">{c.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-dark-gray">{fmtCompact(c.bsvNGN)}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ccyColors[idx] ?? "bg-gray-400"}`}
                    style={{ width: `${Math.max(c.pct * 100, 0.5)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Face: {fmtCompact(c.faceNGN)}</span>
                  <span className={`text-xs font-semibold ${ccyTextColors[idx]}`}>
                    {(c.pct * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary note */}
          <div className="mt-5 rounded-lg bg-gray-50 border border-border p-3">
            <p className="text-xs text-gray-500">
              Foreign currency positions (USD, GBP, EUR) are translated to NGN at the rates above.
              FX risk is monitored via the ALM and Duration Risk modules.
            </p>
          </div>
        </div>
      </div>

      {/* Asset class breakdown full width */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-dark-gray">AUM by Asset Class</h2>
        <p className="text-xs text-gray-400 mt-0.5 mb-6">
          Balance sheet value by instrument type — sorted by contribution to total NAV
        </p>
        <div className="space-y-3">
          {byType.map((t) => (
            <BarRow
              key={t.type}
              label={t.type}
              value={fmtCompact(t.bsvNGN)}
              pct={t.pct}
              color={TYPE_COLORS[t.type] ?? "bg-gray-400"}
              secondary={`${t.count} positions`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
