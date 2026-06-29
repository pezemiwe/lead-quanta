import type { AssetClass } from "../types";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
  tip?: string;
  readOnly?: boolean;
  master?: "counterparty" | "issuer" | "broker" | "bankAccount" | "counterpartyBank";
  step?: string;
  maxLength?: number;
}

export interface DocumentSlot {
  id: string;
  label: string;
  required: boolean;
  accept: string;
  multiple?: boolean;
}

export const ASSET_CLASSES: AssetClass[] = [
  "Fixed deposits and call deposits",
  "Treasury bills and commercial papers",
  "Bonds",
  "Equities",
  "Mutual funds",
  "Alternative investments",
];

export const SETTLEMENT_FIELDS: FieldDef[] = [
  { key: "counterpartyBank", label: "Counterparty bank", master: "counterpartyBank" },
  { key: "beneficiaryAccountNumber", label: "Beneficiary account number", readOnly: true },
  { key: "beneficiaryAccountName", label: "Beneficiary account name", readOnly: true },
  { key: "sortCodeOrSwift", label: "Sort code / SWIFT", readOnly: true },
  {
    key: "paymentNarrative",
    label: "Payment narrative / reference",
    maxLength: 140,
    placeholder: "Max 140 characters",
  },
  { key: "settlementCurrency", label: "Currency of settlement", readOnly: true },
  {
    key: "bankConfirmationNote",
    label: "Bank confirmation note",
    type: "textarea",
    placeholder: "Paste or summarise the bank's deal confirmation — deal ref, rate, value date, settlement account",
  },
  {
    key: "custodianNote",
    label: "Custodian note",
    type: "textarea",
    placeholder: "Custodian's settlement confirmation — CSCS ref, custody account, transfer instructions",
  },
];

const FD_FIELDS: FieldDef[] = [
  { key: "counterparty", label: "Counterparty", master: "counterparty" },
  { key: "principal", label: "Principal amount", type: "number", step: "0.01" },
  {
    key: "currency",
    label: "Currency",
    type: "select",
    options: ["NGN", "USD", "GBP", "EUR"],
  },
  { key: "rate", label: "Interest rate %", type: "number", step: "0.0001" },
  {
    key: "dayCount",
    label: "Day count convention",
    type: "select",
    options: ["Actual/365", "Actual/360", "30/360"],
  },
  { key: "tradeDate", label: "Trade date", type: "date" },
  { key: "valueDate", label: "Value date", type: "date" },
  { key: "maturityDate", label: "Maturity date", type: "date" },
  { key: "tenor", label: "Tenor (days)", readOnly: true },
  { key: "expectedInterest", label: "Expected interest", readOnly: true },
  { key: "expectedMaturityValue", label: "Expected maturity value", readOnly: true },
  { key: "settlementAccountId", label: "Settlement account", master: "bankAccount" },
  {
    key: "rolloverInstruction",
    label: "Rollover instruction",
    type: "select",
    options: ["Rollover Principal", "Rollover Principal + Interest", "Terminate"],
  },
];

const TBILL_FIELDS: FieldDef[] = [
  { key: "issuer", label: "Issuer", master: "issuer" },
  { key: "counterparty", label: "Counterparty / dealer", master: "counterparty" },
  { key: "faceValue", label: "Face value", type: "number", step: "0.01" },
  { key: "purchasePrice", label: "Purchase price", type: "number", step: "0.01" },
  {
    key: "yieldMode",
    label: "Rate mode",
    type: "select",
    options: ["Discount Rate %", "Yield %"],
  },
  { key: "discountRateOrYield", label: "Discount rate / yield %", type: "number", step: "0.0001" },
  { key: "maturityValue", label: "Maturity value", readOnly: true },
  { key: "settlementDate", label: "Settlement date", type: "date" },
  { key: "maturityDate", label: "Maturity date", type: "date" },
  { key: "tenor", label: "Tenor (days)", readOnly: true },
  {
    key: "rating",
    label: "Issuer rating",
    type: "select",
    options: ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "NR"],
  },
];

