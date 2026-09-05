import { describe, it, expect } from "vitest";
import {
  effectiveCeilingForLine,
  computeBlendedRiskScore,
  resolveApprovalSteps,
  averageDiscount,
  isDiscountAnomaly,
} from "./discountRisk";
import { DiscountTier, CategoryDiscountCeiling, ApprovalChainRule, QuoteLine } from "../types";

describe("discountRisk engine", () => {
  const tiers: DiscountTier[] = [
    { tier: "Bronze", maxDiscountPercent: 5 },
    { tier: "Silver", maxDiscountPercent: 10 },
    { tier: "Gold", maxDiscountPercent: 15 },
  ];

  const ceilings: CategoryDiscountCeiling[] = [
    { category: "Hardware", maxDiscountPercent: 15 },
    { category: "Services", maxDiscountPercent: 10 },
    { category: "Subscriptions", maxDiscountPercent: 12 },
  ];

  const rules: ApprovalChainRule[] = [
    { id: "r1", minOverPoints: 0.01, maxOverPoints: 3.0, requiresManager: true, requiresFinance: false, label: "Manager Review" },
    { id: "r2", minOverPoints: 3.01, maxOverPoints: null, requiresManager: true, requiresFinance: true, label: "Manager + Finance Review" },
  ];

  describe("effectiveCeilingForLine", () => {
    it("returns the minimum when tier is lower than category ceiling", () => {
      // Bronze (5%) vs Hardware (15%) -> 5%
      const ceiling = effectiveCeilingForLine("Bronze", "Hardware", tiers, ceilings);
      expect(ceiling).toBe(5);
    });

    it("returns the minimum when category is lower than tier ceiling", () => {
      // Gold (15%) vs Services (10%) -> 10%
      const ceiling = effectiveCeilingForLine("Gold", "Services", tiers, ceilings);
      expect(ceiling).toBe(10);
    });

    it("returns equal ceiling when tier and category match", () => {
      // Gold (15%) vs Hardware (15%) -> 15%
      const ceiling = effectiveCeilingForLine("Gold", "Hardware", tiers, ceilings);
      expect(ceiling).toBe(15);
    });

    it("handles Silver tier correctly", () => {
      // Silver (10%) vs Subscriptions (12%) -> 10%
      const ceiling = effectiveCeilingForLine("Silver", "Subscriptions", tiers, ceilings);
      expect(ceiling).toBe(10);
    });

    it("falls back gracefully when tier or category is not found in table", () => {
      const ceiling = effectiveCeilingForLine("Gold", "CustomCat" as any, tiers, ceilings);
      expect(ceiling).toBe(15);
    });
  });

  describe("computeBlendedRiskScore", () => {
    it("returns 0 when all lines are within or at their discount ceiling", () => {
      const lines: QuoteLine[] = [
        { id: "1", productId: "p1", quantity: 2, listPrice: 1000, discountPercent: 5, categoryCeiling: 15, overPoints: -10, isRecurring: false },
        { id: "2", productId: "p2", quantity: 1, listPrice: 500, discountPercent: 10, categoryCeiling: 10, overPoints: 0, isRecurring: false },
      ];
      expect(computeBlendedRiskScore(lines)).toBe(0);
    });

    it("returns single-line overPoints when only one line exists and exceeds ceiling", () => {
      const lines: QuoteLine[] = [
        { id: "1", productId: "p1", quantity: 1, listPrice: 1000, discountPercent: 18, categoryCeiling: 10, overPoints: 8, isRecurring: false },
      ];
      expect(computeBlendedRiskScore(lines)).toBe(8);
    });

    it("revenue-weights the overage score across multiple lines", () => {
      // Line 1: $1000 list, 12% disc, overPoints = -3 (<= 0, adds 0)
      // Line 2: $500 list, 18% disc, overPoints = +8
      // Total value = 1500, line 2 weight = 500/1500 = 1/3
      // Score = 8 * (1/3) * 0.6 + 8 * 0.4 = 1.6 + 3.2 = 4.8
      const lines: QuoteLine[] = [
        { id: "1", productId: "p1", quantity: 1, listPrice: 1000, discountPercent: 12, categoryCeiling: 15, overPoints: -3, isRecurring: false },
        { id: "2", productId: "p2", quantity: 1, listPrice: 500, discountPercent: 18, categoryCeiling: 10, overPoints: 8, isRecurring: false },
      ];
      const score = computeBlendedRiskScore(lines);
      expect(score).toBe(4.8);
    });

    it("returns 0 when quote lines array is empty", () => {
      expect(computeBlendedRiskScore([])).toBe(0);
    });
  });

  describe("resolveApprovalSteps", () => {
    it("returns empty array for risk score <= 0", () => {
      expect(resolveApprovalSteps(0, rules)).toEqual([]);
      expect(resolveApprovalSteps(-1, rules)).toEqual([]);
    });

    it("returns manager step only for minor overage (0.01 - 3.00)", () => {
      const steps = resolveApprovalSteps(2.5, rules);
      expect(steps).toHaveLength(1);
      expect(steps[0].step).toBe("sales_manager");
      expect(steps[0].status).toBe("pending");
    });

    it("returns manager AND finance steps for significant overage (> 3.00)", () => {
      const steps = resolveApprovalSteps(4.2, rules);
      expect(steps).toHaveLength(2);
      expect(steps[0].step).toBe("sales_manager");
      expect(steps[0].status).toBe("pending");
      expect(steps[1].step).toBe("finance");
      expect(steps[1].status).toBe("pending");
    });

    it("handles threshold boundaries exactly", () => {
      const stepsAtThree = resolveApprovalSteps(3.0, rules);
      expect(stepsAtThree).toHaveLength(1);
      expect(stepsAtThree[0].step).toBe("sales_manager");

      const stepsAboveThree = resolveApprovalSteps(3.01, rules);
      expect(stepsAboveThree).toHaveLength(2);
    });
  });

  describe("discount anomalies", () => {
    it("calculates average discount correctly", () => {
      const lines: QuoteLine[] = [
        { id: "1", productId: "p1", quantity: 1, listPrice: 100, discountPercent: 10, categoryCeiling: 15, overPoints: -5, isRecurring: false },
        { id: "2", productId: "p2", quantity: 1, listPrice: 100, discountPercent: 20, categoryCeiling: 15, overPoints: 5, isRecurring: false },
      ];
      expect(averageDiscount(lines)).toBe(15);
    });

    it("detects anomaly when quote discount exceeds rep history by threshold multiplier", () => {
      // 6 * 1.6 = 9.6
      expect(isDiscountAnomaly(12, 6)).toBe(true);  // 12 > 9.6 -> true
      expect(isDiscountAnomaly(9, 6)).toBe(false);  // 9 <= 9.6 -> false
    });
  });
});
