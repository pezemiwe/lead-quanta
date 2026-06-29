import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, Paperclip, RotateCcw, X } from "lucide-react";
import { Modal } from "../../../components/shared/modal";
import { usePortfolioRegistry } from "../../portfolio/portfolio-registry";
import { usePersona } from "../../../context/persona";
import { canDo } from "../../../context/platform-personas";
import { useWorkflow } from "../../workflow/store";
import { DealSlipWorkspace } from "../../workflow/components/deal-slip-workspace";
import { toaster } from "../../../components/shared/toaster";
import {
  ASSET_CLASSES,
  dealNotional,
  emptyFieldsForAssetClass,
  getDocumentSlots,
  getEconomicsFields,
  SETTLEMENT_FIELDS,
  validateDocuments,
  validateMandatoryFields,
} from "../../workflow/engine/fields";
import type { AssetClass } from "../../workflow/types";
import {
  authorisedPortfolioIds,
  TRANSACTION_TYPES,
} from "../data/capture-masters";
import {
  addDays,
  applyDerivedFields,
  isValidIsin,
  isValueDateValid,
} from "../utils/capture-calculations";
import {
  CaptureFieldInput,
  resolveBankAccount,
  resolveCounterpartyBank,
} from "../components/capture-field-input";
import { LimitAlertsBanner, LimitAlertsPanel } from "../components/limit-alerts";
import { buildLimitPreview, limitAlerts } from "../utils/capture-limits";
import { fmtMoney } from "../utils/blotter-metrics";

