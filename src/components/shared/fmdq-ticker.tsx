import { useState, useEffect, useRef } from "react";
import { Activity, RefreshCw, X, TrendingUp, TrendingDown } from "lucide-react";

export interface RateEntry {
  label: string;
  value: string;
  note: string;
  change?: "up" | "down" | "flat";
  category: "monetary" | "tbill" | "bond" | "fx" | "ibor";
}

const RATES: RateEntry[] = [
  // Monetary policy
  { label: "MPR", value: "27.50%", note: "CBN", change: "flat", category: "monetary" },
  // T-Bills
  { label: "91D T-Bill", value: "19.80%", note: "FMDQ", change: "down", category: "tbill" },
  { label: "182D T-Bill", value: "20.15%", note: "FMDQ", change: "down", category: "tbill" },
  { label: "364D T-Bill", value: "20.90%", note: "FMDQ", change: "up", category: "tbill" },
  // FGN Bonds
  { label: "FGN 2yr", value: "18.50%", note: "FMDQ", change: "up", category: "bond" },
  { label: "FGN 5yr", value: "19.00%", note: "FMDQ", change: "flat", category: "bond" },
  { label: "FGN 10yr", value: "19.50%", note: "FMDQ", change: "up", category: "bond" },
  { label: "FGN 15yr", value: "19.80%", note: "FMDQ", change: "up", category: "bond" },
  { label: "FGN 20yr", value: "20.10%", note: "FMDQ", change: "up", category: "bond" },
  // FX
  { label: "USD/NGN", value: "₦1,580", note: "FMDQ", change: "up", category: "fx" },
  { label: "EUR/NGN", value: "₦1,720", note: "FMDQ", change: "flat", category: "fx" },
  { label: "GBP/NGN", value: "₦2,010", note: "FMDQ", change: "down", category: "fx" },
  // NIBOR
  { label: "NIBOR O/N", value: "27.10%", note: "FMDQ", change: "down", category: "ibor" },
  { label: "NIBOR 30D", value: "24.80%", note: "FMDQ", change: "down", category: "ibor" },
  { label: "NIBOR 90D", value: "23.50%", note: "FMDQ", change: "flat", category: "ibor" },
];

const CATEGORY_LABELS: Record<RateEntry["category"], string> = {
  monetary: "Monetary Policy",
  tbill: "Treasury Bills",
  bond: "FGN Bonds",
  fx: "FX Rates",
  ibor: "NIBOR",
};

function formatLiveTime() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function RatesModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const categories = (Object.keys(CATEGORY_LABELS) as RateEntry["category"][]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 backdrop-blur-[2px] pt-12 px-4">
      <div
        ref={ref}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.20)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-[#0F1923] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-md bg-primary/90 px-2 py-0.5">
              <Activity className="h-3 w-3 text-white" />
              <span className="text-xs font-bold tracking-wider text-white">FMDQ LIVE</span>
            </div>
            <p className="text-sm font-semibold text-white">Market Rates</p>
            <span className="text-xs text-white/40">·</span>
            <span className="text-xs text-white/40">FMDQ OTC Securities Exchange & CBN</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Rates grid */}
        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5 bg-surface">
          {categories.map((cat) => {
            const catRates = RATES.filter((r) => r.category === cat);
            if (catRates.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-dark-gray/40">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {catRates.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3.5 py-3"
                    >
                      <div>
                        <p className="text-[11px] font-medium text-dark-gray/50">{r.label}</p>
                        <p className="mt-0.5 text-base font-bold tabular-nums text-dark-gray">
                          {r.value}
                        </p>
                        <p className="mt-0.5 text-[10px] text-primary">{r.note}</p>
                      </div>
                      {r.change && r.change !== "flat" && (
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            r.change === "up"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {r.change === "up" ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface-muted/60 px-5 py-2.5 flex items-center justify-between">
          <p className="text-[11px] text-dark-gray/40">
            Rates are indicative and sourced from FMDQ OTC platform and CBN daily publications.
          </p>
          <p className="text-[11px] tabular-nums text-dark-gray/40">{formatLiveTime()}</p>
        </div>
      </div>
    </div>
  );
}

export function FmdqTicker() {
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(formatLiveTime());
  const [showRates, setShowRates] = useState(false);

  // Scroll ticker
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => o + 1), 3000);
    return () => clearInterval(id);
  }, []);

  // Live clock — updates every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(formatLiveTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  function handleRefresh(e: React.MouseEvent) {
    e.stopPropagation();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  const displayed = RATES.slice(offset % RATES.length).concat(RATES.slice(0, offset % RATES.length));

  return (
    <>
      <div
        className="flex h-7 items-center gap-0 border-b border-border bg-[#0F1923] text-white overflow-hidden shrink-0 cursor-pointer group"
        onClick={() => setShowRates(true)}
        title="Click to view all market rates"
      >
        {/* Source badge */}
        <div className="flex items-center gap-1.5 shrink-0 border-r border-white/10 px-3 h-full bg-primary/90 group-hover:bg-primary transition-colors">
          <Activity className="h-3 w-3" />
          <span className="text-xs font-bold tracking-wider">FMDQ LIVE</span>
        </div>

        {/* Scrolling rates */}
        <div className="flex-1 flex items-center gap-0 overflow-hidden">
          <div className="flex items-center gap-0 transition-transform duration-700 ease-in-out">
            {displayed.map((r, i) => (
              <div key={i} className="flex items-center shrink-0">
                <div className="flex items-center gap-1.5 px-4 h-7">
                  <span className="text-xs text-white/50">{r.label}</span>
                  <span className="text-xs font-bold text-white">{r.value}</span>
                  <span className="text-xs text-primary">{r.note}</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp + refresh */}
        <div className="flex items-center gap-2 shrink-0 border-l border-white/10 px-3 h-full" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-white/40 hidden sm:block">{now}</span>
          <button
            onClick={handleRefresh}
            className="rounded p-0.5 text-white/40 hover:text-white transition-colors"
            title="Refresh rates"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {showRates && <RatesModal onClose={() => setShowRates(false)} />}
    </>
  );
}
