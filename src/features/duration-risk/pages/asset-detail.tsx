import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import {
  CLASSIFICATION_BADGE,
  CLASSIFICATION_LABEL,
  fmtMoney,
  fmtNumber,
  fmtPct,
} from "../../valuation/utils";
import { fmtCompactNGN, fmtYears, colorForShock } from "../utils";
import {
  PARALLEL_SHOCKS_BPS,
  NIGERIAN_SCENARIOS,
  shockedValueLocal,
} from "../engine";
import { fxRate } from "../../valuation/engine";

export function DurationRiskAssetDetail() {
  const v = useDurationRisk();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const inst = useMemo(
    () => v.instruments.find((i) => i.id === id),
    [v.instruments, id],
  );
  const row = useMemo(
    () => v.result.durationRows.find((r) => r.id === id),
    [v.result.durationRows, id],
  );
  const stress = useMemo(
    () => v.result.stressRows.find((r) => r.id === id),
    [v.result.stressRows, id],
  );

  if (!inst || !row || !stress) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-3 text-base font-semibold text-dark-gray">
            Instrument not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {id} is not in the duration-eligible portfolio (it may be Equity,
            Mutual Fund, Bank Placement, or already matured).
          </p>
          <Link
            to="/duration-risk/duration-table"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            Back to duration table
          </Link>
        </div>
      </div>
    );
  }

  const fx = fxRate(inst.currency, v.assumptions);
  const baseLocal = row.baseValueLocal;
  const baseNGN = stress.baseValueNGN;

  // Nigerian-scenario rows for THIS instrument
  const nigerianRows = NIGERIAN_SCENARIOS.map((scen) => {
    const isUSD = inst.currency === "USD";
    const bps = isUSD ? scen.usdShock : scen.ngnShock;
    const shockedLocal = shockedValueLocal(
      inst,
      v.assumptions,
      row.marketYield,
      bps,
    );
    const fxShockedRate = isUSD
      ? v.assumptions.fxUSD * (1 + scen.fxShock / 100)
      : 1;
    const baseFXRate = isUSD ? v.assumptions.fxUSD : 1;
    const shockedNGN = shockedLocal * fxShockedRate;
    const baseFXNGN = baseLocal * baseFXRate;
    return {
      name: scen.name,
      shockedNGN,
      pnl: shockedNGN - baseFXNGN,
      pct: baseFXNGN > 0 ? (shockedNGN - baseFXNGN) / baseFXNGN : 0,
    };
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 rounded-lg border border-border bg-surface p-1.5 text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark-gray">{inst.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono">{inst.id}</span>
              <span>·</span>
              <span>{inst.instrumentType}</span>
              <span>·</span>
              <span>{inst.issuer}</span>
              <span>·</span>
              <span>{inst.sector}</span>
              <span>·</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CLASSIFICATION_BADGE[inst.classification]}`}
              >
                {CLASSIFICATION_LABEL[inst.classification]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* core risk KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Modified Duration"
          value={fmtYears(row.modifiedDur, 3)}
          subtitle={`Macaulay: ${fmtYears(row.macaulayDur, 3)}`}
          icon={<Activity className="h-4 w-4" />}
          variant="highlight"
        />
        <StatCard
          title="DV01 (NGN)"
          value={fmtCompactNGN(row.dv01NGN)}
          subtitle={`Local: ${fmtMoney(row.dv01Local, inst.currency)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Convexity"
          value={fmtNumber(row.convexity, 4)}
          subtitle={`Tenor: ${row.remainingTenor.toFixed(2)} yrs`}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Market Yield"
          value={fmtPct(row.marketYield, 2)}
          subtitle={`Coupon: ${fmtPct(inst.couponRate, 2)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <SectionCard
        title="Risk Interpretation"
        description="Plain-language explanation of the duration metrics for this instrument."
      >
        <ul className="space-y-1.5 text-sm text-gray-600">
          <li>
            A <strong>100 bp</strong> rate rise reduces this instrument's value
            by approximately{" "}
            <span className="font-mono font-semibold text-primary">
              {row.modifiedDur.toFixed(2)}%
            </span>
            .
          </li>
          <li>
            That equates to a NGN loss of approximately{" "}
            <span className="font-mono font-semibold">
              {fmtCompactNGN(row.dv01NGN * 100)}
            </span>{" "}
            on the current book value.
          </li>
          <li>
            Convexity benefit at 200 bps:{" "}
            <span className="font-mono font-semibold">
              {fmtNumber(0.5 * row.convexity * 0.02 * 0.02 * baseLocal * fx, 0)}
            </span>{" "}
            NGN second-order gain regardless of direction.
          </li>
          <li>
            Interest-rate risk level:{" "}
            <strong>
              {row.modifiedDur > 3
                ? "high"
                : row.modifiedDur > 1
                  ? "moderate"
                  : "low"}
            </strong>
            .
          </li>
        </ul>
      </SectionCard>

      {/* parallel shock table */}
      <SectionCard
        title="Parallel Shock Sensitivity"
        description="Re-priced value of this instrument under instantaneous yield shocks."
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Scenario</th>
                <th className="px-4 py-2.5 text-right">Shock</th>
                <th className="px-4 py-2.5 text-right">
                  Shocked Value (Local)
                </th>
                <th className="px-4 py-2.5 text-right">P&amp;L (Local)</th>
                <th className="px-4 py-2.5 text-right">P&amp;L (NGN)</th>
                <th className="px-4 py-2.5 text-right">% Change</th>
              </tr>
            </thead>
            <tbody>
              {PARALLEL_SHOCKS_BPS.map((bps) => {
                const shockedNGN = stress.shockValues[bps] ?? 0;
                const shockedLocal = shockedNGN / fx;
                const pnlLocal = shockedLocal - baseLocal;
                const pnlNGN = stress.pnl[bps] ?? 0;
                const pct = baseLocal > 0 ? pnlLocal / baseLocal : 0;
                const isBase = bps === 0;
                const lbl = isBase
                  ? "Base"
                  : bps < 0
                    ? `Easing ${Math.abs(bps)} bp`
                    : `Tightening ${bps} bp`;
                return (
                  <tr
                    key={bps}
                    className={`border-b border-border/60 ${isBase ? "bg-pale-red/20" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium">{lbl}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-xs"
                        style={{
                          backgroundColor: colorForShock(bps),
                          color: bps === 0 ? "#2c3e50" : "white",
                        }}
                      >
                        {bps > 0 ? "+" : ""}
                        {bps} bps
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {fmtMoney(shockedLocal, inst.currency, 0)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono ${pnlLocal >= 0 ? "text-success" : "text-primary"}`}
                    >
                      {fmtMoney(pnlLocal, inst.currency, 0)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-semibold ${pnlNGN >= 0 ? "text-success" : "text-primary"}`}
                    >
                      {fmtCompactNGN(pnlNGN)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono text-xs ${pct >= 0 ? "text-success" : "text-primary"}`}
                    >
                      {fmtPct(pct, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Nigerian scenarios */}
      <SectionCard
        title="Nigerian Macro Scenarios"
        description="Combined rate + FX shocks tailored to the Nigerian operating environment."
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Scenario</th>
                <th className="px-4 py-2.5 text-right">Shocked Value (NGN)</th>
                <th className="px-4 py-2.5 text-right">P&amp;L (NGN)</th>
                <th className="px-4 py-2.5 text-right">% Change</th>
              </tr>
            </thead>
            <tbody>
              {nigerianRows.map((r) => (
                <tr key={r.name} className="border-b border-border/60">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {fmtCompactNGN(r.shockedNGN)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono font-semibold ${r.pnl >= 0 ? "text-success" : "text-primary"}`}
                  >
                    {fmtCompactNGN(r.pnl)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono text-xs ${r.pct >= 0 ? "text-success" : "text-primary"}`}
                  >
                    {fmtPct(r.pct, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="text-xs text-gray-400">
        Base value:{" "}
        <span className="font-mono">
          {fmtMoney(baseLocal, inst.currency, 2)}
        </span>{" "}
        · NGN equivalent:{" "}
        <span className="font-mono">{fmtCompactNGN(baseNGN)}</span>
        {" · "} Purchase date: {inst.purchaseDate} · Maturity:{" "}
        {inst.maturityDate}
      </div>
    </div>
  );
}
