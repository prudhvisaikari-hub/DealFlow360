import { QuoteLine, SubscriptionPlan, BillingScheduleEntry, BillingCycle } from "../types";
import { v4 as uuid } from "uuid";

const CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Computes the remaining days in the active billing cycle based on the cycle
 * start date and the cycle duration (monthly = 30, quarterly = 90, yearly = 365).
 */
export function computeDaysRemainingInCycle(
  cycleStartDate: Date,
  cycle: BillingCycle,
  currentDate: Date = new Date()
): number {
  const cycleDays = CYCLE_DAYS[cycle] ?? 30;
  const elapsedMs = Math.max(0, currentDate.getTime() - cycleStartDate.getTime());
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const daysIntoCurrentCycle = elapsedDays % cycleDays;
  const daysRemaining = cycleDays - daysIntoCurrentCycle;
  return Math.max(1, daysRemaining);
}

/**
 * Builds a billing schedule for an order that may mix one-time and
 * recurring lines:
 *  - One-time lines: single "invoiced" entry, billed immediately.
 *  - Recurring lines: first cycle billed now, plus N future scheduled
 *    entries (we generate 3 upcoming cycles for demo purposes).
 */
export function buildBillingSchedule(
  lines: QuoteLine[],
  plans: SubscriptionPlan[],
  startDate: Date = new Date(),
  futureCycles = 3
): BillingScheduleEntry[] {
  const schedule: BillingScheduleEntry[] = [];

  for (const line of lines) {
    const netUnitPrice = line.listPrice * (1 - line.discountPercent / 100);
    const lineTotal = netUnitPrice * line.quantity;

    if (!line.isRecurring) {
      schedule.push({
        id: uuid(),
        lineId: line.id,
        dueDate: startDate.toISOString(),
        amount: Math.round(lineTotal * 100) / 100,
        status: "invoiced",
        note: "One-time charge",
      });
      continue;
    }

    const plan = plans.find((p) => p.id === line.subscriptionPlanId);
    const cycle: BillingCycle = plan?.cycle ?? "monthly";
    const cycleDays = CYCLE_DAYS[cycle];

    // first cycle billed now
    schedule.push({
      id: uuid(),
      lineId: line.id,
      dueDate: startDate.toISOString(),
      amount: Math.round(lineTotal * 100) / 100,
      status: "invoiced",
      note: `Recurring (${cycle}) - cycle 1`,
    });

    for (let i = 1; i <= futureCycles; i++) {
      schedule.push({
        id: uuid(),
        lineId: line.id,
        dueDate: addDays(startDate, cycleDays * i).toISOString(),
        amount: Math.round(lineTotal * 100) / 100,
        status: "scheduled",
        note: `Recurring (${cycle}) - cycle ${i + 1}`,
      });
    }
  }

  return schedule;
}

/**
 * Mid-cycle proration when quantity changes on a recurring line.
 * Charges/credits the difference for the remaining days in the
 * current cycle.
 */
export function prorateQuantityChange(
  line: QuoteLine,
  plan: SubscriptionPlan,
  oldQuantity: number,
  newQuantity: number,
  daysRemainingInCycle: number
): { amount: number; type: "charge" | "credit"; note: string } {
  if (!plan.prorationEnabled) {
    return { amount: 0, type: "charge", note: "Proration disabled for this plan; change applies next cycle." };
  }
  const cycleDays = CYCLE_DAYS[plan.cycle];
  const netUnitPrice = line.listPrice * (1 - line.discountPercent / 100);
  const deltaQty = newQuantity - oldQuantity;
  const dailyRate = netUnitPrice / cycleDays;
  const amount = Math.abs(Math.round(dailyRate * deltaQty * daysRemainingInCycle * 100) / 100);
  return {
    amount,
    type: deltaQty >= 0 ? "charge" : "credit",
    note: `${deltaQty >= 0 ? "Prorated charge" : "Prorated credit"} for ${Math.abs(deltaQty)} unit(s) x ${daysRemainingInCycle} remaining day(s).`,
  };
}

/**
 * Cancellation refund calculation based on the plan's policy.
 */
export function calculateCancellationRefund(
  line: QuoteLine,
  plan: SubscriptionPlan,
  daysRemainingInCycle: number
): { refundAmount: number; note: string } {
  const cycleDays = CYCLE_DAYS[plan.cycle];
  const netUnitPrice = line.listPrice * (1 - line.discountPercent / 100);
  const lineTotal = netUnitPrice * line.quantity;

  if (plan.cancellationRefundPolicy === "full") {
    return { refundAmount: Math.round(lineTotal * 100) / 100, note: "Full refund per plan policy." };
  }
  if (plan.cancellationRefundPolicy === "prorated") {
    const dailyRate = lineTotal / cycleDays;
    const refund = Math.round(dailyRate * daysRemainingInCycle * 100) / 100;
    return { refundAmount: refund, note: `Prorated refund for ${daysRemainingInCycle} remaining day(s).` };
  }
  return { refundAmount: 0, note: "No refund per plan policy." };
}
