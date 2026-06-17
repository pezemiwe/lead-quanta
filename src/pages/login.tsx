import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePersona } from "../context/persona";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Lock,
  Mail,
  User,
  ChevronDown,
  Shield,
} from "lucide-react";

/* ── Personas ────────────────────────────────────────────────── */
const PERSONAS = [
  {
    name: "Amaka Osei",
    role: "Chief Financial Officer",
    avatar: "AO",
    email: "a.osei@leadwayholdings.com",
    password: "CFO#Leadway2026",
    access: "Full platform access",
  },
  {
    name: "Emeka Nwosu",
    role: "Chief Risk Officer",
    avatar: "EN",
    email: "e.nwosu@leadwayholdings.com",
    password: "CRO#Leadway2026",
    access: "Risk & IFRS 9 modules",
  },
  {
    name: "Fatima Aliyu",
    role: "Portfolio Analyst",
    avatar: "FA",
    email: "f.aliyu@leadwayholdings.com",
    password: "Port#Leadway2026",
    access: "Portfolio Management",
  },
  {
    name: "Chidi Okafor",
    role: "Risk Manager",
    avatar: "CO",
    email: "c.okafor@leadwayholdings.com",
    password: "Risk#Leadway2026",
    access: "IFRS 9 & Valuation",
  },
  {
    name: "Ngozi Adeyemi",
    role: "Compliance Officer",
    avatar: "NA",
    email: "n.adeyemi@leadwayholdings.com",
    password: "Comp#Leadway2026",
    access: "Compliance & Audit",
  },
  {
    name: "Tunde Bello",
    role: "Internal Auditor",
    avatar: "TB",
    email: "t.bello@leadwayholdings.com",
    password: "Audit#Leadway2026",
    access: "Read-only audit trail",
  },
  {
    name: "Seun Adesanya",
    role: "System Admin",
    avatar: "SA",
    email: "s.adesanya@leadwayholdings.com",
    password: "SysAdmin#Leadway2026",
    access: "Governance & Controls",
  },
];

/* ── Login Page ──────────────────────────────────────────────── */
export function LoginPage() {
  const { setPersona } = usePersona();
  const navigate = useNavigate();
  const onLogin = (p: { name: string; role: string; avatar: string }) => {
    setPersona(p);
    navigate("/modules");
  };
  const onBack = () => navigate("/");
  const [selectedPersona, setSelectedPersona] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePersonaChange = (value: string) => {
    setSelectedPersona(value);
    setError("");
    const p = PERSONAS.find((p) => p.role === value);
    if (p) {
      setEmail(p.email);
      setPassword(p.password);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    // Simulate auth handshake
    setTimeout(() => {
      setLoading(false);
      const p = PERSONAS.find((p) => p.role === selectedPersona);
      onLogin(
        p
          ? { name: p.name, role: p.role, avatar: p.avatar }
          : {
              name: email.split("@")[0],
              role: "User",
              avatar: email[0]?.toUpperCase() ?? "U",
            },
      );
    }, 1400);
  };

  const activePersona = PERSONAS.find((p) => p.role === selectedPersona);

  return (
    <div className="flex min-h-screen font-sans antialiased">
      {/* ── Left panel (image + brand) ────────────────────────── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[58%]">
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
          alt="Financial district"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(150deg, rgba(247,148,29,0.92) 0%, rgba(154,52,18,0.95) 100%)",
          }}
        />
        {/* Dot pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
              <img
                src="/lead-logo.jpg"
                alt="Leadway Holdings"
                className="h-full w-full object-cover object-left"
                draggable={false}
              />
            </div>
            <div>
              <p className="text-base font-bold text-white">Leadway Quanta</p>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Financial Analytics
              </p>
            </div>
          </div>

          {/* Core message */}
          <div className="max-w-md">
            <p
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Leadway Holdings Group
            </p>
            <h2 className="mb-5 text-3xl font-bold leading-snug text-white xl:text-4xl">
              Precision analytics for Africa's most ambitious financial group.
            </h2>
            <p
              className="mb-10 text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.58)" }}
            >
              Portfolio management, IFRS 9 & ECL computation, and fair-value
              valuation unified in one audit-ready platform.
            </p>

            <div className="space-y-3.5">
              {[
                "Real-time investment portfolio analytics & staging",
                "Automated IFRS 9 expected credit loss",
                "IFRS 13 fair-value valuation engine",
                "CBN regulatory reporting & audit trail",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.72)" }}
                  >
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom disclaimer */}
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>
              Authorised users only · Leadway Holdings Group · Confidential
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ───────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-8 sm:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-dark-gray/50 transition-colors hover:text-dark-gray"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {/* Logo (mobile only) */}
          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/lead-logo.jpg"
              alt="Leadway Holdings"
              className="h-7 w-7 shrink-0 overflow-hidden rounded-full object-cover object-left"
              draggable={false}
            />
            <span className="text-sm font-bold text-primary">Leadway Quanta</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-xs font-medium text-dark-gray/45">
              Secure login
            </span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
          <div className="w-full max-w-100">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="mb-1.5 text-2xl font-bold text-dark-gray">
                Welcome back
              </h1>
              <p className="text-sm text-dark-gray/50">
                Sign in to access the Leadway Quanta platform
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Persona selector */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-dark-gray/45">
                  Quick access — select persona
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
                  <select
                    value={selectedPersona}
                    onChange={(e) => handlePersonaChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-surface-muted py-3 pl-10 pr-10 text-sm text-dark-gray outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="">— Select a user persona —</option>
                    {PERSONAS.map((p) => (
                      <option key={p.role} value={p.role}>
                        {p.name} · {p.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
                </div>

                {/* Active persona access badge */}
                {activePersona && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/15 bg-pale-red px-3 py-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{ background: "#F7941D" }}
                    >
                      {activePersona.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-dark-gray">
                        {activePersona.name}
                      </p>
                      <p className="truncate text-[10px] text-primary">
                        {activePersona.access}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-[11px] font-medium text-dark-gray/30">
                  or enter credentials
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-dark-gray/45"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@leadwayholdings.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-dark-gray placeholder:text-dark-gray/30 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-wider text-dark-gray/45"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-primary hover:text-mid-red"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-11 text-sm text-dark-gray placeholder:text-dark-gray/30 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-gray/35 hover:text-dark-gray/65"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-lg border border-danger/20 bg-red-50 px-4 py-2.5 text-xs font-medium text-danger">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-70"
                style={{
                  background: loading
                    ? "#F7941D"
                    : "linear-gradient(135deg, #F7941D 0%, #C2410C 100%)",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(247,148,29,0.30)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-8 text-center text-[11px] text-dark-gray/30">
              Leadway Holdings Group · Confidential · Authorised users only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
