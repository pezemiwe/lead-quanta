/* ─────────────────────────────────────────────────────────────────────────
   ALCO Investment Pack — Board / Investment Committee Quality Report
   Leadway Holdings Group · May 2026
   ───────────────────────────────────────────────────────────────────────── */
import { useMemo, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Activity,
  BarChart2,
} from "lucide-react";
import {
  BOOK_COMPUTED,
  BOOK_VALUATIONS,
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtPct,
  fmtDate,
  fmtN,
} from "../../portfolio/engine/book-compute";
import {
  assignEntities,
  ENTITY_BENCHMARKS,
} from "../../performance/engine/entity-assignment";
import { ENTITIES } from "../../../context/entity";
import { useWorkflow } from "../../workflow/store";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { SectionCard } from "../../../components/shared/section-card";
import type { EntityId } from "../../../context/entity";

const VALUATION_DATE = "2026-05-28";
const FX_USD = 1580;
const REPORT_PERIOD = "May 2026";

/* ── Pre-compute entity assignments ─────────────────────────── */
const ENTITY_IDS = assignEntities(BOOK_INSTRUMENTS);

/* ── Helpers ─────────────────────────────────────────────────── */
function daysOpen(createdAt: string): number {
  return Math.max(
    0,
    Math.round(
      (new Date("2026-05-28T00:00:00Z").getTime() -
        new Date(createdAt).getTime()) /
        86_400_000,
    ),
  );
}

type ComplianceStatus = "green" | "amber" | "red";

interface ComplianceItem {
  label: string;
  detail: string;
  status: ComplianceStatus;
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    label: "NAICOM Asset Allocation",
    detail: "Within permissible limits per Insurance Act 2023. FGN bonds >30% compliant.",
    status: "green",
  },
  {
    label: "Counterparty Limits",
    detail: "1 watch flag: Zenith Bank at 14.2% (limit 15%). Monitoring required.",
    status: "amber",
  },
  {
    label: "Regulatory Reporting",
    detail: "NAICOM Q1 2026 return filed. PENCOM RSA report due 30 Jun 2026.",
    status: "amber",
  },
];

/* ── Status badge helpers ────────────────────────────────────── */
function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: "bg-red-100 text-red-700 border border-red-200",
    assigned: "bg-amber-100 text-amber-700 border border-amber-200",
    "pending approval": "bg-blue-100 text-blue-700 border border-blue-200",
    closed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  return (
    map[status.toLowerCase()] ??
    "bg-slate-100 text-slate-700 border border-slate-200"
  );
}

function complianceIcon(s: ComplianceStatus) {
  if (s === "green")
    return <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
  if (s === "amber")
    return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
  return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
}

