import { describe, it, expect } from "vitest";
import { computeBlendedRiskScore, resolveApprovalSteps } from "./discountRisk";
import { computeWarehouseSplit } from "./warehouseSplit";
import { buildBillingSchedule } from "./billing";
import { QuoteLine, ApprovalChainRule, Warehouse, Product, SubscriptionPlan } from "../types";

describe("DealFlow360 Integration Workflow Tests", () => {
  const approvalRules: ApprovalChainRule[] = [
    { id: "r1", minOverPoints: 0.01, maxOverPoints: 3, requiresManager: true, requiresFinance: false, label: "Manager review" },
    { id: "r2", minOverPoints: 3.01, maxOverPoints: null, requiresManager: true, requiresFinance: true, label: "Manager + Finance review" },
  ];

  const warehouses: Warehouse[] = [
    { id: "wh-main", name: "Main", location: "Newark", shippingCostWeight: 1.0, replenishmentDays: 5, stock: { "p-laptop": 10 } },
    { id: "wh-east", name: "East", location: "Columbus", shippingCostWeight: 1.4, replenishmentDays: 3, stock: { "p-laptop": 5 } },
  ];

  const products: Product[] = [
    { id: "p-laptop", name: "Laptop", category: "Hardware", basePrice: 1200, unit: "unit", tax: 8, description: "", variants: [], marginPercent: 22, isRecurring: false },
    { id: "p-sub", name: "Monthly Support", category: "Subscriptions", basePrice: 150, unit: "month", tax: 0, description: "", variants: [], marginPercent: 55, isRecurring: true, recurringPlanId: "plan-m" },
  ];

  const plans: SubscriptionPlan[] = [
    { id: "plan-m", name: "Monthly Support Plan", cycle: "monthly", prorationEnabled: true, cancellationRefundPolicy: "prorated" },
  ];

  it("completes full quote lifecycle from draft through manager and finance approval to fulfillment & billing", () => {
    // 1. Rep drafts quote with 2 lines: Laptop (within ceiling) & Support (over ceiling)
    const lines: QuoteLine[] = [
      { id: "l1", productId: "p-laptop", quantity: 5, listPrice: 1164, discountPercent: 12, categoryCeiling: 15, overPoints: -3, isRecurring: false },
      { id: "l2", productId: "p-sub", quantity: 5, listPrice: 150, discountPercent: 20, categoryCeiling: 12, overPoints: 8, isRecurring: true, subscriptionPlanId: "plan-m" },
    ];

    // 2. Submit for approval -> calculate score & approval steps
    const score = computeBlendedRiskScore(lines);
    expect(score).toBeGreaterThan(0.01);

    const steps = resolveApprovalSteps(score, approvalRules);
    // Since overPoints on line 2 is +8, verify steps require approval
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].step).toBe("sales_manager");
    expect(steps[0].status).toBe("pending");

    // 3. Manager approves step 1
    steps[0].status = "approved";
    steps[0].actedBy = "Karan Mehta";

    // 4. If finance approval exists, finance approves step 2
    if (steps.length > 1) {
      expect(steps[1].step).toBe("finance");
      expect(steps[1].status).toBe("pending");
      steps[1].status = "approved";
      steps[1].actedBy = "Ritu Nair";
    }

    const allApproved = steps.every((s) => s.status === "approved");
    expect(allApproved).toBe(true);

    // 5. When fully approved, warehouse plan and billing schedule are generated
    const warehousePlan = computeWarehouseSplit(lines, warehouses, products);
    const billingSchedule = buildBillingSchedule(lines, plans, new Date());

    expect(warehousePlan.lines.length).toBeGreaterThan(0);
    expect(warehousePlan.lines[0].warehouseId).toBe("wh-main");
    expect(warehousePlan.lines[0].quantity).toBe(5);

    // Physical line (1 entry) + 4 subscription entries (1 invoiced + 3 scheduled) = 5 entries
    expect(billingSchedule).toHaveLength(5);
    expect(billingSchedule[0].status).toBe("invoiced");
    expect(billingSchedule[1].status).toBe("invoiced");
    expect(billingSchedule[2].status).toBe("scheduled");
  });

  it("handles customer portal counter negotiation and customer confirmation", () => {
    // 1. Sent quotation with line at 5% discount
    const lines: QuoteLine[] = [
      { id: "l1", productId: "p-laptop", quantity: 3, listPrice: 1000, discountPercent: 5, categoryCeiling: 15, overPoints: -10, isRecurring: false },
    ];

    // Initial risk score is 0
    let score = computeBlendedRiskScore(lines);
    expect(score).toBe(0);

    // 2. Customer counters with 12% discount
    const counterDiscount = 12;
    lines[0].discountPercent = counterDiscount;
    lines[0].overPoints = Math.round((counterDiscount - lines[0].categoryCeiling) * 100) / 100;

    // 3. Recompute risk on customer confirmation: 12% <= 15% ceiling -> score stays 0
    score = computeBlendedRiskScore(lines);
    expect(score).toBe(0);

    const steps = resolveApprovalSteps(score, approvalRules);
    expect(steps).toHaveLength(0); // Auto-approved directly into fulfillment!
  });
});
