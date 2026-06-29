import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtNumber, CLASSIFICATION_BADGE } from "../utils";

export function ValuationResults() {
  const v = useValuation();
  if (!v.hasData) return <EmptyPortfolio />;
  const { byType, bySector, topExposures } = v.result;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Portfolio Breakdown
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed analysis by instrument type, sector, and largest exposures.
        </p>
      </div>

      {/* by type */}
      <SectionCard title="Breakdown by Instrument Type" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Instrument Type</th>
                <th className="px-5 py-2.5 text-right">Count</th>
                <th className="px-5 py-2.5 text-right">Face Value (NGN)</th>
                <th className="px-5 py-2.5 text-right">BS Value (NGN)</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((r) => (
                <tr key={r.type} className="border-b border-border/60">
                  <td className="px-5 py-2.5">{r.type}</td>
                  <td className="px-5 py-2.5 text-right font-mono">
                    {r.count}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono">
                    {fmtNumber(r.faceValueNGN, 0)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono font-semibold">
                    {fmtNumber(r.bsValueNGN, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* by sector with bar */}
      <SectionCard title="Breakdown by Sector" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Sector</th>
                <th className="px-5 py-2.5 text-right">Count</th>
                <th className="px-5 py-2.5 text-right">Face Value (NGN)</th>
                <th className="px-5 py-2.5 text-right">BS Value (NGN)</th>
                <th className="px-5 py-2.5 text-right">% of Portfolio</th>
                <th className="px-5 py-2.5 text-left w-44">Share</th>
              </tr>
            </thead>
            <tbody>
              {bySector.map((r) => (
                <tr key={r.sector} className="border-b border-border/60">
                  <td className="px-5 py-2.5">{r.sector}</td>
                  <td className="px-5 py-2.5 text-right font-mono">
                    {r.count}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono">
                    {fmtNumber(r.faceValueNGN, 0)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono">
                    {fmtNumber(r.bsValueNGN, 0)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono">
                    {(r.pctOfPortfolio * 100).toFixed(1)}%
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, r.pctOfPortfolio * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* top exposures */}
      <SectionCard title="Top 10 Exposures by Balance Sheet Value" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">#</th>
                <th className="px-5 py-2.5 text-left">ID</th>
                <th className="px-5 py-2.5 text-left">Name</th>
                <th className="px-5 py-2.5 text-left">Type</th>
                <th className="px-5 py-2.5 text-left">Class</th>
                <th className="px-5 py-2.5 text-right">BS Value (NGN)</th>
              </tr>
            </thead>
            <tbody>
              {topExposures.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-5 py-2.5 font-mono">{r.rank}</td>
                  <td className="px-5 py-2.5 font-mono text-xs">{r.id}</td>
                  <td className="px-5 py-2.5">{r.name}</td>
                  <td className="px-5 py-2.5 text-xs text-gray-500">
                    {r.type}
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CLASSIFICATION_BADGE[r.classification]}`}
                    >
                      {r.classification}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono font-semibold">
                    {fmtNumber(r.bsValueNGN, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
