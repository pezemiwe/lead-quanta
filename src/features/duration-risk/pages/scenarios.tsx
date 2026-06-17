import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtCompactNGN, fmtBps } from "../utils";

export function DurationRiskScenarios() {
  const v = useDurationRisk();
  if (!v.hasData) return <EmptyPortfolio />;
  const { curveScenarios, nigerianScenarios } = v.result;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Scenario Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Non-parallel curve reshaping and Nigerian-specific macro scenarios.
        </p>
      </div>

      {/* curve scenarios */}
      <SectionCard
        title="Curve Reshaping Scenarios"
        description="Short end = instruments with remaining tenor ≤ 2 years. Long end = all others."
        noPadding
      >
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Scenario</th>
              <th className="px-4 py-2.5 text-right">Short End</th>
              <th className="px-4 py-2.5 text-right">Long End</th>
              <th className="px-4 py-2.5 text-right">Portfolio Impact (NGN)</th>
            </tr>
          </thead>
          <tbody>
            {curveScenarios.map((s) => (
              <tr key={s.name} className="border-b border-border/60">
                <td className="px-4 py-2.5 font-medium">{s.name}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {fmtBps(getCurveBps(s.name, "short"))}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {fmtBps(getCurveBps(s.name, "long"))}
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-mono font-semibold ${
                    s.totalNGN >= 0 ? "text-success" : "text-primary"
                  }`}
                >
                  {fmtCompactNGN(s.totalNGN)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {/* Nigerian scenarios */}
      <SectionCard
        title="Nigerian Macro Scenarios"
        description="CBN policy moves, FX shocks, and Eurobond spread widening."
        noPadding
      >
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Scenario</th>
              <th className="px-4 py-2.5 text-right">Portfolio (NGN)</th>
              <th className="px-4 py-2.5 text-right">OCI Impact</th>
              <th className="px-4 py-2.5 text-right">P&amp;L Impact</th>
            </tr>
          </thead>
          <tbody>
            {nigerianScenarios.map((s) => (
              <tr key={s.name} className="border-b border-border/60">
                <td className="px-4 py-2.5 font-medium">{s.name}</td>
                <td
                  className={`px-4 py-2.5 text-right font-mono font-semibold ${
                    s.totalNGN >= 0 ? "text-success" : "text-primary"
                  }`}
                >
                  {fmtCompactNGN(s.totalNGN)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-mono ${
                    s.ociNGN >= 0 ? "text-success" : "text-primary"
                  }`}
                >
                  {fmtCompactNGN(s.ociNGN)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-mono ${
                    s.plNGN >= 0 ? "text-success" : "text-primary"
                  }`}
                >
                  {fmtCompactNGN(s.plNGN)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

const CURVE_LOOKUP: Record<string, { short: number; long: number }> = {
  "Bear Steepener": { short: 0, long: 150 },
  "Bull Flattener": { short: 0, long: -150 },
  "Bear Flattener": { short: 150, long: 0 },
  "Bull Steepener": { short: -150, long: 0 },
  "Twist Up": { short: 100, long: -100 },
  "Twist Down": { short: -100, long: 100 },
};

function getCurveBps(name: string, side: "short" | "long"): number {
  return CURVE_LOOKUP[name]?.[side] ?? 0;
}
