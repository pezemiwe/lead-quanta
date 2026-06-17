import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyBondYieldOverride,
  applyFxOverride,
  applyYieldOverride,
  buildMarketState,
  VALUATION_DATE,
} from "./engine";
import type { MarketState } from "./engine/types";

interface MarketDataContextValue {
  state: MarketState;
  asOf: string;
  refresh: () => void;
  setYield: (
    tenor: number,
    newYield: number,
    source: string,
    currency?: "NGN" | "USD",
  ) => void;
  setFx: (pair: string, rate: number, source: string) => void;
  setBondYield: (bondId: string, newYield: number, source: string) => void;
  connectBloomberg: () => void;
  bloombergConnected: boolean;
  loadFmdq: (rows: { tenor: number; yield: number }[]) => void;
}

const Ctx = createContext<MarketDataContextValue | null>(null);

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [asOf] = useState(VALUATION_DATE);
  const [state, setState] = useState<MarketState>(() => buildMarketState(asOf));
  const [bloombergConnected, setBloombergConnected] = useState(false);

  const refresh = useCallback(() => setState(buildMarketState(asOf)), [asOf]);

  const setYield = useCallback(
    (
      tenor: number,
      newYield: number,
      source: string,
      currency: "NGN" | "USD" = "NGN",
    ) =>
      setState((s) => applyYieldOverride(s, tenor, newYield, source, currency)),
    [],
  );

  const setFx = useCallback(
    (pair: string, rate: number, source: string) =>
      setState((s) => applyFxOverride(s, pair, rate, source)),
    [],
  );

  const setBondYield = useCallback(
    (bondId: string, newYield: number, source: string) =>
      setState((s) => applyBondYieldOverride(s, bondId, newYield, source)),
    [],
  );

  const connectBloomberg = useCallback(() => setBloombergConnected(true), []);

  const loadFmdq = useCallback(
    (rows: { tenor: number; yield: number }[]) =>
      setState((s) => {
        let next = s;
        for (const r of rows)
          next = applyYieldOverride(next, r.tenor, r.yield, "FMDQ", "NGN");
        return { ...next, source: "FMDQ" };
      }),
    [],
  );

  const value = useMemo<MarketDataContextValue>(
    () => ({
      state,
      asOf,
      refresh,
      setYield,
      setFx,
      setBondYield,
      connectBloomberg,
      bloombergConnected,
      loadFmdq,
    }),
    [
      state,
      asOf,
      refresh,
      setYield,
      setFx,
      setBondYield,
      connectBloomberg,
      bloombergConnected,
      loadFmdq,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketData(): MarketDataContextValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useMarketData must be used within MarketDataProvider");
  return ctx;
}