function complianceBg(s: ComplianceStatus) {
  if (s === "green") return "bg-emerald-50 border-emerald-200";
  if (s === "amber") return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
export function AlcoPack() {
  const { exceptions } = useWorkflow();
  const printRef = useRef<HTMLDivElement>(null);

  /* ── Weighted avg yield ──────────────────────────────────── */
  const { weightedYield, totalBSV } = useMemo(() => {
    let sumYieldXVal = 0;
    let total = 0;
    for (const v of BOOK_VALUATIONS) {
      if (v.instrument.status !== "Active") continue;
      sumYieldXVal += v.marketYieldUsed * v.balanceSheetValueNGN;
      total += v.balanceSheetValueNGN;
    }
    return {
      weightedYield: total > 0 ? sumYieldXVal / total : 0,
      totalBSV: total,
    };
  }, []);

  /* ── Open exceptions ─────────────────────────────────────── */
  const openExceptions = useMemo(
    () => exceptions.filter((e) => e.status !== "closed"),
    [exceptions],
  );

  /* ── Entity rows ─────────────────────────────────────────── */
  const entityRows = useMemo(() => {
    type EntityAcc = {
      bsv: number;
      count: number;
      yieldXVal: number;
    };
    const acc = new Map<EntityId, EntityAcc>();
    for (const id of ENTITIES.map((e) => e.id as EntityId)) {
      acc.set(id, { bsv: 0, count: 0, yieldXVal: 0 });
    }

    BOOK_VALUATIONS.forEach((v, i) => {
      if (v.instrument.status !== "Active") return;
      const entityId = ENTITY_IDS[i];
      if (!entityId) return;
      const row = acc.get(entityId);
      if (!row) return;
      row.bsv += v.balanceSheetValueNGN;
      row.count += 1;
      row.yieldXVal += v.marketYieldUsed * v.balanceSheetValueNGN;
    });

    return ENTITY_BENCHMARKS.map((eb) => {
      const data = acc.get(eb.id) ?? { bsv: 0, count: 0, yieldXVal: 0 };
      const yield_ = data.bsv > 0 ? data.yieldXVal / data.bsv : 0;
      const vsBenchmark = yield_ - eb.benchmarkYield;
      const entity = ENTITIES.find((e) => e.id === eb.id);
      return {
        id: eb.id,
        shortName: eb.shortName,
        name: entity?.name ?? eb.name,
        regulator: eb.regulator,
        colour: eb.colour,
        navNGN: data.bsv,
        navUSD: data.bsv / FX_USD,
        instruments: data.count,
        yield: yield_,
        benchmarkYield: eb.benchmarkYield,
        benchmarkLabel: eb.benchmarkLabel,
        vsBenchmark,
        status:
          vsBenchmark > 0.005
            ? "Outperform"
            : vsBenchmark < -0.005
              ? "Underperform"
              : "In-Line",
      };
    });
  }, []);

  /* ── Performance chart data ───────────────────────────────── */
  const perfChartData = useMemo(
    () =>
      entityRows
        .filter((r) => r.id !== "consolidated")
        .map((r) => ({
          name: r.shortName,
          "Portfolio Yield": parseFloat((r.yield * 100).toFixed(2)),
          Benchmark: parseFloat((r.benchmarkYield * 100).toFixed(2)),
          colour: r.colour,
        })),
    [entityRows],
  );

  /* ── Maturity buckets ────────────────────────────────────── */
  const maturityStats = useMemo(() => {
    let assets30 = 0;
    let assets90 = 0;
    const top5: { name: string; matDate: string; bsv: number; type: string }[] = [];

    for (const v of BOOK_VALUATIONS) {
      if (v.instrument.status !== "Active") continue;
      const years = v.risk.remainingTenorYears;
      if (years < 30 / 365) assets30 += v.balanceSheetValueNGN;
      if (years < 90 / 365) assets90 += v.balanceSheetValueNGN;
      top5.push({
        name: v.instrument.name,
        matDate: v.instrument.maturityDate,
        bsv: v.balanceSheetValueNGN,
        type: v.instrument.instrumentType,
      });
    }

    top5.sort((a, b) => a.matDate.localeCompare(b.matDate));
    return { assets30, assets90, top5: top5.slice(0, 5) };
  }, []);

  /* ── Download handler (stub) ─────────────────────────────── */
  function handleDownload() {
    const btn = document.getElementById("pdf-btn");
    if (btn) {
      btn.textContent = "Preparing PDF...";
      setTimeout(() => {
        if (btn) btn.textContent = "Download PDF";
      }, 2000);
    }
  }

  /* ── Limit breaches / watches (hardcoded per spec) ──────── */
  const limitBreaches = 0;
  const limitWatches = 1;

  return (
    <div ref={printRef} className="space-y-10 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      {/* ══════════════════════════════════════════════════════
          REPORT HEADER
          ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-4 w-1 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Confidential · Investment Committee
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-dark-gray sm:text-3xl">
            ALCO Investment Report
          </h1>
          <p className="mt-1 text-base font-semibold text-dark-gray/70">
            {REPORT_PERIOD} &nbsp;|&nbsp; Leadway Holdings Group
          </p>
          <p className="mt-0.5 text-xs text-dark-gray/40">
            Prepared by Investment Operations · Rates sourced from FMDQ as at{" "}
            {fmtDate(VALUATION_DATE)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 mt-3 sm:mt-0">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-dark-gray/40">
            <Clock className="h-3.5 w-3.5" />
            As at {fmtDate(VALUATION_DATE)}
          </span>
          <button
            id="pdf-btn"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — EXECUTIVE SUMMARY STRIP
          ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader number="1" title="Executive Summary" />
        <StatCardGrid>
          <StatCard
            title="Group AUM"
            value={fmtCompact(BOOK_COMPUTED.totals.totalBSValueNGN)}
            subtitle={`${fmtN(BOOK_COMPUTED.totals.instruments)} instruments · ${fmtCompact(BOOK_COMPUTED.totals.totalBSValueUSD, "$")} USD equiv.`}
            variant="highlight"
            trend={{ direction: "up", label: "Book value as at valuation date" }}
          />
          <StatCard
            title="Portfolio Yield (Wtd Avg)"
            value={fmtPct(weightedYield)}
            subtitle="Weighted by balance sheet value"
            trend={{ direction: "up", label: "vs blended benchmark 18.9%" }}
          />
          <StatCard
            title="Open Exceptions"
            value={openExceptions.length}
            subtitle={`${exceptions.length} total · ${exceptions.filter((e) => e.status === "closed").length} closed`}
            variant={openExceptions.length > 2 ? "warning" : "default"}
            trend={{
              direction: openExceptions.length > 0 ? "down" : "up",
              label: openExceptions.length > 0 ? "Action required" : "All clear",
            }}
          />
          <StatCard
            title="Limit Utilisation"
            value={`${limitBreaches} breach / ${limitWatches} watch`}
            subtitle="Counterparty & asset class limits"
            variant={limitBreaches > 0 ? "danger" : limitWatches > 0 ? "warning" : "default"}
            trend={{
              direction: limitBreaches > 0 ? "down" : "neutral",
              label: limitBreaches > 0 ? "Breach requires IC approval" : "Within tolerance",
            }}
          />
        </StatCardGrid>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — PORTFOLIO POSITION BY ENTITY
          ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader number="2" title="Portfolio Position by Entity" />
        <SectionCard
          title="Entity Breakdown"
          description="NAV, yield, and benchmark comparison per regulated entity"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-dark-gray/50">
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">Regulator</th>
                  <th className="px-4 py-3 text-right">NAV (₦B)</th>
                  <th className="px-4 py-3 text-right">NAV ($M)</th>
                  <th className="px-4 py-3 text-right">Instruments</th>
                  <th className="px-4 py-3 text-right">Yield</th>
                  <th className="px-4 py-3 text-right">vs Benchmark</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {entityRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-t border-border hover:bg-pale-red/20 transition-colors ${
                      row.id === "consolidated"
                        ? "bg-slate-100 font-semibold"
                        : i % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: row.colour }}
                        />
                        <span className="font-semibold text-dark-gray">
                          {row.shortName}
                        </span>
                      </div>
                      <p className="mt-0.5 pl-5 text-[10px] text-dark-gray/45 truncate max-w-48">
                        {row.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-dark-gray/70">{row.regulator}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {row.navNGN > 0
                        ? fmtN(row.navNGN / 1e9, 1)
                        : <span className="text-dark-gray/30">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-dark-gray/70">
                      {row.navUSD > 0
                        ? fmtN(row.navUSD / 1e6, 1)
                        : <span className="text-dark-gray/30">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.instruments || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-dark-gray">
                      {row.yield > 0 ? fmtPct(row.yield) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.yield > 0 ? (
                        <span
                          className={
                            row.vsBenchmark > 0
                              ? "text-emerald-600 font-semibold"
                              : row.vsBenchmark < 0
                                ? "text-red-600 font-semibold"
                                : "text-dark-gray/60"
                          }
                        >
                          {row.vsBenchmark > 0 ? "+" : ""}
                          {fmtPct(row.vsBenchmark)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.yield > 0 ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.status === "Outperform"
                              ? "bg-emerald-100 text-emerald-700"
                              : row.status === "Underperform"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      ) : (
                        <span className="text-dark-gray/30 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — PERFORMANCE VS BENCHMARK
          ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader number="3" title="Performance vs Benchmark" />
        <SectionCard
          title="Portfolio Yield vs Benchmark by Entity"
          description="Grouped bar chart — current period vs regulatory / liability benchmark"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={perfChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                barCategoryGap="30%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [
                    `${(v as number).toFixed(2)}%`,
                    name as string,
                  ]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar
                  dataKey="Portfolio Yield"
                  fill="#F7941D"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="Benchmark"
                  fill="#1E3A5F"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Benchmark legend */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ENTITY_BENCHMARKS.filter((eb) => eb.id !== "consolidated").map((eb) => (
              <div
                key={eb.id}
                className="rounded-lg border border-border bg-slate-50 px-3 py-2"
              >
                <p className="text-xs font-semibold text-dark-gray">{eb.shortName}</p>
                <p className="text-[10px] text-dark-gray/50">{eb.benchmarkLabel}</p>
                <p className="mt-1 text-sm font-bold text-dark-gray tabular-nums">
                  {fmtPct(eb.benchmarkYield)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — EXCEPTIONS & LIMIT BREACHES
          ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader number="4" title="Exceptions & Limit Breaches" />
        <SectionCard
          title="Exception Register"
          description="All workflow exceptions — open, assigned, and closed"
          actions={
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                openExceptions.length > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              {openExceptions.length} open
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-dark-gray/50">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Days Open</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-dark-gray/40 text-xs">
                      No exceptions on record
                    </td>
                  </tr>
                ) : (
                  exceptions.map((ex) => (
                    <tr
                      key={ex.id}
                      className="border-t border-border hover:bg-pale-red/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-dark-gray">{ex.type}</td>
                      <td className="px-4 py-3 text-dark-gray/70 max-w-xs">
                        <p className="truncate">{ex.description}</p>
                      </td>
                      <td className="px-4 py-3 text-dark-gray/70">{ex.owner}</td>
                      <td className="px-4 py-3 tabular-nums text-dark-gray/70">
                        {fmtDate(ex.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(
                            ex.status,
                          )}`}
                        >
                          {ex.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={
                            daysOpen(ex.createdAt) > 7
                              ? "font-bold text-red-600"
                              : "text-dark-gray/70"
                          }
                        >
                          {daysOpen(ex.createdAt)}d
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 5 — LIQUIDITY & MATURITY PROFILE
          ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader number="5" title="Liquidity & Maturity Profile" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <StatCardGrid>
              <StatCard
                title="Maturing Within 30 Days"
                value={fmtCompact(maturityStats.assets30)}
                subtitle="Immediate reinvestment requirement"
                variant={maturityStats.assets30 > 5e10 ? "warning" : "default"}
                trend={{ direction: "neutral", label: "Reinvestment watch" }}
              />
              <StatCard
                title="Maturing 30–90 Days"
                value={fmtCompact(maturityStats.assets90 - maturityStats.assets30)}
                subtitle="Near-term liquidity buffer"
                trend={{ direction: "up", label: "Within 90-day window" }}
              />
              <StatCard
                title="Reinvestment Requirement"
                value={fmtCompact(maturityStats.assets30)}
                subtitle="Must be reinvested within the month"
                variant="highlight"
                trend={{ direction: "neutral", label: "Coordinate with Treasury" }}
              />
            </StatCardGrid>
          </div>
        </div>

        {/* Top 5 Maturities */}
        <div className="mt-4">
          <SectionCard
            title="Top 5 Upcoming Maturities"
            description="Nearest-maturing active instruments requiring reinvestment"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-dark-gray/50">
                    <th className="px-4 py-3 text-left w-8">#</th>
                    <th className="px-4 py-3 text-left">Instrument</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Maturity Date</th>
                    <th className="px-4 py-3 text-right">Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {maturityStats.top5.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-border hover:bg-pale-red/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-dark-gray/40 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-dark-gray">{row.name}</td>
                      <td className="px-4 py-3 text-dark-gray/60 text-xs">{row.type}</td>
                      <td className="px-4 py-3 tabular-nums text-dark-gray/70">
                        {fmtDate(row.matDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-dark-gray">
                        {fmtCompact(row.bsv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 6 — COMPLIANCE SUMMARY
          ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader number="6" title="Compliance Summary" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {COMPLIANCE_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`flex flex-col gap-3 rounded-xl border p-5 shadow-sm ${complianceBg(item.status)}`}
            >
              <div className="flex items-start gap-3">
                {complianceIcon(item.status)}
                <div>
                  <p className="text-sm font-bold text-dark-gray">{item.label}</p>
                  <p className="mt-1 text-xs text-dark-gray/60">{item.detail}</p>
                </div>
              </div>
              <div className="mt-auto">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === "green"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "amber"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.status === "green"
                    ? "Compliant"
                    : item.status === "amber"
                      ? "Monitor"
                      : "Breach"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          REPORT FOOTER
          ══════════════════════════════════════════════════════ */}
      <footer className="mt-12 border-t border-border pt-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Leadway Holdings Group
            </span>
            <span className="h-1 w-8 rounded-full bg-primary" />
          </div>
          <p className="text-xs text-dark-gray/45 max-w-xl leading-relaxed">
            Prepared by Investment Operations. For Investment Committee use only.
            Rates sourced from FMDQ as at {fmtDate(VALUATION_DATE)}.
            This report is confidential and intended solely for the Leadway
            Holdings Group ALCO and Investment Committee.
          </p>
          <p className="text-[10px] text-dark-gray/30 mt-1">
            Lead Quanta v1.0 · {REPORT_PERIOD} · Auto-generated report
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-component: Section Header ───────────────────────────── */
function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {number}
      </div>
      <h2 className="text-base font-bold uppercase tracking-wide text-dark-gray">
        {title}
      </h2>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
