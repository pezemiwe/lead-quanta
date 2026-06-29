import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeftRight,
  BarChart2,
  ChevronRight,
  TrendingUp,
  Database,
  Settings,
  LayoutDashboard,
  Shield,
  FileText,
  Calculator,
  Activity,
  Check,
  Menu,
  X,
  Building2,
  PieChart,
  Layers,
  AlertTriangle,
  LineChart,
} from "lucide-react";

/* ── hooks ─────────────────────────────────────────────────── */
const useScrolled = (threshold = 30) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
};

const useInView = (opts?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, ...opts },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
};

/* ── Platform Mockup ────────────────────────────────────────── */
const PlatformMockup = () => (
  <div className="relative w-full max-w-155">
    {/* Soft red shadow behind */}
    <div
      className="pointer-events-none absolute inset-0 -z-10 scale-105 rounded-3xl blur-3xl"
      style={{
        background:
          "radial-gradient(ellipse, rgba(247,148,29,0.12) 0%, transparent 70%)",
      }}
    />
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10),0_4px_16px_rgba(0,0,0,0.06)]">
      {/* Window chrome */}
      <div className="flex h-10 items-center gap-1.5 border-b border-border bg-surface-muted px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="mx-auto flex h-5 w-52 items-center justify-center rounded border border-border bg-white">
          <span className="font-mono text-[9px] text-dark-gray/40">
            leadway-quanta.app — Dashboard
          </span>
        </div>
      </div>

      <div className="flex" style={{ height: 400 }}>
        {/* Sidebar */}
        <div className="flex w-14 shrink-0 flex-col items-center gap-5 border-r border-border bg-surface-muted py-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black text-white"
            style={{ background: "#F7941D" }}
          >
            LQ
          </div>
          {[LayoutDashboard, BarChart2, FileText, Calculator, Settings].map(
            (Icon, i) => (
              <Icon
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  color: i === 0 ? "#F7941D" : "#1a1a1a",
                  opacity: i === 0 ? 1 : 0.25,
                }}
              />
            ),
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
          {/* Heading */}
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 h-2.5 w-40 rounded-sm bg-dark-gray/80" />
              <div className="h-2 w-24 rounded-sm bg-dark-gray/20" />
            </div>
            <div
              className="flex h-7 items-center gap-1.5 rounded-lg px-3 text-[9px] font-semibold text-white"
              style={{ background: "#F7941D" }}
            >
              <Activity style={{ width: 9, height: 9 }} />
              Capture Deal
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              {
                label: "Portfolio",
                value: "₦14.2B",
                up: true,
                note: "+8.3% YoY",
              },
              {
                label: "Active Deals",
                value: "24",
                up: true,
                note: "3 pending review",
              },
              { label: "Avg Yield", value: "17.4%", up: true, note: "+1.2pp" },
              { label: "OCI Reserve", value: "₦83M", up: null, note: "FVOCI" },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-white p-3"
              >
                <p className="text-[7px] text-dark-gray/40">{s.label}</p>
                <p className="mt-0.5 text-[11px] font-bold text-dark-gray leading-tight">
                  {s.value}
                </p>
                <p
                  className="mt-1 text-[7px] font-medium"
                  style={{
                    color:
                      s.up === null
                        ? "#1a1a1a66"
                        : s.up
                          ? "#0f766e"
                          : "#b91c1c",
                  }}
                >
                  {s.note}
                </p>
              </div>
            ))}
          </div>

          {/* Modules nav tabs */}
          <div className="flex gap-1">
            {["Portfolio", "Deal Capture", "Valuation"].map((tab, i) => (
              <div
                key={tab}
                className="rounded-md px-3 py-1.5 text-[8px] font-semibold"
                style={{
                  background: i === 0 ? "#F7941D" : "#f4f4f4",
                  color: i === 0 ? "white" : "#1a1a1a99",
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Trade blotter table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex gap-4 bg-surface-muted px-3 py-2 border-b border-border">
              {["ID", "Instrument", "Counterparty", "Amount", "Status"].map((h) => (
                <span
                  key={h}
                  className="text-[7px] font-bold uppercase tracking-wider text-dark-gray/40"
                >
                  {h}
                </span>
              ))}
            </div>
            {[
              {
                id: "D-042",
                inst: "FGN Bond 2031",
                cpty: "Zenith Bank",
                amt: "₦500M",
                status: "Approved",
                color: "#0f766e",
              },
              {
                id: "D-041",
                inst: "CBN T-Bill 91d",
                cpty: "CBN",
                amt: "₦200M",
                status: "Settled",
                color: "#0f766e",
              },
              {
                id: "D-040",
                inst: "MTN Nigeria Bond",
                cpty: "GTBank",
                amt: "₦150M",
                status: "Pending",
                color: "#d97706",
              },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-3 py-2"
                style={{
                  background: i % 2 === 0 ? "white" : "#fafafa",
                  borderTop: i > 0 ? "1px solid #f0f0f0" : "none",
                }}
              >
                <span className="font-mono text-[8px] text-dark-gray/50 w-7">
                  {r.id}
                </span>
                <span className="text-[8px] text-dark-gray/70 w-16 truncate">{r.inst}</span>
                <span className="text-[8px] text-dark-gray/55">{r.cpty}</span>
                <span className="text-[8px] font-medium text-dark-gray/70">
                  {r.amt}
                </span>
                <span className="text-[8px] font-semibold" style={{ color: r.color }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div className="flex flex-1 items-end gap-1 rounded-lg border border-border bg-white p-3">
            <p className="self-start text-[7px] text-dark-gray/35 mr-2">
              Portfolio Return (12m)
            </p>
            {[38, 42, 48, 52, 47, 58, 62, 55, 68, 72, 78, 83].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h * 0.6}%`,
                  maxHeight: 36,
                  background: `rgba(247,148,29,${0.2 + (i / 11) * 0.6})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ── Navbar ─────────────────────────────────────────────────── */
const NAV_LINKS = ["Modules", "Capabilities", "Compliance"];

const Navbar = ({ onEnter }: { onEnter: () => void }) => {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.97)",
        borderBottom: "1px solid #E2E2E2",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/lead-logo.jpg"
            alt="Leadway Holdings"
            className="h-9 w-9 shrink-0 overflow-hidden rounded-full object-cover object-left"
            draggable={false}
          />
          <div>
            <p className="text-sm font-bold tracking-tight text-primary">
              Leadway Quanta
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-dark-gray/45">
              Financial Analytics
            </p>
          </div>
          <div className="ml-3 hidden h-4 w-px bg-border lg:block" />
          <span className="hidden text-[10px] font-medium text-dark-gray/35 lg:block">
            Leadway Holdings Group
          </span>
        </div>

        {/* Desktop nav */}
        <ul className="hidden list-none items-center gap-8 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase()}`}
                className="text-sm font-medium text-dark-gray/55 no-underline transition-colors hover:text-dark-gray"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={onEnter}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-mid-red"
            style={{ boxShadow: "0 2px 12px rgba(247,148,29,0.22)" }}
          >
            Access Platform
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-dark-gray/60 lg:hidden"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-5 pb-5 pt-4 lg:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-dark-gray/65 no-underline"
            >
              {l}
            </a>
          ))}
          <button
            onClick={onEnter}
            className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
          >
            Access Platform →
          </button>
        </div>
      )}
    </header>
  );
};

/* ── Hero ────────────────────────────────────────────────────── */
const HeroSection = ({ onEnter }: { onEnter: () => void }) => {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      id="hero"
      className="relative overflow-hidden pt-16"
      style={{
        background:
          "linear-gradient(135deg, #08081A 0%, #110407 55%, #06080F 100%)",
      }}
    >
      {/* Fine grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Red glow — top-left */}
      <div
        className="pointer-events-none absolute -top-60 -left-60 h-[700px] w-[700px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, #F7941D, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      {/* Deep-blue glow — bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, #1E3A5F, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.12,
        }}
      />
      {/* Financial chart SVG decoration */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        {[35, 55, 45, 70, 60, 80, 65, 90, 75, 55, 85, 70, 95, 60, 80, 72, 88, 65, 78, 92].map(
          (h, i) => (
            <rect
              key={i}
              x={920 + i * 26}
              y={320 - h}
              width={10}
              height={h}
              rx={1.5}
              fill="#F7941D"
              opacity={0.04 + i * 0.007}
            />
          ),
        )}
        <path
          d="M860 520 C940 490 1000 440 1100 415 C1180 394 1240 360 1340 330 C1390 315 1420 303 1440 293"
          stroke="#F7941D"
          strokeWidth="1.5"
          opacity="0.22"
        />
        <path
          d="M0 600 C140 578 280 558 440 528 C580 500 700 472 860 448 C980 428 1100 408 1280 382 C1360 368 1400 358 1440 348"
          stroke="#FFFFFF"
          strokeWidth="1"
          opacity="0.06"
        />
        <line x1="860" y1="310" x2="1440" y2="310" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.07" />
        <line x1="860" y1="380" x2="1440" y2="380" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.05" />
        <line x1="860" y1="450" x2="1440" y2="450" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.03" />
      </svg>

      <div className="relative mx-auto max-w-[1440px] px-4 py-20 lg:px-6 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left */}
          <div
            className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {/* Eyebrow */}
            <div
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-4 py-1.5"
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-semibold tracking-wide text-white/80">
                Leadway Holdings Group · Analytics Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-5 text-4xl font-bold leading-[1.08] tracking-tight text-white lg:text-5xl xl:text-[3.5rem]">
              One platform for
              <br />
              <span className="text-primary">every investment</span>
              <br />
              decision.
            </h1>

            {/* Sub */}
            <p className="mb-8 max-w-lg text-base leading-relaxed text-white/60">
              Nine integrated modules{" "}
              <strong className="font-semibold text-white/85">
                Portfolio Management
              </strong>
              ,{" "}
              <strong className="font-semibold text-white/85">
                Valuation
              </strong>
              ,{" "}
              <strong className="font-semibold text-white/85">
                Deal Capture &amp; Workflow
              </strong>
              , Performance Analytics, Duration &amp; Risk, Market
              Data, Accounting, and Reporting — unified in a single audit-ready
              platform built for NAICOM and CBN compliance.
            </p>

            {/* CTAs */}
            <div className="mb-10 flex flex-wrap gap-3">
              <button
                onClick={onEnter}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-mid-red"
                style={{ boxShadow: "0 4px 24px rgba(247,148,29,0.4)" }}
              >
                Access Platform
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <a
                href="#modules"
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white/80 no-underline transition-all hover:text-white"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(10px)",
                }}
              >
                Explore Modules
              </a>
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                {
                  icon: <Shield className="h-3.5 w-3.5" />,
                  text: "CBN Compliant",
                },
                {
                  icon: <FileText className="h-3.5 w-3.5" />,
                  text: "Workflow Enabled",
                },
                {
                  icon: <Check className="h-3.5 w-3.5" />,
                  text: "Audit-Trail Enabled",
                },
                {
                  icon: <TrendingUp className="h-3.5 w-3.5" />,
                  text: "Real-Time Analytics",
                },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-xs font-medium text-white/45"
                >
                  <span className="text-primary">{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — mockup */}
          <div
            className={`flex justify-center transition-all duration-700 delay-200 lg:justify-end ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <PlatformMockup />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into white */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to bottom, transparent, white)" }}
      />
    </section>
  );
};

/* ── Nine Modules ──────────────────────────────────────────── */
const MODULES = [
  {
    id: "portfolio",
    number: "01",
    icon: <BarChart2 className="h-6 w-6" />,
    title: "Portfolio Management",
    subtitle: "Real-time investment portfolio analytics & monitoring",
    description:
      "Gain complete visibility into the Leadway Holdings investment portfolio. Monitor security performance, track allocations, analyse concentration risk, and generate executive-level portfolio reports all in real time.",
    capabilities: [
      "Securities ingestion & classification",
      "Concentration & sector analysis",
      "Allocation targets & limit monitoring",
      "Portfolio trend reporting",
      "Maturity & redemption tracking",
    ],
    accent: "#F7941D",
    bg: "#FFF7ED",
  },
  {
    id: "deal-capture",
    number: "02",
    icon: <ArrowLeftRight className="h-6 w-6" />,
    title: "Deal Capture & Trade Management",
    subtitle: "End-to-end trade lifecycle & settlement workflow",
    description:
      "Capture, validate, and manage the full lifecycle of investment trades from order entry and counterparty confirmation through settlement and post-trade reconciliation with real-time blotter and STP support.",
    capabilities: [
      "Order entry & pre-trade validation",
      "Counterparty & broker management",
      "Settlement & custodian reconciliation",
      "Real-time trade blotter",
      "Corporate actions processing",
    ],
    accent: "#E07B12",
    bg: "#FFF1E0",
  },
  {
    id: "market-data",
    number: "03",
    icon: <Activity className="h-6 w-6" />,
    title: "Market Data & Trend Analytics",
    subtitle: "Live prices, yields, indices & macro signals",
    description:
      "Aggregate and normalise market data across asset classes government bonds, equities, FX, and money market rates and overlay macro-economic trend signals to inform investment decisions.",
    capabilities: [
      "Government bond yield curve construction",
      "Equity price & index feeds",
      "FX rates & money market benchmarks",
      "Macro-economic signal overlays",
      "Historical trend analytics",
    ],
    accent: "#1A6B8A",
    bg: "#EFF7FA",
  },
  {
    id: "valuation",
    number: "04",
    icon: <LineChart className="h-6 w-6" />,
    title: "Valuation Engine",
    subtitle: "Fair value & investment instrument valuation",
    description:
      "Compute fair values across Leadway Holdings' investment portfolio bonds, equities, mutual funds and money market instruments using industry-standard models. Supports IFRS 13 disclosures and mark-to-market reporting.",
    capabilities: [
      "Discounted cash flow (DCF) engine",
      "Yield curve & benchmark rate feeds",
      "IFRS 13 fair value hierarchy",
      "Investment securities valuation",
      "Mark-to-market & mark-to-model",
    ],
    accent: "#9A3412",
    bg: "#FBEEE6",
  },
  {
    id: "workflow",
    number: "05",
    icon: <Calculator className="h-6 w-6" />,
    title: "Workflow & Maker-Checker",
    subtitle: "Multi-role approval workflow from deal origination to settlement",
    description:
      "Every investment transaction passes through a configurable multi-role approval workflow. Deal originators, checkers, CRO, and CFO each play a defined role — with mandatory sign-off gates, SLA tracking, and an immutable audit trail at every step.",
    capabilities: [
      "Deal origination to settlement pipeline",
      "Configurable maker-checker approval gates",
      "SLA countdown and escalation alerts",
      "Investment limit enforcement at origination",
      "Immutable audit trail with role attribution",
    ],
    accent: "#C2410C",
    bg: "#FBEFE6",
  },
  {
    id: "performance",
    number: "06",
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Return & Performance Analytics",
    subtitle: "Attribution, benchmarking & return decomposition",
    description:
      "Measure and decompose investment returns at fund, asset class, and security level. Run attribution analysis against benchmarks and generate GIPS-aligned performance reports for the investment committee.",
    capabilities: [
      "Time-weighted & money-weighted returns",
      "Attribution analysis by asset class",
      "Benchmark comparison & tracking error",
      "GIPS-aligned performance reporting",
      "Historical performance trend charts",
    ],
    accent: "#1A7A4A",
    bg: "#EFF8F3",
  },
  {
    id: "duration-risk",
    number: "07",
    icon: <Shield className="h-6 w-6" />,
    title: "Duration & Risk Analytics",
    subtitle: "Interest rate sensitivity, VaR & stress testing",
    description:
      "Quantify and manage portfolio risk exposures — duration, convexity, value-at-risk, and credit spread sensitivity and run stress scenarios across interest rate and FX shock assumptions.",
    capabilities: [
      "Modified duration & convexity analytics",
      "DV01 & PV01 sensitivity measures",
      "Value-at-Risk (VaR) computation",
      "Stress testing & scenario analysis",
      "Credit spread & FX risk exposure",
    ],
    accent: "#3A3A6A",
    bg: "#F0F0F8",
  },
  {
    id: "accounting",
    number: "08",
    icon: <FileText className="h-6 w-6" />,
    title: "Accounting & GL Integration",
    subtitle: "Automated journal entries & general ledger sync",
    description:
      "Generate IFRS-compliant accounting entries for all investment transactions purchases, disposals, accruals, fair value adjustments, and impairment charges and sync directly to the general ledger.",
    capabilities: [
      "IFRS-compliant journal entry generation",
      "Fair value & amortised cost accounting",
      "Impairment charge posting",
      "Accrued income & amortisation schedules",
      "GL system integration & reconciliation",
    ],
    accent: "#7A5A1A",
    bg: "#FAF5EF",
  },
  {
    id: "reporting",
    number: "09",
    icon: <PieChart className="h-6 w-6" />,
    title: "Reporting & Dashboard",
    subtitle: "Board, ALCO & regulatory reporting suite",
    description:
      "Generate Investment Committee packs, ALCO reports, CBN/SEC regulatory submissions, and interactive management dashboards all from a single reporting hub with scheduled distribution.",
    capabilities: [
      "Investment Committee report packs",
      "ALCO & board-level dashboards",
      "CBN / SEC regulatory submissions",
      "Scheduled report distribution",
      "Cross-module consolidated analytics",
    ],
    accent: "#4A4A8A",
    bg: "#F0F0F8",
  },
];

const ModulesSection = () => {
  const { ref, inView } = useInView();
  return (
    <section id="modules" ref={ref} className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        {/* Header */}
        <div
          className={`mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-pale-red px-3.5 py-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Platform Modules
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-dark-gray lg:text-4xl">
            Nine integrated modules.
            <br />
            One platform.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-dark-gray/58">
            Each module is purpose-built for a distinct investment management
            workflow, yet seamlessly integrated data flows across modules
            without manual intervention.
          </p>
        </div>

        {/* Module cards */}
        <div className="space-y-6">
          {MODULES.map((m, i) => (
            <div
              key={m.id}
              className={`overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all duration-700 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
                {/* Left pane */}
                <div
                  className="flex flex-col justify-between p-8 lg:p-10"
                  style={{ background: m.bg }}
                >
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ background: m.accent }}
                      >
                        {m.icon}
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-dark-gray">
                      {m.title}
                    </h3>
                    <p
                      className="mb-4 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: m.accent }}
                    >
                      {m.subtitle}
                    </p>
                    <p className="text-sm leading-relaxed text-dark-gray/60">
                      {m.description}
                    </p>
                  </div>
                </div>

                {/* Right pane — capabilities */}
                <div className="flex flex-col justify-center border-t border-border p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-dark-gray/35">
                    Key capabilities
                  </p>
                  <ul className="space-y-3">
                    {m.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: m.bg }}
                        >
                          <Check
                            className="h-3 w-3"
                            style={{ color: m.accent }}
                          />
                        </span>
                        <span className="text-sm text-dark-gray/70">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── Capabilities Strip ─────────────────────────────────────── */
const CAPABILITIES = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "CBN Compliance",
    desc: "Outputs aligned to CBN and NAICOM supervisory guidelines and regulatory filing formats.",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Real-Time Analytics",
    desc: "Live portfolio dashboards with instant refresh on data ingestion or model re-run.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Audit Trail",
    desc: "Complete, immutable record of every calculation run, override, and data change.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Data Integration",
    desc: "Direct connectors to core banking systems, data warehouses, and Excel upload workflows.",
  },
  {
    icon: <PieChart className="h-5 w-5" />,
    title: "Board Reporting",
    desc: "Auto-generated board-level and ALCO reports in regulatory-compliant templates.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Limit Enforcement",
    desc: "Investment limits enforced at deal origination — NAICOM and CBN concentration rules built in.",
  },
];

const CapabilitiesSection = () => {
  const { ref, inView } = useInView();
  return (
    <section
      id="capabilities"
      ref={ref}
      className="py-24 lg:py-32"
      style={{ background: "#F7F7F8" }}
    >
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div
          className={`mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3.5 py-1.5">
            <Settings className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Platform Capabilities
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-dark-gray lg:text-4xl">
            Built for enterprise-grade financial work
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-dark-gray/58">
            Every capability has been designed around the operational and
            regulatory realities of a Nigerian financial services group.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <div
              key={c.title}
              className={`rounded-2xl border border-border bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-700 hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(247,148,29,0.07)] ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${(i % 3) * 100}ms` }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-pale-red text-primary">
                {c.icon}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-dark-gray">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-dark-gray/55">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── Stats Banner ───────────────────────────────────────────── */
const StatsBanner = () => {
  const { ref, inView } = useInView();
  const stats = [
    {
      value: "9",
      label: "Integrated modules",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      value: "IFRS 13",
      label: "Fair value hierarchy",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      value: "CBN",
      label: "Compliant outputs",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      value: "100%",
      label: "Audit-trail coverage",
      icon: <Activity className="h-5 w-5" />,
    },
  ];
  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-20"
      style={{
        background:
          "linear-gradient(135deg, #F7941D 0%, #C2410C 55%, #9A3412 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-3 text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                {s.icon}
              </div>
              <p className="text-4xl font-black tracking-tight text-white lg:text-5xl">
                {s.value}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.62)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── Compliance Section ─────────────────────────────────────── */
const ComplianceSection = () => {
  const { ref, inView } = useInView();
  const items = [
    {
      label: "IFRS 13 Fair Value Hierarchy",
      desc: "L1/L2/L3 fair value classification and measurement for all investment securities.",
    },
    {
      label: "NAICOM / CBN Investment Guidelines",
      desc: "Concentration limits, single-issuer caps, and eligible asset classes enforced at source.",
    },
    {
      label: "IFRS 13 Fair Value",
      desc: "Level 1–3 hierarchy disclosures for valuation outputs.",
    },
    {
      label: "SEC Nigeria Reporting",
      desc: "Investment securities and fund valuation statements.",
    },
    {
      label: "Full Audit Trail",
      desc: "Every run, override, and data change is logged and traceable.",
    },
    {
      label: "Role-Based Access",
      desc: "Granular permission model aligned to segregation of duties.",
    },
  ];
  return (
    <section id="compliance" ref={ref} className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div
            className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-pale-red px-3.5 py-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Regulatory Compliance
              </span>
            </div>
            <h2 className="mb-5 text-3xl font-bold tracking-tight text-dark-gray lg:text-4xl">
              Engineered to meet every
              <br />
              regulatory obligation.
            </h2>
            <p className="mb-8 text-base leading-relaxed text-dark-gray/58">
              From CBN supervisory guidelines to IFRS standards, Leadway Quanta
              was designed with the regulatory framework baked in not bolted on.
            </p>
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
                alt="Financial analytics in action"
                className="h-48 w-full object-cover"
                loading="lazy"
              />
              <div className="bg-surface-muted px-5 py-4">
                <p className="text-xs leading-relaxed text-dark-gray/55">
                  Every transaction is fully traceable from deal origination
                  through valuation and approval to settlement — with a complete,
                  immutable audit record.
                </p>
              </div>
            </div>
          </div>

          {/* Right — compliance items */}
          <div
            className={`transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="space-y-3">
              {items.map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 rounded-xl border border-border bg-surface-muted p-5 transition-all hover:border-primary/20"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pale-red">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-dark-gray">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-dark-gray/50">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── CTA ────────────────────────────────────────────────────── */
const CTASection = ({ onEnter }: { onEnter: () => void }) => {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      className="py-24 lg:py-32"
      style={{ background: "#F7F7F8" }}
    >
      <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
        <div
          className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="overflow-hidden rounded-3xl border border-border bg-white px-10 py-16 shadow-[0_8px_40px_rgba(0,0,0,0.07)] sm:px-16">
            {/* Top accent */}
            <div className="mx-auto mb-8 h-1 w-16 rounded-full bg-primary" />

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-pale-red px-3.5 py-1.5">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Ready to get started?
              </span>
            </div>

            <h2 className="mb-4 text-3xl font-bold tracking-tight text-dark-gray sm:text-4xl">
              Your financial platform is ready.
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-dark-gray/58">
              Access Portfolio Management, Deal Capture & Workflow, and
              Valuation tools integrated in one secure, audit-ready environment.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={onEnter}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-mid-red"
                style={{ boxShadow: "0 4px 20px rgba(247,148,29,0.28)" }}
              >
                Access Platform
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>

            <p className="mt-8 text-xs text-dark-gray/35">
              Leadway Holdings Group · Confidential
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Footer ─────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="border-t border-border bg-white">
    <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-6">
      <div className="grid gap-10 lg:grid-cols-4">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2.5">
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
          <p className="text-xs leading-relaxed text-dark-gray/45">
            Enterprise financial analytics platform for the Leadway Holdings
            Group. Portfolio management, deal workflow, and valuation in one
            integrated environment.
          </p>
        </div>

        {/* Links */}
        {(
          [
            [
              "Platform",
              [
                "Portfolio Module",
                "Workflow Module",
                "Valuation Engine",
                "Reporting",
              ],
            ],
            [
              "Compliance",
              ["CBN Guidelines", "NAICOM Rules", "IFRS 13", "Audit Trail"],
            ],
            [
              "Organisation",
              [
                "Leadway Holdings Group",
                "About Deloitte",
                "Contact Support",
                "Documentation",
              ],
            ],
          ] as [string, string[]][]
        ).map(([group, links]) => (
          <div key={group}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-dark-gray/50">
              {group}
            </p>
            <ul className="list-none space-y-2.5 p-0">
              {links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-xs text-dark-gray/45 no-underline transition-colors hover:text-dark-gray"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <p className="text-xs text-dark-gray/35">
          © {new Date().getFullYear()} Leadway Holdings Group. All rights
          reserved. For internal use only.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-1.5">
          <Building2 className="h-3.5 w-3.5 text-dark-gray/35" />
          <span className="text-xs text-dark-gray/40">Built by</span>
          <span className="text-xs font-bold text-dark-gray/65">Deloitte</span>
        </div>
      </div>
    </div>
  </footer>
);

/* ── Leadway Ecosystem Strip ──────────────────────────────────── */
const LeadwayEcosystemSection = () => {
  const entities = [
    "Leadway Assurance",
    "Leadway Pensure PFA",
    "Leadway Health",
    "Leadway Capital & Trusts",
    "Leadway Asset Management",
    "Leadway Properties",
    "Leadway Holdings",
  ];
  return (
    <div className="border-b border-t border-border bg-white py-8">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-widest text-dark-gray/30">
          Serving the Leadway Holdings Group family of companies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
          {entities.map((e) => (
            <span
              key={e}
              className="text-sm font-semibold text-dark-gray/35 transition-colors hover:text-dark-gray/65"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── City Banner ────────────────────────────────────────────── */
const CityBanner = () => (
  <div className="relative h-56 overflow-hidden lg:h-72">
    <img
      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80"
      alt="Modern financial district"
      className="h-full w-full object-cover"
      loading="lazy"
    />
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(247,148,29,0.90) 0%, rgba(154,52,18,0.84) 100%)",
      }}
    >
      <p className="max-w-2xl text-xl font-bold leading-snug text-white lg:text-2xl">
        Institutional-grade investment intelligence for Africa's most ambitious
        conglomerate.
      </p>
      <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        Leadway Holdings Group · Lagos, Nigeria
      </p>
    </div>
  </div>
);

/* ── Main Export ─────────────────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  const onEnterShowcase = () => navigate("/login");
  return (
    <div className="min-h-screen bg-white font-sans text-dark-gray antialiased">
      <Navbar onEnter={onEnterShowcase} />
      <HeroSection onEnter={onEnterShowcase} />
      <LeadwayEcosystemSection />
      <CityBanner />
      <ModulesSection />
      <CapabilitiesSection />
      <StatsBanner />
      <ComplianceSection />
      <CTASection onEnter={onEnterShowcase} />
      <Footer />
    </div>
  );
}
