import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  FileText,
  Filter,
  PlusSquare,
  Search,
} from "lucide-react";
import { usePersona } from "../../../context/persona";
import { canDo } from "../../../context/platform-personas";
import { usePortfolioRegistry } from "../../portfolio/portfolio-registry";
import { useWorkflow } from "../../workflow/store";
import type { DealSlip, DealSlipStatus } from "../../workflow/types";
import { DealSlipStatusBadge } from "../../workflow/components/status-badge";
import { DealSlipWorkspace } from "../../workflow/components/deal-slip-workspace";
import { downloadDealSlipPdf } from "../../workflow/utils/download-deal-slip";
import { dealNotional } from "../../workflow/engine/fields";
import { isEditableStatus } from "../../workflow/engine/transitions";
import {
  computePositionTally,
  computeVwapMap,
  counterpartyOrIssuer,
  daysInStatus,
  dealVwapInfo,
  fmtMoney,
  limitFlag,
  portfolioExposurePct,
  rateOrPrice,
  tradeDate,
  transactionType,
  valueDate,
} from "../utils/blotter-metrics";
import {
  BUILTIN_PRESETS,
  DEFAULT_BLOTTER_FILTERS,
  deleteSavedView,
  loadSavedViews,
  saveBlotterView,
  type BlotterFilters,
  type SavedBlotterView,
} from "../utils/saved-views";
import { REF_DATE } from "../utils/blotter-metrics";

const ALL_STATUSES: DealSlipStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Returned for Amendment",
  "Approved",
  "Pending Settlement",
  "Settled",
  "Active",
  "Rejected",
  "Matured, Sold or Rolled Over",
];

const SETTLEMENT_OPTIONS = [
  "All",
  "None",
  "Pending",
  "Instruction Generated",
  "Instruction Checked",
  "Settled",
  "Partially Settled",
  "Failed",
  "Settled with Exception",
];

type SortKey =
  | "id"
  | "assetClass"
  | "type"
  | "counterparty"
  | "amount"
  | "tradeDate"
  | "valueDate"
  | "status"
  | "daysInStatus"
  | "vwap";

