import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { DealSlip, SettlementStatus } from "../types";
import { canDo } from "../../../context/platform-personas";

const OUTCOMES: SettlementStatus[] = [
  "Settled",
  "Partially Settled",
  "Failed",
  "Reversed",
  "Settled with Exception",
];

export function SettlementPanel({
  deal,
  role,
  user,
  onGenerate,
  onCheck,
  onConfirm,
}: {
  deal: DealSlip;
  role: string;
  user: string;
  onGenerate: (payload: {
    beneficiary: string;
    account: string;
    custodian: string;
    broker: string;
    valueDate: string;
    currency: string;
    amount: string;
  }) => void;
  onCheck: () => void;
  onConfirm: (outcome: SettlementStatus, reason?: string) => void;
}) {
  const canSettle = canDo(role, "settle", "S");
  const [form, setForm] = useState({
    beneficiary: deal.fields.counterparty || deal.fields.broker || "",
    account: deal.fields.settlementAccount || "",
    custodian: deal.fields.cscsOrCustodian || deal.fields.custodian || "",
    broker: deal.fields.broker || "",
    valueDate: deal.fields.settlementDate || deal.fields.valueDate || "",
    currency: "NGN",
    amount:
      deal.fields.settlementValue ||
      deal.fields.principal ||
      deal.fields.faceValue ||
      "",
  });
  const [outcome, setOutcome] = useState<SettlementStatus>("Settled");
  const [reason, setReason] = useState("");

  if (!canSettle) {
    return (
      <p className="text-xs text-dark-gray/45">
        Settlement actions are restricted to Back Office.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-dark-gray">Settlement</h3>
        {deal.settlementStatus && (
          <span className="text-xs text-primary">{deal.settlementStatus}</span>
        )}
      </div>

      {!deal.settlement && (deal.status === "Approved" || deal.status === "Pending Settlement") && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              ["beneficiary", "Beneficiary"],
              ["account", "Account"],
              ["custodian", "Custodian"],
              ["broker", "Broker"],
              ["valueDate", "Value date"],
              ["currency", "Currency"],
              ["amount", "Amount"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs">
              <span className="font-medium text-dark-gray/60">{label}</span>
              <input
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => onGenerate(form)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              Generate settlement instruction (Maker)
            </button>
          </div>
        </div>
      )}

      {deal.settlement && deal.settlement.status === "draft" && deal.settlement.createdBy !== user && (
        <button
          type="button"
          onClick={onCheck}
          className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
        >
          Check instruction (Checker — maker-checker)
        </button>
      )}

      {deal.settlement?.status === "checked" && (
        <div className="space-y-2 rounded-lg border border-border bg-gray-50 p-3">
          <p className="text-xs text-dark-gray/55">
            Instruction checked by {deal.settlement.checkedBy}. Confirm cash movement and documents.
          </p>
          <select
            className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as SettlementStatus)}
          >
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <textarea
            className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
            rows={2}
            placeholder="Reason / exception detail (required for failed or exception outcomes)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            onClick={() => onConfirm(outcome, reason || undefined)}
            className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white"
          >
            Confirm settlement status
          </button>
        </div>
      )}

      {deal.settlement && (
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-dark-gray/40">Maker</dt>
            <dd>{deal.settlement.createdBy}</dd>
          </div>
          <div>
            <dt className="text-dark-gray/40">Checker</dt>
            <dd>{deal.settlement.checkedBy ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-dark-gray/40">Amount</dt>
            <dd>
              {deal.settlement.currency} {deal.settlement.amount}
            </dd>
          </div>
          <div>
            <dt className="text-dark-gray/40">Value date</dt>
            <dd>{deal.settlement.valueDate}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
