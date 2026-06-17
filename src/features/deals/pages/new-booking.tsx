import { useState, useMemo } from "react";
import {
  Save,
  RotateCcw,
  Info,
  Loader2,
  Paperclip,
  X,
  AlertTriangle,
} from "lucide-react";
import { usePortfolioRegistry } from "../../portfolio/portfolio-registry";
import { GovernanceBar } from "../../../components/shared/governance-bar";
import { useGovernance } from "../../../context/governance";
import { usePersona } from "../../../context/persona";
import { BOOK_COMPUTED } from "../../portfolio/engine/book-compute";

type FormState = {
  instrumentType: string;
  isin: string;
  instrumentName: string;
  issuer: string;
  sector: string;
  currency: string;
  classification: string;
  ifrs13Level: string;
  faceValue: string;
  purchasePrice: string;
  purchaseYield: string;
  couponRate: string;
  couponFrequency: string;
  discountRate: string;
  purchaseDate: string;
  maturityDate: string;
  settlementDate: string;
  custodian: string;
  counterparty: string;
  dayCount: string;
  portfolio: string;
  notes: string;
};

const EMPTY: FormState = {
  instrumentType: "",
  isin: "",
  instrumentName: "",
  issuer: "",
  sector: "",
  currency: "NGN",
  classification: "AC",
  ifrs13Level: "Level 2",
  faceValue: "",
  purchasePrice: "1.00",
  purchaseYield: "",
  couponRate: "",
  couponFrequency: "Semi-Annual",
  discountRate: "",
  purchaseDate: "2026-05-28",
  maturityDate: "",
  settlementDate: "2026-05-30",
  custodian: "",
  counterparty: "",
  dayCount: "Actual/365",
  portfolio: "Trading Book",
  notes: "",
};

const INST_TYPES = [
  "FGN Bond",
  "Treasury Bill",
  "Corporate Bond",
  "Eurobond",
  "Commercial Paper",
  "Equity",
  "Sukuk",
  "Money Market",
];
const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];
const CLASSIFICATIONS = [
  { value: "AC", label: "Amortised Cost (AC)" },
  {
    value: "FVOCI",
    label: "Fair Value through Other Comprehensive Income (FVOCI)",
  },
  { value: "FVTPL", label: "Fair Value through Profit or Loss (FVTPL)" },
];
const IFRS13_LEVELS = ["Level 1", "Level 2", "Level 3"];
const FREQ_OPTIONS = ["Monthly", "Quarterly", "Semi-Annual", "Annual", "Zero"];
const DAY_COUNTS = ["Actual/365", "Actual/360", "30/360", "Actual/Actual"];
const SECTORS = [
  "Federal Government",
  "Banking",
  "Telecoms",
  "Oil & Gas",
  "Consumer Goods",
  "Real Estate",
  "Infrastructure",
  "Utilities",
];

function FieldLabel({
  children,
  tip,
}: {
  children: React.ReactNode;
  tip?: string;
}) {
  return (
    <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
      {children}
      {tip && (
        <Info className="h-3 w-3 text-gray-400 cursor-help" aria-label={tip} />
      )}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-300"
    />
  );
}

type SelectOption = string | { value: string; label: string };

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary"
    >
      <option value="">— Select —</option>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
}

