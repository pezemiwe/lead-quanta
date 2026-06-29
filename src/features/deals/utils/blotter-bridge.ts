import type { DealSlip, RegisterPosition } from "../../workflow/types";
import { dealNotional } from "../../workflow/engine/fields";
import { REF_DATE, tradeDate, transactionType } from "./blotter-metrics";

export interface BridgeLeg {
  count: number;
  notional: number;
}

export interface BlotterBridge {
  opening: BridgeLeg;
  purchases: BridgeLeg;
  sales: BridgeLeg;
  closing: BridgeLeg;
  impliedClosing: BridgeLeg;
  periodFrom: string;
  periodTo: string;
  reconciled: boolean;
}

/** Core position bridge: opening + purchases − sales. */
export function impliedClosingFromLegs(
  opening: BridgeLeg,
  purchases: BridgeLeg,
  sales: BridgeLeg,
): BridgeLeg {
  return {
    count: Math.max(0, opening.count + purchases.count - sales.count),
    notional: Math.max(0, opening.notional + purchases.notional - sales.notional),
  };
}

const ACTIVE_END = new Set([
  "Active",
  "Settled",
  "Approved",
  "Pending Settlement",
  "Under Review",
  "Submitted",
]);

function isSaleDeal(deal: DealSlip): boolean {
  if (deal.status === "Matured, Sold or Rolled Over") return true;
  const t = transactionType(deal).toLowerCase();
  return t.includes("redemption") || t.includes("disposal") || t.includes("sale");
}

function inPeriod(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function sumLeg(deals: DealSlip[]): BridgeLeg {
  return {
    count: deals.length,
    notional: deals.reduce((s, d) => s + dealNotional(d.fields), 0),
  };
}

/** Opening + purchases − sales = closing (count & notional) for the selected period. */
export function computeBlotterBridge(
  deals: DealSlip[],
  register: RegisterPosition[],
  dateFrom: string,
  dateTo: string,
): BlotterBridge {
  const periodFrom = dateFrom || `${REF_DATE.slice(0, 8)}01`;
  const periodTo = dateTo || REF_DATE;

  const scoped = deals.filter((d) => d.status !== "Rejected");

  const registerOpening = register.filter((p) => p.settledAt.slice(0, 10) < periodFrom);
  const registerClosing = register.filter((p) => p.settledAt.slice(0, 10) <= periodTo);

  const dealsBefore = scoped.filter(
    (d) => tradeDate(d) < periodFrom && ACTIVE_END.has(d.status),
  );

  const openingDeals = sumLeg(dealsBefore);
  const openingRegister = registerOpening.reduce((s, p) => s + p.notional, 0);
  const opening: BridgeLeg = {
    count: openingDeals.count + registerOpening.length,
    notional: openingDeals.notional + openingRegister,
  };

  const purchasesInPeriod = scoped.filter(
    (d) =>
      !isSaleDeal(d) &&
      d.status !== "Draft" &&
      inPeriod(tradeDate(d), periodFrom, periodTo),
  );
  const purchases = sumLeg(purchasesInPeriod);

  const salesInPeriod = scoped.filter(
    (d) =>
      isSaleDeal(d) &&
      (inPeriod(tradeDate(d), periodFrom, periodTo) ||
        inPeriod(d.updatedAt.slice(0, 10), periodFrom, periodTo)),
  );
  const sales = sumLeg(salesInPeriod);

  const closingDeals = scoped.filter(
    (d) => tradeDate(d) <= periodTo && ACTIVE_END.has(d.status),
  );
  const closingDealLeg = sumLeg(closingDeals);
  const closingRegister = registerClosing.reduce((s, p) => s + p.notional, 0);

  const closing: BridgeLeg = {
    count: closingDealLeg.count + registerClosing.length,
    notional: closingDealLeg.notional + closingRegister,
  };

  const impliedClosing = impliedClosingFromLegs(opening, purchases, sales);

  const reconciled =
    Math.abs(impliedClosing.count - closing.count) <= 1 &&
    Math.abs(impliedClosing.notional - closing.notional) < 1_000_000;

  return {
    opening,
    purchases,
    sales,
    closing,
    impliedClosing,
    periodFrom,
    periodTo,
    reconciled,
  };
}
