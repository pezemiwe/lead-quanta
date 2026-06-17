import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePersona } from "../context/persona";
import { getModuleAccess, type ModuleId } from "../context/permissions";
import {
  BarChart2,
  Calculator,
  LineChart,
  ChevronRight,
  LogOut,
  Shield,
  Activity,
  FileText,
  Database,
  TrendingUp,
  PieChart,
  Check,
  AlertTriangle,
  ShieldCheck,
  ArrowLeftRight,
  Lock,
  Eye,
} from "lucide-react";

/* ── Module definitions ─────────────────────────────────────── */
const MODULES = [
  {
    id: "portfolio",
    live: true,
    icon: BarChart2,
    title: "Portfolio Management",
    subtitle: "Real-time investment portfolio analytics & monitoring",
    description:
      "Complete visibility into the Leadway Holdings investment portfolio. Monitor security performance, track allocations, analyse concentration risk, and generate board-level reports in real time.",
    features: [
      { icon: Database, label: "Securities ingestion & classification" },
      { icon: PieChart, label: "Concentration & sector analysis" },
      { icon: Activity, label: "Allocation targets & limit monitoring" },
      { icon: TrendingUp, label: "Portfolio trend reporting" },
      { icon: AlertTriangle, label: "Early warning & watch list" },
    ],
    accent: "#F7941D",
    lightBg: "#FFF7ED",
  },
  {
    id: "deal-capture",
    live: true,
    icon: ArrowLeftRight,
    title: "Deal Capture & Trade Management",
    subtitle: "End-to-end trade lifecycle & settlement workflow",
    description:
      "Capture, validate, and manage the full lifecycle of investment trades from order entry and counterparty confirmation through settlement and post-trade reconciliation with real-time blotter and STP support.",
    features: [
      { icon: Database, label: "Order entry & pre-trade validation" },
      { icon: Activity, label: "Counterparty & broker management" },
      { icon: Check, label: "Settlement & custodian reconciliation" },
      { icon: FileText, label: "Real-time trade blotter" },
      { icon: TrendingUp, label: "Corporate actions processing" },
    ],
    accent: "#E07B12",
    lightBg: "#FFF1E0",
  },
  {
    id: "market-data",
    live: true,
    icon: Activity,
    title: "Market Data & Trend Analytics",
    subtitle: "Live prices, yields, indices & macro signals",
    description:
      "Aggregate and normalise market data across asset classes government bonds, equities, FX, and money market rates and overlay macro-economic trend signals to inform investment decisions.",
    features: [
      { icon: TrendingUp, label: "Government bond yield curve construction" },
      { icon: Activity, label: "Equity price & index feeds" },
      { icon: Database, label: "FX rates & money market benchmarks" },
      { icon: AlertTriangle, label: "Macro-economic signal overlays" },
      { icon: PieChart, label: "Historical trend analytics" },
    ],
    accent: "#1A6B8A",
    lightBg: "#EFF7FA",
  },
  {
    id: "valuation",
    live: true,
    icon: LineChart,
    title: "Valuation Engine",
    subtitle: "Fair value & investment instrument valuation",
    description:
      "Compute fair values across the investment portfolio bonds, equities, mutual funds and money market instruments using industry-standard models with IFRS 13 hierarchy disclosures.",
    features: [
      { icon: Calculator, label: "Discounted cash flow (DCF)" },
      { icon: Activity, label: "Yield curve & benchmark feeds" },
      { icon: Shield, label: "IFRS 13 fair value hierarchy" },
      { icon: PieChart, label: "Investment securities pricing" },
      { icon: TrendingUp, label: "Mark-to-market reporting" },
    ],
    accent: "#9A3412",
    lightBg: "#FBEEE6",
  },
  {
    id: "ifrs9",
    live: true,
    icon: Calculator,
    title: "IFRS 9 — Expected Credit Loss",
    subtitle: "Automated ECL computation aligned to CBN guidelines",
    description:
      "Automate the full IFRS 9 impairment lifecycle from SICR detection and stage allocation through PD/LGD/EAD parameterisation to ECL charge computation aligned with CBN prudential guidelines.",
    features: [
      { icon: AlertTriangle, label: "Automated SICR detection & staging" },
      { icon: Calculator, label: "PD · LGD · EAD parameters" },
      { icon: FileText, label: "12-month & lifetime ECL" },
      { icon: TrendingUp, label: "Macro-economic overlays" },
      { icon: Shield, label: "CBN regulatory reporting" },
    ],
    accent: "#C2410C",
    lightBg: "#FBEFE6",
  },
  {
    id: "performance",
    live: true,
    icon: TrendingUp,
    title: "Return & Performance Analytics",
    subtitle: "Attribution, benchmarking & return decomposition",
    description:
      "Measure and decompose investment returns at fund, asset class, and security level. Run attribution analysis against benchmarks and generate GIPS-aligned performance reports for the investment committee.",
    features: [
      { icon: Activity, label: "Time-weighted & money-weighted returns" },
      { icon: PieChart, label: "Attribution analysis by asset class" },
      { icon: TrendingUp, label: "Benchmark comparison & tracking error" },
      { icon: FileText, label: "GIPS-aligned performance reporting" },
      { icon: Database, label: "Historical performance trend charts" },
    ],
    accent: "#1A7A4A",
    lightBg: "#EFF8F3",
  },
  {
    id: "duration-risk",
    live: true,
    icon: ShieldCheck,
    title: "Duration & Risk Analytics",
    subtitle: "Interest rate sensitivity, VaR & stress testing",
    description:
      "Quantify and manage portfolio risk exposures duration, convexity, value-at-risk, and credit spread sensitivity and run stress scenarios across interest rate and FX shock assumptions.",
    features: [
      { icon: Calculator, label: "Modified duration & convexity" },
      { icon: Activity, label: "DV01 & PV01 sensitivity measures" },
      { icon: AlertTriangle, label: "Value-at-Risk (VaR) computation" },
      { icon: Shield, label: "Stress testing & scenario analysis" },
      { icon: TrendingUp, label: "Credit spread & FX risk exposure" },
    ],
    accent: "#3A3A6A",
    lightBg: "#F0F0F8",
  },
  {
    id: "accounting",
    live: true,
    icon: FileText,
    title: "Accounting & GL Integration",
    subtitle: "Automated journal entries & general ledger sync",
    description:
      "Generate IFRS-compliant accounting entries for all investment transactions purchases, disposals, accruals, fair value adjustments, and impairment charges — and sync directly to the general ledger.",
    features: [
      { icon: FileText, label: "IFRS-compliant journal entry generation" },
      { icon: Calculator, label: "Fair value & amortised cost accounting" },
      { icon: AlertTriangle, label: "Impairment charge posting" },
      { icon: Database, label: "Accrued income & amortisation schedules" },
      { icon: Check, label: "GL system integration & reconciliation" },
    ],
    accent: "#7A5A1A",
    lightBg: "#FAF5EF",
  },
  {
    id: "reporting",
    live: true,
    icon: PieChart,
    title: "Reporting & Dashboard",
    subtitle: "Board, ALCO & regulatory reporting suite",
    description:
      "Generate Investment Committee packs, ALCO reports, CBN/SEC regulatory submissions, and interactive management dashboards all from a single reporting hub with scheduled distribution.",
    features: [
      { icon: FileText, label: "Investment Committee report packs" },
      { icon: PieChart, label: "ALCO & board-level dashboards" },
      { icon: Database, label: "CBN / SEC regulatory submissions" },
      { icon: Activity, label: "Scheduled report distribution" },
      { icon: TrendingUp, label: "Cross-module consolidated analytics" },
    ],
    accent: "#4A4A8A",
    lightBg: "#F0F0F8",
  },
  {
    id: "governance",
    live: true,
    icon: ShieldCheck,
    title: "Governance & Controls",
    subtitle: "RBAC, approvals, audit trail & compliance",
    description:
      "Centralised governance hub for role-based access control, maker-checker approval workflows, NAICOM investment limit monitoring, immutable audit trail, compliance monitoring, and external system integrations.",
    features: [
      { icon: Lock, label: "Role-based access & segregation of duties" },
      { icon: Check, label: "Maker-checker approval workflows" },
      { icon: Shield, label: "Immutable system audit trail" },
      { icon: AlertTriangle, label: "Investment limit controls (NAICOM/CBN)" },
      { icon: Eye, label: "External integrations hub" },
    ],
    accent: "#2D4A8A",
    lightBg: "#EFF2FA",
  },
];