export function NewBooking() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { getPortfolioNames } = usePortfolioRegistry();
  const { logAction, hasPermission } = useGovernance();
  const { persona } = usePersona();
  const PORTFOLIOS = getPortfolioNames();

  const canCreate = hasPermission(persona.role, "deal.create");

  const set = (field: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [field]: v }));

  // Auto-compute EIR approximation
  const eirApprox = form.purchaseYield
    ? parseFloat(form.purchaseYield)
    : form.couponRate
      ? parseFloat(form.couponRate)
      : null;

  // Investment limit check: single-issuer concentration
  const limitWarning = useMemo(() => {
    if (!form.issuer || !form.faceValue) return null;
    const fv = parseFloat(form.faceValue);
    if (isNaN(fv) || fv <= 0) return null;
    const totalBSV = BOOK_COMPUTED.totals.totalBSValueNGN;
    const proposedPct = (fv / (totalBSV + fv)) * 100;
    if (proposedPct > 10) {
      return `Single-issuer concentration would reach ${proposedPct.toFixed(1)}% (NAICOM limit: 10%)`;
    }
    if (proposedPct > 8) {
      return `Single-issuer concentration approaching limit: ${proposedPct.toFixed(1)}% (limit: 10%)`;
    }
    return null;
  }, [form.issuer, form.faceValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    const ref = `DL-${Date.now().toString().slice(-6)}`;
    logAction({
      user: persona.name,
      role: persona.role,
      module: "Deals",
      action: "New Booking Submitted",
      detail: `${form.instrumentName || form.instrumentType} — ₦${form.faceValue || "0"} face value submitted for checker approval. Ref: ${ref}`,
      status: limitWarning ? "warning" : "success",
      ip: "10.0.1.xx",
    });
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="p-3 sm:p-4 md:p-6 xl:p-8">
        <div className="rounded-xl border border-border bg-surface p-10 flex flex-col items-center gap-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Save className="h-7 w-7 text-success" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-dark-gray">
              Deal Submitted for Approval
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {form.instrumentName || "New instrument"} has been submitted to
              the maker-checker queue. Reference:{" "}
              <span className="font-mono font-semibold">
                DL-{Date.now().toString().slice(-6)}
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              setForm(EMPTY);
              setSubmitted(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> Book another deal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8">
      <GovernanceBar
        requiredPermission="deal.create"
        context="maker"
        contextNote="Submit booking → awaits CFO checker approval"
        showPendingApprovals
      />

      {/* Limit warning banner */}
      {limitWarning && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>{limitWarning}</span>
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Deal Capture
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          New Investment Booking
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Capture instrument economics, counterparty and settlement details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Instrument Details */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Instrument Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel>Instrument Type *</FieldLabel>
              <SelectInput
                value={form.instrumentType}
                onChange={set("instrumentType")}
                options={INST_TYPES}
              />
            </div>
            <div>
              <FieldLabel tip="International Securities Identification Number">
                ISIN
              </FieldLabel>
              <TextInput
                value={form.isin}
                onChange={set("isin")}
                placeholder="e.g. NGFGN00001234"
              />
            </div>
            <div>
              <FieldLabel>Instrument Name *</FieldLabel>
              <TextInput
                value={form.instrumentName}
                onChange={set("instrumentName")}
                placeholder="e.g. FGN Bond 2031"
              />
            </div>
            <div>
              <FieldLabel>Issuer *</FieldLabel>
              <TextInput
                value={form.issuer}
                onChange={set("issuer")}
                placeholder="e.g. Federal Government of Nigeria"
              />
            </div>
            <div>
              <FieldLabel>Sector</FieldLabel>
              <SelectInput
                value={form.sector}
                onChange={set("sector")}
                options={SECTORS}
              />
            </div>
            <div>
              <FieldLabel>Portfolio</FieldLabel>
              <SelectInput
                value={form.portfolio}
                onChange={set("portfolio")}
                options={PORTFOLIOS}
              />
            </div>
          </div>
        </div>

        {/* Section: IFRS 9 Classification */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            IFRS 9 Classification
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Classification *</FieldLabel>
              <SelectInput
                value={form.classification}
                onChange={set("classification")}
                options={CLASSIFICATIONS}
              />
            </div>
            <div>
              <FieldLabel>IFRS 13 Fair Value Level</FieldLabel>
              <SelectInput
                value={form.ifrs13Level}
                onChange={set("ifrs13Level")}
                options={IFRS13_LEVELS}
              />
            </div>
            <div>
              <FieldLabel>Currency *</FieldLabel>
              <SelectInput
                value={form.currency}
                onChange={set("currency")}
                options={CURRENCIES}
              />
            </div>
          </div>
        </div>

        {/* Section: Economics */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Deal Economics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel tip="Nominal / par value in instrument currency">
                Face Value *
              </FieldLabel>
              <TextInput
                value={form.faceValue}
                onChange={set("faceValue")}
                placeholder="e.g. 100000000"
              />
            </div>
            <div>
              <FieldLabel tip="As decimal, e.g. 0.98 for 98%">
                Purchase Price (decimal)
              </FieldLabel>
              <TextInput
                value={form.purchasePrice}
                onChange={set("purchasePrice")}
                placeholder="e.g. 0.9850"
              />
            </div>
            <div>
              <FieldLabel tip="Annual yield to maturity at purchase">
                Purchase Yield (%)
              </FieldLabel>
              <TextInput
                value={form.purchaseYield}
                onChange={set("purchaseYield")}
                placeholder="e.g. 0.185 for 18.5%"
              />
            </div>
            <div>
              <FieldLabel>Coupon Rate (annual, decimal)</FieldLabel>
              <TextInput
                value={form.couponRate}
                onChange={set("couponRate")}
                placeholder="e.g. 0.1500 for 15%"
              />
            </div>
            <div>
              <FieldLabel>Coupon Frequency</FieldLabel>
              <SelectInput
                value={form.couponFrequency}
                onChange={set("couponFrequency")}
                options={FREQ_OPTIONS}
              />
            </div>
            <div>
              <FieldLabel>Day Count Convention</FieldLabel>
              <SelectInput
                value={form.dayCount}
                onChange={set("dayCount")}
                options={DAY_COUNTS}
              />
            </div>
            <div>
              <FieldLabel tip="Discount rate used for DCF valuation (e.g. 0.185 for 18.5%). Defaults to purchase yield if blank.">
                Discount Rate (%)
              </FieldLabel>
              <TextInput
                value={form.discountRate}
                onChange={set("discountRate")}
                placeholder="e.g. 0.185 for 18.5%"
              />
            </div>
          </div>
          {eirApprox !== null && (
            <div className="mt-4 rounded-lg bg-pale-red/40 border border-primary/20 px-4 py-3">
              <p className="text-xs text-primary">
                <span className="font-semibold">Estimated EIR:</span>{" "}
                {(eirApprox * 100).toFixed(4)}% — precise EIR will be computed
                on deal booking.
              </p>
            </div>
          )}
        </div>

        {/* Section: Dates */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">Dates</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Trade / Purchase Date *</FieldLabel>
              <TextInput
                value={form.purchaseDate}
                onChange={set("purchaseDate")}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <FieldLabel>Settlement Date</FieldLabel>
              <TextInput
                value={form.settlementDate}
                onChange={set("settlementDate")}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <FieldLabel>Maturity Date</FieldLabel>
              <TextInput
                value={form.maturityDate}
                onChange={set("maturityDate")}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </div>

        {/* Section: Counterparty */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Counterparty &amp; Custody
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Custodian</FieldLabel>
              <TextInput
                value={form.custodian}
                onChange={set("custodian")}
                placeholder="e.g. First Bank Custodial"
              />
            </div>
            <div>
              <FieldLabel>Counterparty</FieldLabel>
              <TextInput
                value={form.counterparty}
                onChange={set("counterparty")}
                placeholder="e.g. Stanbic IBTC Securities"
              />
            </div>
          </div>
        </div>

        {/* Section: Documents */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Document Attachments
          </h2>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-gray-50 px-4 py-3 hover:border-primary hover:bg-pale-red/20 transition-colors">
              <Paperclip className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                Attach term sheet, IC memo, or supporting documents…
              </span>
              <input
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.csv"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setAttachments((prev) => [...prev, ...files]);
                  e.target.value = "";
                }}
              />
            </label>
            {attachments.length > 0 && (
              <ul className="space-y-1.5">
                {attachments.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 text-dark-gray">
                      <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium">{f.name}</span>
                      <span className="text-xs text-gray-400">
                        ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-gray-400 hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Section: Notes */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Notes / Rationale
          </h2>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            rows={3}
            placeholder="Investment rationale, IC approval reference, or other notes..."
            className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-300 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm(EMPTY)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            type="submit"
            disabled={submitting || !canCreate}
            title={
              !canCreate
                ? `${persona.role} does not have deal.create permission`
                : undefined
            }
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Booking…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Book Deal
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
