import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bell,
  Coins,
  Database,
  LayoutDashboard,
  LineChart,
  Percent,
  Scale,
  TrendingUp,
} from "lucide-react";
import { usePersona } from "../../context/persona";
import { Logo } from "../../components/shared/logo";
import { UserMenu } from "../../components/shared/user-menu";

import { MarketDataProvider } from "./store";
import { MarketDataDashboard } from "./pages/dashboard";
import { MarketDataYieldCurve } from "./pages/yield-curve";
import { MarketDataFx } from "./pages/fx-rates";
import { MarketDataBondPrices } from "./pages/bond-prices";
import { MarketDataInflationMpr } from "./pages/inflation-mpr";
import { MarketDataPortfolioPnl } from "./pages/portfolio-pnl";
import { MarketDataSpreadAnalysis } from "./pages/spread-analysis";
import { MarketDataAlerts } from "./pages/alerts";
import { MarketDataSources } from "./pages/sources";

export type MarketDataPage =
  | "dashboard"
  | "yield-curve"
  | "fx-rates"
  | "bond-prices"
  | "inflation-mpr"
  | "portfolio-pnl"
  | "spread-analysis"
  | "alerts"
  | "sources";

const NAV: {
  id: MarketDataPage;
  label: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "overview",
  },
  {
    id: "yield-curve",
    label: "Yield Curve",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "rates",
  },
  {
    id: "bond-prices",
    label: "Bond Prices",
    icon: <LineChart className="h-4 w-4" />,
    group: "rates",
  },
  {
    id: "spread-analysis",
    label: "NGN vs USD Spread",
    icon: <Scale className="h-4 w-4" />,
    group: "rates",
  },
  {
    id: "fx-rates",
    label: "FX Rates",
    icon: <Coins className="h-4 w-4" />,
    group: "fx",
  },
  {
    id: "inflation-mpr",
    label: "Inflation & MPR",
    icon: <Percent className="h-4 w-4" />,
    group: "macro",
  },
  {
    id: "portfolio-pnl",
    label: "Portfolio P&L",
    icon: <Activity className="h-4 w-4" />,
    group: "portfolio",
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: <AlertTriangle className="h-4 w-4" />,
    group: "ops",
  },
  {
    id: "sources",
    label: "Sources & Overrides",
    icon: <Database className="h-4 w-4" />,
    group: "ops",
  },
];

const GROUPS: Record<string, string> = {
  overview: "Overview",
  rates: "Rates",
  fx: "FX",
  macro: "Macro",
  portfolio: "Portfolio",
  ops: "Operations",
};

function PageBody({ page }: { page: MarketDataPage }) {
  switch (page) {
    case "dashboard":
      return <MarketDataDashboard />;
    case "yield-curve":
      return <MarketDataYieldCurve />;
    case "fx-rates":
      return <MarketDataFx />;
    case "bond-prices":
      return <MarketDataBondPrices />;
    case "inflation-mpr":
      return <MarketDataInflationMpr />;
    case "portfolio-pnl":
      return <MarketDataPortfolioPnl />;
    case "spread-analysis":
      return <MarketDataSpreadAnalysis />;
    case "alerts":
      return <MarketDataAlerts />;
    case "sources":
      return <MarketDataSources />;
  }
}

export function MarketDataModule() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const { page: pageParam } = useParams<{ page?: string }>();

  const page: MarketDataPage = (pageParam ?? "dashboard") as MarketDataPage;

  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    groupLabel: label,
    items: NAV.filter((n) => n.group === key),
  }));

  return (
    <MarketDataProvider>
      <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
          <div className="flex items-center gap-3">
            <Logo collapsed />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-semibold text-dark-gray">
              Market Data &amp; Trend Analytics
            </span>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu
              persona={persona}
              onSwitchModules={() => navigate("/modules")}
              onLogout={() => {
                setPersona({ name: "", role: "", avatar: "" });
                navigate("/");
              }}
            />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
            <nav className="flex-1 py-4">
              {grouped.map(({ groupLabel, items }) => (
                <div key={groupLabel} className="mb-5">
                  <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-gray-300">
                    {groupLabel}
                  </p>
                  {items.map((item) => {
                    const active = page === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/market-data/${item.id}`)}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          active
                            ? "border-r-2 border-primary bg-pale-red font-medium text-primary"
                            : "text-gray-500 hover:bg-gray-50 hover:text-dark-gray"
                        }`}
                      >
                        <span
                          className={`shrink-0 ${active ? "text-primary" : ""}`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto">
            <PageBody page={page} />
          </main>
        </div>
      </div>
    </MarketDataProvider>
  );
}
