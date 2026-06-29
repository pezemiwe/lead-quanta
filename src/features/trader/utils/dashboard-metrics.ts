import type { DealSlip, RegisterPosition } from "../../workflow/types";
import { dealNotional } from "../../workflow/engine/fields";
import {
  REF_DATE,
  counterpartyOrIssuer,
  counterpartyUtilisation,
  daysBetween,
  fmtMoney,
  isToday,
} from "../../deals/utils/blotter-metrics";

export {
  REF_DATE,
  counterpartyOrIssuer,
  counterpartyUtilisation,
  fmtMoney,
  isToday,
  rateOrPrice,
  tradeDate,
  transactionType,
  valueDate,
} from "../../deals/utils/blotter-metrics";

export interface MaturityRow {
  id: string;
  instrument: string;
  counterparty: string;
  amount: number;
  maturityDate: string;
  daysRemaining: number;
  source: "register" | "deal";
  dealSlipId?: string;
}

export function buildMaturityRows(
  register: RegisterPosition[],
  deals: DealSlip[],
  refDate = REF_DATE,
): MaturityRow[] {
  const rows: MaturityRow[] = [];

  for (const p of register) {
    const md = p.fields.maturityDate;
    if (!md) continue;
    const days = daysBetween(refDate, md);
    if (days <= 30) {
      rows.push({
        id: p.id,
        instrument: p.label,
        counterparty: p.counterparty,
        amount: p.notional,
        maturityDate: md,
        daysRemaining: days,
        source: "register",
        dealSlipId: p.dealSlipId,
      });
    }
  }

  for (const d of deals) {
    if (d.status !== "Active" && d.status !== "Approved" && d.status !== "Pending Settlement") {
      continue;
    }
    const md = d.fields.maturityDate;
    if (!md) continue;
    const days = daysBetween(refDate, md);
    if (days <= 30 && !rows.some((r) => r.dealSlipId === d.id)) {
      rows.push({
        id: d.id,
        instrument: d.fields.counterparty || d.assetClass,
        counterparty: counterpartyOrIssuer(d),
        amount: dealNotional(d.fields),
        maturityDate: md,
        daysRemaining: days,
        source: "deal",
        dealSlipId: d.id,
      });
    }
  }

  return rows.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