const BOND_FIELDS: FieldDef[] = [
  { key: "issuer", label: "Issuer", master: "issuer" },
  { key: "counterparty", label: "Counterparty / dealer", master: "counterparty" },
  { key: "isin", label: "ISIN", placeholder: "NGXXXXXXXXXX" },
  { key: "faceValue", label: "Face value", type: "number", step: "0.01" },
  { key: "coupon", label: "Coupon rate %", type: "number", step: "0.0001" },
  {
    key: "couponFrequency",
    label: "Coupon frequency",
    type: "select",
    options: ["Annual", "Semi-Annual", "Quarterly", "Monthly"],
  },
  { key: "cleanPrice", label: "Clean price", type: "number", step: "0.0001" },
  { key: "accruedInterest", label: "Accrued interest", type: "number", step: "0.01" },
  { key: "dirtyPrice", label: "Dirty price", readOnly: true },
  { key: "yield", label: "Yield %", type: "number", step: "0.0001" },
  { key: "settlementValue", label: "Settlement value", readOnly: true },
  { key: "settlementDate", label: "Settlement date", type: "date" },
  { key: "maturityDate", label: "Maturity date", type: "date" },
  { key: "duration", label: "Duration", readOnly: true },
  { key: "dv01", label: "DV01", readOnly: true },
];

const EQUITY_FIELDS: FieldDef[] = [
  { key: "issuer", label: "Issuer / company", master: "issuer" },
  { key: "ticker", label: "Ticker / symbol", readOnly: true },
  { key: "broker", label: "Broker", master: "broker" },
  { key: "quantity", label: "Quantity / units", type: "number", step: "1" },
  { key: "price", label: "Price per unit", type: "number", step: "0.0001" },
  { key: "brokerageFee", label: "Brokerage fee", type: "number", step: "0.01" },
  { key: "otherFees", label: "Other fees", type: "number", step: "0.01" },
  { key: "tradeDate", label: "Trade date", type: "date" },
  { key: "settlementDate", label: "Settlement date (T+2)", type: "date" },
  { key: "grossSettlementValue", label: "Gross settlement value", readOnly: true },
  { key: "netSettlementValue", label: "Net settlement value", readOnly: true },
  {
    key: "cscsOrCustodian",
    label: "CSCS / custodian",
    type: "select",
    options: ["First Bank Custody", "Stanbic IBTC Custody", "UBA Custody", "CSCS Direct"],
  },
];

const MUTUAL_FUND_FIELDS: FieldDef[] = [
  { key: "fundName", label: "Fund name" },
  { key: "fundManager", label: "Fund manager" },
  {
    key: "transactionSubType",
    label: "Transaction sub-type",
    type: "select",
    options: ["Subscription", "Redemption"],
  },
  { key: "nav", label: "NAV per unit", type: "number", step: "0.0001" },
  { key: "units", label: "Number of units", type: "number", step: "0.0001" },
  { key: "totalAmount", label: "Total subscription / redemption", readOnly: true },
  { key: "valuationDate", label: "Valuation date", type: "date" },
  { key: "settlementAccountId", label: "Settlement account", master: "bankAccount" },
];

const ALT_FIELDS: FieldDef[] = [
  { key: "fundOrAssetName", label: "Fund / asset name" },
  { key: "fundManager", label: "Fund manager" },
  {
    key: "transactionSubType",
    label: "Transaction sub-type",
    type: "select",
    options: ["Subscription", "Capital Call", "Distribution", "Redemption"],
  },
  { key: "commitment", label: "Commitment amount", type: "number", step: "0.01" },
  { key: "capitalCall", label: "Capital call amount", type: "number", step: "0.01" },
  { key: "distribution", label: "Distribution amount", type: "number", step: "0.01" },
  { key: "nav", label: "NAV per unit", type: "number", step: "0.0001" },
  { key: "units", label: "Number of units", type: "number", step: "0.0001" },
  { key: "totalAmount", label: "Total amount", readOnly: true },
  { key: "valuationDate", label: "Valuation date", type: "date" },
  {
    key: "valuationBasis",
    label: "Valuation basis",
    type: "select",
    options: ["NAV", "DCF", "Market Comparable", "Manual"],
  },
  { key: "settlementAccountId", label: "Settlement account", master: "bankAccount" },
  { key: "exitTerms", label: "Exit terms", type: "textarea" },
];

/** @deprecated use getEconomicsFields */
export const MANDATORY_FIELDS: Record<AssetClass, FieldDef[]> = {
  "Fixed deposits and call deposits": FD_FIELDS,
  "Treasury bills and commercial papers": TBILL_FIELDS,
  Bonds: BOND_FIELDS,
  Equities: EQUITY_FIELDS,
  "Mutual funds": MUTUAL_FUND_FIELDS,
  "Alternative investments": ALT_FIELDS,
};

