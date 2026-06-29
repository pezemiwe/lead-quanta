import { canDo } from "../../context/platform-personas";

export type DealsPage =
  | "blotter"
  | "new-booking"
  | "coupon-schedules"
  | "settlements"
  | "counterparties"
  | "exposure"
  | "approvals"
  | "exceptions"
  | "reconciliation"
  | "treasury-cash"
  | "trader-performance";

export function canAccessDealsPage(role: string, page: DealsPage): boolean {
  switch (page) {
    case "blotter":
      return canDo(role, "blotter", "V") || canDo(role, "blotter", "C");
    case "new-booking":
      return canDo(role, "dealSlip", "C");
    case "coupon-schedules":
      return canDo(role, "register", "V") || canDo(role, "dealSlip", "V");
    case "settlements":
      return canDo(role, "settle", "S") || canDo(role, "register", "V");
    case "counterparties":
      return canDo(role, "limits", "V") || canDo(role, "blotter", "V");
    case "exposure":
      return canDo(role, "limits", "V") || canDo(role, "checks", "R") || canDo(role, "approval", "A");
    case "approvals":
      return (
        canDo(role, "checks", "R") ||
        canDo(role, "approval", "A") ||
        canDo(role, "dealSlip", "R")
      );
    case "exceptions":
      return (
        canDo(role, "checks", "R") ||
        canDo(role, "settle", "S") ||
        canDo(role, "approval", "A")
      );
    case "reconciliation":
      return canDo(role, "settle", "S") || canDo(role, "checks", "R");
    case "treasury-cash":
      return canDo(role, "register", "V") || canDo(role, "settle", "S") || canDo(role, "blotter", "V");
    case "trader-performance":
      return canDo(role, "blotter", "V") || canDo(role, "blotter", "C");
    default:
      return false;
  }
}

export function defaultDealsPage(role: string): DealsPage {
  const order: DealsPage[] = [
    "blotter",
    "new-booking",
    "approvals",
    "settlements",
    "exceptions",
    "coupon-schedules",
    "counterparties",
  ];
  return order.find((p) => canAccessDealsPage(role, p)) ?? "blotter";
}
