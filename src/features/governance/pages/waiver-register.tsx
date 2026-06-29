import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Modal } from "../../../components/shared/modal";
import { usePersona } from "../../../context/persona";

type WaiverStatus = "Active" | "Pending Approval" | "Expired" | "Revoked";
type WaiverCategory = "Investment Limits" | "Instrument Eligibility" | "Rating Threshold" | "Tenor Limit" | "Concentration Limit" | "Regulatory";

interface Waiver {
  id: string;
  category: WaiverCategory;
  rule: string;
  regulation: string;
  justification: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  expiryDate: string;
  status: WaiverStatus;
  instrument?: string;
  counterparty?: string;
  reviewNotes?: string;
  closedAt?: string;
}

const SEED_WAIVERS: Waiver[] = [
  {
    id: "WVR-2026-001",
    category: "Concentration Limit",
    rule: "Single Issuer Exposure > 10%",
    regulation: "NAICOM Prudential §7.2",
    justification: "FGN sovereign bonds are explicitly exempt from single-issuer concentration limits under NAICOM Guidelines 2022 §4.1(b). Current FGN exposure of 62.4% is driven by regulatory minimum requirement for government securities.",
    requestedBy: "Ngozi Adeyemi (Compliance)",
    requestedAt: "2026-03-01T09:00:00Z",
    approvedBy: "Bode Adeleye (CRO)",
    approvedAt: "2026-03-05T14:00:00Z",
    expiryDate: "2026-12-31",
    status: "Active",
    instrument: "All FGN Bonds",
    reviewNotes: "NAICOM exemption confirmed. Annual review required.",
  },
  {
    id: "WVR-2026-002",
    category: "Rating Threshold",
    rule: "Minimum Rating BBB — Sub-investment grade issuer",
    regulation: "Investment Policy Statement §5.3",
    justification: "Seplat Energy Plc CP exposure of ₦2.1B pre-dates the current rating policy. Position is held to maturity (Aug 2026). No new CP will be issued. Rollover instruction is Terminate.",
    requestedBy: "Amina Yusuf (MM Desk)",
    requestedAt: "2026-04-15T10:30:00Z",
    approvedBy: "Ngozi Eze (Head of Investments)",
    approvedAt: "2026-04-18T11:00:00Z",
    expiryDate: "2026-08-31",
    status: "Active",
    counterparty: "Seplat Energy Plc",
    instrument: "Seplat Energy CP 19% Aug 2026",
    reviewNotes: "Approved for hold-to-maturity. No rollover permitted.",
  },
  {
    id: "WVR-2026-003",
    category: "Tenor Limit",
    rule: "Maximum bond tenor 10 years",
    regulation: "LPFA Investment Guidelines §8.1",
    justification: "Pension fund ALM strategy requires duration extension to match long-dated annuity liabilities. FGN 2042 bond (16-year tenor) is required to close duration gap of +4.2 years identified in the Feb 2026 ALCO review.",
    requestedBy: "Tunde Bakare (FI Desk)",
    requestedAt: "2026-05-10T08:00:00Z",
    approvedBy: null,
    approvedAt: null,
    expiryDate: "2026-12-31",
    status: "Pending Approval",
    instrument: "FGN 16.25% 2042",
    reviewNotes: "",
  },
  {
    id: "WVR-2026-004",
    category: "Instrument Eligibility",
    rule: "Alternative investments require ALCO pre-approval",
    regulation: "Investment Policy Statement §9.4",
    justification: "Infrastructure fund co-investment opportunity in Lekki Port project. IRR 19.5%, 7-year tenor. Risk committee reviewed. Board approved in principle at March 2026 meeting.",
    requestedBy: "Emeka Okafor (Alternatives)",
    requestedAt: "2026-04-01T10:00:00Z",
    approvedBy: "Investment Committee",
    approvedAt: "2026-04-20T16:00:00Z",
    expiryDate: "2026-09-30",
    status: "Active",
    instrument: "Lekki Port Infrastructure Fund",
    reviewNotes: "Board approved at 15 March 2026 meeting. Commitment up to ₦5B.",
  },
  {
    id: "WVR-2025-018",
    category: "Regulatory",
    rule: "CBN Form A monthly filing deadline",
    regulation: "CBN Investment Regulations 2019",
    justification: "System downtime on 30 Nov 2025 prevented timely submission. Filed 2 Dec 2025 with CBN notification.",
    requestedBy: "Compliance Team",
    requestedAt: "2025-11-30T17:00:00Z",
    approvedBy: "CBN (acknowledged)",
    approvedAt: "2025-12-03T09:00:00Z",
    expiryDate: "2025-12-31",
    status: "Expired",
    reviewNotes: "Closed — CBN acknowledged late filing with no sanction.",
  },
];

