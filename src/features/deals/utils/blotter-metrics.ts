import type { DealSlip, RegisterPosition } from "../../workflow/types";
import { dealNotional } from "../../workflow/engine/fields";

export const REF_DATE = "2026-05-28";

export function parseDate(s: string): Date {
  return new Date(`${s.slice(0, 10)}T00:00:00`);
}

export function daysBetween(from: string, to: string): number {
  const a = parseDate(from).getTime();
  const b = parseDate(to).getTime();
  return Math.round((b - a) / 86400000);
}

export function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}bn`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  return `₦${n.toLocaleString()}`;
}

export function transactionType(deal: DealSlip): string {
  if (deal.assetClass.includes("deposit")) return "Placement";
  if (deal.assetClass === "Equities") return "Equity Trade";
  if (deal.assetClass === "Bonds") return "Bond Purchase";
  if (deal.assetClass.includes("Treasury")) return "T-Bill / CP";
  if (deal.assetClass === "Mutual funds") return "Fund Subscription";
  return "Alternative Subscription";
}

export function counterpartyOrIssuer(deal: DealSlip): string {
  return (
    deal.fields.counterparty ||
    deal.fields.issuer ||
    deal.fields.fundManager ||
    deal.fields.fundOrAssetName ||
    "—"
  );
}

export function rateOrPrice(deal: DealSlip): string {
  const r =
    deal.fields.rate ||
    deal.fields.yield ||
    deal.fields.discountRateOrYield ||
    deal.fields.price ||
    deal.fields.cleanPrice;
  return r ? (deal.fields.rate || deal.fields.yield ? `${r}%` : r) : "—";
}

export function tradeDate(deal: DealSlip): string {
  return deal.fields.tradeDate || deal.fields.purchaseDate || deal.createdAt.slice(0, 10);
}

export function valueDate(deal: DealSlip): string {
  return deal.fields.valueDate || deal.fields.settlementDate || "—";
}

export type LimitFlag = "ok" | "watch" | "breach" | "pending" | "na";

export function limitFlag(deal: DealSlip): LimitFlag {
  if (deal.status === "Draft" || deal.status === "Rejected") return "na";
  const check = deal.checks.find((c) => c.type === "limit");
  if (check) {
    if (check.status === "pass" || check.status === "cleared") return "ok";
    if (check.status === "watch") return "watch";
    if (check.status === "breach") return "breach";
    return "pending";
  }
  const notional = dealNotional(deal.fields);
  if (notional > 5_000_000_000) return "breach";
  if (notional > 3_000_000_000) return "watch";
  return "ok";
}

export function daysInStatus(deal: DealSlip, refDate = REF_DATE): number {
  const since = deal.updatedAt.slice(0, 10);
  return Math.max(0, daysBetween(since, refDate));
}

const CP_LIMIT = 5_000_000_000;

export function counterpartyUtilisation(deals: DealSlip[], register: RegisterPosition[]) {
  const exposure = new Map<string, number>();
  for (const d of deals) {
    if (["Rejected", "Draft"].includes(d.status)) continue;
    const cp = counterpartyOrIssuer(d);
    exposure.set(cp, (exposure.get(cp) ?? 0) + dealNotional(d.fields));
  }
  for (const p of register) {
    exposure.set(p.counterparty, (exposure.get(p.counterparty) ?? 0) + p.notional);
  }
  let top = { name: "—", pct: 0 };
  for (const [name, amt] of exposure) {
    const pct = (amt / CP_LIMIT) * 100;
    if (pct > top.pct) top = { name, pct };
  }
  return top;
}

export function portfolioExposurePct(
  deal: DealSlip,
  deals: DealSlip[],
  register: RegisterPosition[],
): number {
  let portfolioTotal = 0;
  for (const d of deals) {
    if (d.portfolioId !== deal.portfolioId || ["Rejected", "Draft"].includes(d.status)) continue;
    portfolioTotal += dealNotional(d.fields);
  }
  for (const p of register) {
    if (p.portfolioId === deal.portfolioId) portfolioTotal += p.notional;
  }
  if (portfolioTotal <= 0) return 0;
  return (dealNotional(deal.fields) / portfolioTotal) * 100;
}

export function isToday(iso: string, ref = REF_DATE): boolean {
  return iso.slice(0, 10) === ref;
}

// ── VWAP ─────────────────────────────────────────────────────────────────────

function parseRate(d: DealSlip): number | null {
  const r =
    d.fields.rate ||
    d.fields.yield ||
    d.fields.discountRateOrYield ||
    d.fields.price ||
    d.fields.cleanPrice;
  const n = parseFloat(r ?? "");
  return isNaN(n) ? null : n;
}

export type VwapEntry = { vwap: number; count: number; totalVolume: number };
export type VwapMap = Map<string, VwapEntry>;

/** Compute VWAP per asset class from all non-rejected/draft deals. */
export function computeVwapMap(deals: DealSlip[]): VwapMap {
  const acc = new Map<string, { sumRV: number; sumV: number; count: number }>();
  for (const d of deals) {
    if (d.status === "Draft" || d.status === "Rejected") continue;
    const rate = parseRate(d);
    const vol = dealNotional(d.fields);
    if (rate === null || vol <= 0) continue;
    const key = d.assetClass;
    const e = acc.get(key) ?? { sumRV: 0, sumV: 0, count: 0 };
    acc.set(key, { sumRV: e.sumRV + rate * vol, sumV: e.sumV + vol, count: e.count + 1 });
  }
  const result: VwapMap = new Map();
  for (const [key, { sumRV, sumV, count }] of acc) {
    if (sumV > 0) result.set(key, { vwap: sumRV / sumV, count, totalVolume: sumV });
  }
  return result;
}

export interface VwapInfo {
  vwap: number;
  dealRate: number;
  /** bps deviation from VWAP: positive = above VWAP */
  bps: number;
  /** true = favourable for buyer (higher yield for FI, lower price for equity) */
  favourable: boolean;
}

/** For a given deal + pre-computed map, returns VWAP deviation info or null if not computable. */
export function dealVwapInfo(deal: DealSlip, vwapMap: VwapMap): VwapInfo | null {
  const rate = parseRate(deal);
  if (rate === null) return null;
  const entry = vwapMap.get(deal.assetClass);
  if (!entry) return null;
  const bps = (rate - entry.vwap) * 100;
  // FI assets: higher rate = better for buyer. Equities/price: lower price = better.
  const isPriceBased = deal.assetClass === "Equities";
  const favourable = isPriceBased ? bps < 0 : bps > 0;
  return { vwap: entry.vwap, dealRate: rate, bps, favourable };
}

// ── Position tally: Opening + Purchases − Sales = Closing ────────────────────

export interface PositionTally {
  opening: number;
  purchases: number;
  sales: number;
  closing: number;
}

export function computePositionTally(
  filteredDeals: DealSlip[],
  allDeals: DealSlip[],
  register: RegisterPosition[],
): PositionTally {
  // Opening = active register positions (existing book value)
  const opening = register.filter((p) => p.status === "Active").reduce((s, p) => s + p.notional, 0);
  // Purchases = new deals going through workflow (non-rejected, non-draft)
  let purchases = 0;
  for (const d of filteredDeals) {
    if (d.status === "Draft" || d.status === "Rejected") continue;
    purchases += dealNotional(d.fields);
  }
  // Sales = deals in register marked as disposed/sold
  const sales = register.filter((p) => p.status === "Sold" || p.status === "Matured").reduce((s, p) => s + p.notional, 0);
  // Suppress unused warning
  void allDeals;
  return { opening, purchases, sales, closing: opening + purchases - sales };
}
