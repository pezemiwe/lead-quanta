import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  ShieldCheck,
  Wallet,
  XCircle,
  Banknote,
  UserCheck,
  FileText,
} from "lucide-react";
import { Modal } from "../../../components/shared/modal";
import { StatCard } from "../../../components/shared/stat-card";
import { PermissionStatGrid } from "../../../components/shared/permission-stat-grid";
import { usePersona } from "../../../context/persona";
import { canDo } from "../../../context/platform-personas";
import { useWorkflow } from "../../workflow/store";
import { useNotifications } from "../../../context/notifications";
import type { DealSlip, SettlementStatus } from "../../workflow/types";
import { DealSlipStatusBadge } from "../../workflow/components/status-badge";
import { dealSlipLabel, dealNotional } from "../../workflow/engine/fields";

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(n: number) {
  return `₦${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/* ─── Settlement step indicator ───────────────────────────── */
const STEPS = [
  { id: 1, label: "Instruction Generated", icon: FileText, role: "Back Office (Maker)" },
  { id: 2, label: "Instruction Checked", icon: UserCheck, role: "Back Office (Checker)" },
  { id: 3, label: "Cash Matched", icon: Banknote, role: "Finance / Treasury Ops" },
  { id: 4, label: "Position Active", icon: CheckCircle2, role: "System (Automatic)" },
];

function currentStep(deal: DealSlip): number {
  if (deal.status === "Active") return 4;
  if (deal.settlementStatus === "Instruction Checked") return 2;
  if (deal.settlementStatus === "Instruction Generated") return 1;
  return 0;
}

function StepProgress({ deal }: { deal: DealSlip }) {
  const step = currentStep(deal);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done = step >= s.id;
        const active = step === s.id - 1;
        return (
          <div key={s.id} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-success text-white"
                    : active
                      ? "bg-primary text-white animate-pulse"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
              </div>
              <div className="text-center">
                <p className={`text-xs font-medium ${done ? "text-success" : active ? "text-primary" : "text-gray-400"}`}>
                  {s.label}
                </p>
                <p className="text-xs text-gray-400 hidden sm:block">{s.role}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-6 ${done ? "bg-success" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Generate instruction modal ──────────────────────────── */
function GenerateInstructionModal({
  deal,
  onClose,
}: {
  deal: DealSlip;
  onClose: () => void;
}) {
  const { persona } = usePersona();
  const { generateSettlementInstruction } = useWorkflow();
  const { addNotification } = useNotifications();
  const notional = dealNotional(deal.fields);

  const [form, setForm] = useState({
    beneficiary: deal.fields.counterparty || deal.fields.issuer || "",
    account: "",
    custodian: deal.fields.cscsOrCustodian || "",
    broker: deal.fields.broker || deal.fields.counterparty || "",
    valueDate: deal.fields.valueDate || deal.fields.settlementDate || "",
    currency: deal.fields.currency || "NGN",
    amount: String(notional),
  });
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.beneficiary || !form.account || !form.valueDate) {
      setError("Beneficiary, account number, and value date are required.");
      return;
    }
    const result = generateSettlementInstruction(deal.id, persona.name, persona.role, form);
    if (!result.ok) { setError(result.error ?? "Failed"); return; }
    addNotification({
      type: "settlement",
      severity: "info",
      title: "Settlement instruction generated",
      body: `${deal.id} — awaiting Back Office checker sign-off`,
      link: "/deal-capture/settlements",
    });
    onClose();
  }

  return (
    <Modal isOpen title="Generate Settlement Instruction" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-700">MAKER STEP — Back Office</p>
          <p className="text-xs text-gray-600 mt-0.5">
            You are generating the settlement instruction for <strong>{deal.id}</strong>. This action will be logged.
            A different Back Office officer must check this instruction before payment can proceed.
          </p>
        </div>

        {[
          { key: "beneficiary", label: "Beneficiary name" },
          { key: "account", label: "Beneficiary account number" },
          { key: "custodian", label: "Custodian / bank" },
          { key: "broker", label: "Broker (if applicable)" },
          { key: "valueDate", label: "Value date", type: "date" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input
              type={type || "text"}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {["NGN", "USD", "GBP", "EUR"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Generate Instruction
          </button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Check instruction modal ─────────────────────────────── */
function CheckInstructionModal({ deal, onClose }: { deal: DealSlip; onClose: () => void }) {
  const { persona } = usePersona();
  const { checkSettlementInstruction } = useWorkflow();
  const { addNotification } = useNotifications();
  const [error, setError] = useState("");
  const si = deal.settlement!;

  function handleCheck() {
    const result = checkSettlementInstruction(deal.id, persona.name, persona.role);
    if (!result.ok) { setError(result.error ?? "Failed"); return; }
    addNotification({
      type: "settlement",
      severity: "info",
      title: "Settlement instruction cleared",
      body: `${deal.id} — instruction checked. Ready for payment release.`,
      link: "/deal-capture/settlements",
    });
    onClose();
  }

  return (
    <Modal isOpen title="Check Settlement Instruction" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-700">CHECKER STEP — Back Office</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Independently verify the instruction below against the approved deal slip.
            You must be a <strong>different officer</strong> from the maker ({si.createdBy}).
            This satisfies the mandatory maker-checker control.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-gray-50 p-4 space-y-2">
          {[
            ["Beneficiary", si.beneficiary],
            ["Account", si.account],
            ["Custodian / Bank", si.custodian],
            ["Broker", si.broker],
            ["Value Date", si.valueDate],
            ["Currency", si.currency],
            ["Amount", si.currency === "NGN" ? fmt(Number(si.amount)) : si.amount],
            ["Generated by", si.createdBy],
            ["Generated at", fmtDate(si.createdAt)],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-dark-gray">{val}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {["Beneficiary name matches counterparty master",
            "Account number matches approved settlement account",
            "Currency and amount match approved deal economics",
            "Value date is the approved settlement date",
          ].map((item) => (
            <label key={item} className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-primary" defaultChecked />
              <span>{item}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCheck}
            className="flex-1 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-success/90"
          >
            <CheckCircle2 className="inline h-4 w-4 mr-1" />
            Confirm Instruction — Release for Payment
          </button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Confirm settlement modal ────────────────────────────── */
function ConfirmSettlementModal({ deal, onClose }: { deal: DealSlip; onClose: () => void }) {
  const { persona } = usePersona();
  const { confirmSettlement } = useWorkflow();
  const { addNotification } = useNotifications();
  const [outcome, setOutcome] = useState<SettlementStatus>("Settled");
  const [reason, setReason] = useState("");
  const [partialPct, setPartialPct] = useState("50");
  const [error, setError] = useState("");

  function handleConfirm() {
    if ((outcome === "Partially Settled" || outcome === "Failed" || outcome === "Settled with Exception") && !reason) {
      setError("Please provide a reason for this settlement outcome.");
      return;
    }
    const result = confirmSettlement(deal.id, persona.name, persona.role, outcome, reason || undefined);
    if (!result.ok) { setError(result.error ?? "Failed"); return; }
    addNotification({
      type: "settlement",
      severity: outcome === "Settled" ? "info" : outcome === "Failed" ? "critical" : "warning",
      title: `Settlement ${outcome} — ${deal.id}`,
      body: outcome === "Settled"
        ? "Position is now active in the investment register."
        : reason,
      link: "/deal-capture/settlements",
    });
    onClose();
  }

  return (
    <Modal isOpen title="Confirm Settlement Outcome" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-semibold text-success">STEP 3 — Confirm Cash & Documents</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Match the cash movement, counterparty confirmation, and custodian statement against the settlement instruction.
            Choosing <strong>Settled</strong> will create an active position in the investment register immediately.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Settlement outcome</label>
          <div className="mt-2 space-y-2">
            {(["Settled", "Partially Settled", "Settled with Exception", "Failed", "Reversed"] as SettlementStatus[]).map((o) => (
              <label key={o} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="outcome"
                  value={o}
                  checked={outcome === o}
                  onChange={() => setOutcome(o)}
                  className="accent-primary"
                />
                <span className={`text-sm font-medium ${
                  o === "Settled" ? "text-success"
                    : o === "Failed" || o === "Reversed" ? "text-danger"
                    : "text-warning"
                }`}>{o}</span>
                <span className="text-xs text-gray-400">
                  {o === "Settled" ? "Full cash and documents confirmed — position activated"
                    : o === "Partially Settled" ? "Part of notional settled — exception raised for balance"
                    : o === "Settled with Exception" ? "Settled but with documentary or timing exception"
                    : o === "Failed" ? "Payment or delivery failed — no position created"
                    : "Settlement reversed after initial confirmation"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {outcome === "Partially Settled" && (
          <div>
            <label className="text-xs font-medium text-gray-600">% settled (approximate)</label>
            <input
              type="number"
              min={1} max={99}
              value={partialPct}
              onChange={(e) => setPartialPct(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">A position will be created for the settled portion. An exception is automatically raised for the balance.</p>
          </div>
        )}

        {outcome !== "Settled" && (
          <div>
            <label className="text-xs font-medium text-gray-600">
              {outcome === "Failed" || outcome === "Reversed" ? "Reason (required)" : "Exception detail (required)"}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue — this will be recorded in the audit trail and exception register"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
            />
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleConfirm}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
              outcome === "Settled" || outcome === "Partially Settled"
                ? "bg-success hover:bg-success/90"
                : "bg-danger hover:bg-danger/90"
            }`}
          >
            Confirm: {outcome}
          </button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Settlement detail panel ─────────────────────────────── */
