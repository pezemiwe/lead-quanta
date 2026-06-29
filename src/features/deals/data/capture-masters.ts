import type { AssetClass } from "../../workflow/types";
import type { PersonaRole } from "../../../context/platform-personas";

export const COUNTERPARTIES = [
  "Zenith Bank Plc",
  "Access Bank Plc",
  "First Bank of Nigeria",
  "GTBank Plc",
  "Stanbic IBTC Bank",
  "United Bank for Africa",
  "FBNQuest Merchant Bank",
  "Coronation Merchant Bank",
];

export const ISSUERS = [
  "Federal Government of Nigeria",
  "Dangote Cement Plc",
  "MTN Nigeria Communications",
  "Nestlé Nigeria Plc",
  "BUA Foods Plc",
  "Lafarge Africa Plc",
  "Seplat Energy Plc",
  "Flour Mills of Nigeria",
];

export const ISSUER_TICKERS: Record<string, string> = {
  "Dangote Cement Plc": "DANGCEM",
  "MTN Nigeria Communications": "MTNN",
  "Nestlé Nigeria Plc": "NESTLE",
  "BUA Foods Plc": "BUACEMENT",
  "Lafarge Africa Plc": "WAPCO",
  "Seplat Energy Plc": "SEPLAT",
  "Flour Mills of Nigeria": "FLOURMILL",
};

export const BROKERS = [
  "CardinalStone Partners",
  "Meristem Stockbrokers",
  "ARM Securities",
  "FBNQuest Securities",
  "United Capital Securities",
];

export const BANK_ACCOUNTS = [
  {
    id: "acct-ngn-main",
    label: "Leadway NGN Operating — 0123456789",
    bank: "Zenith Bank Plc",
    accountNumber: "0123456789",
    accountName: "Leadway Assurance Company Ltd",
    sortCode: "057",
    swift: "ZEIBNGLA",
    currency: "NGN",
  },
  {
    id: "acct-usd",
    label: "Leadway USD Custody — 2045678901",
    bank: "Stanbic IBTC Bank",
    accountNumber: "2045678901",
    accountName: "Leadway Assurance Company Ltd",
    sortCode: "221",
    swift: "SBICNGLX",
    currency: "USD",
  },
  {
    id: "acct-gbp",
    label: "Leadway GBP — 3045678902",
    bank: "Standard Chartered Bank",
    accountNumber: "3045678902",
    accountName: "Leadway Assurance Company Ltd",
    sortCode: "068",
    swift: "SCBLNGLA",
    currency: "GBP",
  },
];

export const COUNTERPARTY_BANKS = [
  { name: "Zenith Bank Plc", accountNumber: "1012345678", accountName: "Counterparty Settlement Account", sortCode: "057", swift: "ZEIBNGLA" },
  { name: "Access Bank Plc", accountNumber: "1023456789", accountName: "Counterparty Settlement Account", sortCode: "044", swift: "ABNGNGLA" },
  { name: "GTBank Plc", accountNumber: "1034567890", accountName: "Counterparty Settlement Account", sortCode: "058", swift: "GTBINGLA" },
];

export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

export const RATINGS = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "NR"];

export const ROLLOVER_OPTIONS = [
  "Rollover Principal",
  "Rollover Principal + Interest",
  "Terminate",
];

export const DAY_COUNT_OPTIONS = ["Actual/365", "Actual/360", "30/360"];

export const TRANSACTION_TYPES: Record<AssetClass, string[]> = {
  "Fixed deposits and call deposits": ["Purchase", "Sale", "Rollover"],
  "Treasury bills and commercial papers": ["Purchase", "Sale", "Rollover", "Partial Disposal"],
  Bonds: ["Purchase", "Sale", "Partial Disposal"],
  Equities: ["Purchase", "Sale"],
  "Mutual funds": ["Subscription", "Redemption"],
  "Alternative investments": [
    "Subscription",
    "Capital Call",
    "Distribution",
    "Redemption",
  ],
};

const ROLE_PORTFOLIOS: Partial<Record<PersonaRole, string[]>> = {
  "Money Market Trader": ["pb-trading", "pb-banking"],
  "Fixed Income Trader": ["pb-banking", "pb-htm"],
  "Equity Trader": ["pb-trading"],
  "Alternative Investment Officer": ["pb-trading", "pb-banking", "pb-htm"],
  "Portfolio Manager": ["pb-trading", "pb-banking", "pb-htm"],
};

export function authorisedPortfolioIds(role: string): string[] | null {
  return ROLE_PORTFOLIOS[role as PersonaRole] ?? null;
}
