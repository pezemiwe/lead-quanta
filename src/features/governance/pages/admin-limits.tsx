import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Info,
  Lock,
  Save,
  Shield,
  Sliders,
  X,
} from "lucide-react";
import { Modal } from "../../../components/shared/modal";
import { usePersona } from "../../../context/persona";

// ── Types ────────────────────────────────────────────────────────────────────

interface CounterpartyLimit {
  id: string;
  name: string;
  sector: string;
  rating: string;
  limitNGN: number; // bn
  utilizationPct: number;
}

interface ConcentrationLimit {
  id: string;
  assetClass: string;
  entity: string;
  maxPct: number;
  currentPct: number;
  regRef: string;
}

interface TenorLimit {
  id: string;
  assetClass: string;
  maxYears: number;
  regRef: string;
}

interface EditTarget {
  type: "counterparty" | "concentration" | "tenor";
  id: string;
  fieldLabel: string;
  currentValue: number;
  unit: string;
  min: number;
  max: number;
  regRef?: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const INIT_CP_LIMITS: CounterpartyLimit[] = [
  { id: "cp001", name: "Zenith Bank Plc", sector: "Banking", rating: "AA", limitNGN: 15, utilizationPct: 68 },
  { id: "cp002", name: "Access Bank Plc", sector: "Banking", rating: "AA-", limitNGN: 12, utilizationPct: 54 },
  { id: "cp003", name: "United Bank for Africa Plc", sector: "Banking", rating: "AA-", limitNGN: 12, utilizationPct: 41 },
  { id: "cp004", name: "Guaranty Trust Holding Co.", sector: "Banking", rating: "AAA", limitNGN: 18, utilizationPct: 72 },
  { id: "cp005", name: "FBN Holdings Plc", sector: "Banking", rating: "A+", limitNGN: 10, utilizationPct: 89 },
  { id: "cp006", name: "Stanbic IBTC Holdings", sector: "Banking", rating: "AA", limitNGN: 10, utilizationPct: 33 },
  { id: "cp007", name: "Dangote Industries Ltd", sector: "Conglomerate", rating: "A+", limitNGN: 8, utilizationPct: 61 },
  { id: "cp008", name: "MTN Nigeria Comms Plc", sector: "Telecoms", rating: "A", limitNGN: 6, utilizationPct: 47 },
  { id: "cp009", name: "Nigerian Breweries Plc", sector: "FMCG", rating: "A-", limitNGN: 5, utilizationPct: 22 },
  { id: "cp010", name: "Federal Government of Nigeria", sector: "Sovereign", rating: "B+", limitNGN: 300, utilizationPct: 62 },
  { id: "cp011", name: "FCMB Group Plc", sector: "Banking", rating: "A", limitNGN: 8, utilizationPct: 35 },
  { id: "cp012", name: "Seplat Energy Plc", sector: "Oil & Gas", rating: "BB+", limitNGN: 3, utilizationPct: 70 },
  { id: "cp013", name: "Lafarge Africa Plc", sector: "Industrials", rating: "BBB", limitNGN: 4, utilizationPct: 28 },
  { id: "cp014", name: "Flour Mills of Nigeria Plc", sector: "FMCG", rating: "BBB+", limitNGN: 4, utilizationPct: 18 },
];

const INIT_CONC: ConcentrationLimit[] = [
  { id: "c1", assetClass: "FGN Bonds", entity: "LACL", maxPct: 80, currentPct: 62.4, regRef: "NAICOM §7.1(a)" },
  { id: "c2", assetClass: "FGN Bonds", entity: "LPFA", maxPct: 70, currentPct: 58.1, regRef: "PENCOM Reg. 10" },
  { id: "c3", assetClass: "Equities", entity: "LACL", maxPct: 25, currentPct: 14.3, regRef: "NAICOM §7.1(d)" },
  { id: "c4", assetClass: "Equities", entity: "LPFA", maxPct: 25, currentPct: 11.7, regRef: "PENCOM Reg. 10" },
  { id: "c5", assetClass: "Money Market", entity: "LACL", maxPct: 40, currentPct: 12.8, regRef: "NAICOM §7.1(b)" },
  { id: "c6", assetClass: "Money Market", entity: "LPFA", maxPct: 35, currentPct: 19.4, regRef: "PENCOM Reg. 10" },
  { id: "c7", assetClass: "Alternatives", entity: "LACL", maxPct: 10, currentPct: 3.2, regRef: "NAICOM §7.1(e)" },
  { id: "c8", assetClass: "Alternatives", entity: "LPFA", maxPct: 5, currentPct: 2.1, regRef: "PENCOM Reg. 10" },
  { id: "c9", assetClass: "Real Estate", entity: "LACL", maxPct: 25, currentPct: 6.9, regRef: "NAICOM §7.1(c)" },
  { id: "c10", assetClass: "Real Estate", entity: "LPFA", maxPct: 10, currentPct: 4.1, regRef: "PENCOM Reg. 10" },
];

const INIT_TENOR: TenorLimit[] = [
  { id: "t1", assetClass: "Fixed Deposits", maxYears: 2, regRef: "IPS §8.1" },
  { id: "t2", assetClass: "Commercial Paper", maxYears: 1, regRef: "IPS §8.2" },
  { id: "t3", assetClass: "Corporate Bonds", maxYears: 15, regRef: "IPS §8.3" },
  { id: "t4", assetClass: "FGN Bonds", maxYears: 30, regRef: "IPS §8.3" },
  { id: "t5", assetClass: "Equities", maxYears: 99, regRef: "N/A" },
  { id: "t6", assetClass: "Mutual Funds", maxYears: 99, regRef: "N/A" },
  { id: "t7", assetClass: "Alternatives", maxYears: 10, regRef: "NAICOM §9.4" },
];

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditLimitModal({
  target,
  onClose,
  onSave,
}: {
  target: EditTarget;
  onClose: () => void;
  onSave: (newValue: number) => void;
}) {
  const [value, setValue] = useState(target.currentValue.toString());
  const [reason, setReason] = useState("");
  const numeric = parseFloat(value);
  const valid = !isNaN(numeric) && numeric >= target.min && numeric <= target.max && reason.length > 10;

  return (
    <Modal isOpen title="Edit Risk Limit" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Limit changes are applied immediately and logged in the audit trail. Changes to regulatory limits may require ALCO approval.
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">Parameter</p>
          <p className="text-sm font-semibold text-dark-gray">{target.fieldLabel}</p>
          {target.regRef && (
            <p className="text-xs text-gray-400 mt-0.5">Reference: {target.regRef}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">
            New value ({target.unit}) — min {target.min}, max {target.max}
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              value={value}
              min={target.min}
              max={target.max}
              step={target.unit === "%" ? 1 : 0.5}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <span className="text-sm text-gray-400">{target.unit}</span>
          </div>
          {!isNaN(numeric) && (numeric < target.min || numeric > target.max) && (
            <p className="text-xs text-danger mt-1">Value must be between {target.min} and {target.max} {target.unit}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">
            Change reason (required — will be logged to audit) <span className="text-danger">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g. ALCO approved increase at June 2026 meeting (minute ref AL-2026-06-04)..."
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
          />
          {reason.length > 0 && reason.length < 10 && (
            <p className="text-xs text-danger mt-1">Provide a meaningful reason (at least 10 chars)</p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => { onSave(numeric); onClose(); }}
            disabled={!valid}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Limit
          </button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Util bar ──────────────────────────────────────────────────────────────────

function UtilBar({ pct, limit }: { pct: number; limit: number }) {
  const ratio = pct / limit;
  const color = ratio >= 1 ? "bg-danger" : ratio >= 0.85 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (pct / limit) * 100)}%` }} />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${ratio >= 1 ? "text-danger" : ratio >= 0.85 ? "text-warning" : "text-gray-500"}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type Tab = "counterparty" | "concentration" | "tenor";

export function AdminLimits() {
  const { persona } = usePersona();
  const isAdmin =
    persona.role === "System Administrator" ||
    persona.role === "Head of Investments" ||
    persona.role === "Investment Committee / ALCO";

  const [tab, setTab] = useState<Tab>("counterparty");
  const [cpLimits, setCpLimits] = useState<CounterpartyLimit[]>(INIT_CP_LIMITS);
  const [concLimits, setConcLimits] = useState<ConcentrationLimit[]>(INIT_CONC);
  const [tenorLimits, setTenorLimits] = useState<TenorLimit[]>(INIT_TENOR);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saved, setSaved] = useState(false);

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function openCpEdit(cp: CounterpartyLimit) {
    setEditTarget({
      type: "counterparty",
      id: cp.id,
      fieldLabel: `Credit Limit — ${cp.name}`,
      currentValue: cp.limitNGN,
      unit: "₦B",
      min: 1,
      max: 500,
    });
  }

  function openConcEdit(c: ConcentrationLimit) {
    setEditTarget({
      type: "concentration",
      id: c.id,
      fieldLabel: `${c.assetClass} max concentration — ${c.entity}`,
      currentValue: c.maxPct,
      unit: "%",
      min: 1,
      max: 100,
      regRef: c.regRef,
    });
  }

  function openTenorEdit(t: TenorLimit) {
    setEditTarget({
      type: "tenor",
      id: t.id,
      fieldLabel: `Max tenor — ${t.assetClass}`,
      currentValue: t.maxYears,
      unit: "years",
      min: 0,
      max: 99,
      regRef: t.regRef,
    });
  }

  function handleSave(newValue: number) {
    if (!editTarget) return;
    if (editTarget.type === "counterparty") {
      setCpLimits((prev) => prev.map((cp) => cp.id === editTarget.id ? { ...cp, limitNGN: newValue } : cp));
    } else if (editTarget.type === "concentration") {
      setConcLimits((prev) => prev.map((c) => c.id === editTarget.id ? { ...c, maxPct: newValue } : c));
    } else {
      setTenorLimits((prev) => prev.map((t) => t.id === editTarget.id ? { ...t, maxYears: newValue } : t));
    }
    showSaved();
  }

  const cpBreaches = cpLimits.filter((c) => c.utilizationPct >= 100).length;
  const cpWarnings = cpLimits.filter((c) => c.utilizationPct >= 85 && c.utilizationPct < 100).length;
  const concBreaches = concLimits.filter((c) => c.currentPct >= c.maxPct).length;
  const concWarnings = concLimits.filter((c) => c.currentPct >= c.maxPct * 0.85 && c.currentPct < c.maxPct).length;

  const TAB_META: Record<Tab, { label: string; icon: React.ReactNode }> = {
    counterparty: { label: "Counterparty Limits", icon: <Shield className="h-4 w-4" /> },
    concentration: { label: "Concentration Limits", icon: <Sliders className="h-4 w-4" /> },
    tenor: { label: "Tenor Caps", icon: <Lock className="h-4 w-4" /> },
  };

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">System Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-dark-gray">Risk Limit Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure counterparty credit limits, asset class concentration limits, and tenor caps.
            All changes are audit-logged and require a stated reason.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Limit saved
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            You are viewing limit configurations in read-only mode. Contact your System Administrator or Head of Investments to request limit changes.
          </p>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Counterparty limits</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{cpLimits.length}</p>
          <p className="text-xs text-gray-400">active limits</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${cpBreaches > 0 ? "border-red-200 bg-red-50" : cpWarnings > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-surface"}`}>
          <p className="text-xs text-gray-400">Near / Over Limit</p>
          <p className={`mt-2 text-2xl font-bold ${cpBreaches > 0 ? "text-danger" : cpWarnings > 0 ? "text-warning" : "text-dark-gray"}`}>
            {cpBreaches} / {cpWarnings}
          </p>
          <p className="text-xs text-gray-400">breach / warning</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${concBreaches > 0 ? "border-red-200 bg-red-50" : concWarnings > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-surface"}`}>
          <p className="text-xs text-gray-400">Concentration</p>
          <p className={`mt-2 text-2xl font-bold ${concBreaches > 0 ? "text-danger" : concWarnings > 0 ? "text-warning" : "text-dark-gray"}`}>
            {concBreaches} / {concWarnings}
          </p>
          <p className="text-xs text-gray-400">breach / warning</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Tenor caps</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{tenorLimits.length}</p>
          <p className="text-xs text-gray-400">asset classes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(Object.entries(TAB_META) as [Tab, { label: string; icon: React.ReactNode }][]).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all ${tab === key ? "bg-white text-dark-gray shadow-sm" : "text-gray-500 hover:text-dark-gray"}`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Counterparty Limits */}
      {tab === "counterparty" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-dark-gray">Counterparty Credit Limits</p>
            <p className="text-xs text-gray-400">Single-name exposure caps per regulatory and IPS guidelines</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-gray-400">Counterparty</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden sm:table-cell">Sector</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden md:table-cell">Rating</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Limit (₦B)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 w-40">Utilisation</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cpLimits.map((cp) => (
                <tr key={cp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-dark-gray">{cp.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{cp.sector}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                      cp.rating.startsWith("A") || cp.rating.startsWith("B+")
                        ? "bg-green-100 text-green-700"
                        : cp.rating.startsWith("BB")
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {cp.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-dark-gray">₦{cp.limitNGN}B</td>
                  <td className="px-4 py-3 w-40">
                    <UtilBar pct={cp.utilizationPct} limit={100} />
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <button
                        onClick={() => openCpEdit(cp)}
                        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-gray-500 hover:text-primary hover:border-primary"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-gray-300" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Concentration Limits */}
      {tab === "concentration" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-dark-gray">Asset Class Concentration Limits</p>
            <p className="text-xs text-gray-400">Maximum portfolio weight per asset class per entity</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-gray-400">Asset Class</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden md:table-cell">Regulation</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Max %</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 w-40">Current / Limit</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {concLimits.map((c) => {
                const ratio = c.currentPct / c.maxPct;
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 ${ratio >= 1 ? "bg-red-50" : ratio >= 0.85 ? "bg-amber-50" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-dark-gray">{c.assetClass}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{c.entity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{c.regRef}</td>
                    <td className="px-4 py-3 font-bold text-dark-gray">{c.maxPct}%</td>
                    <td className="px-4 py-3 w-40">
                      <UtilBar pct={c.currentPct} limit={c.maxPct} />
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <button
                          onClick={() => openConcEdit(c)}
                          className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-gray-500 hover:text-primary hover:border-primary"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-gray-300" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tenor Limits */}
      {tab === "tenor" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-dark-gray">Tenor Caps by Asset Class</p>
            <p className="text-xs text-gray-400">Maximum remaining tenor allowed for new investments</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-gray-400">Asset Class</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden md:table-cell">Policy Reference</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Max Tenor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenorLimits.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-dark-gray">{t.assetClass}</td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{t.regRef}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 font-bold">
                      {t.maxYears === 99 ? "No cap" : `${t.maxYears} years`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <button
                        onClick={() => openTenorEdit(t)}
                        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-gray-500 hover:text-primary hover:border-primary"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-gray-300" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditLimitModal
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
