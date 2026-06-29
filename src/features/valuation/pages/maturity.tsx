import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtNumber } from "../utils";

export function ValuationMaturity() {
  const v = useValuation();
  if (!v.hasData) return <EmptyPortfolio />;
  const { maturityProfile } = v.result;
  const maxFace = Math.max(...maturityProfile.map((b) => b.faceValueNGN), 1);

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Maturity Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Face value distribution by time to maturity.
        </p>
      </div>

      <SectionCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Bucket</th>
                <th className="px-5 py-2.5 text-right">Count</th>
                <th className="px-5 py-2.5 text-right">Face Value (NGN)</th>
                <th className="px-5 py-2.5 text-left w-1/2">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {maturityProfile.map((b) => (
                <tr key={b.bucket} className="border-b border-border/60">
                  <td className="px-5 py-3 font-medium text-dark-gray">
                    {b.bucket}
                  </td>
                  <td className="px-5 py-3 text-right font-mono">{b.count}</td>
                  <td className="px-5 py-3 text-right font-mono">
                    {fmtNumber(b.faceValueNGN, 0)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-3 w-full rounded-full bg-gray-100">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, (b.faceValueNGN / maxFace) * 100)}%`,
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
    </div>
  );
}