/* ── Greeting ───────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* ── Modules Page ───────────────────────────────────────────── */
export function ModulesPage() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleLogout = () => {
    setPersona({ name: "", role: "", avatar: "" });
    navigate("/");
  };

  // Count how many modules this persona can access
  const accessibleCount = MODULES.filter(
    (m) => getModuleAccess(persona.role, m.id as ModuleId) !== "none",
  ).length;

  return (
    <div
      className="flex min-h-screen flex-col font-sans antialiased"
      style={{ background: "#F7F7F8" }}
    >
      {/* ── Top nav ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/lead-logo.jpg"
              alt="Leadway Holdings"
              className="h-8 w-8 shrink-0 overflow-hidden rounded-full object-cover object-left"
              draggable={false}
            />
            <div>
              <p className="text-sm font-bold text-primary">Leadway Quanta</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-dark-gray/40">
                Financial Analytics
              </p>
            </div>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-dark-gray">
                  {persona.name}
                </p>
                <p className="text-xs text-dark-gray/45">{persona.role}</p>
              </div>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
                style={{ background: "#F7941D" }}
              >
                {persona.avatar}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-dark-gray/50 transition-all hover:bg-surface-muted hover:text-dark-gray"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero text ─────────────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
            Module Selection
          </p>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-dark-gray lg:text-3xl">
            {greeting()},{" "}
            <span className="text-primary">{persona.name.split(" ")[0]}</span>.
          </h1>
          <p className="text-sm text-dark-gray/50">
            Select a module below to begin your session.{" "}
            <span className="font-medium text-dark-gray/70">{accessibleCount} of {MODULES.length} modules available for your role.</span>
          </p>
        </div>
      </div>

      {/* ── Module cards ──────────────────────────────────────── */}
      <main className="flex-1 py-8 lg:py-10">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const isHovered = hovered === m.id;
              const access = getModuleAccess(persona.role, m.id as ModuleId);
              const isLocked = access === "none";
              const isReadOnly = access === "read-only";
              return (
                <div
                  key={m.id}
                  onMouseEnter={() => !isLocked && setHovered(m.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 ${isLocked ? "opacity-50 grayscale" : ""}`}
                  style={{
                    boxShadow: isHovered
                      ? `0 12px 32px rgba(0,0,0,0.09), 0 0 0 1.5px ${m.accent}33`
                      : "0 1px 3px rgba(0,0,0,0.05)",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                  }}
                >
                  {/* Accent top stripe */}
                  <div style={{ height: 3, background: isLocked ? "#9ca3af" : m.accent, flexShrink: 0 }} />

                  <div className="flex flex-1 flex-col p-4">
                    {/* Icon + status badge */}
                    <div className="mb-3 flex items-start justify-between">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                        style={{ background: isLocked ? "#9ca3af" : m.accent }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {isLocked ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                          <Lock className="h-2.5 w-2.5" /> Locked
                        </span>
                      ) : isReadOnly ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600">
                          <Eye className="h-2.5 w-2.5" /> View
                        </span>
                      ) : m.live ? (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                          Live
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-dark-gray/35">
                          Soon
                        </span>
                      )}
                    </div>

                    {/* Module name + subtitle */}
                    <h3 className="mb-0.5 text-[13px] font-bold leading-snug text-dark-gray">
                      {m.title}
                    </h3>
                    <p className="mb-3 text-[11px] leading-snug text-dark-gray/45">
                      {m.subtitle}
                    </p>

                    {/* Top 3 capabilities */}
                    <div className="mb-4 flex flex-1 flex-col gap-1.5">
                      {m.features.slice(0, 3).map(({ label }) => (
                        <div key={label} className="flex items-start gap-1.5">
                          <div
                            className="mt-[3px] h-1 w-1 shrink-0 rounded-full"
                            style={{ background: isLocked ? "#9ca3af" : `${m.accent}99` }}
                          />
                          <span className="text-[10px] leading-snug text-dark-gray/50">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    {isLocked ? (
                      <button
                        disabled
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold cursor-not-allowed bg-gray-100 text-gray-400"
                      >
                        <Lock className="h-3 w-3" /> Access Restricted
                      </button>
                    ) : isReadOnly ? (
                      <button
                        onClick={() => navigate(`/${m.id}`)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-800 transition-all hover:bg-amber-100"
                      >
                        <Eye className="h-3 w-3" /> View Module
                      </button>
                    ) : m.live ? (
                      <button
                        onClick={() => navigate(`/${m.id}`)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold text-white transition-all duration-200"
                        style={{
                          background: isHovered
                            ? `linear-gradient(90deg, ${m.accent} 0%, ${m.accent}CC 100%)`
                            : m.accent,
                        }}
                      >
                        Open Module <ChevronRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold cursor-not-allowed text-dark-gray/30"
                        style={{ background: "#F4F4F6" }}
                      >
                        <Lock className="h-3 w-3" /> Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white py-5">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-dark-gray/30">
              © {new Date().getFullYear()} Leadway Holdings Group. For authorised
              internal use only.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-dark-gray/30">
              <Shield className="h-3 w-3" />
              <span>CBN Compliant · IFRS 9 Ready · Audit-Trail Enabled</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
