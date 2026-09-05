import { describe, it, expect } from "vitest";
import {
  buildBillingSchedule,
  prorateQuantityChange,
  calculateCancellationRefund,
  computeDaysRemainingInCycle,
} from "./billing";
import { SubscriptionPlan, QuoteLine } from "../types";

describe("billing engine", () => {
  const planMonthly: SubscriptionPlan = {
    id: "plan-monthly",
    name: "Monthly Plan",
    cycle: "monthly",
    prorationEnabled: true,
    cancellationRefundPolicy: "prorated",
  };

  const planQuarterly: SubscriptionPlan = {
    id: "plan-quarterly",
    name: "Quarterly Plan",
    cycle: "quarterly",
    prorationEnabled: false,
    cancellationRefundPolicy: "none",
  };

  const planYearlyFull: SubscriptionPlan = {
    id: "plan-yearly",
    name: "Yearly Plan",
    cycle: "yearly",
    prorationEnabled: true,
    cancellationRefundPolicy: "full",
  };

  const plans = [planMonthly, planQuarterly, planYearlyFull];

  describe("buildBillingSchedule", () => {
    it("generates a single immediate entry for one-time physical lines", () => {
      const lines: QuoteLine[] = [
        { id: "l1", productId: "prod-laptop", quantity: 2, listPrice: 1000, discountPercent: 10, categoryCeiling: 15, overPoints: 0, isRecurring: false },
      ];
      const schedule = buildBillingSchedule(lines, plans, new Date("2026-01-01T00:00:00Z"));

      expect(schedule).toHaveLength(1);
      expect(schedule[0].amount).toBe(1800); // 2 * 1000 * 0.9
      expect(schedule[0].status).toBe("invoiced");
      expect(schedule[0].note).toBe("One-time charge");
    });

    it("generates entries for monthly recurring subscriptions", () => {
      const lines: QuoteLine[] = [
        { id: "l2", productId: "prod-sub-m", quantity: 1, listPrice: 100, discountPercent: 0, categoryCeiling: 12, overPoints: 0, isRecurring: true, subscriptionPlanId: "plan-monthly" },
      ];
      // Default generates 1 invoiced + 3 future scheduled = 4 entries
      const schedule = buildBillingSchedule(lines, plans, new Date("2026-01-01T00:00:00Z"));

      expect(schedule).toHaveLength(4);
      expect(schedule[0].status).toBe("invoiced");
      expect(schedule[1].status).toBe("scheduled");
      expect(schedule[0].amount).toBe(100);
      expect(schedule[3].amount).toBe(100);

      // Or with custom futureCycles
      const fullYearSchedule = buildBillingSchedule(lines, plans, new Date("2026-01-01T00:00:00Z"), 11);
      expect(fullYearSchedule).toHaveLength(12);
    });
  });

  describe("prorateQuantityChange", () => {
    it("calculates prorated charge for quantity increase with proration enabled", () => {
      const line: QuoteLine = {
        id: "l1",
        productId: "sub",
        quantity: 5,
        listPrice: 100,
        discountPercent: 10, // net price $90
        categoryCeiling: 12,
        overPoints: 0,
        isRecurring: true,
        subscriptionPlanId: "plan-monthly",
      };
      // Increased by 3 units with 15 days remaining out of 30:
      // delta = 3 * 90 * (15 / 30) = 135
      const result = prorateQuantityChange(line, planMonthly, 5, 8, 15);

      expect(result.type).toBe("charge");
      expect(result.amount).toBe(135);
      expect(result.note).toContain("Prorated charge");
    });

    it("calculates prorated credit for quantity decrease", () => {
      const line: QuoteLine = {
        id: "l1",
        productId: "sub",
        quantity: 8,
        listPrice: 100,
        discountPercent: 10, // net price $90
        categoryCeiling: 12,
        overPoints: 0,
        isRecurring: true,
        subscriptionPlanId: "plan-monthly",
      };
      // Decreased by 3 units with 15 days remaining:
      const result = prorateQuantityChange(line, planMonthly, 8, 5, 15);

      expect(result.type).toBe("credit");
      expect(result.amount).toBe(135);
      expect(result.note).toContain("Prorated credit");
    });

    it("returns zero amount when proration is disabled on plan", () => {
      const line: QuoteLine = {
        id: "l1",
        productId: "sub",
        quantity: 2,
        listPrice: 300,
        discountPercent: 0,
        categoryCeiling: 12,
        overPoints: 0,
        isRecurring: true,
        subscriptionPlanId: "plan-quarterly",
      };
      const result = prorateQuantityChange(line, planQuarterly, 2, 4, 15);

      expect(result.amount).toBe(0);
      expect(result.note).toContain("Proration disabled");
    });
  });

  describe("calculateCancellationRefund", () => {
    it("calculates prorated refund when policy is prorated", () => {
      const line: QuoteLine = {
        id: "l1",
        productId: "sub",
        quantity: 2,
        listPrice: 100,
        discountPercent: 0,
        categoryCeiling: 12,
        overPoints: 0,
        isRecurring: true,
        subscriptionPlanId: "plan-monthly",
      };
      // 2 * 100 = $200 per month, 15 days left out of 30 -> $100 refund
      const refund = calculateCancellationRefund(line, planMonthly, 15);

      expect(refund.refundAmount).toBe(100);
      expect(refund.note).toContain("Prorated refund");
    });

    it("calculates full refund when policy is full", () => {
      const line: QuoteLine = {
        id: "l1",
        productId: "sub",
        quantity: 1,
        listPrice: 1200,
        discountPercent: 0,
        categoryCeiling: 12,
        overPoints: 0,
        isRecurring: true,
        subscriptionPlanId: "plan-yearly",
      };
      const refund = calculateCancellationRefund(line, planYearlyFull, 100);

      expect(refund.refundAmount).toBe(1200);
      expect(refund.note).toContain("Full refund");
    });

    it("returns zero refund when policy is none", () => {
      const line: QuoteLine = {
        id: "l1",
        productId: "sub",
        quantity: 1,
        listPrice: 300,
        discountPercent: 0,
        categoryCeiling: 12,
        overPoints: 0,
        isRecurring: true,
        subscriptionPlanId: "plan-quarterly",
      };
      const refund = calculateCancellationRefund(line, planQuarterly, 45);

      expect(refund.refundAmount).toBe(0);
      expect(refund.note).toContain("No refund per plan policy");
    });
  });

  describe("computeDaysRemainingInCycle", () => {
    it("computes remaining days for monthly cycle (30 days total)", () => {
      const start = new Date("2026-01-01T00:00:00Z");
      // 10 days later -> 20 days remaining
      const current = new Date("2026-01-11T00:00:00Z");
      const remaining = computeDaysRemainingInCycle(start, "monthly", current);
      expect(remaining).toBe(20);
    });

    it("rolls over correctly across multiple monthly billing cycles", () => {
      const start = new Date("2026-01-01T00:00:00Z");
      // 35 days later -> 5 days into cycle 2 -> 25 days remaining
      const current = new Date("2026-02-05T00:00:00Z");
      const remaining = computeDaysRemainingInCycle(start, "monthly", current);
      expect(remaining).toBe(25);
    });

    it("computes remaining days for quarterly cycle (90 days total)", () => {
      const start = new Date("2026-01-01T00:00:00Z");
      // 30 days later -> 60 days remaining
      const current = new Date("2026-01-31T00:00:00Z");
      const remaining = computeDaysRemainingInCycle(start, "quarterly", current);
      expect(remaining).toBe(60);
    });

    it("returns cycleDays on cycle start day (0 days elapsed)", () => {
      const start = new Date("2026-01-01T00:00:00Z");
      const remaining = computeDaysRemainingInCycle(start, "monthly", start);
      expect(remaining).toBe(30);
    });
  });
});