function SettlementDetailPanel({ deal, onClose }: { deal: DealSlip; onClose: () => void }) {
  const { persona } = usePersona();
  const canSettle = canDo(persona.role, "settle", "S");
  const step = currentStep(deal);
  const [modal, setModal] = useState<"generate" | "check" | "confirm" | null>(null);

  const notional = dealNotional(deal.fields);
  const isMaker = deal.settlement?.createdBy === persona.name;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-xs text-gray-400">{deal.assetClass}</p>
          <h3 className="text-base font-bold text-dark-gray">{deal.id}</h3>
          <p className="text-xs text-gray-500">{dealSlipLabel(deal.fields, deal.assetClass)}</p>
        </div>
        <div className="flex items-center gap-2">
          <DealSlipStatusBadge status={deal.status} />
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Step progress */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Settlement Progress</p>
          <StepProgress deal={deal} />
        </div>

        {/* Economics summary */}
        <div className="rounded-xl border border-border bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Deal Economics</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Notional", fmt(notional)],
              ["Currency", deal.fields.currency || "NGN"],
              ["Counterparty", deal.fields.counterparty || deal.fields.issuer || "—"],
              ["Portfolio", deal.portfolioName],
              ["Approved by", deal.approvedBy || "—"],
              ["Approved at", deal.approvedAt ? fmtDate(deal.approvedAt) : "—"],
              ["Days in queue", deal.approvedAt ? String(daysSince(deal.approvedAt)) : "—"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-dark-gray">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settlement instruction (if exists) */}
        {deal.settlement && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settlement Instruction</p>
              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                deal.settlement.status === "checked" ? "bg-green-100 text-success"
                  : "bg-amber-100 text-warning"
              }`}>
                {deal.settlement.status === "checked" ? "Checked ✓" : "Draft — Pending Check"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                ["Beneficiary", deal.settlement.beneficiary],
                ["Account", deal.settlement.account],
                ["Custodian", deal.settlement.custodian],
                ["Broker", deal.settlement.broker],
                ["Value Date", deal.settlement.valueDate],
                ["Currency / Amount", `${deal.settlement.currency} ${deal.settlement.currency === "NGN" ? fmt(Number(deal.settlement.amount)) : deal.settlement.amount}`],
                ["Maker", deal.settlement.createdBy],
                ["Checker", deal.settlement.checkedBy || "Awaiting checker"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-semibold ${val === "Awaiting checker" ? "text-warning" : "text-dark-gray"}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {canSettle && (
          <div className="space-y-2">
            {step === 0 && deal.status === "Approved" && (
              <button
                onClick={() => setModal("generate")}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Settlement Instruction (Maker)
              </button>
            )}
            {step === 1 && !isMaker && (
              <button
                onClick={() => setModal("check")}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Check Instruction & Release for Payment (Checker)
              </button>
            )}
            {step === 1 && isMaker && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                You raised this instruction. A <strong>different Back Office officer</strong> must check it (maker-checker control).
              </div>
            )}
            {step === 2 && (
              <button
                onClick={() => setModal("confirm")}
                className="w-full rounded-xl bg-success px-4 py-3 text-sm font-semibold text-white hover:bg-success/90 flex items-center justify-center gap-2"
              >
                <Banknote className="h-4 w-4" />
                Confirm Cash Movement & Activate Position
              </button>
            )}
            {(deal.status === "Active") && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-success flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Settlement complete. Position <strong>{deal.registerPositionId}</strong> is active in the investment register.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "generate" && <GenerateInstructionModal deal={deal} onClose={() => setModal(null)} />}
      {modal === "check" && <CheckInstructionModal deal={deal} onClose={() => setModal(null)} />}
      {modal === "confirm" && <ConfirmSettlementModal deal={deal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ─── Register disposal modal ─────────────────────────────── */
function DisposalModal({
  position,
  onClose,
}: {
  position: { id: string; label: string; notional: number; assetClass: string };
  onClose: () => void;
}) {
  const [salePrice, setSalePrice] = useState("");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const proceeds = Number(salePrice) || 0;
  const realizedGL = proceeds - position.notional;

  if (done) {
    return (
      <Modal isOpen title="Disposal Processed" onClose={onClose} size="sm">
        <div className="text-center space-y-4 py-4">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <p className="text-sm font-semibold text-dark-gray">Position closed</p>
          <p className="text-xs text-gray-500">
            Realized {realizedGL >= 0 ? "gain" : "loss"} of{" "}
            <span className={realizedGL >= 0 ? "text-success font-bold" : "text-danger font-bold"}>
              ₦{Math.abs(realizedGL).toLocaleString()}
            </span>{" "}
            posted to Disposals ledger. Audit trail updated.
          </p>
          <button onClick={onClose} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen title="Process Disposal / Realized P&L" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-xs font-semibold text-orange-700">DISPOSAL PROCESSING</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Closing position <strong>{position.id}</strong> — {position.label}. Enter the actual sale proceeds to compute realized gain or loss.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-gray-50 p-3 text-xs">
          <div>
            <p className="text-gray-400">Book value (cost)</p>
            <p className="font-bold text-dark-gray">₦{position.notional.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400">Asset class</p>
            <p className="font-bold text-dark-gray">{position.assetClass}</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Sale / maturity proceeds (₦)</label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="Enter actual proceeds received"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        {proceeds > 0 && (
          <div className={`rounded-xl border p-4 text-center ${realizedGL >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <p className="text-xs text-gray-500">Realized {realizedGL >= 0 ? "Gain" : "Loss"}</p>
            <p className={`text-2xl font-bold mt-1 ${realizedGL >= 0 ? "text-success" : "text-danger"}`}>
              {realizedGL >= 0 ? "+" : ""}₦{realizedGL.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">({((realizedGL / position.notional) * 100).toFixed(2)}% return on book value)</p>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-600">Disposal reason / trade instruction</label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Matured at par, Secondary market sale at bid price..."
            className="mt-1 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            disabled={!proceeds}
            onClick={() => setDone(true)}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Post Disposal & Close Position
          </button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Main Settlements page ───────────────────────────────── */
export function Settlements() {
  const { persona } = usePersona();
  const { queues, register, dealSlips } = useWorkflow();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [disposalPos, setDisposalPos] = useState<{ id: string; label: string; notional: number; assetClass: string } | null>(null);
  const [regFilter, setRegFilter] = useState<"active" | "all">("active");

  const canSettle = canDo(persona.role, "settle", "S");
  const canViewRegister = canDo(persona.role, "register", "V") || canDo(persona.role, "register", "S");

  const settlementQueue = queues.settlementQueue(persona.role);
  const selectedDeal = selectedId ? dealSlips.find((d) => d.id === selectedId) : null;

  const pendingInstruction = settlementQueue.filter((d) => !d.settlement).length;
  const pendingCheck = settlementQueue.filter((d) => d.settlement && d.settlement.status !== "checked").length;
  const pendingConfirm = settlementQueue.filter((d) => d.settlement?.status === "checked").length;
  const totalAmount = settlementQueue.reduce((s, d) => s + dealNotional(d.fields), 0);

  const displayRegister = regFilter === "active"
    ? register.filter((r) => r.status === "Active")
    : register;

  function settlementStatusColor(d: DealSlip) {
    if (d.status === "Active") return "text-success";
    if (d.settlementStatus === "Instruction Checked") return "text-blue-600";
    if (d.settlementStatus === "Instruction Generated") return "text-warning";
    if (d.status === "Approved") return "text-gray-400";
    return "text-gray-400";
  }

  function settlementStatusIcon(d: DealSlip) {
    if (d.status === "Active") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    if (d.settlementStatus === "Instruction Checked") return <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />;
    if (d.settlementStatus === "Instruction Generated") return <Clock className="h-3.5 w-3.5 text-warning" />;
    if (d.settlementStatus === "Failed") return <XCircle className="h-3.5 w-3.5 text-danger" />;
    return <FileCheck2 className="h-3.5 w-3.5 text-gray-400" />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header area */}
      <div className="shrink-0 border-b border-border bg-surface px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-dark-gray">Settlement & Investment Register</h1>
            <p className="mt-0.5 text-sm text-dark-gray/55">
              Back Office confirms settlement before positions enter the register. Mandatory maker-checker on every instruction.
            </p>
          </div>
          {canSettle && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">{pendingInstruction + pendingCheck + pendingConfirm}</span> deal{pendingInstruction + pendingCheck + pendingConfirm !== 1 ? "s" : ""} require action
              </p>
            </div>
          )}
        </div>

        <PermissionStatGrid className="mt-4">
          {canSettle && (
            <StatCard
              title="Awaiting instruction"
              value={String(pendingInstruction)}
              subtitle="No SI generated yet"
              trend={{ direction: pendingInstruction > 0 ? "up" : "neutral", label: "need maker action" }}
            />
          )}
          {canSettle && (
            <StatCard
              title="Awaiting check"
              value={String(pendingCheck)}
              subtitle="Instruction needs checker"
              trend={{ direction: pendingCheck > 0 ? "up" : "neutral", label: "pending checker" }}
            />
          )}
          {canSettle && (
            <StatCard
              title="Awaiting confirmation"
              value={String(pendingConfirm)}
              subtitle="Checked — ready to confirm"
              trend={{ direction: pendingConfirm > 0 ? "up" : "neutral", label: "ready for cash match" }}
            />
          )}
          {canViewRegister && (
            <StatCard
              title="Total value in queue"
              value={`₦${(totalAmount / 1e9).toFixed(1)}B`}
              subtitle="Settlement notional pending"
            />
          )}
          {canViewRegister && (
            <StatCard
              title="Active positions"
              value={String(register.filter((r) => r.status === "Active").length)}
              subtitle="In investment register"
            />
          )}
        </PermissionStatGrid>
      </div>

      {/* Body — two panes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: queue list */}
        <div className={`flex flex-col border-r border-border bg-surface overflow-hidden ${selectedDeal ? "hidden lg:flex lg:w-96" : "flex-1"}`}>
          <div className="px-4 py-3 border-b border-border shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Settlement Queue ({settlementQueue.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {settlementQueue.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <CheckCircle2 className="h-10 w-10 text-success/40 mb-3" />
                <p className="text-sm font-medium text-dark-gray/60">No deals awaiting settlement</p>
                <p className="text-xs text-gray-400 mt-1">All approved deals have been processed.</p>
              </div>
            )}
            {settlementQueue.map((d) => {
              const isSelected = selectedId === d.id;
              const step = currentStep(d);
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(isSelected ? null : d.id)}
                  className={`w-full text-left px-4 py-4 transition-colors ${isSelected ? "bg-orange-50 border-l-2 border-primary" : "hover:bg-gray-50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {settlementStatusIcon(d)}
                        <span className="text-xs font-bold text-dark-gray">{d.id}</span>
                        <DealSlipStatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{dealSlipLabel(d.fields, d.assetClass)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d.assetClass}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-dark-gray">₦{(dealNotional(d.fields) / 1e6).toFixed(0)}M</p>
                      <p className={`text-xs font-semibold mt-0.5 ${settlementStatusColor(d)}`}>
                        Step {step}/3
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: detail panel OR register */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedDeal ? (
            <SettlementDetailPanel deal={selectedDeal} onClose={() => setSelectedId(null)} />
          ) : (
            canViewRegister && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
                  <p className="text-sm font-semibold text-dark-gray">Investment Register</p>
                  <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
                    {(["active", "all"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setRegFilter(f)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${regFilter === f ? "bg-white text-dark-gray shadow-sm" : "text-gray-500 hover:text-dark-gray"}`}
                      >
                        {f === "active" ? "Active only" : "All positions"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50 border-b border-border">
                      <tr>
                        {["Position ID", "Instrument", "Counterparty", "Portfolio", "Notional", "Status", "Settled", "Action"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-400 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayRegister.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-dark-gray">{r.id}</td>
                          <td className="px-4 py-3 text-dark-gray max-w-48 truncate">{r.label}</td>
                          <td className="px-4 py-3 text-gray-500">{r.counterparty}</td>
                          <td className="px-4 py-3 text-gray-500">{r.portfolioId}</td>
                          <td className="px-4 py-3 text-right font-semibold text-dark-gray">
                            {r.currency} {(r.notional / 1e6).toFixed(0)}M
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              r.status === "Active" ? "bg-green-100 text-success"
                                : r.status === "Matured" ? "bg-gray-100 text-gray-600"
                                : r.status === "Sold" ? "bg-blue-100 text-blue-600"
                                : "bg-orange-100 text-orange-600"
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{r.settledAt.slice(0, 10)}</td>
                          <td className="px-4 py-3">
                            {r.status === "Active" && canSettle && (
                              <button
                                onClick={() => setDisposalPos({ id: r.id, label: r.label, notional: r.notional, assetClass: r.assetClass })}
                                className="rounded border border-border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-primary"
                              >
                                Process Disposal
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {displayRegister.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                            No register positions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {disposalPos && <DisposalModal position={disposalPos} onClose={() => setDisposalPos(null)} />}
    </div>
  );
}
