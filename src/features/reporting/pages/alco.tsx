import {
  BOOK_COMPUTED,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";

const totals = BOOK_COMPUTED.totals;
const matProfile = BOOK_COMPUTED.maturityProfile;

const totalBSV = totals.totalBSValueNGN;
const totalDV01 = BOOK_VALUATIONS.reduce((s, v) => s + v.risk.dv01, 0);
const wDur =
  BOOK_VALUATIONS.reduce(
    (s, v) => s + v.risk.modifiedDuration * v.balanceSheetValueNGN,
    0,
  ) / (totalBSV || 1);

// Duration gap buckets: assets vs liabilities proxy (assets = book, liabilities = 5yr flat)
const assetDur = wDur;
const liabilityDur = 5.0; // proxy
const durationGap = assetDur - liabilityDur;

// DV01 by maturity bucket
const dv01ByBucket = matProfile.map((b) => ({
  bucket: b.bucket,
  faceValue: b.faceValueNGN,
  dv01Est:
    b.faceValueNGN *
    0.0001 *
    (b.bucket === "0-1yr"
      ? 0.5
      : b.bucket === "1-3yr"
        ? 2
        : b.bucket === "3-5yr"
          ? 4
          : b.bucket === "5-10yr"
            ? 7
            : 12),
}));

// Interest rate sensitivity: EaR for +100bps shock
const earShock = Math.abs(totalDV01) * 100; // ₦ impact

export function ALCO() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-dark-gray">
            ALCO Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Asset-Liability Committee — Q2 2026, as at 28 May 2026
          </p>
        </div>
        <button className="rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary">
          Export PDF
        </button>
      </div>

      {/* duration gap KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Asset Duration",
            value: assetDur.toFixed(2) + " yrs",
            sub: "weighted modified duration",
          },
          {
            label: "Liability Duration (proxy)",
            value: liabilityDur.toFixed(1) + " yrs",
            sub: "5yr funding proxy",
          },
          {
            label: "Duration Gap",
            value:
              (durationGap >= 0 ? "+" : "") + durationGap.toFixed(2) + " yrs",
            sub: durationGap > 0 ? "asset-sensitive" : "liability-sensitive",
            danger: Math.abs(durationGap) > 3,
          },
          {
            label: "Portfolio DV01",
            value: fmtCompact(Math.abs(totalDV01)),
            sub: "₦ per 1bp",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <p
              className={`mt-2 text-xl font-bold ${(k as any).danger ? "text-danger" : "text-dark-gray"}`}
            >
              {k.value}
            </p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* interest rate sensitivity */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Interest Rate Sensitivity
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-400">
              <th className="pb-2 text-left font-medium">Shock Scenario</th>
              <th className="pb-2 text-right font-medium">DV01 Impact (₦)</th>
              <th className="pb-2 text-right font-medium">EaR Impact (₦)</th>
              <th className="pb-2 text-right font-medium">% of AuM</th>
            </tr>
          </thead>
          <tbody>
            {[
              { scenario: "Parallel +25bps", mult: 25 },
              { scenario: "Parallel +50bps", mult: 50 },
              { scenario: "Parallel +100bps", mult: 100 },
              { scenario: "Parallel +200bps", mult: 200 },
              { scenario: "Parallel -100bps", mult: -100 },
            ].map((s) => {
              const impact = totalDV01 * s.mult;
              return (
                <tr
                  key={s.scenario}
                  className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
                >
                  <td className="py-3 text-dark-gray">{s.scenario}</td>
                  <td className="py-3 text-right font-semibold text-danger">
                    {fmtCompact(impact)}
                  </td>
                  <td className="py-3 text-right font-semibold text-danger">
                    {fmtCompact(impact * 1.15)}
                  </td>
                  <td className="py-3 text-right text-gray-400">
                    {fmtPct(Math.abs(impact) / totalBSV)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* duration gap by maturity bucket */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Duration Gap by Maturity Bucket
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-400">
              <th className="pb-2 text-left font-medium">Maturity Bucket</th>
              <th className="pb-2 text-right font-medium">Instruments</th>
              <th className="pb-2 text-right font-medium">Face Value (₦)</th>
              <th className="pb-2 text-right font-medium">Est. DV01 (₦)</th>
              <th className="pb-2 text-right font-medium">% of Book</th>
            </tr>
          </thead>
          <tbody>
            {dv01ByBucket.map((b) => (
              <tr
                key={b.bucket}
                className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
              >
                <td className="py-3 font-medium text-dark-gray">{b.bucket}</td>
                <td className="py-3 text-right text-gray-500">
                  {matProfile.find((m) => m.bucket === b.bucket)?.count ?? 0}
                </td>
                <td className="py-3 text-right font-semibold">
                  {fmtCompact(b.faceValue)}
                </td>
                <td className="py-3 text-right text-danger font-semibold">
                  {fmtCompact(b.dv01Est)}
                </td>
                <td className="py-3 text-right text-gray-400">
                  {fmtPct(b.faceValue / totals.totalBSValueNGN)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* liquidity profile */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Liquidity Maturity Profile (Cumulative)
        </h2>
        <div className="space-y-2">
          {(() => {
            let cumulative = 0;
            return matProfile.map((b) => {
              cumulative += b.faceValueNGN;
              const pct = cumulative / totals.totalBSValueNGN;
              return (
                <div key={b.bucket} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-gray-500">{b.bucket}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs font-semibold">
                    {fmtPct(pct)}
                  </span>
                  <span className="w-24 text-right text-xs text-gray-400">
                    {fmtCompact(cumulative)}
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
