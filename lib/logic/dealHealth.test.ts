import { describe, it, expect } from "vitest";
import { evaluateDealHealth } from "./dealHealth";
import { Quotation, User } from "../types";

describe("dealHealth engine", () => {
  const rep: User = {
    id: "rep-1",
    name: "Alex Rep",
    email: "alex@dealflow.com",
    role: "sales_rep",
    avgDiscountHistory: 5,
  };

  function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }

  it("flags deals with no activity for 3+ days as stalled with medium severity", () => {
    const quotes: Quotation[] = [
      {
        id: "q-stalled-med",
        customerId: "c1",
        repId: "rep-1",
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4),
        status: "sent",
        lines: [],
        blendedRiskScore: 0,
        approvalSteps: [],
        auditTrail: [],
        billingSchedule: [],
        negotiation: [],
        lastActivityAt: daysAgo(4),
        upsellAccepted: [],
      },
    ];

    const flags = evaluateDealHealth(quotes, [rep]);
    const stalled = flags.find((f) => f.type === "stalled");

    expect(stalled).toBeDefined();
    expect(stalled?.severity).toBe("medium");
  });

  it("flags deals with no activity for 7+ days with high severity", () => {
    const quotes: Quotation[] = [
      {
        id: "q-stalled-high",
        customerId: "c1",
        repId: "rep-1",
        createdAt: daysAgo(10),
        updatedAt: daysAgo(8),
        status: "under_negotiation",
        lines: [],
        blendedRiskScore: 0,
        approvalSteps: [],
        auditTrail: [],
        billingSchedule: [],
        negotiation: [],
        lastActivityAt: daysAgo(8),
        upsellAccepted: [],
      },
    ];

    const flags = evaluateDealHealth(quotes, [rep]);
    const stalled = flags.find((f) => f.type === "stalled");

    expect(stalled).toBeDefined();
    expect(stalled?.severity).toBe("high");
  });

  it("flags discount anomalies when rep offers discount well above their historical average", () => {
    const quotes: Quotation[] = [
      {
        id: "q-anomaly",
        customerId: "c1",
        repId: "rep-1",
        createdAt: daysAgo(0),
        updatedAt: daysAgo(0),
        status: "draft",
        // Rep history is 5%, line discount is 15% (> 5 + 5)
        lines: [
          { id: "l1", productId: "p1", quantity: 1, listPrice: 100, discountPercent: 15, categoryCeiling: 15, overPoints: 0, isRecurring: false },
        ],
        blendedRiskScore: 0,
        approvalSteps: [],
        auditTrail: [],
        billingSchedule: [],
        negotiation: [],
        lastActivityAt: daysAgo(0),
        upsellAccepted: [],
      },
    ];

    const flags = evaluateDealHealth(quotes, [rep]);
    const anomaly = flags.find((f) => f.type === "discount_anomaly");

    expect(anomaly).toBeDefined();
    expect(anomaly?.severity).toBe("high");
    expect(anomaly?.message).toContain("well above their historical average");
  });

  it("flags delivery slippage when backorders exist with elapsed activity time", () => {
    const quotes: Quotation[] = [
      {
        id: "q-slippage",
        customerId: "c1",
        repId: "rep-1",
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
        status: "fulfilling",
        lines: [],
        blendedRiskScore: 0,
        approvalSteps: [],
        auditTrail: [],
        billingSchedule: [],
        warehousePlan: {
          lines: [],
          shipmentCount: 1,
          estimatedShippingCost: 10,
          backorderLines: [{ productId: "p1", quantity: 5 }],
          isManualOverride: false,
        },
        negotiation: [],
        lastActivityAt: daysAgo(2),
        upsellAccepted: [],
      },
    ];

    const flags = evaluateDealHealth(quotes, [rep]);
    const slippage = flags.find((f) => f.type === "delivery_slippage");

    expect(slippage).toBeDefined();
    expect(slippage?.severity).toBe("medium");
  });

  it("ignores confirmed, billed, and rejected quotations", () => {
    const quotes: Quotation[] = [
      {
        id: "q-billed",
        customerId: "c1",
        repId: "rep-1",
        createdAt: daysAgo(20),
        updatedAt: daysAgo(20),
        status: "billed",
        lines: [],
        blendedRiskScore: 0,
        approvalSteps: [],
        auditTrail: [],
        billingSchedule: [],
        negotiation: [],
        lastActivityAt: daysAgo(20),
        upsellAccepted: [],
      },
      {
        id: "q-confirmed",
        customerId: "c1",
        repId: "rep-1",
        createdAt: daysAgo(15),
        updatedAt: daysAgo(15),
        status: "confirmed",
        lines: [],
        blendedRiskScore: 0,
        approvalSteps: [],
        auditTrail: [],
        billingSchedule: [],
        negotiation: [],
        lastActivityAt: daysAgo(15),
        upsellAccepted: [],
      },
    ];

    const flags = evaluateDealHealth(quotes, [rep]);
    expect(flags).toHaveLength(0);
  });
});
