import { Briefcase, Wallet, ShieldAlert, Activity } from "lucide-react";
import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { fmtMoneyCompact, fmtNumber, CLASSIFICATION_BADGE } from "../utils";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { AcronymTip } from "../../../components/shared/acronym-tip";

export function ValuationOverview() {
  const v = useValuation();
  if (!v.hasData) return <EmptyPortfolio />;
  const { totals, byClassification } = v.result;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Portfolio Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          As at {v.assumptions.valuationDate} · {totals.instruments} instruments
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Sheet Value"
          value={fmtMoneyCompact(totals.totalBSValueNGN, "NGN")}
          subtitle="Total NGN-equivalent"
          icon={<Briefcase className="h-4 w-4" />}
          variant="highlight"
        />
        <StatCard
          title="Face Value"
          value={fmtMoneyCompact(totals.totalFaceValueNGN, "NGN")}
          subtitle="Sum of nominal"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          title="ECL Provision"
          value={fmtMoneyCompact(totals.totalECLNGN, "NGN")}
          subtitle="Amortised Cost + Fair Value (OCI) stages"
          icon={<ShieldAlert className="h-4 w-4" />}
          variant="warning"
        />
        <StatCard
          title="OCI Reserve"
          value={fmtMoneyCompact(totals.totalOCIReserveNGN, "NGN")}
          subtitle="Fair Value (OCI) — unrealised movement"
          icon={<Activity className="h-4 w-4" />}
          variant={totals.totalOCIReserveNGN >= 0 ? "default" : "danger"}
        />
      </div>

      <SectionCard
        title="Breakdown by Classification"
        description="AC = Amortised Cost · FVOCI = Fair Value through Other Comprehensive Income · FVTPL = Fair Value through Profit & Loss"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Classification</th>
                <th className="px-5 py-2.5 text-right">Count</th>
                <th className="px-5 py-2.5 text-right">Face Value (NGN)</th>
                <th className="px-5 py-2.5 text-right">BS Value (NGN)</th>
                <th className="px-5 py-2.5 text-right">ECL</th>
              </tr>
            </thead>
            <tbody>
              {byClassification.map((r) => (
                <tr
                  key={r.classification}
                  className="border-b border-border/60"
                >
                  <td className="px-5 py-3">
                    <AcronymTip term={r.classification}>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSIFICATION_BADGE[r.classification]}`}
                      >
                        {r.classification}
                      </span>
                    </AcronymTip>
                  </td>
                  <td className="px-5 py-3 text-right font-mono">{r.count}</td>
                  <td className="px-5 py-3 text-right font-mono">
                    {fmtNumber(r.faceValueNGN, 0)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold">
                    {fmtNumber(r.bsValueNGN, 0)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-primary">
                    {fmtNumber(r.eclNGN, 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-mono text-xs font-bold">
                <td className="px-5 py-2.5 font-sans uppercase text-gray-500">
                  Total
                </td>
                <td className="px-5 py-2.5 text-right">
                  {fmtNumber(totals.instruments)}
                </td>
                <td className="px-5 py-2.5 text-right">
                  {fmtNumber(totals.totalFaceValueNGN, 0)}
                </td>
                <td className="px-5 py-2.5 text-right">
                  {fmtNumber(totals.totalBSValueNGN, 0)}
                </td>
                <td className="px-5 py-2.5 text-right">
                  {fmtNumber(totals.totalECLNGN, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
