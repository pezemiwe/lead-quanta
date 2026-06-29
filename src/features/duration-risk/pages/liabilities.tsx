import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { fmtCompactNGN } from "../utils";
import {
  DEFAULT_LIABILITY_STRUCTURE,
  LIABILITY_POLICY_CLASSES,
} from "../engine/reference-data";
import { Plus, Trash2, RotateCcw, ShieldCheck, TrendingDown, AlertTriangle } from "lucide-react";
import type { LiabilityBucket } from "../engine/types";
import { BOOK_COMPUTED } from "../../portfolio/engine/book-compute";
void BOOK_COMPUTED;

const fmtY = (v: number) =>
  v >= 1e9
    ? `₦${(v / 1e9).toFixed(0)}B`
    : v >= 1e6
      ? `₦${(v / 1e6).toFixed(0)}M`
      : `₦${v}`;

const fmtTooltip = (v: unknown) =>
  typeof v === "number" ? fmtCompactNGN(v) : String(v);

type ViewTab = "overview" | "cashflows" | "ladder";

export function DurationRiskLiabilities() {
  const v = useDurationRisk();
  const [tab, setTab] = useState<ViewTab>("overview");
  const [rows, setRows] = useState<LiabilityBucket[]>(v.liabilities);

  const update = (i: number, patch: Partial<LiabilityBucket>) =>
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((p) => p.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((p) => [...p, { bucket: "New Bucket", duration: 1, valueNGN: 0 }]);
  const apply = () => v.setLiabilities(rows);
  const reset = () => {
    setRows(DEFAULT_LIABILITY_STRUCTURE);
    v.setLiabilities(DEFAULT_LIABILITY_STRUCTURE);
  };

  const totalLiabilityValue = rows.reduce((s, r) => s + r.valueNGN, 0);
  const wtdLiabilityDur =
    totalLiabilityValue > 0
      ? rows.reduce((s, r) => s + r.duration * r.valueNGN, 0) / totalLiabilityValue
      : 0;

  const assetWAD = v.result.totals.wtdModifiedDur ?? 0;
  const durationGap = assetWAD - wtdLiabilityDur;
  const totalAssets = v.result.alm.buckets.reduce((s, b) => s + b.assetValue, 0) || BOOK_COMPUTED.totals.totalBSValueNGN;
  const surplus = totalAssets - totalLiabilityValue;

  // Cash flow chart data: overlay asset and liability cash flows by year
  const cashFlowData = useMemo(() => {
    const yearMap = new Map<number, { year: number; assets: number; liabilities: number }>();
    for (const cls of LIABILITY_POLICY_CLASSES) {
      cls.years.forEach((yr, i) => {
        const existing = yearMap.get(yr) ?? { year: yr, assets: 0, liabilities: 0 };
        existing.liabilities += cls.cashFlows[i] ?? 0;
        yearMap.set(yr, existing);
      });
    }
    // approximate asset cash flows proportionally from WAD
    const assetBuckets = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 25];
    assetBuckets.forEach((yr) => {
      const weight = Math.exp(-Math.abs(yr - assetWAD) / 3);
      const existing = yearMap.get(yr) ?? { year: yr, assets: 0, liabilities: 0 };
      existing.assets = (weight / assetBuckets.reduce((s, y) => s + Math.exp(-Math.abs(y - assetWAD) / 3), 0)) * totalAssets * 0.35;
      yearMap.set(yr, existing);
    });
    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [assetWAD, totalAssets]);

  const TABS: { id: ViewTab; label: string }[] = [
    { id: "overview", label: "Overview & Gap" },
    { id: "cashflows", label: "Cash Flow Overlay" },
    { id: "ladder", label: "Liability Ladder" },
  ];

  return (
    <div className="space-y-6 p-5 lg:p-7">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
            Duration & Risk
          </p>
          <h1 className="text-xl font-bold tracking-tight text-dark-gray">
            Liability Structure & ALM
          </h1>
          <p className="mt-1 text-xs text-dark-gray/45">
            Insurance liability cash flow model — life, general, health and annuity policy classes.
            LACL technical reserves as at {new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-dark-gray/60 transition hover:bg-surface-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset defaults
          </button>
          <button
            onClick={apply}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
          >
            Apply changes
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <StatCardGrid>
        <StatCard
          title="Total Technical Reserves"
          value={fmtCompactNGN(totalLiabilityValue)}
          subtitle="Policyholder liabilities"
          icon={<ShieldCheck className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="Wtd. Avg. Liability Duration"
          value={`${wtdLiabilityDur.toFixed(2)}y`}
          subtitle="Across all policy classes"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <StatCard
          title="Asset–Liability Duration Gap"
          value={`${durationGap >= 0 ? "+" : ""}${durationGap.toFixed(2)}y`}
          subtitle={`Asset WAD ${assetWAD.toFixed(2)}y vs Liability ${wtdLiabilityDur.toFixed(2)}y`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={Math.abs(durationGap) > 2 ? "warning" : "default"}
          trend={{
            label:
              durationGap > 2
                ? "Consider extending asset duration"
                : durationGap < -2
                  ? "Consider shortening asset duration"
                  : "Gap within tolerance",
            direction: Math.abs(durationGap) > 2 ? "down" : "neutral",
          }}
        />
        <StatCard
          title="Surplus (Assets − Liabilities)"
          value={fmtCompactNGN(surplus)}
          subtitle="Solvency buffer"
          icon={<ShieldCheck className="h-4 w-4" />}
          variant={surplus < 0 ? "danger" : surplus < totalAssets * 0.1 ? "warning" : "default"}
        />
      </StatCardGrid>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-surface text-dark-gray shadow-sm"
                : "text-dark-gray/50 hover:text-dark-gray"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview: Policy Classes ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {LIABILITY_POLICY_CLASSES.map((cls) => (
              <div
                key={cls.name}
                className="rounded-xl border border-border bg-surface p-4"
                style={{ borderTopColor: cls.colour, borderTopWidth: 3 }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-dark-gray">{cls.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: cls.colour + "18", color: cls.colour }}
                  >
                    {cls.shortName}
                  </span>
                </div>
                <p className="text-xl font-bold text-dark-gray">
                  {fmtCompactNGN(cls.valueNGN)}
                </p>
                <p className="text-xs text-dark-gray/40">{cls.description}</p>
                <div className="mt-3 border-t border-border pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-gray/45">Duration</span>
                    <span className="font-bold text-dark-gray">{cls.duration.toFixed(1)}y</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-0.5">
                    <span className="text-dark-gray/45">% of reserves</span>
                    <span className="font-semibold text-dark-gray/70">
                      {((cls.valueNGN / totalLiabilityValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Duration Gap Advisory */}
          <div
            className={`rounded-xl border p-4 ${
              Math.abs(durationGap) > 3
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  Math.abs(durationGap) > 3 ? "text-amber-600" : "text-emerald-600"
                }`}
              />
              <div>
                <p
                  className={`text-xs font-bold ${
                    Math.abs(durationGap) > 3 ? "text-amber-800" : "text-emerald-800"
                  }`}
                >
                  ALM Gap Analysis —{" "}
                  {Math.abs(durationGap) > 3 ? "Action Recommended" : "Within Tolerance"}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    Math.abs(durationGap) > 3 ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  Asset WAD {assetWAD.toFixed(2)}y vs Liability WAD {wtdLiabilityDur.toFixed(2)}y → Gap{" "}
                  <strong>{durationGap >= 0 ? "+" : ""}{durationGap.toFixed(2)}y</strong>.{" "}
                  {durationGap > 2
                    ? "Assets are longer than liabilities. The portfolio benefits from declining rates but is exposed to rising rates. Consider rotating into shorter-dated instruments or increasing floating-rate allocation."
                    : durationGap < -2
                      ? "Liabilities are longer than assets. The portfolio is exposed to reinvestment risk. Consider extending into longer-dated FGN bonds or infrastructure bonds."
                      : "Duration gap is within ±2y tolerance. Continue monitoring as new business is written and policies mature."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cash Flow Overlay ── */}
      {tab === "cashflows" && (
        <SectionCard
          title="Asset vs Liability Cash Flows"
          description="Approximate cash inflows (asset maturities/coupons) vs outflows (policyholder claims/benefits) by year"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} barGap={2}>
                <XAxis
                  dataKey="year"
                  tickFormatter={(v) => `Y${v}`}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />
                <YAxis tickFormatter={fmtY} tick={{ fontSize: 10, fill: "#6B7280" }} />
                <Tooltip formatter={fmtTooltip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#E5E7EB" />
                <Bar dataKey="assets" name="Asset Cash Flows" fill="#F7941D" radius={[3, 3, 0, 0]} />
                <Bar dataKey="liabilities" name="Liability Outflows" fill="#1E3A5F" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[10px] text-dark-gray/35">
            Asset cash flows are approximated from the portfolio duration profile. Liability cash flows are
            based on actuarial projections per policy class. A gap indicates ALM risk — either reinvestment
            risk (assets shorter) or liquidity risk (liabilities shorter than assets).
          </p>
        </SectionCard>
      )}

      {/* ── Liability Ladder (editable) ── */}
      {tab === "ladder" && (
        <SectionCard
          title="Liability Time Bucket Ladder"
          description="Edit individual buckets then click Apply to update ALM gap analysis"
          actions={
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[10px] text-dark-gray/50 transition hover:bg-surface-muted"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
              <button
                onClick={apply}
                className="rounded-lg bg-primary px-3 py-1 text-[10px] font-bold text-white transition hover:bg-primary/90"
              >
                Apply
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border">
                <tr>
                  <th className="pb-2.5 pr-4 text-left font-semibold uppercase tracking-wider text-dark-gray/40">
                    Bucket / Policy Class
                  </th>
                  <th className="pb-2.5 pr-4 text-right font-semibold uppercase tracking-wider text-dark-gray/40">
                    Duration (yrs)
                  </th>
                  <th className="pb-2.5 pr-4 text-right font-semibold uppercase tracking-wider text-dark-gray/40">
                    Value (NGN)
                  </th>
                  <th className="pb-2.5 text-right font-semibold uppercase tracking-wider text-dark-gray/40">
                    % of Total
                  </th>
                  <th className="pb-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <input
                        value={r.bucket}
                        onChange={(e) => update(i, { bucket: e.target.value })}
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-4">
                      <input
                        type="number"
                        step="0.01"
                        value={r.duration}
                        onChange={(e) => update(i, { duration: Number(e.target.value) })}
                        className="w-20 rounded border border-border bg-surface px-2 py-1 text-right text-xs font-mono focus:border-primary focus:outline-none ml-auto block"
                      />
                    </td>
                    <td className="py-2.5 pr-4">
                      <input
                        type="number"
                        value={r.valueNGN}
                        onChange={(e) => update(i, { valueNGN: Number(e.target.value) })}
                        className="w-40 rounded border border-border bg-surface px-2 py-1 text-right text-xs font-mono focus:border-primary focus:outline-none ml-auto block"
                      />
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-dark-gray/60">
                      {totalLiabilityValue > 0
                        ? `${((r.valueNGN / totalLiabilityValue) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => remove(i)}
                        className="text-dark-gray/25 transition hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-surface-muted/40">
                <tr>
                  <td className="px-0 py-3">
                    <button
                      onClick={add}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1 text-[10px] text-dark-gray/45 transition hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-3 w-3" /> Add bucket
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-right text-xs font-bold text-dark-gray">
                    WAD: {wtdLiabilityDur.toFixed(3)}y
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs font-bold text-dark-gray">
                    {fmtCompactNGN(totalLiabilityValue)}
                  </td>
                  <td className="py-3 pr-4 text-right text-xs font-semibold text-dark-gray">
                    100.0%
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
