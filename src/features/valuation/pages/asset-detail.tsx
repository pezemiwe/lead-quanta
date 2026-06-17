import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";
import { useValuation } from "../store";
import { valueInstrument } from "../engine";
import { Tabs } from "../../../components/shared/tabs";
import { SectionCard } from "../../../components/shared/section-card";
import {
  fmtMoney,
  fmtNumber,
  fmtPct,
  fmtDate,
  CLASSIFICATION_BADGE,
  CLASSIFICATION_LABEL,
  STAGE_BADGE,
} from "../utils";
import type { Instrument } from "../engine/types";

type Tab =
  | "summary"
  | "amort"
  | "cashflow"
  | "income"
  | "fairvalue"
  | "oci"
  | "risk"
  | "audit";

export function ValuationAssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const v = useValuation();
  const [tab, setTab] = useState<Tab>("summary");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const instrument = v.instruments.find((i) => i.id === id);
  const valuation = useMemo(
    () => (instrument ? valueInstrument(instrument, v.assumptions) : null),
    [instrument, v.assumptions],
  );

  if (!instrument || !valuation) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate("/valuation/inventory")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to inventory
        </button>
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-dark-gray">
            Instrument not found
          </p>
          <p className="mt-1 text-xs text-gray-400">
            The instrument <span className="font-mono">{id}</span> does not
            exist in this portfolio.
          </p>
        </div>
      </div>
    );
  }

  const inst = instrument;
  const cls = inst.classification;
  const ccy = inst.currency;

  /* tabs availability — Equity hides amort & cashflow */
  const isEquity = inst.instrumentType === "Equity";
  const tabs: { value: Tab; label: string }[] = [
    { value: "summary", label: "Summary" },
    ...(isEquity
      ? []
      : ([
          { value: "amort", label: "EIR & Amortisation" },
          { value: "cashflow", label: "Cash Flows" },
        ] as { value: Tab; label: string }[])),
    { value: "income", label: "Income & P&L" },
    ...(cls !== "AC" && !isEquity
      ? ([{ value: "fairvalue", label: "Fair Value" }] as {
          value: Tab;
          label: string;
        }[])
      : []),
    ...(cls === "FVOCI" && !isEquity
      ? ([{ value: "oci", label: "OCI Recycling" }] as {
          value: Tab;
          label: string;
        }[])
      : []),
    ...(!isEquity ? [{ value: "risk" as Tab, label: "Risk Metrics" }] : []),
    { value: "audit", label: "Audit Trail" },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* breadcrumb + actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/valuation/inventory")}
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Asset Inventory
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-dark-gray">
              {inst.id}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSIFICATION_BADGE[cls]}`}
            >
              {cls}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {inst.ifrs13Level}
            </span>
            {inst.impairmentStage && inst.impairmentStage !== "N/A" && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE[inst.impairmentStage]}`}
              >
                {inst.impairmentStage}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            {inst.name} · {inst.instrumentType} · {inst.issuer}
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-gray-500 hover:bg-pale-red hover:text-primary hover:border-primary transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      <Tabs<Tab>
        tabs={tabs}
        value={tab}
        onChange={setTab}
        variant="underline"
        size="md"
      />

      {tab === "summary" && (
        <SummaryTab
          inst={inst}
          val={valuation}
          valuationDate={v.assumptions.valuationDate}
        />
      )}
      {tab === "amort" && <AmortTab inst={inst} val={valuation} />}
      {tab === "cashflow" && <CashFlowTab inst={inst} val={valuation} />}
      {tab === "income" && <IncomeTab inst={inst} val={valuation} />}
      {tab === "fairvalue" && <FairValueTab inst={inst} val={valuation} />}
      {tab === "oci" && <OCITab inst={inst} val={valuation} />}
      {tab === "risk" && <RiskTab inst={inst} val={valuation} />}
      {tab === "audit" && <AuditTab inst={inst} val={valuation} />}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-dark-gray">
              Delete instrument?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You are about to remove{" "}
              <span className="font-mono">{inst.id}</span> — {inst.name}. This
              action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  v.removeInstrument(inst.id);
                  navigate("/valuation/inventory");
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ─── per-tab small helpers (closure access to ccy) ─── */
}

/* ════════════════════════════════════════════════════════
   Row & Tab Components
   ════════════════════════════════════════════════════════ */

