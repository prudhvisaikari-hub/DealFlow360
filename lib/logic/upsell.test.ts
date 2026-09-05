import { describe, it, expect } from "vitest";
import { getUpsellSuggestions, computeOrderMargin } from "./upsell";
import { Product, UpsellRule, QuoteLine } from "../types";

describe("upsell engine", () => {
  const products: Product[] = [
    { id: "p-laptop", name: "Laptop", category: "Hardware", basePrice: 1000, unit: "unit", tax: 0, description: "", variants: [], marginPercent: 20, isRecurring: false },
    { id: "p-monitor", name: "Monitor", category: "Hardware", basePrice: 300, unit: "unit", tax: 0, description: "", variants: [], marginPercent: 25, isRecurring: false },
    { id: "p-dock", name: "Dock", category: "Hardware", basePrice: 100, unit: "unit", tax: 0, description: "", variants: [], marginPercent: 30, isRecurring: false },
    { id: "p-lowmargin", name: "Budget Mouse", category: "Hardware", basePrice: 20, unit: "unit", tax: 0, description: "", variants: [], marginPercent: 5, isRecurring: false },
  ];

  const rules: UpsellRule[] = [
    { id: "r1", triggerProductId: "p-laptop", suggestedProductId: "p-monitor", coPurchaseScore: 0.7, promoted: true, minMarginPercent: 15 },
    { id: "r2", triggerProductId: "p-laptop", suggestedProductId: "p-dock", coPurchaseScore: 0.6, promoted: false, minMarginPercent: 15 },
    { id: "r3", triggerProductId: "p-laptop", suggestedProductId: "p-lowmargin", coPurchaseScore: 0.9, promoted: false, minMarginPercent: 15 },
  ];

  it("ranks suggestions by score including promotional boost (+0.15)", () => {
    const cart: QuoteLine[] = [
      { id: "l1", productId: "p-laptop", quantity: 1, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    // Monitor: 0.70 + 0.15 promo = 0.85
    // Dock: 0.60
    const suggestions = getUpsellSuggestions(cart, products, rules, []);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].productId).toBe("p-monitor");
    expect(suggestions[0].score).toBe(0.85);
    expect(suggestions[0].promoted).toBe(true);
    expect(suggestions[1].productId).toBe("p-dock");
    expect(suggestions[1].score).toBe(0.6);
  });

  it("filters out products already present in cart", () => {
    const cart: QuoteLine[] = [
      { id: "l1", productId: "p-laptop", quantity: 1, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
      { id: "l2", productId: "p-monitor", quantity: 1, listPrice: 300, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    const suggestions = getUpsellSuggestions(cart, products, rules, []);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].productId).toBe("p-dock");
  });

  it("filters out products already accepted", () => {
    const cart: QuoteLine[] = [
      { id: "l1", productId: "p-laptop", quantity: 1, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    const suggestions = getUpsellSuggestions(cart, products, rules, ["p-monitor"]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].productId).toBe("p-dock");
  });

  it("filters out products failing the margin gate", () => {
    const cart: QuoteLine[] = [
      { id: "l1", productId: "p-laptop", quantity: 1, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    // p-lowmargin has margin 5%, rule requires 15%
    const suggestions = getUpsellSuggestions(cart, products, rules, []);
    const hasLowMargin = suggestions.some((s) => s.productId === "p-lowmargin");

    expect(hasLowMargin).toBe(false);
  });

  describe("computeOrderMargin", () => {
    it("computes revenue-weighted blended margin correctly", () => {
      // Laptop: 1 * 1000 = 1000 rev, margin 20% -> profit $200
      // Dock: 1 * 100 = 100 rev, margin 30% -> profit $30
      // Total rev = 1100, profit = 230 -> margin = 230 / 1100 = 20.91%
      const lines: QuoteLine[] = [
        { id: "l1", productId: "p-laptop", quantity: 1, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
        { id: "l2", productId: "p-dock", quantity: 1, listPrice: 100, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
      ];
      const margin = computeOrderMargin(lines, products);

      expect(margin).toBe(20.91);
    });

    it("returns 0 for empty cart", () => {
      expect(computeOrderMargin([], products)).toBe(0);
    });
  });
});
