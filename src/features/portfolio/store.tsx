import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Holding,
  Transaction,
  AllocationTarget,
  PortfolioMetrics,
} from "./engine/types";
import { computePortfolioMetrics } from "./engine";
import { HOLDINGS, TRANSACTIONS, TARGETS } from "./engine/reference-data";

interface PortfolioContextValue {
  holdings: Holding[];
  transactions: Transaction[];
  targets: AllocationTarget[];
  metrics: PortfolioMetrics;
  selectedHoldingId: string | null;

  setSelectedHoldingId: (id: string | null) => void;
  addHolding: (h: Holding) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  addTransaction: (tx: Transaction) => void;
  setTargets: (t: AllocationTarget[]) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(HOLDINGS);
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS);
  const [targets, setTargets] = useState<AllocationTarget[]>(TARGETS);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(
    null,
  );

  const metrics = useMemo(
    () => computePortfolioMetrics(holdings, targets),
    [holdings, targets],
  );

  const value: PortfolioContextValue = {
    holdings,
    transactions,
    targets,
    metrics,
    selectedHoldingId,
    setSelectedHoldingId,
    addHolding: (h) => setHoldings((prev) => [h, ...prev]),
    updateHolding: (id, patch) =>
      setHoldings((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      ),
    removeHolding: (id) =>
      setHoldings((prev) => prev.filter((h) => h.id !== id)),
    addTransaction: (tx) => setTransactions((prev) => [tx, ...prev]),
    setTargets,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx)
    throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
