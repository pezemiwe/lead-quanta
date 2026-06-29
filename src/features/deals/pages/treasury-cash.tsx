/* ─────────────────────────────────────────────────────────────────────────
   Treasury Cash Management Dashboard
   Dedicated page for the Treasury Cash persona — Bloomberg-style cashflow view
   ───────────────────────────────────────────────────────────────────────── */
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  Wallet,
  Clock,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
} from "lucide-react";
import {
  BOOK_VALUATIONS,
  fmtCompact,
  fmtDate,
  fmtN,
  fmtPct,
} from "../../portfolio/engine/book-compute";
import { useWorkflow } from "../../workflow/store";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { SectionCard } from "../../../components/shared/section-card";
import { dealNotional } from "../../workflow/engine/fields";

const VALUATION_DATE = "2026-05-28";
const FX_USD = 1580;

/* ── Date helpers ──────────────────────────────────────────── */
function parseISO(s: string): Date {
  return new Date(s + "T00:00:00Z");
}
function daysDiff(from: string, to: string): number {
  return Math.round(
    (parseISO(to).getTime() - parseISO(from).getTime()) / 86_400_000,
  );
}
function addDays(base: string, n: number): string {
  const d = new Date(parseISO(base).getTime() + n * 86_400_000);
  return d.toISOString().slice(0, 10);
}
function bucketLabel(days: number): "This Week" | "Next Week" | "2-4 Weeks" | "1-3 Months" {
  if (days <= 7) return "This Week";
  if (days <= 14) return "Next Week";
  if (days <= 28) return "2-4 Weeks";
  return "1-3 Months";
}

type CashFlowEvent = {
  date: string;
  type: "Maturity" | "Coupon" | "Settlement";
  label: string;
  amount: number;
  direction: "inflow" | "outflow";
  bucket: "This Week" | "Next Week" | "2-4 Weeks" | "1-3 Months";
  daysAway: number;
};

const BUCKET_ORDER = ["This Week", "Next Week", "2-4 Weeks", "1-3 Months"] as const;

/* ── Liquidity ladder tenors ────────────────────────────────── */
type LiqBucket = {
  label: string;
  minDays: number;
  maxDays: number;
  value: number;
};

const LIQ_TENORS: Omit<LiqBucket, "value">[] = [
  { label: "0–30d", minDays: 0, maxDays: 30 },
  { label: "31–90d", minDays: 31, maxDays: 90 },
  { label: "91–180d", minDays: 91, maxDays: 180 },
  { label: "181–365d", minDays: 181, maxDays: 365 },
  { label: "1–3yr", minDays: 366, maxDays: 1095 },
  { label: "3–5yr", minDays: 1096, maxDays: 1825 },
  { label: "5yr+", minDays: 1826, maxDays: Infinity },
];

/* ── Helpers ─────────────────────────────────────────────────── */
function typeColour(type: CashFlowEvent["type"]): string {
  if (type === "Maturity") return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (type === "Coupon") return "bg-blue-100 text-blue-800 border border-blue-200";
  return "bg-amber-100 text-amber-800 border border-amber-200";
}

