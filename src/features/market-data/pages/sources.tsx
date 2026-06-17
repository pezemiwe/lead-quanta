import { useState } from "react";
import { CheckCircle2, Database, RefreshCw, Zap } from "lucide-react";
import { useMarketData } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { NGN_TENORS } from "../engine";
import { fmtPct, fmtTenor } from "../utils";

export function MarketDataSources() {
  const {
    state,
    refresh,
    setYield,
    setFx,
    connectBloomberg,
    bloombergConnected,
  } = useMarketData();

  const [tenor, setTenor] = useState<number>(5);
  const [newYield, setNewYield] = useState<string>("");
  const [fxPair, setFxPair] = useState<string>(" USD-NGN");
  const [fxRate, setFxRate] = useState<string>("");

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Data Sources & Overrides
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure live feeds, apply manual overrides, and audit data lineage
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Live feeds"
          description={`Current source: ${state.source}`}
          actions={
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-dark-gray hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          }
        >
          <ul className="divide-y divide-border text-sm">
            <li className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pale-red text-primary">
                  <Database className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-dark-gray">FMDQ NGN Curve</p>
                  <p className="text-xs text-gray-500">
                    Daily fixings for 10 tenors
                  </p>
                </div>
              </div>
            </li>
            <li className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-dark-gray">
                    Bloomberg Terminal
                  </p>
                  <p className="text-xs text-gray-500">
                    {bloombergConnected
                      ? "Session active — fetching live quotes"
                      : "Connect to your local BLPAPI session"}
                  </p>
                </div>
              </div>
              <button
                onClick={connectBloomberg}
                disabled={bloombergConnected}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                  bloombergConnected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-primary text-white hover:bg-mid-red"
                }`}
              >
                {bloombergConnected ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </>
                ) : (
                  "Connect"
                )}
              </button>
            </li>
            <li className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Database className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-dark-gray">
                    US Treasury & yfinance
                  </p>
                  <p className="text-xs text-gray-500">
                    Backstop for USD curve and equities
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-500">Auto</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Manual overrides"
          description="Pin a tenor or FX rate until next refresh"
        >
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 font-medium text-dark-gray">NGN yield</p>
              <div className="flex gap-2">
                <select
                  value={tenor}
                  onChange={(e) => setTenor(Number(e.target.value))}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                >
                  {NGN_TENORS.map((t) => (
                    <option key={t} value={t}>
                      {fmtTenor(t)}
                    </option>
                  ))}
                </select>
                <input
                  value={newYield}
                  onChange={(e) => setNewYield(e.target.value)}
                  placeholder="0.192"
                  className="flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => {
                    const v = parseFloat(newYield);
                    if (!isNaN(v)) {
                      setYield(tenor, v, "Manual override");
                      setNewYield("");
                    }
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-mid-red"
                >
                  Apply
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium text-dark-gray">FX rate</p>
              <div className="flex gap-2">
                <select
                  value={fxPair}
                  onChange={(e) => setFxPair(e.target.value)}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                >
                  {state.snapshot.fx.map((f) => (
                    <option key={f.pair} value={f.pair}>
                      {f.pair}
                    </option>
                  ))}
                </select>
                <input
                  value={fxRate}
                  onChange={(e) => setFxRate(e.target.value)}
                  placeholder="1595.00"
                  className="flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => {
                    const v = parseFloat(fxRate);
                    if (!isNaN(v)) {
                      setFx(fxPair, v, "CBN Fix");
                      setFxRate("");
                    }
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-mid-red"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Override audit trail"
        description={`${state.overrides.length} override${state.overrides.length === 1 ? "" : "s"} applied`}
      >
        {state.overrides.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No overrides applied. Apply one above to see it logged here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {[...state.overrides].reverse().map((o, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(o.at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium text-dark-gray">
                      {o.type}
                    </td>
                    <td className="px-3 py-2">{o.key}</td>
                    <td className="px-3 py-2 text-right font-mono text-dark-gray">
                      {o.type.includes("Yield")
                        ? fmtPct(o.value, 3)
                        : o.value.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {o.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