function Row({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-3 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${
          emphasis ? "font-semibold text-dark-gray" : "text-dark-gray"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryTab({
  inst,
  val,
  valuationDate,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
  valuationDate: string;
}) {
  const ccy = inst.currency;
  const isAC = inst.classification === "AC";
  const isFVOCI = inst.classification === "FVOCI";
  const isFVTPL = inst.classification === "FVTPL";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Instrument Profile">
        <Row label="Instrument ID" value={inst.id} mono />
        <Row label="Name" value={inst.name} />
        <Row label="Type" value={inst.instrumentType} />
        <Row label="Issuer" value={inst.issuer} />
        <Row label="Sector" value={inst.sector} />
        <Row
          label="Classification"
          value={CLASSIFICATION_LABEL[inst.classification]}
        />
        <Row label="IFRS 13 Level" value={inst.ifrs13Level} />
        <Row label="Currency" value={ccy} />
        <Row label="Coupon Frequency" value={inst.couponFrequency} />
        <Row label="Status" value={inst.status} />
      </SectionCard>

      <SectionCard title="Key Dates & Pricing">
        <Row label="Face Value" value={fmtMoney(inst.faceValue, ccy)} mono />
        <Row
          label="Purchase Price"
          value={fmtMoney(inst.purchasePrice, ccy)}
          mono
        />
        <Row label="Purchase Date" value={fmtDate(inst.purchaseDate)} mono />
        <Row label="Maturity Date" value={fmtDate(inst.maturityDate)} mono />
        <Row label="Coupon Rate" value={fmtPct(inst.couponRate)} mono />
        <Row label="Valuation Date" value={fmtDate(valuationDate)} mono />
      </SectionCard>

      <SectionCard title="Carrying & Fair Value" className="lg:col-span-2">
        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
          {isAC && (
            <>
              <Row
                label="Carrying Value (Today)"
                value={fmtMoney(val.acCarryingValue, ccy)}
                mono
                emphasis
              />
              <Row
                label="Accrued Interest"
                value={fmtMoney(val.accruedInterest, ccy)}
                mono
              />
              <Row
                label="Total Book Value (Dirty)"
                value={fmtMoney(val.totalBookValueDirty, ccy)}
                mono
                emphasis
              />
              <Row
                label="Fair Value (Informational)"
                value={fmtMoney(val.cleanFairValue, ccy)}
                mono
              />
            </>
          )}
          {isFVOCI && (
            <>
              <Row
                label="AC Carrying Value"
                value={fmtMoney(val.acCarryingValue, ccy)}
                mono
              />
              <Row
                label="Fair Value (Balance Sheet)"
                value={fmtMoney(val.cleanFairValue, ccy)}
                mono
                emphasis
              />
              <Row
                label="OCI Reserve (FV − AC)"
                value={fmtMoney(val.ociReserve, ccy)}
                mono
                emphasis
              />
              <Row
                label="Accrued Interest"
                value={fmtMoney(val.accruedInterest, ccy)}
                mono
              />
              <Row
                label="Total Carrying Value (Dirty)"
                value={fmtMoney(val.dirtyFairValue, ccy)}
                mono
              />
            </>
          )}
          {isFVTPL && (
            <>
              <Row
                label="Fair Value (Balance Sheet)"
                value={fmtMoney(val.cleanFairValue, ccy)}
                mono
                emphasis
              />
              <Row
                label="Purchase Price"
                value={fmtMoney(inst.purchasePrice, ccy)}
                mono
              />
              <Row
                label="Unrealised Gain / (Loss)"
                value={fmtMoney(val.unrealisedGL, ccy)}
                mono
                emphasis
              />
              <Row
                label="Accrued Interest / Income"
                value={fmtMoney(val.accruedInterest, ccy)}
                mono
              />
            </>
          )}
          {ccy !== "NGN" && (
            <>
              <Row
                label="FX Rate (vs NGN)"
                value={fmtNumber(
                  val.balanceSheetValueNGN / (val.cleanFairValue || 1),
                  2,
                )}
                mono
              />
              <Row
                label="Balance Sheet Value (NGN)"
                value={`₦${val.balanceSheetValueNGN.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                mono
                emphasis
              />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function AmortTab({
  inst,
  val,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
}) {
  const ccy = inst.currency;
  const isZero = inst.couponFrequency === "Zero";
  return (
    <div className="space-y-5">
      <SectionCard title={isZero ? "Discount Amortisation" : "EIR Summary"}>
        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
          <Row
            label="Purchase Price"
            value={fmtMoney(inst.purchasePrice, ccy)}
            mono
          />
          <Row label="Face Value" value={fmtMoney(inst.faceValue, ccy)} mono />
          <Row
            label="Discount at Purchase"
            value={fmtMoney(val.discountAtPurchase, ccy)}
            mono
          />
          <Row
            label="Effective Interest Rate (EIR)"
            value={fmtPct(val.eir, 4)}
            mono
            emphasis
          />
          {!isZero && (
            <Row
              label="Stated Coupon Rate"
              value={fmtPct(inst.couponRate, 4)}
              mono
            />
          )}
        </div>
      </SectionCard>

      {!isZero && val.amortSchedule.length > 0 && (
        <SectionCard title="Amortisation Schedule" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Per</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-right">Opening Bal</th>
                  <th className="px-4 py-2.5 text-right">EIR Income</th>
                  <th className="px-4 py-2.5 text-right">Coupon CF</th>
                  <th className="px-4 py-2.5 text-right">Amort</th>
                  <th className="px-4 py-2.5 text-right">Closing Bal</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {val.amortSchedule.map((r) => (
                  <tr
                    key={r.period}
                    className={`border-b border-border/60 font-mono text-xs ${
                      r.status === "Current"
                        ? "bg-pale-red/30 font-semibold"
                        : r.status === "Future"
                          ? ""
                          : "text-gray-400"
                    }`}
                  >
                    <td className="px-4 py-2">{r.period}</td>
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.openingBalance, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.eirIncome, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.couponCF, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.amortisation, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.closingBalance, 0)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === "Past"
                            ? "bg-gray-100 text-gray-500"
                            : r.status === "Current"
                              ? "bg-pale-red text-primary"
                              : "bg-teal-50 text-success"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {inst.classification === "FVOCI" && val.ociMovement.length > 0 && (
        <SectionCard title="OCI Reserve Movement" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Per</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-right">AC Carrying Val</th>
                  <th className="px-4 py-2.5 text-right">Fair Value (Est.)</th>
                  <th className="px-4 py-2.5 text-right">OCI Reserve</th>
                </tr>
              </thead>
              <tbody>
                {val.ociMovement.map((r) => (
                  <tr
                    key={r.period}
                    className="border-b border-border/60 font-mono text-xs"
                  >
                    <td className="px-4 py-2">{r.period}</td>
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.acCarryingValue, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.fairValueEst, 0)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${
                        r.ociReserve >= 0 ? "text-success" : "text-primary"
                      }`}
                    >
                      {fmtNumber(r.ociReserve, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function CashFlowTab({
  inst,
  val,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
}) {
  const ccy = inst.currency;
  const totalFuture = val.cashFlowSchedule
    .filter((r) => r.status === "Future")
    .reduce((s, r) => s + r.amount, 0);
  return (
    <SectionCard title="Cash Flow Schedule" noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 text-left">#</th>
              <th className="px-4 py-2.5 text-left">Date</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-right">Days to CF</th>
              <th className="px-4 py-2.5 text-right">PV of CF</th>
              <th className="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {val.cashFlowSchedule.map((r) => (
              <tr
                key={r.period}
                className={`border-b border-border/60 font-mono text-xs ${
                  r.status === "Past" ? "text-gray-400" : ""
                }`}
              >
                <td className="px-4 py-2">{r.period}</td>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2 font-sans">{r.type}</td>
                <td className="px-4 py-2 text-right">
                  {fmtNumber(r.amount, 0)}
                </td>
                <td className="px-4 py-2 text-right">{r.daysToCF}</td>
                <td className="px-4 py-2 text-right">
                  {r.pvOfCF != null ? fmtMoney(r.pvOfCF, ccy, 2) : "—"}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === "Past"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-teal-50 text-success"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-mono text-xs font-bold">
              <td
                colSpan={3}
                className="px-4 py-2.5 text-right font-sans uppercase text-gray-500"
              >
                Total Future
              </td>
              <td className="px-4 py-2.5 text-right">
                {fmtNumber(totalFuture, 0)}
              </td>
              <td />
              <td className="px-4 py-2.5 text-right">
                {fmtMoney(val.totalFuturePV, ccy, 2)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function IncomeTab({
  inst,
  val,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
}) {
  const ccy = inst.currency;
  const cls = inst.classification;
  return (
    <div className="space-y-5">
      {cls === "AC" && (
        <SectionCard title="P&L Summary — Amortised Cost">
          <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Amortised Cost only EIR interest recognised in P&L. No fair value
            movements recognised.
          </p>
          <Row
            label="EIR (Effective Interest Rate)"
            value={fmtPct(val.eir, 4)}
            mono
          />
          <Row
            label="Carrying Value (Today)"
            value={fmtMoney(val.acCarryingValue, ccy)}
            mono
          />
          <Row
            label="Accrued Interest (today)"
            value={fmtMoney(val.accruedInterest, ccy)}
            mono
          />
          <Row
            label="Estimated Annual EIR Income"
            value={fmtMoney(val.annualEIRIncome, ccy)}
            mono
            emphasis
          />
          <Row
            label="ECL Provision"
            value={fmtMoney(inst.eclProvision ?? 0, ccy)}
            mono
          />
          <Row label="Impairment Stage" value={inst.impairmentStage ?? "N/A"} />
        </SectionCard>
      )}

      {cls === "FVOCI" && (
        <>
          <SectionCard title="P&L Section">
            <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Hits Income Statement — EIR interest recognised in P&L.
            </p>
            <Row
              label="EIR Interest Income (annual est.)"
              value={fmtMoney(val.annualEIRIncome, ccy)}
              mono
              emphasis
            />
            <Row
              label="Accrued Interest (today)"
              value={fmtMoney(val.accruedInterest, ccy)}
              mono
            />
            <Row
              label="ECL Charge (P&L)"
              value={fmtMoney(-(inst.eclProvision ?? 0), ccy)}
              mono
            />
          </SectionCard>
          <SectionCard title="OCI Section">
            <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Sits in Equity — bypasses P&L. Recycled to P&L upon disposal.
            </p>
            <Row
              label="AC Carrying Value"
              value={fmtMoney(val.acCarryingValue, ccy)}
              mono
            />
            <Row
              label="Fair Value"
              value={fmtMoney(val.cleanFairValue, ccy)}
              mono
            />
            <Row
              label="OCI Reserve (Unrealised)"
              value={fmtMoney(val.ociReserve, ccy)}
              mono
              emphasis
            />
            <Row
              label="OCI Position"
              value={
                <span
                  className={`font-semibold ${
                    val.ociReserve >= 0 ? "text-success" : "text-primary"
                  }`}
                >
                  Unrealised {val.ociReserve >= 0 ? "GAIN" : "LOSS"}
                </span>
              }
            />
            <Row
              label="Impairment Stage"
              value={inst.impairmentStage ?? "N/A"}
            />
          </SectionCard>
        </>
      )}

      {cls === "FVTPL" && (
        <SectionCard title="P&L Summary — FVTPL">
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            FVTPL — ALL fair value movements hit P&L immediately. No OCI. No ECL
            required.
          </p>
          <Row
            label="Purchase Price"
            value={fmtMoney(inst.purchasePrice, ccy)}
            mono
          />
          <Row
            label="Current Fair Value"
            value={fmtMoney(val.cleanFairValue, ccy)}
            mono
          />
          <Row
            label="Unrealised Gain / (Loss) — P&L"
            value={fmtMoney(val.unrealisedGL, ccy)}
            mono
            emphasis
          />
          <Row
            label="Accrued / Coupon Income"
            value={fmtMoney(val.accruedInterest, ccy)}
            mono
          />
          <Row
            label="P&L Position"
            value={
              <span
                className={`font-semibold ${
                  val.unrealisedGL >= 0 ? "text-success" : "text-primary"
                }`}
              >
                {val.unrealisedGL >= 0 ? "GAIN" : "LOSS"} in P&L
              </span>
            }
          />
        </SectionCard>
      )}
    </div>
  );
}

function FairValueTab({
  inst,
  val,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
}) {
  const ccy = inst.currency;
  const bps = ((val.marketYieldUsed - inst.couponRate) * 100).toFixed(2);
  return (
    <SectionCard title="Fair Value Detail">
      <Row label="Valuation Method" value="Discounted Cash Flow (DCF)" />
      <Row label="Yield Curve" value={val.yieldCurveLabel} />
      <Row
        label="Interpolated Market Yield"
        value={fmtPct(val.marketYieldUsed, 4)}
        mono
      />
      {inst.couponRate > 0 && (
        <>
          <Row
            label="Purchase Yield / Coupon Rate"
            value={fmtPct(inst.couponRate, 4)}
            mono
          />
          <Row
            label="Yield Movement (market vs coupon)"
            value={`${bps} bps approx`}
            mono
          />
        </>
      )}
      <Row
        label="Clean Fair Value"
        value={fmtMoney(val.cleanFairValue, ccy)}
        mono
        emphasis
      />
      <Row
        label="Accrued Interest"
        value={fmtMoney(val.accruedInterest, ccy)}
        mono
      />
      <Row
        label="Dirty Fair Value"
        value={fmtMoney(val.dirtyFairValue, ccy)}
        mono
      />
      <Row label="IFRS 13 Level" value={inst.ifrs13Level} />
    </SectionCard>
  );
}

function OCITab({
  inst,
  val,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
}) {
  const ccy = inst.currency;
  const tax = 0.3;
  const oci = val.ociReserve;
  const taxEffect = -oci * tax;
  const net = oci + taxEffect;
  return (
    <SectionCard title="OCI Recycling Simulation (If sold today)">
      <Row
        label="Current Fair Value"
        value={fmtMoney(val.cleanFairValue, ccy)}
        mono
      />
      <Row
        label="AC Carrying Value"
        value={fmtMoney(val.acCarryingValue, ccy)}
        mono
      />
      <Row
        label="OCI Reserve (to be recycled)"
        value={fmtMoney(oci, ccy)}
        mono
      />
      <Row
        label="Estimated Sale Price (at FV)"
        value={fmtMoney(val.cleanFairValue, ccy)}
        mono
      />
      <Row
        label="P&L Impact on Sale (OCI recycled)"
        value={fmtMoney(oci, ccy)}
        mono
        emphasis
      />
      <Row
        label="Estimated Tax Effect (30%)"
        value={fmtMoney(taxEffect, ccy)}
        mono
      />
      <Row label="Net P&L After Tax" value={fmtMoney(net, ccy)} mono emphasis />
    </SectionCard>
  );
}

function RiskTab({
  inst,
  val,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
}) {
  const ccy = inst.currency;
  const r = val.risk;
  return (
    <SectionCard title="Risk Metrics">
      <div className="grid gap-x-8 md:grid-cols-2">
        <Row
          label="Remaining Tenor (Yrs)"
          value={r.remainingTenorYears.toFixed(2)}
          mono
        />
        <Row
          label="Macaulay Duration"
          value={r.macaulayDuration.toFixed(2)}
          mono
        />
        <Row
          label="Modified Duration"
          value={r.modifiedDuration.toFixed(2)}
          mono
        />
        <Row label="DV01 (per bp)" value={fmtNumber(r.dv01, 2)} mono />
        <Row label="Convexity" value={r.convexity.toFixed(4)} mono />
        {r.nextCouponDate && (
          <>
            <Row label="Next Coupon Date" value={r.nextCouponDate} mono />
            <Row
              label="Next Coupon Amount"
              value={fmtMoney(r.nextCouponAmount, ccy)}
              mono
            />
            <Row
              label="Days to Next Coupon"
              value={r.daysToNextCoupon ?? "—"}
              mono
            />
          </>
        )}
      </div>
    </SectionCard>
  );
}

function AuditTab({
  inst,
  val,
}: {
  inst: Instrument;
  val: ReturnType<typeof valueInstrument>;
}) {
  const ccy = inst.currency;
  const valuationModel =
    inst.classification === "AC" ? "EIR Amortisation" : "DCF / Market Price";
  return (
    <SectionCard title="Audit Trail">
      <Row label="Booked By" value={inst.bookedBy ?? inst.status} />
      <Row label="Initial Classification" value={inst.classification} />
      <Row label="Reclassification History" value="None" />
      <Row label="Last Valuation Run" value="2026-05-28 08:00 AM" mono />
      <Row label="Valuation Model" value={valuationModel} />
      <Row label="IFRS 13 Level" value={inst.ifrs13Level} />
      <Row label="Impairment Stage" value={inst.impairmentStage ?? "N/A"} />
      <Row
        label="ECL Provision"
        value={fmtMoney(inst.eclProvision ?? 0, ccy)}
        mono
      />
      <Row
        label="Annual EIR Income"
        value={fmtMoney(val.annualEIRIncome, ccy)}
        mono
      />
    </SectionCard>
  );
}
