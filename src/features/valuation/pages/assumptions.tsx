import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { fmtNumber, fmtPct } from "../utils";

export function ValuationAssumptions() {
  const v = useValuation();
  const a = v.assumptions;

  const update = (patch: Partial<typeof a>) =>
    v.setAssumptions({ ...a, ...patch });

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Valuation Assumptions
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Yield curves, FX rates, and global settings used by the engine.
        </p>
      </div>

      <SectionCard title="Valuation Date">
        <input
          type="date"
          value={a.valuationDate}
          onChange={(e) => update({ valuationDate: e.target.value })}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </SectionCard>

      <SectionCard title="FX Rates (vs NGN)">
        <div className="grid gap-4 sm:grid-cols-3">
          <FxField
            label="USD"
            value={a.fxUSD}
            onChange={(n) => update({ fxUSD: n })}
          />
          <FxField
            label="GBP"
            value={a.fxGBP}
            onChange={(n) => update({ fxGBP: n })}
          />
          <FxField
            label="EUR"
            value={a.fxEUR}
            onChange={(n) => update({ fxEUR: n })}
          />
        </div>
      </SectionCard>

      <SectionCard title="Credit Spreads">
        <div className="grid gap-4 sm:grid-cols-3">
          <PctField
            label="Corporate Spread"
            value={a.corporateSpread}
            onChange={(n) => update({ corporateSpread: n })}
          />
          <PctField
            label="State Bond Spread"
            value={a.stateSpread}
            onChange={(n) => update({ stateSpread: n })}
          />
          <PctField
            label="OCI Recycling Tax Rate"
            value={a.taxRate}
            onChange={(n) => update({ taxRate: n })}
          />
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="FGN Sovereign Yield Curve">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2 text-left">Tenor (yrs)</th>
                <th className="py-2 text-right">Yield</th>
              </tr>
            </thead>
            <tbody>
              {a.fgnYieldCurve.map((p, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-1.5 font-mono">{p.tenorYears}</td>
                  <td className="py-1.5 text-right font-mono">
                    {fmtPct(p.yield, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
        <SectionCard title="USD Benchmark Yield Curve">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2 text-left">Tenor (yrs)</th>
                <th className="py-2 text-right">Yield</th>
              </tr>
            </thead>
            <tbody>
              {a.usdYieldCurve.map((p, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-1.5 font-mono">{p.tenorYears}</td>
                  <td className="py-1.5 text-right font-mono">
                    {fmtPct(p.yield, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}

function FxField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label} / NGN
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <span className="mt-1 block text-xs text-gray-400">
        1 {label} = ₦{fmtNumber(value, 2)}
      </span>
    </label>
  );
}

function PctField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </span>
      <input
        type="number"
        step="0.0001"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <span className="mt-1 block text-xs text-gray-400">
        ≈ {fmtPct(value, 2)}
      </span>
    </label>
  );
}