function dirIcon(dir: CashFlowEvent["direction"], type: CashFlowEvent["type"]) {
  if (dir === "inflow")
    return <ArrowUpCircle className="h-4 w-4 text-emerald-500 shrink-0" />;
  return <ArrowDownCircle className="h-4 w-4 text-amber-500 shrink-0" />;
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
export function TreasuryCashManagement() {
  const { dealSlips } = useWorkflow();

  /* ── Build cashflow event list ─────────────────────────────── */
  const cashEvents = useMemo<CashFlowEvent[]>(() => {
    const events: CashFlowEvent[] = [];
    const horizon90 = addDays(VALUATION_DATE, 90);

    for (const v of BOOK_VALUATIONS) {
      if (v.instrument.status !== "Active") continue;
      const mat = v.instrument.maturityDate;

      // Maturity inflows
      if (mat >= VALUATION_DATE && mat <= horizon90) {
        const days = daysDiff(VALUATION_DATE, mat);
        events.push({
          date: mat,
          type: "Maturity",
          label: v.instrument.name,
          amount: v.balanceSheetValueNGN,
          direction: "inflow",
          bucket: bucketLabel(days),
          daysAway: days,
        });
      }

      // Coupon inflows
      const nextCoup = v.risk.nextCouponDate;
      if (
        nextCoup &&
        nextCoup >= VALUATION_DATE &&
        nextCoup <= horizon90 &&
        v.risk.nextCouponAmount > 0
      ) {
        const days = daysDiff(VALUATION_DATE, nextCoup);
        events.push({
          date: nextCoup,
          type: "Coupon",
          label: `${v.instrument.name} — coupon`,
          amount: v.risk.nextCouponAmount,
          direction: "inflow",
          bucket: bucketLabel(days),
          daysAway: days,
        });
      }
    }

    // Settlement outflows from workflow
    for (const d of dealSlips) {
      if (d.status !== "Approved" && d.status !== "Pending Settlement") continue;
      const valueDate =
        d.fields.valueDate ?? d.fields.settlementDate ?? VALUATION_DATE;
      const days = Math.max(0, daysDiff(VALUATION_DATE, valueDate));
      if (days > 90) continue;
      const notional = dealNotional(d.fields);
      events.push({
        date: valueDate,
        type: "Settlement",
        label: `${d.id} — ${d.fields.counterparty ?? d.fields.issuer ?? d.fields.broker ?? "counterparty"}`,
        amount: notional,
        direction: "outflow",
        bucket: bucketLabel(days),
        daysAway: days,
      });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [dealSlips]);

  /* ── Liquidity ladder ──────────────────────────────────────── */
  const ladderData = useMemo<(LiqBucket & { cumulative: number })[]>(() => {
    const buckets: LiqBucket[] = LIQ_TENORS.map((t) => ({ ...t, value: 0 }));
    for (const v of BOOK_VALUATIONS) {
      if (v.instrument.status !== "Active") continue;
      const days = daysDiff(VALUATION_DATE, v.instrument.maturityDate);
      if (days < 0) continue;
      const bkt = buckets.find((b) => days >= b.minDays && days <= b.maxDays);
      if (bkt) bkt.value += v.balanceSheetValueNGN;
    }
    let cumulative = 0;
    return buckets.map((b) => {
      cumulative += b.value;
      return { ...b, cumulative };
    });
  }, []);

  /* ── KPI calculations ──────────────────────────────────────── */
  const kpis = useMemo(() => {
    const inflows90 = cashEvents
      .filter((e) => e.direction === "inflow")
      .reduce((s, e) => s + e.amount, 0);

    const today = cashEvents.filter((e) => e.daysAway === 0);
    const todayIn = today
      .filter((e) => e.direction === "inflow")
      .reduce((s, e) => s + e.amount, 0);
    const todayOut = today
      .filter((e) => e.direction === "outflow")
      .reduce((s, e) => s + e.amount, 0);
    const todayNet = todayIn - todayOut;

    const pendingSettlements = dealSlips.filter(
      (d) => d.status === "Approved" || d.status === "Pending Settlement",
    ).length;

    const totalBSV = BOOK_VALUATIONS.filter((v) => v.instrument.status === "Active").reduce(
      (s, v) => s + v.balanceSheetValueNGN,
      0,
    );

    const liquidityRatio = totalBSV > 0 ? inflows90 / totalBSV : 0;

    return { inflows90, todayNet, pendingSettlements, liquidityRatio, totalBSV };
  }, [cashEvents, dealSlips]);

  /* ── Group events by bucket ────────────────────────────────── */
  const grouped = useMemo(() => {
    const map = new Map<string, CashFlowEvent[]>();
    for (const b of BUCKET_ORDER) map.set(b, []);
    for (const e of cashEvents) {
      map.get(e.bucket)?.push(e);
    }
    return map;
  }, [cashEvents]);

  /* ── In-flight deals ────────────────────────────────────────── */
  const inFlightDeals = useMemo(
    () =>
      dealSlips.filter(
        (d) => d.status === "Approved" || d.status === "Pending Settlement",
      ),
    [dealSlips],
  );

  /* ── Ladder chart max ───────────────────────────────────────── */
  const ladderMax = Math.max(...ladderData.map((d) => d.value), 1);
  const cumulativeMax = ladderData[ladderData.length - 1]?.cumulative ?? 1;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Treasury Cash Management
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-dark-gray">
          Cash Flow & Liquidity Dashboard
        </h1>
        <p className="text-sm text-dark-gray/55">
          As at {fmtDate(VALUATION_DATE)} · Next 90-day view · Live settlement feed
        </p>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────── */}
      <StatCardGrid>
        <StatCard
          title="Liquidity (0–90 days)"
          value={fmtCompact(kpis.inflows90)}
          subtitle="Total maturities + coupons due"
          variant="highlight"
          trend={{ direction: "up", label: "Assets maturing within quarter" }}
        />
        <StatCard
          title="Today's Net Cash"
          value={fmtCompact(Math.abs(kpis.todayNet))}
          subtitle={kpis.todayNet >= 0 ? "Net inflow today" : "Net outflow today"}
          variant={kpis.todayNet >= 0 ? "default" : "warning"}
          trend={{
            direction: kpis.todayNet >= 0 ? "up" : "down",
            label: kpis.todayNet >= 0 ? "Positive cash position" : "Watch settlement outflows",
          }}
        />
        <StatCard
          title="Pending Settlements"
          value={kpis.pendingSettlements}
          subtitle="Approved deals awaiting payment"
          variant={kpis.pendingSettlements > 2 ? "warning" : "default"}
          trend={{
            direction: "neutral",
            label: `${inFlightDeals.length} in-flight`,
          }}
        />
        <StatCard
          title="Liquidity Ratio"
          value={fmtPct(kpis.liquidityRatio)}
          subtitle="90-day maturities / total book"
          trend={{ direction: "neutral", label: "vs 15% regulatory minimum" }}
        />
      </StatCardGrid>

      {/* ── Three-panel layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Panel 1 — Cash Flow Calendar */}
        <div className="xl:col-span-2">
          <SectionCard
            title="Cash Flow Calendar — Next 90 Days"
            description="Maturities, coupons, and settlement outflows bucketed by settlement week"
            actions={
              <span className="flex items-center gap-1.5 text-xs text-dark-gray/55">
                <Clock className="h-3.5 w-3.5" />
                {cashEvents.length} events
              </span>
            }
          >
            <div className="space-y-6">
              {BUCKET_ORDER.map((bucket) => {
                const events = grouped.get(bucket) ?? [];
                if (events.length === 0) return null;
                const bucketIn = events
                  .filter((e) => e.direction === "inflow")
                  .reduce((s, e) => s + e.amount, 0);
                const bucketOut = events
                  .filter((e) => e.direction === "outflow")
                  .reduce((s, e) => s + e.amount, 0);
                return (
                  <div key={bucket}>
                    {/* Bucket header */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-semibold text-dark-gray">
                          {bucket}
                        </span>
                        <span className="rounded-full bg-pale-red px-2 py-0.5 text-xs font-medium text-primary">
                          {events.length} events
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-600 font-medium">
                          +{fmtCompact(bucketIn)}
                        </span>
                        {bucketOut > 0 && (
                          <span className="text-amber-600 font-medium">
                            −{fmtCompact(bucketOut)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event rows */}
                    <div className="space-y-2">
                      {events.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:border-primary/30 transition-colors"
                        >
                          {dirIcon(e.direction, e.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${typeColour(e.type)}`}
                              >
                                {e.type}
                              </span>
                              <span className="text-sm font-medium text-dark-gray truncate">
                                {e.label}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-dark-gray/50">
                              {fmtDate(e.date)}
                              {e.daysAway > 0 ? ` · ${e.daysAway}d away` : " · Today"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`text-sm font-bold tabular-nums ${
                                e.direction === "inflow"
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {e.direction === "inflow" ? "+" : "−"}
                              {fmtCompact(e.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {cashEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-dark-gray/40">
                  <Calendar className="h-12 w-12 mb-3" />
                  <p className="text-sm">No cash flow events in the next 90 days</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Panel 3 — Settlement Cash Position (right sidebar) */}
        <div className="space-y-6">
          <SectionCard title="Settlement Cash Position" description="Today's in-flight deals">
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="rounded-lg bg-slate-900 p-4 text-white">
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                  Net Cash Today
                </p>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    kpis.todayNet >= 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {kpis.todayNet >= 0 ? "+" : "−"}
                  {fmtCompact(Math.abs(kpis.todayNet))}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {kpis.todayNet >= 0 ? "Net inflow" : "Net outflow"}
                </p>
              </div>

              {/* In-flight deals */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-dark-gray/50 mb-2">
                  In-Flight Deals
                </p>
                {inFlightDeals.length === 0 ? (
                  <p className="text-xs text-dark-gray/40 py-3 text-center">
                    No deals pending settlement
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inFlightDeals.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-lg border border-border bg-surface p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-dark-gray">
                              {d.id}
                            </p>
                            <p className="text-xs text-dark-gray/55 truncate">
                              {d.fields.counterparty ??
                                d.fields.issuer ??
                                d.fields.broker ??
                                d.assetClass}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-amber-600 tabular-nums">
                              −{fmtCompact(dealNotional(d.fields))}
                            </p>
                            <span
                              className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                d.status === "Approved"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                        </div>
                        {d.fields.valueDate && (
                          <p className="mt-1 text-[10px] text-dark-gray/40">
                            Value date: {fmtDate(d.fields.valueDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved awaiting payment */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-dark-gray/50 mb-2">
                  Approved — Awaiting Payment
                </p>
                {dealSlips.filter((d) => d.status === "Approved").length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-xs text-emerald-700">All approved deals settled</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dealSlips
                      .filter((d) => d.status === "Approved")
                      .map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3"
                        >
                          <div>
                            <p className="text-xs font-semibold text-blue-800">{d.id}</p>
                            <p className="text-[10px] text-blue-600">
                              {d.approvedBy ? `Approved by ${d.approvedBy}` : "Approved"}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-amber-600 tabular-nums">
                            {fmtCompact(dealNotional(d.fields))}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Panel 2 — Liquidity Ladder (full width below) */}
      <SectionCard
        title="Liquidity Ladder"
        description="Assets maturing by tenor bucket — cumulative liquidity profile"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={ladderData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="bar"
                tickFormatter={(v: number) => fmtCompact(v).replace("₦", "")}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <YAxis
                yAxisId="line"
                orientation="right"
                tickFormatter={(v: number) => fmtCompact(v).replace("₦", "")}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                formatter={(v: unknown, name: unknown) => [
                  fmtCompact(v as number),
                  name === "value" ? "Maturing Value" : "Cumulative Liquidity",
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v: unknown) =>
                  v === "value" ? "Maturing Value (₦)" : "Cumulative Liquidity (₦)"
                }
              />
              <Bar
                yAxisId="bar"
                dataKey="value"
                fill="#F7941D"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                name="value"
              />
              <Line
                yAxisId="line"
                type="monotone"
                dataKey="cumulative"
                stroke="#1E3A5F"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#1E3A5F", strokeWidth: 0 }}
                name="cumulative"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Ladder detail table */}
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-dark-gray/50">
                <th className="px-4 py-3 text-left">Tenor Bucket</th>
                <th className="px-4 py-3 text-right">Maturing Value</th>
                <th className="px-4 py-3 text-right">% of Book</th>
                <th className="px-4 py-3 text-right">Cumulative</th>
                <th className="px-4 py-3 text-right">Cumul. %</th>
              </tr>
            </thead>
            <tbody>
              {ladderData.map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-t border-border transition-colors hover:bg-pale-red/30 ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-dark-gray">{row.label}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {row.value > 0 ? fmtCompact(row.value) : <span className="text-dark-gray/30">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-dark-gray/70">
                    {kpis.totalBSV > 0
                      ? fmtPct(row.value / kpis.totalBSV)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-primary">
                    {fmtCompact(row.cumulative)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-dark-gray/70">
                    {kpis.totalBSV > 0
                      ? fmtPct(row.cumulative / kpis.totalBSV)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-slate-50">
                <td className="px-4 py-3 text-xs font-bold uppercase text-dark-gray">
                  Total Book
                </td>
                <td className="px-4 py-3 text-right font-bold text-dark-gray tabular-nums">
                  {fmtCompact(kpis.totalBSV)}
                </td>
                <td className="px-4 py-3 text-right text-dark-gray/70">100%</td>
                <td className="px-4 py-3 text-right font-bold text-primary tabular-nums">
                  {fmtCompact(kpis.totalBSV)}
                </td>
                <td className="px-4 py-3 text-right text-dark-gray/70">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* Footer timestamp */}
      <p className="text-center text-xs text-dark-gray/30 pb-4">
        Treasury Cash Dashboard · Rates as at {fmtDate(VALUATION_DATE)} · FX: USD/NGN {fmtN(FX_USD)} · Leadway Treasury Operations
      </p>
    </div>
  );
}
