import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtCompactNGN, fmtYears } from "../utils";
import { AlertTriangle, CheckCircle2, Scale } from "lucide-react";
import { Link } from "react-router-dom";

export function DurationRiskALMGap() {
  const v = useDurationRisk();
  if (!v.hasData) return <EmptyPortfolio />;
  const { alm } = v.result;

  const maxValue = Math.max(
    ...alm.buckets.flatMap((b) => [b.assetValue, b.liabValue]),
    1,
  );

  // cumulative gap
  let cum = 0;
  const cumGaps = alm.buckets.map((b) => {
    cum += b.gap;
    return cum;
  });
  const maxAbsCum = Math.max(...cumGaps.map((g) => Math.abs(g)), 1);

  const positiveGap = alm.durationGap > 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">
            Asset / Liability Gap
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Duration gap analysis between the asset portfolio and the liability
            ladder.
          </p>
        </div>
        <Link
          to="/duration-risk/liabilities"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-pale-red hover:text-primary hover:border-primary"
        >
          Edit liabilities
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Asset Duration"
          value={fmtYears(alm.wtdAssetDur, 3)}
          subtitle="Weighted by BS value"
          icon={<Scale className="h-4 w-4" />}
        />
        <StatCard
          title="Liability Duration"
          value={fmtYears(alm.wtdLiabDur, 3)}
          subtitle="Weighted by value"
          icon={<Scale className="h-4 w-4" />}
        />
        <StatCard
          title="Duration Gap"
          value={fmtYears(alm.durationGap, 3)}
          subtitle={positiveGap ? "Assets longer" : "Liabilities longer"}
          icon={
            positiveGap ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )
          }
          variant={
            Math.abs(alm.durationGap) > 1
              ? positiveGap
                ? "danger"
                : "warning"
              : "default"
          }
        />
        <StatCard
          title="DV01 Gap"
          value={fmtCompactNGN(alm.dv01Gap)}
          subtitle="NGN per bp"
          icon={<Scale className="h-4 w-4" />}
          variant={alm.dv01Gap < 0 ? "default" : "warning"}
        />
      </div>

      {/* interpretation */}
      <div
        className={`rounded-xl border p-4 text-sm ${
          positiveGap
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-teal-200 bg-teal-50 text-success"
        }`}
      >
        {positiveGap ? (
          <p>
            <strong>Positive duration gap.</strong> Assets are longer than
            liabilities a 100 bp rate rise would reduce equity by
            approximately{" "}
            <span className="font-mono">
              {fmtCompactNGN(-alm.dv01Gap * 100)}
            </span>
            .
          </p>
        ) : (
          <p>
            <strong>Negative duration gap.</strong> Liabilities reprice faster
            than assets — rising rates benefit net position.
          </p>
        )}
      </div>

      {/* ladder */}
      <SectionCard title="Bucket-by-Bucket Comparison" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Bucket</th>
                <th className="px-4 py-2.5 text-right">Asset Value</th>
                <th className="px-4 py-2.5 text-right">Asset Dur</th>
                <th className="px-4 py-2.5 text-right">Liab Value</th>
                <th className="px-4 py-2.5 text-right">Liab Dur</th>
                <th className="px-4 py-2.5 text-right">Gap</th>
                <th className="px-4 py-2.5 text-left w-48">Ladder</th>
              </tr>
            </thead>
            <tbody>
              {alm.buckets.map((b) => {
                const assetPct = (b.assetValue / maxValue) * 100;
                const liabPct = (b.liabValue / maxValue) * 100;
                return (
                  <tr key={b.bucket} className="border-b border-border/60">
                    <td className="px-4 py-2.5 font-medium">{b.bucket}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {fmtCompactNGN(b.assetValue)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {b.assetDur.toFixed(2)}y
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {fmtCompactNGN(b.liabValue)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {b.liabDur.toFixed(2)}y
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-semibold ${
                        b.gap >= 0 ? "text-success" : "text-primary"
                      }`}
                    >
                      {fmtCompactNGN(b.gap)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-2 bg-blue-500"
                            style={{ width: `${assetPct}%` }}
                          />
                        </div>
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-2 bg-amber-500"
                            style={{ width: `${liabPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {fmtCompactNGN(alm.totalAssetNGN)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {alm.wtdAssetDur.toFixed(2)}y
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {fmtCompactNGN(alm.totalLiabNGN)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {alm.wtdLiabDur.toFixed(2)}y
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-mono ${
                    alm.totalAssetNGN - alm.totalLiabNGN >= 0
                      ? "text-success"
                      : "text-primary"
                  }`}
                >
                  {fmtCompactNGN(alm.totalAssetNGN - alm.totalLiabNGN)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-border bg-gray-50 px-4 py-2 text-xs text-gray-500">
          <span className="mr-4 inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-500" /> Assets
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-500" /> Liabilities
          </span>
        </div>
      </SectionCard>

      {/* cumulative gap */}
      <SectionCard
        title="Cumulative A-L Gap"
        description="Running cumulative gap across maturity buckets."
      >
        <div className="space-y-2">
          {alm.buckets.map((b, i) => {
            const cumVal = cumGaps[i];
            const pct = (Math.abs(cumVal) / maxAbsCum) * 100;
            const positive = cumVal >= 0;
            return (
              <div
                key={b.bucket}
                className="grid grid-cols-12 items-center gap-3"
              >
                <span className="col-span-2 text-xs text-gray-500">
                  {b.bucket}
                </span>
                <div className="col-span-7 flex h-5 items-center">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    {!positive && (
                      <div
                        className="absolute right-1/2 h-full rounded-l-full bg-red-500"
                        style={{ width: `${pct / 2}%` }}
                      />
                    )}
                    {positive && (
                      <div
                        className="absolute left-1/2 h-full rounded-r-full bg-green-500"
                        style={{ width: `${pct / 2}%` }}
                      />
                    )}
                    <div className="absolute left-1/2 h-full w-px bg-gray-300" />
                  </div>
                </div>
                <span
                  className={`col-span-3 text-right font-mono text-xs font-semibold ${
                    positive ? "text-success" : "text-primary"
                  }`}
                >
                  {fmtCompactNGN(cumVal)}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
