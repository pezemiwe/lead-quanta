import { useState, useMemo } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  LayoutGrid,
  List,
  TrendingUp,
  Target,
  ArrowRight,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Drawer } from "../../../components/shared/drawer";

type Stage =
  | "Prospecting"
  | "Due Diligence"
  | "Term Sheet"
  | "IC Approval"
  | "Closed";
type Priority = "high" | "medium" | "low";
type InvestmentType = "Equity" | "Debt" | "Hybrid" | "Real Assets";
type ViewMode = "kanban" | "list";

interface Deal {
  id: string;
  name: string;
  sector: string;
  stage: Stage;
  irr: number;
  size: number;
  currency: "NGN" | "USD";
  lead: string;
  priority: Priority;
  investmentType: InvestmentType;
  targetClose: string;
  notes: string;
}

const STAGES: Stage[] = [
  "Prospecting",
  "Due Diligence",
  "Term Sheet",
  "IC Approval",
  "Closed",
];

const STAGE_CONFIG: Record<
  Stage,
  { border: string; label: string; bg: string; dot: string }
> = {
  Prospecting: {
    border: "border-t-slate-400",
    label: "text-slate-500",
    bg: "bg-slate-50",
    dot: "bg-slate-400",
  },
  "Due Diligence": {
    border: "border-t-blue-400",
    label: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  "Term Sheet": {
    border: "border-t-amber-400",
    label: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  "IC Approval": {
    border: "border-t-orange-500",
    label: "text-orange-600",
    bg: "bg-orange-50",
    dot: "bg-orange-500",
  },
  Closed: {
    border: "border-t-teal-500",
    label: "text-teal-600",
    bg: "bg-teal-50",
    dot: "bg-teal-500",
  },
};

const PRIORITY_CONFIG: Record<
  Priority,
  { bar: string; badge: string; label: string }
> = {
  high: {
    bar: "bg-danger",
    badge: "bg-red-50 text-danger border border-red-200",
    label: "High",
  },
  medium: {
    bar: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "Medium",
  },
  low: {
    bar: "bg-slate-300",
    badge: "bg-slate-50 text-slate-500 border border-slate-200",
    label: "Low",
  },
};

const SECTOR_COLORS: Record<string, string> = {
  "Financial Services": "bg-blue-50 text-blue-700",
  FinTech: "bg-purple-50 text-purple-700",
  Technology: "bg-indigo-50 text-indigo-700",
  Agriculture: "bg-green-50 text-green-700",
  Energy: "bg-orange-50 text-orange-700",
  "Healthcare / Real Estate": "bg-teal-50 text-teal-700",
  Infrastructure: "bg-cyan-50 text-cyan-700",
  "Consumer Goods": "bg-pink-50 text-pink-700",
};

const INV_TYPES: InvestmentType[] = ["Equity", "Debt", "Hybrid", "Real Assets"];
const SECTORS = Object.keys(SECTOR_COLORS);

const INITIAL_DEALS: Deal[] = [
  {
    id: "D001",
    name: "Leadway Microfinance Expansion",
    sector: "Financial Services",
    stage: "IC Approval",
    irr: 18.4,
    size: 12.5,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "high",
    investmentType: "Equity",
    targetClose: "2026-06-30",
    notes:
      "Board approval meeting 28 May. Regulatory pre-clearance obtained from CBN.",
  },
  {
    id: "D002",
    name: "Afropay Digital Payments",
    sector: "FinTech",
    stage: "Due Diligence",
    irr: 31.2,
    size: 8.8,
    currency: "USD",
    lead: "F. Aliyu",
    priority: "high",
    investmentType: "Equity",
    targetClose: "2026-07-15",
    notes:
      "CBN PSSP licence review in progress. Legal DD expected to close 5-Jun.",
  },
  {
    id: "D003",
    name: "Lagos Tier-3 Data Centre JV",
    sector: "Technology",
    stage: "Term Sheet",
    irr: 22.0,
    size: 45.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "medium",
    investmentType: "Hybrid",
    targetClose: "2026-08-01",
    notes:
      "JV partner: MTN Infrastructure. Term sheet signed 20 May. Legal review underway.",
  },
  {
    id: "D004",
    name: "Northern Agri-Processing Hub",
    sector: "Agriculture",
    stage: "Prospecting",
    irr: 19.5,
    size: 22.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "medium",
    investmentType: "Debt",
    targetClose: "2026-09-30",
    notes:
      "FGN incentive zone eligible — NIRSAL co-investment under discussion.",
  },
  {
    id: "D005",
    name: "Transcorp Energy Spinoff Stake",
    sector: "Energy",
    stage: "Due Diligence",
    irr: 25.8,
    size: 38.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "high",
    investmentType: "Equity",
    targetClose: "2026-07-31",
    notes:
      "Follows Transcorp Group restructuring. Existing board seat provides information advantage.",
  },
  {
    id: "D006",
    name: "Pan-African Healthcare REIT",
    sector: "Healthcare / Real Estate",
    stage: "Prospecting",
    irr: 16.2,
    size: 60.0,
    currency: "USD",
    lead: "F. Aliyu",
    priority: "low",
    investmentType: "Real Assets",
    targetClose: "2026-12-31",
    notes:
      "5-country footprint: Nigeria, Kenya, Ghana, Egypt, South Africa. Anchor LP discussions ongoing.",
  },
];

const EMPTY_DRAFT: Omit<Deal, "id"> = {
  name: "",
  sector: "Financial Services",
  stage: "Prospecting",
  irr: 15,
  size: 5,
  currency: "NGN",
  lead: "",
  priority: "medium",
  investmentType: "Equity",
  targetClose: "",
  notes: "",
};

function initials(name: string) {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function fmtSize(size: number, currency: "NGN" | "USD") {
  const sym = currency === "NGN" ? "₦" : "$";
  return `${sym}${size.toFixed(1)}B`;
}

export function PortfolioPipeline() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Deal | null>(null);
  const [adding, setAdding] = useState(false);
  const [submittingDeal, setSubmittingDeal] = useState(false);
  const [draft, setDraft] = useState<Omit<Deal, "id">>(EMPTY_DRAFT);
  const [sortField, setSortField] = useState<keyof Deal>("stage");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);

  const sel = selected
    ? (deals.find((d) => d.id === selected.id) ?? null)
    : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.sector.toLowerCase().includes(q) ||
        d.lead.toLowerCase().includes(q),
    );
  }, [deals, search]);

  const sortedList = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [filtered, sortField, sortDir]);

  const moveStage = (id: string, dir: 1 | -1) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = STAGES.indexOf(d.stage);
        return {
          ...d,
          stage: STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))],
        };
      }),
    );
    setSelected((prev) => {
      if (!prev || prev.id !== id) return prev;
      const idx = STAGES.indexOf(prev.stage);
      return {
        ...prev,
        stage: STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))],
      };
    });
  };

  const removeDeal = (id: string) => {
    const deal = deals.find((d) => d.id === id);
    if (deal) setDeletingDeal(deal);
  };

  const confirmRemoveDeal = () => {
    if (!deletingDeal) return;
    setDeals((prev) => prev.filter((d) => d.id !== deletingDeal.id));
    setSelected(null);
    setDeletingDeal(null);
  };

  const dealsByStage = (s: Stage) => filtered.filter((d) => d.stage === s);

  const totalNGN = deals
    .filter((d) => d.currency === "NGN")
    .reduce((s, d) => s + d.size, 0);
  const totalUSD = deals
    .filter((d) => d.currency === "USD")
    .reduce((s, d) => s + d.size, 0);
  const avgIRR = deals.length
    ? deals.reduce((s, d) => s + d.irr, 0) / deals.length
    : 0;
  const highCount = deals.filter((d) => d.priority === "high").length;

  const toggleSort = (field: keyof Deal) => {
    if (sortField === field) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortField(field);
      setSortDir(1);
    }
  };

  const SortIcon = ({ field }: { field: keyof Deal }) =>
    sortField === field ? (
      sortDir === 1 ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronUp className="h-3 w-3" />
      )
    ) : null;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Portfolio Management
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-dark-gray">
            Investment Pipeline
          </h1>
          <p className="mt-1 text-sm text-dark-gray/50">
            {deals.length} deals &middot; avg IRR{" "}
            <span className="font-semibold text-success">
              {avgIRR.toFixed(1)}%
            </span>{" "}
            · {highCount} high-priority
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* view toggle */}
          <div className="flex rounded-lg border border-border bg-surface overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                view === "kanban"
                  ? "bg-primary text-white"
                  : "text-dark-gray/50 hover:text-dark-gray"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                view === "list"
                  ? "bg-primary text-white"
                  : "text-dark-gray/50 hover:text-dark-gray"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setAdding(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red"
          >
            <Plus className="h-4 w-4" /> New Deal
          </button>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <Target className="h-4 w-4 text-primary" />,
            label: "Active Deals",
            value: String(deals.length),
            sub: `${highCount} high priority`,
            accent: "text-dark-gray",
          },
          {
            icon: <TrendingUp className="h-4 w-4 text-success" />,
            label: "Avg Projected IRR",
            value: `${avgIRR.toFixed(1)}%`,
            sub: "Unweighted mean",
            accent: "text-success",
          },
          {
            icon: <span className="text-sm font-bold text-primary">₦</span>,
            label: "NGN Pipeline",
            value: `₦${totalNGN.toFixed(1)}B`,
            sub: "Deal value",
            accent: "text-primary",
          },
          {
            icon: <span className="text-sm font-bold text-emerald-600">$</span>,
            label: "USD Pipeline",
            value: `$${totalUSD.toFixed(1)}B`,
            sub: "Deal value",
            accent: "text-emerald-600",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              {k.icon}
              <p className="text-xs text-dark-gray/50 font-medium">{k.label}</p>
            </div>
            <p className={`mt-1.5 text-xl font-bold ${k.accent}`}>{k.value}</p>
            <p className="mt-0.5 text-xs text-dark-gray/40">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Stage Funnel Bar ─────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold text-dark-gray/50 uppercase tracking-wider">
          Pipeline Funnel
        </p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STAGES.map((stage, i) => {
            const count = dealsByStage(stage).length;
            const cfg = STAGE_CONFIG[stage];
            return (
              <div key={stage} className="flex items-center gap-1 shrink-0">
                <div
                  className={`rounded-lg px-4 py-2.5 text-center min-w-[110px] ${cfg.bg}`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${cfg.label}`}
                  >
                    {stage}
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-dark-gray">
                    {count}
                  </p>
                  <div className="mt-1 flex justify-center gap-0.5">
                    {Array.from({ length: Math.max(count, 0) }).map((_, j) => (
                      <span
                        key={j}
                        className={`h-1 w-1 rounded-full ${cfg.dot}`}
                      />
                    ))}
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-dark-gray/20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deals, sector, lead PM…"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* ── Kanban Board ─────────────────────────────────────────── */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3" style={{ minWidth: "980px" }}>
            {STAGES.map((stage) => {
              const stageDeals = dealsByStage(stage);
              const cfg = STAGE_CONFIG[stage];
              const stageTotal = stageDeals.reduce((s, d) => s + d.size, 0);
              return (
                <div
                  key={stage}
                  className={`flex-1 rounded-xl border-t-4 border border-border bg-surface shadow-sm ${cfg.border}`}
                >
                  {/* column header */}
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs font-bold uppercase tracking-wider ${cfg.label}`}
                      >
                        {stage}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.label}`}
                      >
                        {stageDeals.length}
                      </span>
                    </div>
                    {stageDeals.length > 0 && (
                      <p className="mt-0.5 text-xs text-dark-gray/40">
                        ₦
                        {stageDeals
                          .filter((d) => d.currency === "NGN")
                          .reduce((s, d) => s + d.size, 0)
                          .toFixed(1)}
                        B NGN
                        {stageDeals.some((d) => d.currency === "USD") &&
                          ` · $${stageDeals
                            .filter((d) => d.currency === "USD")
                            .reduce((s, d) => s + d.size, 0)
                            .toFixed(1)}B USD`}
                      </p>
                    )}
                  </div>

                  {/* cards */}
                  <div className="p-2 space-y-2 min-h-32">
                    {stageDeals.length === 0 && (
                      <p className="py-8 text-center text-xs text-dark-gray/20">
                        No deals
                      </p>
                    )}
                    {stageDeals.map((deal) => {
                      const isActive = sel?.id === deal.id;
                      const pc = PRIORITY_CONFIG[deal.priority];
                      return (
                        <button
                          key={deal.id}
                          onClick={() => setSelected(isActive ? null : deal)}
                          className={`group relative w-full rounded-lg border text-left transition-all overflow-hidden ${
                            isActive
                              ? "border-primary bg-pale-red/20 shadow-md"
                              : "border-border bg-white hover:border-primary/40 hover:shadow-sm"
                          }`}
                        >
                          {/* priority bar */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${pc.bar}`}
                          />
                          <div className="pl-4 pr-3 pt-3 pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-dark-gray leading-tight line-clamp-2">
                                {deal.name}
                              </p>
                              {/* lead PM avatar */}
                              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                {initials(deal.lead || "?")}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${SECTOR_COLORS[deal.sector] ?? "bg-gray-100 text-gray-500"}`}
                              >
                                {deal.sector}
                              </span>
                              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-dark-gray/50 border border-border">
                                {deal.investmentType}
                              </span>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="text-sm font-bold text-success">
                                {deal.irr}%{" "}
                                <span className="text-xs font-normal text-dark-gray/40">
                                  IRR
                                </span>
                              </span>
                              <span className="text-xs font-semibold text-dark-gray/70">
                                {fmtSize(deal.size, deal.currency)}
                              </span>
                            </div>
                            {deal.targetClose && (
                              <p className="mt-1.5 flex items-center gap-1 text-xs text-dark-gray/40">
                                <Calendar className="h-3 w-3" />
                                Close {deal.targetClose}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* column footer: total */}
                  {stageDeals.length > 0 && (
                    <div className="px-4 py-2 border-t border-border">
                      <p className="text-xs text-dark-gray/40">
                        Total: ₦{stageTotal.toFixed(1)}B equiv.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List View ────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                {(
                  [
                    { field: "name", label: "Deal" },
                    { field: "sector", label: "Sector" },
                    { field: "stage", label: "Stage" },
                    { field: "investmentType", label: "Type" },
                    { field: "irr", label: "IRR %" },
                    { field: "size", label: "Size" },
                    { field: "priority", label: "Priority" },
                    { field: "targetClose", label: "Target Close" },
                    { field: "lead", label: "Lead PM" },
                  ] as { field: keyof Deal; label: string }[]
                ).map((col) => (
                  <th
                    key={col.field}
                    onClick={() => toggleSort(col.field)}
                    className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs font-semibold text-dark-gray/50 uppercase tracking-wider cursor-pointer hover:text-dark-gray select-none whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {sortedList.map((deal, i) => {
                const cfg = STAGE_CONFIG[deal.stage];
                const pc = PRIORITY_CONFIG[deal.priority];
                const isActive = sel?.id === deal.id;
                return (
                  <tr
                    key={deal.id}
                    onClick={() => setSelected(isActive ? null : deal)}
                    className={`border-b border-border transition-colors cursor-pointer ${
                      i % 2 === 0 ? "bg-white" : "bg-surface-muted/50"
                    } ${isActive ? "bg-pale-red/20" : "hover:bg-pale-red/10"}`}
                  >
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <p className="font-semibold text-dark-gray text-xs">
                        {deal.name}
                      </p>
                      <p className="text-xs text-dark-gray/40">{deal.id}</p>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${SECTOR_COLORS[deal.sector] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {deal.sector}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.label}`}
                      >
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-gray/70">
                      {deal.investmentType}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-success">
                      {deal.irr}%
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-dark-gray">
                      {fmtSize(deal.size, deal.currency)}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${pc.badge}`}
                      >
                        {pc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-gray/60">
                      {deal.targetClose || "—"}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {initials(deal.lead || "?")}
                        </span>
                        <span className="text-xs text-dark-gray/60">
                          {deal.lead}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3" />
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedList.length === 0 && (
            <p className="py-10 text-center text-sm text-dark-gray/30">
              No deals match your search
            </p>
          )}
        </div>
      )}

      {/* ── Deal Detail Drawer ───────────────────────────────────── */}
      <Drawer
        isOpen={!!sel}
        onClose={() => setSelected(null)}
        size="md"
        title={sel?.name ?? ""}
        description={sel ? `${sel.sector} · ${sel.investmentType}` : ""}
        footer={
          sel ? (
            <div className="flex w-full items-center justify-between">
              <button
                onClick={() => removeDeal(sel.id)}
                className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveStage(sel.id, -1)}
                  disabled={STAGES.indexOf(sel.stage) === 0}
                  className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-dark-gray/70 hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  onClick={() => moveStage(sel.id, 1)}
                  disabled={STAGES.indexOf(sel.stage) === STAGES.length - 1}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-mid-red disabled:opacity-40"
                >
                  Advance <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {sel && (
          <div className="space-y-5">
            {/* stage progress */}
            <div>
              <p className="mb-2 text-xs font-semibold text-dark-gray/50 uppercase tracking-wider">
                Stage Progress
              </p>
              <div className="flex items-center gap-1">
                {STAGES.map((s, i) => {
                  const cfg = STAGE_CONFIG[s];
                  const active = s === sel.stage;
                  const past = STAGES.indexOf(sel.stage) > i;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div
                        className={`flex-1 rounded-full py-1 text-center text-[10px] font-semibold transition-all ${
                          active
                            ? `${cfg.bg} ${cfg.label} ring-2 ring-offset-1 ring-current`
                            : past
                              ? "bg-teal-50 text-teal-600"
                              : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        {s.split(" ")[0]}
                      </div>
                      {i < STAGES.length - 1 && (
                        <div
                          className={`h-0.5 w-3 rounded-full ${
                            STAGES.indexOf(sel.stage) > i
                              ? "bg-teal-400"
                              : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* key metrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Projected IRR",
                  value: `${sel.irr}%`,
                  accent: "text-success",
                },
                {
                  label: "Deal Size",
                  value: fmtSize(sel.size, sel.currency),
                  accent: "text-dark-gray",
                },
                {
                  label: "Investment Type",
                  value: sel.investmentType,
                  accent: "text-dark-gray",
                },
                {
                  label: "Priority",
                  value: PRIORITY_CONFIG[sel.priority].label,
                  accent: PRIORITY_CONFIG[sel.priority].badge.includes("danger")
                    ? "text-danger"
                    : "text-dark-gray",
                },
                {
                  label: "Lead PM",
                  value: sel.lead || "—",
                  accent: "text-dark-gray",
                },
                {
                  label: "Target Close",
                  value: sel.targetClose || "—",
                  accent: "text-dark-gray",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-border bg-surface p-3"
                >
                  <p className="text-xs text-dark-gray/50">{m.label}</p>
                  <p className={`mt-0.5 text-sm font-bold ${m.accent}`}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* notes */}
            {sel.notes && (
              <div className="rounded-lg border border-border bg-surface-muted p-4">
                <p className="mb-1 text-xs font-semibold text-dark-gray/50 uppercase tracking-wider">
                  Deal Notes
                </p>
                <p className="text-sm text-dark-gray/70 leading-relaxed">
                  {sel.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Remove Deal Confirmation Modal ───────────────────────── */}
      {deletingDeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDeletingDeal(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-5 w-5 text-danger" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-dark-gray">
              Remove Deal
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Remove{" "}
              <span className="font-medium text-dark-gray">
                {deletingDeal.name}
              </span>{" "}
              from the pipeline? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingDeal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveDeal}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Deal Drawer ──────────────────────────────────────── */}
      <Drawer
        isOpen={adding}
        onClose={() => setAdding(false)}
        size="md"
        title="New Pipeline Deal"
        description="Register a prospective investment for the deal team to evaluate."
        footer={
          <>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/60 hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              disabled={!draft.name.trim() || submittingDeal}
              onClick={() => {
                setSubmittingDeal(true);
                setTimeout(() => {
                  const id = `D${Date.now().toString(36).toUpperCase().slice(-5)}`;
                  setDeals((prev) => [{ ...draft, id }, ...prev]);
                  setSubmittingDeal(false);
                  setAdding(false);
                }, 700);
              }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red disabled:opacity-50"
            >
              {submittingDeal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding…
                </>
              ) : (
                "Add to Pipeline"
              )}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* deal identity */}
          <div>
            <label className="text-xs font-semibold text-dark-gray/60 uppercase tracking-wider">
              Deal Identity
            </label>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Deal Name <span className="text-danger">*</span>
                </label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Lagos Renewable Energy Fund II"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Sector
                  </label>
                  <select
                    value={draft.sector}
                    onChange={(e) =>
                      setDraft({ ...draft, sector: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {SECTORS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Investment Type
                  </label>
                  <select
                    value={draft.investmentType}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        investmentType: e.target.value as InvestmentType,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {INV_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* economics */}
          <div>
            <label className="text-xs font-semibold text-dark-gray/60 uppercase tracking-wider">
              Economics
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Projected IRR (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={draft.irr}
                  onChange={(e) =>
                    setDraft({ ...draft, irr: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Deal Size (Bn)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={draft.size}
                  onChange={(e) =>
                    setDraft({ ...draft, size: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Currency
                </label>
                <select
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      currency: e.target.value as "NGN" | "USD",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option>NGN</option>
                  <option>USD</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Priority
                </label>
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft({ ...draft, priority: e.target.value as Priority })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* team & timeline */}
          <div>
            <label className="text-xs font-semibold text-dark-gray/60 uppercase tracking-wider">
              Team &amp; Timeline
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Initial Stage
                </label>
                <select
                  value={draft.stage}
                  onChange={(e) =>
                    setDraft({ ...draft, stage: e.target.value as Stage })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Target Close
                </label>
                <input
                  type="date"
                  value={draft.targetClose}
                  onChange={(e) =>
                    setDraft({ ...draft, targetClose: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">
                  Lead Portfolio Manager
                </label>
                <input
                  value={draft.lead}
                  onChange={(e) => setDraft({ ...draft, lead: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. F. Aliyu"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* notes */}
          <div>
            <label className="text-xs font-medium text-gray-500">
              Investment Thesis / Notes
            </label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              placeholder="DD progress, regulatory considerations, key risks, co-investors…"
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
