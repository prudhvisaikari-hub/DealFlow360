import { Quotation, User } from "../types";
import { averageDiscount, isDiscountAnomaly } from "./discountRisk";

export interface DealHealthFlag {
  quotationId: string;
  type: "stalled" | "discount_anomaly" | "delivery_slippage";
  message: string;
  severity: "low" | "medium" | "high";
}

const STALL_THRESHOLD_DAYS = 3;

export function evaluateDealHealth(quotations: Quotation[], users: User[]): DealHealthFlag[] {
  const flags: DealHealthFlag[] = [];
  const now = new Date();

  for (const q of quotations) {
    if (["confirmed", "billed", "rejected"].includes(q.status)) continue;

    // Stalled check
    const lastActivity = new Date(q.lastActivityAt);
    const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity >= STALL_THRESHOLD_DAYS) {
      flags.push({
        quotationId: q.id,
        type: "stalled",
        message: `No activity for ${Math.floor(daysSinceActivity)} day(s) — status: ${q.status.replace(/_/g, " ")}`,
        severity: daysSinceActivity >= 7 ? "high" : "medium",
      });
    }

    // Discount anomaly check
    const rep = users.find((u) => u.id === q.repId);
    const quoteAvg = averageDiscount(q.lines);
    if (rep && isDiscountAnomaly(quoteAvg, rep.avgDiscountHistory ?? 0)) {
      flags.push({
        quotationId: q.id,
        type: "discount_anomaly",
        message: `${rep.name} discounted ${quoteAvg}% — well above their historical average of ${rep.avgDiscountHistory ?? 0}%`,
        severity: "high",
      });
    }

    // Delivery slippage — if backorder lines exist for a while
    if (q.warehousePlan && q.warehousePlan.backorderLines.length > 0 && daysSinceActivity >= 1) {
      flags.push({
        quotationId: q.id,
        type: "delivery_slippage",
        message: `${q.warehousePlan.backorderLines.length} line(s) still backordered`,
        severity: "medium",
      });
    }
  }

  return flags;
}