function LimitBadge({ flag }: { flag: ReturnType<typeof limitFlag> }) {
  if (flag === "na") return <span className="text-dark-gray/30">—</span>;
  const styles = {
    ok: "bg-emerald-50 text-emerald-700",
    watch: "bg-amber-50 text-amber-700",
    breach: "bg-red-50 text-red-700",
    pending: "bg-blue-50 text-blue-700",
  };
  const labels = { ok: "OK", watch: "Watch", breach: "Breach", pending: "Pending" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[flag]}`}>
      {labels[flag]}
    </span>
  );
}

export interface TradeBlotterProps {
  defaultMyDealsOnly?: boolean;
  showCaptureButton?: boolean;
  title?: string;
  compact?: boolean;
}

export function TradeBlotter({
  defaultMyDealsOnly = false,
  showCaptureButton = true,
  title = "Trade blotter",
  compact = false,
}: TradeBlotterProps) {
  const { persona } = usePersona();
  const navigate = useNavigate();
  const wf = useWorkflow();
  const { dealSlips, register, syncVersion, lastSyncedAt } = wf;

  const personaKey = `${persona.role}:${persona.name}`;
  const [filters, setFilters] = useState<BlotterFilters>({
    ...DEFAULT_BLOTTER_FILTERS,
    myDealsOnly: defaultMyDealsOnly,
    dateFrom: `${REF_DATE.slice(0, 8)}01`,
    dateTo: REF_DATE,
  });
  const [savedViews, setSavedViews] = useState<SavedBlotterView[]>(() =>
    loadSavedViews(personaKey),
  );
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("tradeDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { portfolios: registryPortfolios } = usePortfolioRegistry();
  const canCreate = canDo(persona.role, "dealSlip", "C");
  const canLimits = canDo(persona.role, "limits", "V") || canDo(persona.role, "limits", "R");
  const canSettle = canDo(persona.role, "settle", "S");
  const showSettlementCol = canSettle || canDo(persona.role, "register", "S");
  const isTrader = ["Money Market Trader", "Fixed Income Trader", "Equity Trader", "Head of Trading", "Portfolio Manager"].includes(persona.role);
  const showVwap = isTrader || canLimits;

  // Map portfolio name → mandate for badge display
  const portfolioMandateMap = useMemo(
    () => new Map(registryPortfolios.map((p) => [p.name, p.mandate])),
    [registryPortfolios],
  );

  const sourceDeals = useMemo(() => {
    if (!filters.myDealsOnly) return dealSlips;
    return dealSlips.filter(
      (d) => d.createdBy === persona.name || d.createdByRole === persona.role,
    );
  }, [dealSlips, filters.myDealsOnly, persona.name, persona.role, syncVersion]);

  // VWAP map computed from ALL deals (not just filtered) for accurate market reference
  const vwapMap = useMemo(() => computeVwapMap(dealSlips), [dealSlips, syncVersion]);

  const assetClasses = useMemo(
    () => ["All", ...Array.from(new Set(sourceDeals.map((d) => d.assetClass)))],
    [sourceDeals],
  );

  const portfolios = useMemo(
    () => ["All", ...Array.from(new Set(sourceDeals.map((d) => d.portfolioName)))],
    [sourceDeals],
  );

  const filtered = useMemo(() => {
    let rows = [...sourceDeals];
    const q = filters.search.toLowerCase();
    if (q) {
      rows = rows.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          counterpartyOrIssuer(d).toLowerCase().includes(q) ||
          (d.fields.issuer ?? "").toLowerCase().includes(q) ||
          d.portfolioName.toLowerCase().includes(q),
      );
    }
    if (filters.assetFilter !== "All") rows = rows.filter((d) => d.assetClass === filters.assetFilter);
    if (filters.portfolioFilter !== "All") {
      rows = rows.filter((d) => d.portfolioName === filters.portfolioFilter);
    }
    if (filters.statusFilter.length > 0) {
      rows = rows.filter((d) => filters.statusFilter.includes(d.status));
    }
    if (filters.dateFrom) rows = rows.filter((d) => tradeDate(d) >= filters.dateFrom);
    if (filters.dateTo) rows = rows.filter((d) => tradeDate(d) <= filters.dateTo);
    if (filters.settlementFilter !== "All") {
      if (filters.settlementFilter === "None") {
        rows = rows.filter((d) => !d.settlementStatus);
      } else {
        rows = rows.filter((d) => d.settlementStatus === filters.settlementFilter);
      }
    }
    if (filters.limitAlertOnly) {
      rows = rows.filter((d) => {
        const f = limitFlag(d);
        return f === "watch" || f === "breach";
      });
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp = a.id.localeCompare(b.id);
          break;
        case "assetClass":
          cmp = a.assetClass.localeCompare(b.assetClass);
          break;
        case "type":
          cmp = transactionType(a).localeCompare(transactionType(b));
          break;
        case "counterparty":
          cmp = counterpartyOrIssuer(a).localeCompare(counterpartyOrIssuer(b));
          break;
        case "amount":
          cmp = dealNotional(a.fields) - dealNotional(b.fields);
          break;
        case "tradeDate":
          cmp = tradeDate(a).localeCompare(tradeDate(b));
          break;
        case "valueDate":
          cmp = valueDate(a).localeCompare(valueDate(b));
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "daysInStatus":
          cmp = daysInStatus(a) - daysInStatus(b);
          break;
        case "vwap": {
          const ia = dealVwapInfo(a, vwapMap);
          const ib = dealVwapInfo(b, vwapMap);
          cmp = (ia?.bps ?? 0) - (ib?.bps ?? 0);
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [sourceDeals, filters, sortKey, sortAsc, vwapMap]);

  const positionTally = useMemo(
    () => computePositionTally(filtered, dealSlips, register),
    [filtered, dealSlips, register],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const patchFilters = (patch: Partial<BlotterFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const toggleStatus = (s: DealSlipStatus) => {
    setFilters((f) => {
      const next = new Set(f.statusFilter);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return { ...f, statusFilter: [...next], limitAlertOnly: false };
    });
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const exportRows = (format: "csv" | "xlsx") => {
    const data = filtered.map((d) => ({
      Reference: d.id,
      "Asset Class": d.assetClass,
      Portfolio: d.portfolioName,
      "Transaction Type": transactionType(d),
      "Counterparty/Issuer": counterpartyOrIssuer(d),
      Amount: dealNotional(d.fields),
      "Rate/Price": rateOrPrice(d),
      "Trade Date": tradeDate(d),
      "Value Date": valueDate(d),
      Status: d.status,
      "Settlement Status": d.settlementStatus ?? "",
      "Days in Status": daysInStatus(d),
      "Limit Flag": limitFlag(d),
      ...(canLimits
        ? { "Portfolio %": portfolioExposurePct(d, dealSlips, register).toFixed(1) }
        : {}),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Blotter");
    XLSX.writeFile(wb, `trade-blotter.${format === "csv" ? "csv" : "xlsx"}`, {
      bookType: format === "csv" ? "csv" : "xlsx",
    });
  };

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-primary"
    >
      {label}
      {sortKey === col && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );

  const defaultFrom = `${REF_DATE.slice(0, 8)}01`;
  const periodFiltered =
    filters.dateFrom !== defaultFrom || filters.dateTo !== REF_DATE;

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (periodFiltered ? 1 : 0) +
    (filters.assetFilter !== "All" ? 1 : 0) +
    (filters.portfolioFilter !== "All" ? 1 : 0) +
    (filters.settlementFilter !== "All" ? 1 : 0) +
    filters.statusFilter.length +
    (filters.limitAlertOnly ? 1 : 0);

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-border bg-[#FAFBFC] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-dark-gray">{title}</h2>
                {lastSyncedAt && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live · {new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-dark-gray/45">
                {filtered.length} deal{filtered.length !== 1 ? "s" : ""} · click a row to open the deal slip
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs text-dark-gray/60">
                <input
                  type="checkbox"
                  checked={filters.myDealsOnly}
                  onChange={(e) => patchFilters({ myDealsOnly: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                My deals only
              </label>
              <select
                className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-dark-gray"
                defaultValue=""
                onChange={(e) => {
                  const preset = BUILTIN_PRESETS.find((p) => p.id === e.target.value);
                  if (preset) patchFilters(preset.apply({ ...filters, statusFilter: [...filters.statusFilter] }));
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  Quick view…
                </option>
                {BUILTIN_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {showCaptureButton && canCreate && (
                <button
                  type="button"
                  onClick={() => navigate("/deal-capture/new-booking")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  <PlusSquare className="h-3.5 w-3.5" />
                  Deal capture
                </button>
              )}
            </div>
          </div>

          {/* Search + actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/30" />
              <input
                className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="Search reference, counterparty, issuer…"
                value={filters.search}
                onChange={(e) => patchFilters({ search: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold ${
                filtersOpen || activeFilterCount > 0
                  ? "border-primary/30 bg-pale-red/40 text-primary"
                  : "border-border bg-white text-dark-gray/60"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => exportRows("csv")}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-semibold text-dark-gray/60 hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-3 space-y-3 rounded-lg border border-border bg-white p-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                <label className="block text-xs lg:col-span-1">
                  <span className="mb-1 block font-medium text-dark-gray/50">From</span>
                  <input
                    type="date"
                    className="w-full rounded-md border border-border px-2.5 py-2 text-sm"
                    value={filters.dateFrom}
                    onChange={(e) => patchFilters({ dateFrom: e.target.value })}
                  />
                </label>
                <label className="block text-xs lg:col-span-1">
                  <span className="mb-1 block font-medium text-dark-gray/50">To</span>
                  <input
                    type="date"
                    className="w-full rounded-md border border-border px-2.5 py-2 text-sm"
                    value={filters.dateTo}
                    onChange={(e) => patchFilters({ dateTo: e.target.value })}
                  />
                </label>
                <label className="block text-xs lg:col-span-1">
                  <span className="mb-1 block font-medium text-dark-gray/50">Asset class</span>
                  <select
                    className="w-full rounded-md border border-border px-2.5 py-2 text-sm"
                    value={filters.assetFilter}
                    onChange={(e) => patchFilters({ assetFilter: e.target.value })}
                  >
                    {assetClasses.map((a) => (
                      <option key={a} value={a}>
                        {a === "All" ? "All" : a.replace(" and call deposits", "").replace(" and commercial papers", "")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs lg:col-span-1">
                  <span className="mb-1 block font-medium text-dark-gray/50">Portfolio</span>
                  <select
                    className="w-full rounded-md border border-border px-2.5 py-2 text-sm"
                    value={filters.portfolioFilter}
                    onChange={(e) => patchFilters({ portfolioFilter: e.target.value })}
                  >
                    {portfolios.map((p) => (
                      <option key={p} value={p}>
                        {p === "All" ? "All" : p}
                      </option>
                    ))}
                  </select>
                </label>
                {showSettlementCol ? (
                  <label className="block text-xs lg:col-span-1">
                    <span className="mb-1 block font-medium text-dark-gray/50">Settlement</span>
                    <select
                      className="w-full rounded-md border border-border px-2.5 py-2 text-sm"
                      value={filters.settlementFilter}
                      onChange={(e) => patchFilters({ settlementFilter: e.target.value })}
                    >
                      {SETTLEMENT_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s === "All" ? "All" : s}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="hidden lg:block lg:col-span-1" />
                )}
                <label className="block text-xs lg:col-span-1">
                  <span className="mb-1 block font-medium text-dark-gray/50">Add status</span>
                  <select
                    className="w-full rounded-md border border-border px-2.5 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value as DealSlipStatus;
                      if (v && !filters.statusFilter.includes(v)) {
                        patchFilters({ statusFilter: [...filters.statusFilter, v], limitAlertOnly: false });
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">Any status…</option>
                    {ALL_STATUSES.filter((s) => !filters.statusFilter.includes(s)).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filters.statusFilter.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                  <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-dark-gray/40">
                    Status
                  </span>
                  {filters.statusFilter.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStatus(s)}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20"
                    >
                      {s} ×
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => patchFilters({ statusFilter: [] })}
                    className="text-[10px] text-dark-gray/45 hover:underline"
                  >
                    Clear status
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {savedViews.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setFilters({ ...v.filters, statusFilter: [...v.filters.statusFilter] });
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-dark-gray/60 hover:border-primary"
                    >
                      <Bookmark className="h-3 w-3" />
                      {v.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {showSaveInput ? (
                    <span className="flex items-center gap-1">
                      <input
                        className="rounded border border-border px-2 py-1 text-xs"
                        placeholder="View name…"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                      />
                      <button
                        type="button"
                        disabled={!saveName.trim()}
                        onClick={() => {
                          setSavedViews(saveBlotterView(personaKey, saveName.trim(), filters));
                          setSaveName("");
                          setShowSaveInput(false);
                        }}
                        className="text-xs font-semibold text-primary disabled:opacity-40"
                      >
                        Save
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSaveInput(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Save view
                    </button>
                  )}
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        patchFilters({
                          ...DEFAULT_BLOTTER_FILTERS,
                          myDealsOnly: filters.myDealsOnly,
                          dateFrom: `${REF_DATE.slice(0, 8)}01`,
                          dateTo: REF_DATE,
                        })
                      }
                      className="text-xs text-dark-gray/45 hover:underline"
                    >
                      Reset all
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Position tally bar: Opening + Purchases − Sales = Closing */}
        <div className="border-b border-border bg-[#FAFBFC] px-5 py-2.5 flex flex-wrap items-center gap-1 text-xs text-dark-gray/60">
          <span className="font-semibold text-dark-gray/80">Position:</span>
          <span className="tabular-nums text-dark-gray font-medium">{fmtMoney(positionTally.opening)}</span>
          <span className="text-gray-400">(opening)</span>
          <span className="mx-1 text-gray-400">+</span>
          <span className="tabular-nums text-success font-medium">{fmtMoney(positionTally.purchases)}</span>
          <span className="text-gray-400">(purchases)</span>
          <span className="mx-1 text-gray-400">−</span>
          <span className="tabular-nums text-danger font-medium">{fmtMoney(positionTally.sales)}</span>
          <span className="text-gray-400">(sales)</span>
          <span className="mx-1 text-gray-400">=</span>
          <span className="tabular-nums font-bold text-dark-gray">{fmtMoney(positionTally.closing)}</span>
          <span className="text-gray-400">(closing)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-white text-[11px] font-semibold uppercase tracking-wide text-dark-gray/45">
              <tr>
                <th className="px-4 py-3"><SortHeader label="Reference" col="id" /></th>
                <th className="px-4 py-3"><SortHeader label="Asset class" col="assetClass" /></th>
                <th className="px-4 py-3"><SortHeader label="Type" col="type" /></th>
                <th className="px-4 py-3"><SortHeader label="Counterparty" col="counterparty" /></th>
                <th className="px-4 py-3 text-right"><SortHeader label="Amount" col="amount" /></th>
                <th className="px-4 py-3">Rate/Price</th>
                <th className="px-4 py-3"><SortHeader label="Trade date" col="tradeDate" /></th>
                <th className="px-4 py-3"><SortHeader label="Value date" col="valueDate" /></th>
                <th className="px-4 py-3"><SortHeader label="Status" col="status" /></th>
                {showVwap && <th className="px-4 py-3">Portfolio</th>}
                {canLimits && (
                  <>
                    <th className="px-4 py-3">Limit</th>
                    <th className="px-4 py-3 text-right">Port. %</th>
                  </>
                )}
                {showVwap && <th className="px-4 py-3"><SortHeader label="VWAP dev." col="vwap" /></th>}
                <th className="px-4 py-3"><SortHeader label="Age (d)" col="daysInStatus" /></th>
                {showSettlementCol && <th className="px-4 py-3">Settlement</th>}
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((d, i) => {
                const editable = isEditableStatus(d.status) && canCreate;
                const lf = limitFlag(d);
                return (
                  <tr
                    key={d.id}
                    className={`cursor-pointer transition-colors hover:bg-primary/[0.03] ${
                      i % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"
                    }`}
                    onClick={() => setSelectedId(d.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-dark-gray">{d.id}</span>
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-xs text-dark-gray/70" title={d.assetClass}>
                      {d.assetClass.replace(" and call deposits", "").replace(" and commercial papers", "")}
                    </td>
                    <td className="px-4 py-3 text-xs">{transactionType(d)}</td>
                    <td className="px-4 py-3 text-xs">{counterpartyOrIssuer(d)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {dealNotional(d.fields).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{rateOrPrice(d)}</td>
                    <td className="px-4 py-3 text-xs">{tradeDate(d)}</td>
                    <td className="px-4 py-3 text-xs">{valueDate(d)}</td>
                    <td className="px-4 py-3">
                      <DealSlipStatusBadge status={d.status} />
                    </td>
                    {showVwap && (() => {
                      const mandate = portfolioMandateMap.get(d.portfolioName);
                      return (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-dark-gray/70 truncate max-w-22.5" title={d.portfolioName}>
                              {d.portfolioName}
                            </span>
                            {mandate && (
                              <span
                                className={`inline-flex w-fit rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                  mandate === "Discretionary"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-purple-50 text-purple-700"
                                }`}
                              >
                                {mandate === "Discretionary" ? "D" : "ND"}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })()}
                    {canLimits && (
                      <>
                        <td className="px-4 py-3">
                          <LimitBadge flag={lf} />
                        </td>
                        <td className="px-4 py-3 text-right text-xs tabular-nums">
                          {portfolioExposurePct(d, dealSlips, register).toFixed(1)}%
                        </td>
                      </>
                    )}
                    {showVwap && (() => {
                      const info = dealVwapInfo(d, vwapMap);
                      if (!info) return <td className="px-4 py-3 text-xs text-gray-300">—</td>;
                      const sign = info.bps >= 0 ? "+" : "";
                      return (
                        <td className="px-4 py-3 text-xs tabular-nums">
                          <span className={`font-semibold ${info.favourable ? "text-success" : "text-danger"}`}>
                            {sign}{info.bps.toFixed(1)}bps
                          </span>
                        </td>
                      );
                    })()}
                    <td className="px-4 py-3 text-xs tabular-nums">{daysInStatus(d)}</td>
                    {showSettlementCol && (
                      <td className="px-4 py-3 text-xs text-dark-gray/55">
                        {d.settlementStatus ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          title="Open deal slip"
                          onClick={() => setSelectedId(d.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20"
                        >
                          <FileText className="h-3 w-3" />
                          Slip
                        </button>
                        <button
                          type="button"
                          title="Download PDF"
                          onClick={() => downloadDealSlipPdf(d)}
                          className="rounded p-1.5 text-dark-gray/40 hover:bg-gray-100 hover:text-dark-gray"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        {editable && (
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => setSelectedId(d.id)}
                            className="rounded p-1.5 text-dark-gray/40 hover:bg-gray-100"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canCreate && (
                          <button
                            type="button"
                            title="Duplicate"
                            onClick={() => {
                              const r = wf.duplicateDealSlip(d.id, persona.name, persona.role);
                              if (r.ok) setSelectedId(r.id);
                            }}
                            className="rounded p-1.5 text-dark-gray/40 hover:bg-gray-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pageRows.length === 0 && (
            <p className="py-12 text-center text-sm text-dark-gray/45">No trades match your filters.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-dark-gray/55">
          <span>
            {filtered.length} row{filtered.length !== 1 ? "s" : ""} · page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <select
              className="rounded border border-border px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-border px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-border px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedId && (
        <DealSlipWorkspace dealId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