const STATUS_META: Record<WaiverStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  "Active": { color: "text-success", bg: "bg-green-100", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  "Pending Approval": { color: "text-warning", bg: "bg-amber-100", icon: <Clock className="h-3.5 w-3.5" /> },
  "Expired": { color: "text-gray-400", bg: "bg-gray-100", icon: <XCircle className="h-3.5 w-3.5" /> },
  "Revoked": { color: "text-danger", bg: "bg-red-100", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const CATEGORY_COLORS: Record<WaiverCategory, string> = {
  "Investment Limits": "bg-orange-100 text-orange-700",
  "Instrument Eligibility": "bg-blue-100 text-blue-700",
  "Rating Threshold": "bg-red-100 text-red-700",
  "Tenor Limit": "bg-purple-100 text-purple-700",
  "Concentration Limit": "bg-teal-100 text-teal-700",
  "Regulatory": "bg-gray-100 text-gray-600",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysToExpiry(iso: string) {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
}

function NewWaiverModal({ onClose, onAdd }: { onClose: () => void; onAdd: (w: Waiver) => void }) {
  const { persona } = usePersona();
  const [form, setForm] = useState({
    category: "Investment Limits" as WaiverCategory,
    rule: "",
    regulation: "",
    justification: "",
    instrument: "",
    counterparty: "",
    expiryDate: "",
  });

  function handleSubmit() {
    if (!form.rule || !form.justification || !form.expiryDate) return;
    const id = `WVR-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    onAdd({
      id,
      category: form.category,
      rule: form.rule,
      regulation: form.regulation,
      justification: form.justification,
      requestedBy: `${persona.name} (${persona.role})`,
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      expiryDate: form.expiryDate,
      status: "Pending Approval",
      instrument: form.instrument || undefined,
      counterparty: form.counterparty || undefined,
    });
    onClose();
  }

  return (
    <Modal isOpen title="Request Policy Waiver" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-xs font-semibold text-orange-700">COMPLIANCE RECORD</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Waivers are formal exceptions to investment policy. All waivers require approval from the Head of Investments or Investment Committee and are subject to annual review.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as WaiverCategory }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {["Investment Limits", "Instrument Eligibility", "Rating Threshold", "Tenor Limit", "Concentration Limit", "Regulatory"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Expiry date</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {[
          { key: "rule", label: "Rule / limit being waived" },
          { key: "regulation", label: "Regulation or policy reference" },
          { key: "instrument", label: "Instrument (if applicable)" },
          { key: "counterparty", label: "Counterparty (if applicable)" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input
              type="text"
              value={form[key as keyof typeof form] as string}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-medium text-gray-600">Business justification <span className="text-danger">*</span></label>
          <textarea
            rows={4}
            value={form.justification}
            onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
            placeholder="Provide a detailed justification including risk assessment, alternative options considered, and proposed mitigants..."
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!form.rule || !form.justification || !form.expiryDate}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Submit Waiver Request
          </button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function WaiverDetail({ waiver, onClose, onApprove }: { waiver: Waiver; onClose: () => void; onApprove: (id: string) => void }) {
  const { persona } = usePersona();
  const canApprove = persona.role === "Head of Investments" || persona.role === "Investment Committee / ALCO" || persona.role === "Compliance";
  const days = daysToExpiry(waiver.expiryDate);
  const meta = STATUS_META[waiver.status];

  return (
    <Modal isOpen title={`Waiver ${waiver.id}`} onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[waiver.category]}`}>
            {waiver.category}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
            {meta.icon} {waiver.status}
          </span>
          {waiver.status === "Active" && (
            <span className={`text-xs ${days < 30 ? "text-danger" : days < 90 ? "text-warning" : "text-success"}`}>
              {days > 0 ? `Expires in ${days} days` : "Expired"}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-border bg-gray-50 p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-400">Rule being waived</p>
            <p className="text-sm font-semibold text-dark-gray mt-0.5">{waiver.rule}</p>
          </div>
          {waiver.regulation && (
            <div>
              <p className="text-xs text-gray-400">Regulation / Policy reference</p>
              <p className="text-sm text-dark-gray mt-0.5">{waiver.regulation}</p>
            </div>
          )}
          {waiver.instrument && (
            <div>
              <p className="text-xs text-gray-400">Instrument</p>
              <p className="text-sm text-dark-gray mt-0.5">{waiver.instrument}</p>
            </div>
          )}
          {waiver.counterparty && (
            <div>
              <p className="text-xs text-gray-400">Counterparty</p>
              <p className="text-sm text-dark-gray mt-0.5">{waiver.counterparty}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Business Justification</p>
          <p className="text-sm text-gray-700 leading-relaxed border-l-2 border-primary pl-3">{waiver.justification}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs border-t border-border pt-3">
          {[
            ["Requested by", waiver.requestedBy],
            ["Requested", fmtDate(waiver.requestedAt)],
            ["Approved by", waiver.approvedBy || "Pending"],
            ["Approved", waiver.approvedAt ? fmtDate(waiver.approvedAt) : "—"],
            ["Expiry", fmtDate(waiver.expiryDate)],
          ].map(([label, val]) => (
            <div key={label as string}>
              <p className="text-gray-400">{label}</p>
              <p className="font-semibold text-dark-gray">{val}</p>
            </div>
          ))}
        </div>

        {waiver.reviewNotes && (
          <div className="rounded-lg border border-border bg-gray-50 p-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-400 mb-1">Review Notes</p>
            {waiver.reviewNotes}
          </div>
        )}

        {waiver.status === "Pending Approval" && canApprove && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { onApprove(waiver.id); onClose(); }}
              className="flex-1 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-success/90"
            >
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              Approve Waiver
            </button>
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              Close
            </button>
          </div>
        )}
        {!(waiver.status === "Pending Approval" && canApprove) && (
          <button onClick={onClose} className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Close
          </button>
        )}
      </div>
    </Modal>
  );
}

export function WaiverRegister() {
  const { persona } = usePersona();
  const [waivers, setWaivers] = useState<Waiver[]>(SEED_WAIVERS);
  const [filter, setFilter] = useState<WaiverStatus | "All">("All");
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Waiver | null>(null);
  const canRequest = persona.role === "Compliance" || persona.role === "Head of Investments" || persona.role === "Portfolio Manager";

  const filtered = filter === "All" ? waivers : waivers.filter((w) => w.status === filter);
  const activeCount = waivers.filter((w) => w.status === "Active").length;
  const pendingCount = waivers.filter((w) => w.status === "Pending Approval").length;
  const expiringCount = waivers.filter((w) => w.status === "Active" && daysToExpiry(w.expiryDate) < 30).length;

  function handleApprove(id: string) {
    setWaivers((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "Active", approvedBy: persona.name, approvedAt: new Date().toISOString() }
          : w
      )
    );
  }

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Governance</p>
          <h1 className="mt-1 text-2xl font-bold text-dark-gray">Policy Waiver Register</h1>
          <p className="mt-1 text-sm text-gray-500">
            Formal register of approved exceptions to the Investment Policy Statement and regulatory limits.
            All waivers require approval and are subject to periodic review.
          </p>
        </div>
        {canRequest && (
          <button
            onClick={() => setShowNew(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Request Waiver
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Active Waivers</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{activeCount}</p>
          <p className="text-xs text-gray-400">currently in force</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${pendingCount > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-surface"}`}>
          <p className="text-xs text-gray-400">Pending Approval</p>
          <p className={`mt-2 text-2xl font-bold ${pendingCount > 0 ? "text-warning" : "text-dark-gray"}`}>{pendingCount}</p>
          <p className="text-xs text-gray-400">awaiting sign-off</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${expiringCount > 0 ? "border-red-200 bg-red-50" : "border-border bg-surface"}`}>
          <p className="text-xs text-gray-400">Expiring Soon</p>
          <p className={`mt-2 text-2xl font-bold ${expiringCount > 0 ? "text-danger" : "text-dark-gray"}`}>{expiringCount}</p>
          <p className="text-xs text-gray-400">within 30 days</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total Register</p>
          <p className="mt-2 text-2xl font-bold text-dark-gray">{waivers.length}</p>
          <p className="text-xs text-gray-400">all time</p>
        </div>
      </div>

      {/* Alert for pending */}
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">
              {pendingCount} waiver{pendingCount !== 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Unapproved waivers do not provide regulatory or policy protection. Review and approve or reject promptly.
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(["All", "Active", "Pending Approval", "Expired", "Revoked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${filter === f ? "bg-white text-dark-gray shadow-sm" : "text-gray-500 hover:text-dark-gray"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-400">Waiver ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Rule Waived</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 hidden md:table-cell">Instrument / Counterparty</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 hidden sm:table-cell">Expiry</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 hidden lg:table-cell">Approved by</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((w) => {
              const meta = STATUS_META[w.status];
              const days = daysToExpiry(w.expiryDate);
              return (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-dark-gray">{w.id}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[w.category]}`}>
                      {w.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-48 truncate">{w.rule}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {w.instrument || w.counterparty || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
                      {meta.icon}
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={w.status === "Active" && days < 30 ? "text-danger font-semibold" : "text-gray-500"}>
                      {fmtDate(w.expiryDate)}
                      {w.status === "Active" && days < 30 && ` (${days}d)`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {w.approvedBy || <span className="text-warning">Pending</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(w)}
                      className="rounded border border-border px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-primary flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  No waivers found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showNew && <NewWaiverModal onClose={() => setShowNew(false)} onAdd={(w) => setWaivers((prev) => [w, ...prev])} />}
      {selected && <WaiverDetail waiver={selected} onClose={() => setSelected(null)} onApprove={handleApprove} />}
    </div>
  );
}