function altFieldsForType(subType: string): FieldDef[] {
  const base = ALT_FIELDS.filter(
    (f) =>
      !["commitment", "capitalCall", "distribution"].includes(f.key) ||
      (subType === "Subscription" && f.key === "commitment") ||
      (subType === "Capital Call" && f.key === "capitalCall") ||
      (subType === "Distribution" && f.key === "distribution") ||
      subType === "Redemption",
  );
  if (subType === "Subscription") {
    return base.filter((f) => f.key !== "capitalCall" && f.key !== "distribution");
  }
  if (subType === "Capital Call") {
    return base.filter((f) => f.key !== "commitment" && f.key !== "distribution");
  }
  if (subType === "Distribution") {
    return base.filter((f) => f.key !== "commitment" && f.key !== "capitalCall");
  }
  return base.filter((f) => f.key !== "commitment" && f.key !== "capitalCall" && f.key !== "distribution");
}

export function getEconomicsFields(
  assetClass: AssetClass,
  transactionSubType = "",
): FieldDef[] {
  if (assetClass === "Alternative investments") {
    return altFieldsForType(transactionSubType || "Subscription");
  }
  return MANDATORY_FIELDS[assetClass];
}

export function getDocumentSlots(
  assetClass: AssetClass,
  transactionSubType = "",
): DocumentSlot[] {
  const common: DocumentSlot[] = [
    {
      id: "legal",
      label: "Legal documents",
      required: false,
      accept: ".pdf,.jpg,.jpeg,.png",
      multiple: true,
    },
    {
      id: "other",
      label: "Other supporting documents",
      required: false,
      accept: ".pdf,.jpg,.jpeg,.png",
      multiple: true,
    },
  ];

  if (assetClass === "Fixed deposits and call deposits") {
    return [
      {
        id: "quote",
        label: "Quote / term sheet",
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png",
      },
      ...common,
    ];
  }
  if (assetClass === "Treasury bills and commercial papers") {
    return [
      {
        id: "quote",
        label: "Quote / term sheet",
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png",
      },
      ...common,
    ];
  }
  if (assetClass === "Equities") {
    return [
      {
        id: "brokerNote",
        label: "Broker note",
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png",
      },
      ...common,
    ];
  }
  if (assetClass === "Mutual funds") {
    return [
      {
        id: "navStatement",
        label: "NAV statement",
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png",
      },
      ...common,
    ];
  }
  if (assetClass === "Alternative investments") {
    const slots: DocumentSlot[] = [
      {
        id: "memo",
        label: "Investment memo",
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png",
      },
    ];
    if (transactionSubType === "Capital Call") {
      slots.push({
        id: "capitalCallNotice",
        label: "Capital call notice",
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png",
      });
    }
    return [...slots, ...common];
  }
  return common;
}

export function emptyFieldsForAssetClass(assetClass: AssetClass): Record<string, string> {
  const keySet = new Set<string>([
    "transactionType",
    "yieldMode",
    ...getEconomicsFields(assetClass).map((f) => f.key),
    ...SETTLEMENT_FIELDS.map((f) => f.key),
  ]);
  const map = Object.fromEntries([...keySet].map((k) => [k, ""]));
  if (assetClass === "Treasury bills and commercial papers") {
    map.yieldMode = "Discount Rate %";
  }
  if (assetClass === "Fixed deposits and call deposits") {
    map.currency = "NGN";
  }
  map.tradeDate = new Date().toISOString().slice(0, 10);
  return map;
}

export function validateMandatoryFields(
  assetClass: AssetClass,
  fields: Record<string, string>,
  transactionSubType = "",
): string[] {
  const missing: string[] = [];
  const defs = [...getEconomicsFields(assetClass, transactionSubType), ...SETTLEMENT_FIELDS];
  for (const def of defs) {
    if (def.readOnly) continue;
    if (!fields[def.key]?.trim()) missing.push(def.label);
  }
  return missing;
}

export function validateDocuments(
  assetClass: AssetClass,
  uploaded: Record<string, File[]>,
  transactionSubType = "",
): string[] {
  const missing: string[] = [];
  for (const slot of getDocumentSlots(assetClass, transactionSubType)) {
    if (slot.required && !(uploaded[slot.id]?.length > 0)) {
      missing.push(slot.label);
    }
  }
  return missing;
}

export function dealSlipLabel(fields: Record<string, string>, assetClass: AssetClass): string {
  const primary =
    fields.fundOrAssetName ||
    fields.fundName ||
    fields.ticker ||
    fields.isin ||
    fields.issuer ||
    fields.counterparty ||
    "Untitled deal";
  return `${primary} · ${assetClass.split(" ")[0]}`;
}

export function dealNotional(fields: Record<string, string>): number {
  const raw =
    fields.netSettlementValue ||
    fields.grossSettlementValue ||
    fields.settlementValue ||
    fields.expectedMaturityValue ||
    fields.principal ||
    fields.faceValue ||
    fields.totalAmount ||
    fields.subscriptionAmount ||
    fields.capitalCall ||
    fields.commitment ||
    fields.distribution ||
    "0";
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
