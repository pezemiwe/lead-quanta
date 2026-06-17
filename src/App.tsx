import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PersonaProvider } from "./context/persona";
import { GovernanceProvider } from "./context/governance";
import { PortfolioRegistryProvider } from "./features/portfolio/portfolio-registry";
import { RequireAuth, ProtectedModule } from "./components/shared/require-auth";
import { LandingPage } from "./pages/landing";
import { LoginPage } from "./pages/login";
import { ModulesPage } from "./pages/modules";
import { PageLoader } from "./components/shared/loader";

/* ── Lazily-loaded modules (each gets its own JS chunk) ──────── */
const PortfolioModule = lazy(() =>
  import("./features/portfolio").then((m) => ({ default: m.PortfolioModule })),
);
const IFRS9Module = lazy(() =>
  import("./features/ifrs9").then((m) => ({ default: m.IFRS9Module })),
);
const ValuationModule = lazy(() =>
  import("./features/valuation").then((m) => ({ default: m.ValuationModule })),
);
const DurationRiskModule = lazy(() =>
  import("./features/duration-risk").then((m) => ({
    default: m.DurationRiskModule,
  })),
);
const MarketDataModule = lazy(() =>
  import("./features/market-data").then((m) => ({
    default: m.MarketDataModule,
  })),
);
const DealsModule = lazy(() =>
  import("./features/deals").then((m) => ({ default: m.DealsModule })),
);
const PerformanceModule = lazy(() =>
  import("./features/performance").then((m) => ({
    default: m.PerformanceModule,
  })),
);
const AccountingModule = lazy(() =>
  import("./features/accounting").then((m) => ({
    default: m.AccountingModule,
  })),
);
const ReportingModule = lazy(() =>
  import("./features/reporting").then((m) => ({
    default: m.ReportingModule,
  })),
);
const GovernanceModule = lazy(() =>
  import("./features/governance").then((m) => ({
    default: m.GovernanceModule,
  })),
);

export function App() {
  return (
    <PersonaProvider>
      <GovernanceProvider>
        <PortfolioRegistryProvider>
          <Suspense fallback={<PageLoader label="Loading module…" />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Module hub */}
              <Route
                path="/modules"
                element={
                  <RequireAuth>
                    <ModulesPage />
                  </RequireAuth>
                }
              />

              {/* Portfolio — all sub-pages via :page param */}
              <Route
                path="/portfolio"
                element={
                  <ProtectedModule moduleId="portfolio">
                    <PortfolioModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/portfolio/:page"
                element={
                  <ProtectedModule moduleId="portfolio">
                    <PortfolioModule />
                  </ProtectedModule>
                }
              />

              {/* IFRS 9 */}
              <Route
                path="/ifrs9"
                element={
                  <ProtectedModule moduleId="ifrs9">
                    <IFRS9Module />
                  </ProtectedModule>
                }
              />
              <Route
                path="/ifrs9/:page"
                element={
                  <ProtectedModule moduleId="ifrs9">
                    <IFRS9Module />
                  </ProtectedModule>
                }
              />

              {/* Valuation */}
              <Route
                path="/valuation"
                element={
                  <ProtectedModule moduleId="valuation">
                    <ValuationModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/valuation/:page"
                element={
                  <ProtectedModule moduleId="valuation">
                    <ValuationModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/valuation/asset/:id"
                element={
                  <ProtectedModule moduleId="valuation">
                    <ValuationModule />
                  </ProtectedModule>
                }
              />

              {/* Duration & Risk */}
              <Route
                path="/duration-risk"
                element={
                  <ProtectedModule moduleId="duration-risk">
                    <DurationRiskModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/duration-risk/:page"
                element={
                  <ProtectedModule moduleId="duration-risk">
                    <DurationRiskModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/duration-risk/asset/:id"
                element={
                  <ProtectedModule moduleId="duration-risk">
                    <DurationRiskModule />
                  </ProtectedModule>
                }
              />

              {/* Market Data & Trend Analytics */}
              <Route
                path="/market-data"
                element={
                  <ProtectedModule moduleId="market-data">
                    <MarketDataModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/market-data/:page"
                element={
                  <ProtectedModule moduleId="market-data">
                    <MarketDataModule />
                  </ProtectedModule>
                }
              />

              {/* Deal Capture & Trade Management */}
              <Route
                path="/deal-capture"
                element={
                  <ProtectedModule moduleId="deal-capture">
                    <DealsModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/deal-capture/:page"
                element={
                  <ProtectedModule moduleId="deal-capture">
                    <DealsModule />
                  </ProtectedModule>
                }
              />

              {/* Performance Analytics */}
              <Route
                path="/performance"
                element={
                  <ProtectedModule moduleId="performance">
                    <PerformanceModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/performance/:page"
                element={
                  <ProtectedModule moduleId="performance">
                    <PerformanceModule />
                  </ProtectedModule>
                }
              />

              {/* Accounting & GL */}
              <Route
                path="/accounting"
                element={
                  <ProtectedModule moduleId="accounting">
                    <AccountingModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/accounting/:page"
                element={
                  <ProtectedModule moduleId="accounting">
                    <AccountingModule />
                  </ProtectedModule>
                }
              />

              {/* Reporting */}
              <Route
                path="/reporting"
                element={
                  <ProtectedModule moduleId="reporting">
                    <ReportingModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/reporting/:page"
                element={
                  <ProtectedModule moduleId="reporting">
                    <ReportingModule />
                  </ProtectedModule>
                }
              />

              {/* Governance & Controls */}
              <Route
                path="/governance"
                element={
                  <ProtectedModule moduleId="governance">
                    <GovernanceModule />
                  </ProtectedModule>
                }
              />
              <Route
                path="/governance/:page"
                element={
                  <ProtectedModule moduleId="governance">
                    <GovernanceModule />
                  </ProtectedModule>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PortfolioRegistryProvider>
      </GovernanceProvider>
    </PersonaProvider>
  );
}
