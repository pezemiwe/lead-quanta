import type { FieldDef } from "../../workflow/engine/fields";
import {
  BANK_ACCOUNTS,
  BROKERS,
  COUNTERPARTIES,
  COUNTERPARTY_BANKS,
  ISSUERS,
} from "../data/capture-masters";

function masterOptions(master: FieldDef["master"]): string[] {
  switch (master) {
    case "counterparty":
      return COUNTERPARTIES;
    case "issuer":
      return ISSUERS;
    case "broker":
      return BROKERS;
    case "bankAccount":
      return BANK_ACCOUNTS.map((a) => a.id);
    case "counterpartyBank":
      return COUNTERPARTY_BANKS.map((b) => b.name);
    default:
      return [];
  }
}

export function CaptureFieldInput({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-50 disabled:text-dark-gray/55";

  if (def.readOnly) {
    return (
      <input
        type="text"
        disabled
        className={`${base} cursor-not-allowed bg-gray-50 text-dark-gray/70`}
        value={value || "—"}
        tabIndex={-1}
        aria-readonly="true"
      />
    );
  }

  if (def.master === "bankAccount") {
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select account…</option>
        {BANK_ACCOUNTS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    );
  }

  if (def.master) {
    const options = masterOptions(def.master);
    return (
      <>
        <input
          list={`${def.key}-list`}
          className={base}
          value={value}
          placeholder={def.placeholder ?? "Search…"}
          onChange={(e) => onChange(e.target.value)}
        />
        <datalist id={`${def.key}-list`}>
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </>
    );
  }

  if (def.type === "select" && def.options) {
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {def.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (def.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[72px] resize-y`}
        value={value}
        maxLength={def.maxLength}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      type={def.type === "date" ? "date" : def.type === "number" ? "number" : "text"}
      className={base}
      value={value}
      step={def.step}
      maxLength={def.maxLength}
      placeholder={def.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function resolveBankAccount(id: string) {
  return BANK_ACCOUNTS.find((a) => a.id === id);
}

export function resolveCounterpartyBank(name: string) {
  return COUNTERPARTY_BANKS.find((b) => b.name === name);
}
