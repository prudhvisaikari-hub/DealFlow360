import { UpsellRule, Product, QuoteLine } from "../types";

export interface UpsellSuggestion {
  productId: string;
  productName: string;
  score: number;
  marginDelta: number;
  promoted: boolean;
  reason: string;
}

/**
 * Given the products currently in the cart, rank upsell/cross-sell
 * suggestions using historical co-purchase strength, promotion boosts,
 * and a minimum margin threshold so only healthy-margin items surface.
 */
export function getUpsellSuggestions(
  cartLines: QuoteLine[],
  products: Product[],
  rules: UpsellRule[],
  alreadyAccepted: string[]
): UpsellSuggestion[] {
  const cartProductIds = new Set(cartLines.map((l) => l.productId));
  const candidates = new Map<string, UpsellSuggestion>();

  for (const line of cartLines) {
    const applicableRules = rules.filter((r) => r.triggerProductId === line.productId);
    for (const rule of applicableRules) {
      if (cartProductIds.has(rule.suggestedProductId)) continue;
      if (alreadyAccepted.includes(rule.suggestedProductId)) continue;

      const suggestedProduct = products.find((p) => p.id === rule.suggestedProductId);
      if (!suggestedProduct) continue;
      if (suggestedProduct.marginPercent < rule.minMarginPercent) continue; // margin gate

      const promoBoost = rule.promoted ? 0.15 : 0;
      const score = Math.min(1, rule.coPurchaseScore + promoBoost);
      const marginDelta = Math.round(suggestedProduct.basePrice * (suggestedProduct.marginPercent / 100) * 100) / 100;

      const existing = candidates.get(suggestedProduct.id);
      if (!existing || existing.score < score) {
        candidates.set(suggestedProduct.id, {
          productId: suggestedProduct.id,
          productName: suggestedProduct.name,
          score: Math.round(score * 100) / 100,
          marginDelta,
          promoted: rule.promoted,
          reason: rule.promoted
            ? "Frequently bought together + currently promoted"
            : "Frequently bought together",
        });
      }
    }
  }

  return Array.from(candidates.values()).sort((a, b) => b.score - a.score);
}

export function computeOrderMargin(lines: QuoteLine[], products: Product[]): number {
  let totalRevenue = 0;
  let totalMargin = 0;
  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) continue;
    const netPrice = line.listPrice * (1 - line.discountPercent / 100);
    const lineRevenue = netPrice * line.quantity;
    // Discount eats directly into margin
    const grossMarginAmount = product.basePrice * (product.marginPercent / 100);
    const discountImpact = line.listPrice * (line.discountPercent / 100);
    const netMarginPerUnit = grossMarginAmount - discountImpact;
    totalRevenue += lineRevenue;
    totalMargin += netMarginPerUnit * line.quantity;
  }
  if (totalRevenue === 0) return 0;
  return Math.round((totalMargin / totalRevenue) * 10000) / 100; // percent
}