type UploadedDoc = { file: File; uploadedAt: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function NewBooking() {
  const { persona } = usePersona();
  const navigate = useNavigate();
  const { portfolios } = usePortfolioRegistry();
  const wf = useWorkflow();
  const { dealSlips, register } = wf;
  const canCreate = canDo(persona.role, "dealSlip", "C");

  const allowedIds = authorisedPortfolioIds(persona.role);
  const authorisedPortfolios = useMemo(
    () =>
      allowedIds
        ? portfolios.filter((p) => allowedIds.includes(p.id) && p.status === "Active")
        : portfolios.filter((p) => p.status === "Active"),
    [portfolios, allowedIds],
  );

  const [assetClass, setAssetClass] = useState<AssetClass>(ASSET_CLASSES[0]);
  const [transactionType, setTransactionType] = useState(
    TRANSACTION_TYPES[ASSET_CLASSES[0]][0],
  );
  const [portfolioId, setPortfolioId] = useState(authorisedPortfolios[0]?.id ?? "");
  const [fields, setFields] = useState(() => emptyFieldsForAssetClass(ASSET_CLASSES[0]));
  const [uploads, setUploads] = useState<Record<string, UploadedDoc[]>>({});
  const [settlementTouched, setSettlementTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createdSlipId, setCreatedSlipId] = useState<string | null>(null);

  const portfolio = authorisedPortfolios.find((p) => p.id === portfolioId);
  const transactionSubType =
    fields.transactionSubType || transactionType;
  const economicsDefs = getEconomicsFields(assetClass, transactionSubType);
  const documentSlots = getDocumentSlots(assetClass, transactionSubType);

  const derivedFields = useMemo(() => {
    let next = applyDerivedFields(assetClass, fields);
    if (assetClass === "Equities" && fields.tradeDate && !settlementTouched) {
      next = { ...next, settlementDate: addDays(fields.tradeDate, 2) };
    }
    const bank = resolveBankAccount(next.settlementAccountId);
    if (bank) {
      next.settlementAccount = bank.label;
      if (!next.currency) next.currency = bank.currency;
    }
    const cpBank = resolveCounterpartyBank(next.counterpartyBank);
    if (cpBank) {
      next.beneficiaryAccountNumber = cpBank.accountNumber;
      next.beneficiaryAccountName = cpBank.accountName;
      next.sortCodeOrSwift = `${cpBank.sortCode} / ${cpBank.swift}`;
    }
    if (next.currency && !next.settlementCurrency) {
      next.settlementCurrency = next.currency;
    }
    return next;
  }, [assetClass, fields, settlementTouched]);

  const limitRows = useMemo(
    () =>
      buildLimitPreview(
        assetClass,
        portfolioId,
        portfolio?.name ?? "",
        derivedFields,
        dealSlips,
        register,
      ),
    [assetClass, portfolioId, portfolio?.name, derivedFields, dealSlips, register],
  );

  const alerts = useMemo(() => limitAlerts(limitRows), [limitRows]);
  const notional = dealNotional(derivedFields);

  useEffect(() => {
    if (!authorisedPortfolios.some((p) => p.id === portfolioId)) {
      setPortfolioId(authorisedPortfolios[0]?.id ?? "");
    }
  }, [authorisedPortfolios, portfolioId]);

  const onAssetClassChange = (ac: AssetClass) => {
    setAssetClass(ac);
    const tx = TRANSACTION_TYPES[ac][0];
    setTransactionType(tx);
    const subType =
      ac === "Alternative investments" || ac === "Mutual funds" ? tx : "";
    setFields({
      ...emptyFieldsForAssetClass(ac),
      transactionType: tx,
      transactionSubType: subType,
    });
    setUploads({});
    setSettlementTouched(false);
  };

  const setField = (key: string) => (value: string) => {
    if (key === "settlementDate") setSettlementTouched(true);
    setFields((f) => ({ ...f, [key]: value }));
  };

  const addFiles = (slotId: string, files: FileList | null, multiple: boolean) => {
    if (!files?.length) return;
    const valid: UploadedDoc[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        toaster.error({
          title: "File too large",
          description: `${file.name} exceeds 10 MB limit.`,
        });
        continue;
      }
      valid.push({ file, uploadedAt: new Date().toISOString() });
    }
    if (!valid.length) return;
    setUploads((prev) => ({
      ...prev,
      [slotId]: multiple ? [...(prev[slotId] ?? []), ...valid] : valid,
    }));
  };

  const removeFile = (slotId: string, index: number) => {
    setUploads((prev) => ({
      ...prev,
      [slotId]: (prev[slotId] ?? []).filter((_, i) => i !== index),
    }));
  };

  const collectValidationErrors = (): string[] => {
    const errors: string[] = [];
    const missing = validateMandatoryFields(assetClass, derivedFields, transactionSubType);
    if (missing.length) errors.push(...missing);

    const docMissing = validateDocuments(
        assetClass,
        Object.fromEntries(
          Object.entries(uploads).map(([k, v]) => [k, v.map((u) => u.file)]),
        ),
        transactionSubType,
    );
    errors.push(...docMissing);

    if (derivedFields.isin && !isValidIsin(derivedFields.isin)) {
      errors.push("ISIN format");
    }
    if (
      assetClass === "Fixed deposits and call deposits" &&
      derivedFields.tradeDate &&
      derivedFields.valueDate &&
      !isValueDateValid(derivedFields.tradeDate, derivedFields.valueDate)
    ) {
      errors.push("Value date must be on or after trade date");
    }
    if (derivedFields.paymentNarrative && derivedFields.paymentNarrative.length > 140) {
      errors.push("Payment narrative (max 140 characters)");
    }

    return errors;
  };

  const handleSubmitRequest = () => {
    const errors = collectValidationErrors();
    if (errors.length) {
      toaster.error({
        title: "Submission failed",
        description: `Please correct ${errors.length} field(s): ${errors.slice(0, 4).join(", ")}${errors.length > 4 ? "…" : ""}.`,
      });
      return;
    }
    setConfirmOpen(true);
  };

  const submitDeal = () => {
    if (!canCreate) return;

    setSubmitting(true);
    const allDocs = Object.values(uploads)
      .flat()
      .map((u) => ({ name: u.file.name }));

    const payload = {
      ...derivedFields,
      transactionType,
    };

    const created = wf.createDealSlip({
      assetClass,
      portfolioId,
      portfolioName: portfolio?.name ?? portfolioId,
      fields: payload,
      user: persona.name,
      role: persona.role,
      documents: allDocs,
    });

    if (!created.ok) {
      toaster.error({ title: "Submission failed", description: created.error });
      setSubmitting(false);
      return;
    }

    const sub = wf.submitDealSlip(created.id, persona.name, persona.role);
    if (!sub.ok) {
      toaster.error({ title: "Submission failed", description: sub.error ?? "Unknown error" });
      setSubmitting(false);
      setCreatedSlipId(created.id);
      return;
    }

    toaster.success({
      title: "Deal submitted for review",
      description: `Reference ${created.id}. You will be notified when reviewed.`,
    });

    setSubmitting(false);
    setConfirmOpen(false);
    setCreatedSlipId(created.id);
  };

  const resetForm = () => {
    const tx = TRANSACTION_TYPES[assetClass][0];
    const subType =
      assetClass === "Alternative investments" || assetClass === "Mutual funds" ? tx : "";
    setFields({
      ...emptyFieldsForAssetClass(assetClass),
      transactionType: tx,
      transactionSubType: subType,
    });
    setTransactionType(tx);
    setUploads({});
    setSettlementTouched(false);
  };

  const dashboardPath = canDo(persona.role, "blotter", "C")
    ? "/trader/dashboard"
    : "/deal-capture/blotter";

  if (!canCreate) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-dark-gray/55">
          Your role ({persona.role}) cannot capture deals.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto my-6 max-w-4xl px-4 pb-28 sm:px-0">
      <nav className="flex items-center gap-1.5 text-xs text-dark-gray/45">
        <Link to={dashboardPath} className="hover:text-primary">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-dark-gray">Deal Capture</span>
      </nav>

      <div className="mt-6">
        <h1 className="text-xl font-bold text-dark-gray">Deal Capture</h1>
        <p className="mt-1 text-sm text-dark-gray/55">
          Enter trade economics and terms. Submitting generates a deal slip for review and
          workflow tracking.
        </p>
      </div>

      {notional > 0 && alerts.length > 0 && (
        <div className="mt-4">
          <LimitAlertsBanner alerts={alerts} />
        </div>
      )}

      <form
        id="deal-capture-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitRequest();
        }}
        className="mt-6 space-y-5"
      >
        {/* Classification */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Classification</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-dark-gray/60">
              Asset class *
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={assetClass}
                onChange={(e) => onAssetClassChange(e.target.value as AssetClass)}
              >
                {ASSET_CLASSES.map((ac) => (
                  <option key={ac} value={ac}>
                    {ac}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-dark-gray/60">
              Transaction type *
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={transactionType}
                onChange={(e) => {
                  const tx = e.target.value;
                  setTransactionType(tx);
                  setField("transactionType")(tx);
                  if (
                    assetClass === "Alternative investments" ||
                    assetClass === "Mutual funds"
                  ) {
                    setField("transactionSubType")(tx);
                  }
                }}
              >
                {TRANSACTION_TYPES[assetClass].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-full block text-xs font-medium text-dark-gray/60 sm:col-span-1">
              Portfolio / fund *
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
              >
                {authorisedPortfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Economics */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold">Economics &amp; terms</h2>
          <p className="mb-4 text-xs text-dark-gray/45">
            {economicsDefs.filter((d) => !d.readOnly).length} fields for {assetClass}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {economicsDefs.map((def) => (
              <label
                key={def.key}
                className={`block text-xs font-medium text-dark-gray/60 ${
                  def.type === "textarea" ? "sm:col-span-2" : ""
                }`}
              >
                {def.label} {!def.readOnly && "*"}
                <div className="mt-1">
                  <CaptureFieldInput
                    def={def}
                    value={derivedFields[def.key] ?? ""}
                    onChange={def.readOnly ? () => {} : setField(def.key)}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Settlement details */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Counterparty &amp; settlement details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SETTLEMENT_FIELDS.map((def) => (
              <label
                key={def.key}
                className={`block text-xs font-medium text-dark-gray/60 ${
                  def.key === "paymentNarrative" ? "sm:col-span-2" : ""
                }`}
              >
                {def.label} {!def.readOnly && "*"}
                <div className="mt-1">
                  <CaptureFieldInput
                    def={def}
                    value={derivedFields[def.key] ?? ""}
                    onChange={def.readOnly ? () => {} : setField(def.key)}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Documents</h2>
          <div className="space-y-4">
            {documentSlots.map((slot) => (
              <div key={slot.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border px-4 py-3 hover:border-primary">
                  <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {slot.label}
                    {slot.required ? " *" : " (optional)"}
                    <span className="ml-1 text-[10px] text-dark-gray/35">PDF, JPG, PNG · max 10 MB</span>
                  </span>
                  <input
                    type="file"
                    multiple={slot.multiple}
                    accept={slot.accept}
                    className="hidden"
                    onChange={(e) => addFiles(slot.id, e.target.files, !!slot.multiple)}
                  />
                </label>
                {(uploads[slot.id] ?? []).map((doc, i) => (
                  <div
                    key={`${slot.id}-${i}`}
                    className="mt-2 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-dark-gray">{doc.file.name}</p>
                      <p className="text-[10px] text-dark-gray/40">
                        {formatFileSize(doc.file.size)} ·{" "}
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeFile(slot.id, i)}>
                      <X className="h-4 w-4 text-dark-gray/40 hover:text-danger" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm md:left-56">
        <div className="mx-auto flex max-w-4xl justify-end gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-dark-gray hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            type="submit"
            form="deal-capture-form"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit for review
          </button>
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="Submit for review?"
        size="md"
        footer={
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitDeal}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Confirm submit"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-dark-gray/60">
            The deal slip will be locked and routed for Middle Office and Compliance review.
          </p>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-[#FAFBFC] p-3 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-gray/40">
                Portfolio
              </p>
              <p className="mt-0.5 font-medium text-dark-gray">{portfolio?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-gray/40">
                Notional
              </p>
              <p className="mt-0.5 font-medium tabular-nums text-dark-gray">
                {notional > 0 ? fmtMoney(notional) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-gray/40">
                Asset class
              </p>
              <p className="mt-0.5 font-medium text-dark-gray">{assetClass}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-gray/40">
                Transaction
              </p>
              <p className="mt-0.5 font-medium text-dark-gray">{transactionType}</p>
            </div>
          </div>
          <LimitAlertsPanel alerts={alerts} />
        </div>
      </Modal>

      {createdSlipId && (
        <DealSlipWorkspace
          dealId={createdSlipId}
          onClose={() => navigate("/deal-capture/blotter")}
        />
      )}
    </div>
  );
}
