import { createContext, useContext, useState, type ReactNode } from "react";

/* -------------------------------------------------------
   Portfolio Registry
   Shared state for named portfolio books consumed by both
   Portfolio Management and Deal Capture modules.
------------------------------------------------------- */

export type PortfolioType = "Trading" | "Banking" | "HTM" | "AFS" | "Custom";
export type PortfolioStatus = "Active" | "Inactive" | "Archived";

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description: string;
  manager: string;
  mandatedBy: string;
  strategy: string;
  status: PortfolioStatus;
  createdAt: string; // ISO date
  instrumentCount?: number;
}

const SEED: Portfolio[] = [
  {
    id: "pb-trading",
    name: "Trading Book",
    type: "Trading",
    baseCurrency: "NGN",
    description: "Short-duration instruments held for active trading.",
    manager: "Head of Trading",
    mandatedBy: "Investment Committee",
    strategy: "Active trading — mark-to-market daily",
    status: "Active",
    createdAt: "2024-01-01",
    instrumentCount: 68,
  },
  {
    id: "pb-banking",
    name: "Banking Book",
    type: "Banking",
    baseCurrency: "NGN",
    description: "Long-duration fixed income and loan-book instruments.",
    manager: "Head of Fixed Income",
    mandatedBy: "Investment Committee",
    strategy: "Buy and hold — EIR amortisation",
    status: "Active",
    createdAt: "2024-01-01",
    instrumentCount: 97,
  },
  {
    id: "pb-htm",
    name: "Held-to-Maturity",
    type: "HTM",
    baseCurrency: "NGN",
    description: "Instruments designated HTM under IFRS 9 — AC classification.",
    manager: "Head of Fixed Income",
    mandatedBy: "Board Risk Committee",
    strategy: "Hold to maturity — no rebalancing",
    status: "Active",
    createdAt: "2024-01-01",
    instrumentCount: 39,
  },
];

interface RegistryContextValue {
  portfolios: Portfolio[];
  addPortfolio: (p: Omit<Portfolio, "id" | "createdAt">) => Portfolio;
  updatePortfolio: (id: string, patch: Partial<Portfolio>) => void;
  removePortfolio: (id: string) => void;
  getPortfolioNames: () => string[];
}

const RegistryContext = createContext<RegistryContextValue | null>(null);

let _counter = SEED.length + 1;

export function PortfolioRegistryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(SEED);

  function addPortfolio(p: Omit<Portfolio, "id" | "createdAt">): Portfolio {
    const newP: Portfolio = {
      ...p,
      id: `pb-custom-${_counter++}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPortfolios((prev) => [...prev, newP]);
    return newP;
  }

  function updatePortfolio(id: string, patch: Partial<Portfolio>) {
    setPortfolios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  function removePortfolio(id: string) {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  }

  function getPortfolioNames(): string[] {
    return portfolios.filter((p) => p.status === "Active").map((p) => p.name);
  }

  return (
    <RegistryContext.Provider
      value={{
        portfolios,
        addPortfolio,
        updatePortfolio,
        removePortfolio,
        getPortfolioNames,
      }}
    >
      {children}
    </RegistryContext.Provider>
  );
}

export function usePortfolioRegistry() {
  const ctx = useContext(RegistryContext);
  if (!ctx)
    throw new Error(
      "usePortfolioRegistry must be used within PortfolioRegistryProvider",
    );
  return ctx;
}
