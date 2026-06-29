import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePersona } from "../context/persona";
import { isFrontOfficeTrader } from "../context/platform-personas";
import { Eye, EyeOff, ArrowLeft, Mail, User, ChevronDown } from "lucide-react";
import type { PersonaRole } from "../context/platform-personas";
import { PERSONA_HOME_QUEUES } from "../context/platform-personas";

const PERSONAS: {
  name: string;
  role: PersonaRole;
  avatar: string;
  email: string;
  password: string;
  access: string;
}[] = [
  {
    name: "Amina Yusuf",
    role: "Money Market Trader",
    avatar: "AY",
    email: "a.yusuf@leadwayholdings.com",
    password: "MM#Leadway2026",
    access: "Deal capture · Money market",
  },
  {
    name: "Tunde Bakare",
    role: "Fixed Income Trader",
    avatar: "TB",
    email: "t.bakare@leadwayholdings.com",
    password: "FI#Leadway2026",
    access: "Bonds · T-bills · CP",
  },
  {
    name: "Chioma Okonkwo",
    role: "Equity Trader",
    avatar: "CO",
    email: "c.okonkwo@leadwayholdings.com",
    password: "EQ#Leadway2026",
    access: "Listed equities & funds",
  },
  {
    name: "Ibrahim Musa",
    role: "Alternative Investment Officer",
    avatar: "IM",
    email: "i.musa@leadwayholdings.com",
    password: "Alt#Leadway2026",
    access: "PE · Real assets · Alts",
  },
  {
    name: "Ngozi Eze",
    role: "Portfolio Manager",
    avatar: "NE",
    email: "n.eze@leadwayholdings.com",
    password: "PM#Leadway2026",
    access: "Approve within mandate",
  },
  {
    name: "Dr. James Adeyemi",
    role: "Head of Investments",
    avatar: "JA",
    email: "j.adeyemi@leadwayholdings.com",
    password: "HoI#Leadway2026",
    access: "Executive approvals & exceptions",
  },
  {
    name: "Kemi Adebayo",
    role: "Middle Office",
    avatar: "KA",
    email: "k.adebayo@leadwayholdings.com",
    password: "MO#Leadway2026",
    access: "Control review · Pricing checks",
  },
  {
    name: "Emeka Nwosu",
    role: "Risk Management",
    avatar: "EN",
    email: "e.nwosu@leadwayholdings.com",
    password: "Risk#Leadway2026",
    access: "Risk review · Limits · Stress",
  },
  {
    name: "Fatima Bello",
    role: "Compliance",
    avatar: "FB",
    email: "f.bello@leadwayholdings.com",
    password: "Comp#Leadway2026",
    access: "Policy · Regulatory limits",
  },
  {
    name: "Yusuf Garba",
    role: "Back Office",
    avatar: "YG",
    email: "y.garba@leadwayholdings.com",
    password: "BO#Leadway2026",
    access: "Settlement · Register confirmation",
  },
  {
    name: "Amaka Osei",
    role: "Finance",
    avatar: "AO",
    email: "a.osei@leadwayholdings.com",
    password: "Fin#Leadway2026",
    access: "Accruals · GL posting",
  },
  {
    name: "Zainab Ali",
    role: "Treasury Cash Management",
    avatar: "ZA",
    email: "z.ali@leadwayholdings.com",
    password: "Treas#Leadway2026",
    access: "Liquidity · Cash calendar",
  },
  {
    name: "Prof. Okon Bassey",
    role: "Investment Committee / ALCO",
    avatar: "OB",
    email: "o.bassey@leadwayholdings.com",
    password: "ALCO#Leadway2026",
    access: "Committee approvals · ALCO pack",
  },
  {
    name: "Tunde Bello",
    role: "Internal Audit",
    avatar: "TB",
    email: "t.bello@leadwayholdings.com",
    password: "Audit#Leadway2026",
    access: "Read-only audit evidence",
  },
  {
    name: "Seun Adesanya",
    role: "System Administrator",
    avatar: "SA",
    email: "s.adesanya@leadwayholdings.com",
    password: "SysAdmin#Leadway2026",
    access: "Roles · Workflow config",
  },
];

export function LoginPage() {
  const { setPersona } = usePersona();
  const navigate = useNavigate();
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
    setTimeout(() => {
      setLoading(false);
      const p = PERSONAS.find((p) => p.role === selectedPersona);
      const role = p?.role ?? "Money Market Trader";
      setPersona(
        p
          ? { name: p.name, role: p.role, avatar: p.avatar }
          : { name: email.split("@")[0], role, avatar: "U" },
      );
      navigate(isFrontOfficeTrader(role) ? "/trader/dashboard" : "/modules");
    }, 800);
  };

  const activePersona = PERSONAS.find((p) => p.role === selectedPersona);
  const queues = activePersona ? PERSONA_HOME_QUEUES[activePersona.role] : [];

  return (
    <div className="flex min-h-screen font-sans antialiased">
      <div className="relative hidden overflow-hidden lg:flex lg:w-[58%]">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
          alt="Financial district"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(150deg, rgba(247,148,29,0.92) 0%, rgba(154,52,18,0.95) 100%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          <div>
            <p className="text-base font-bold text-white">Leadway Quanta</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Treasury &amp; Investment Management
            </p>
          </div>
          <div className="max-w-md">
            <h2 className="mb-5 text-3xl font-bold leading-snug text-white">
              Shared platform. <br />
              Persona-specific workflow paths.
            </h2>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 flex items-center gap-2 text-sm text-dark-gray/45 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-dark-gray">Sign in</h1>
        <p className="mt-1 text-sm text-dark-gray/55">
          Select a persona to explore role-based workflows.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-dark-gray/45">
              Persona
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
              <select
                value={selectedPersona}
                onChange={(e) => handlePersonaChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-primary"
              >
                <option value="">Select persona…</option>
                {PERSONAS.map((p) => (
                  <option key={p.role} value={p.role}>
                    {p.name} · {p.role}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
            </div>
            {activePersona && (
              <div className="mt-2 rounded-lg border border-primary/15 bg-pale-red px-3 py-2">
                <p className="text-xs font-semibold text-dark-gray">
                  {activePersona.name}
                </p>
                <p className="text-[10px] text-primary">
                  {activePersona.access}
                </p>
                <p className="mt-1 text-[10px] text-dark-gray/45">
                  Queues: {queues.join(" · ")}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-dark-gray/45">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-dark-gray/45">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border py-3 pl-4 pr-10 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-gray/35"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
