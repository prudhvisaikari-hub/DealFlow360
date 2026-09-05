import {
  QuoteLine,
  Product,
  CustomerTier,
  DiscountTier,
  CategoryDiscountCeiling,
  ApprovalChainRule,
  ApprovalStep,
} from "../types";

/**
 * For a given line, the *effective* ceiling is the MORE RESTRICTIVE of:
 *   - the customer tier's overall max discount
 *   - the product category's own ceiling
 * This matches spec: "different products are allowed different discount
 * limits... checks every line against its own limit, not just one overall
 * limit for the whole order."
 */
export function effectiveCeilingForLine(
  tier: CustomerTier,
  category: Product["category"],
  discountTiers: DiscountTier[],
  categoryCeilings: CategoryDiscountCeiling[]
): number {
  const tierMax = discountTiers.find((d) => d.tier === tier)?.maxDiscountPercent ?? 0;
  const catMax = categoryCeilings.find((c) => c.category === category)?.maxDiscountPercent ?? tierMax;
  return Math.min(tierMax, catMax);
}

/**
 * Blended risk score = sum of positive "over points" across all lines,
 * weighted by that line's share of order value, so:
 *  - one severely-over line dominates
 *  - many small overages still accumulate and cannot "hide" individually
 */
export function computeBlendedRiskScore(lines: QuoteLine[]): number {
  const totalValue = lines.reduce((s, l) => s + l.listPrice * l.quantity, 0) || 1;
  let score = 0;
  for (const line of lines) {
    const over = Math.max(0, line.overPoints);
    const lineValue = line.listPrice * line.quantity;
    const weight = lineValue / totalValue;
    // weighted contribution, but also add a flat component so many small
    // violations across many lines still add up meaningfully
    score += over * weight * 0.6 + over * 0.4;
  }
  return Math.round(score * 100) / 100;
}

export function worstOverLine(lines: QuoteLine[]): QuoteLine | null {
  if (lines.length === 0) return null;
  return lines.reduce((worst, l) => (l.overPoints > (worst?.overPoints ?? -Infinity) ? l : worst), lines[0]);
}

/**
 * Determine which approval steps are required given the blended score
 * and the configured approval chain rules.
 */
export function resolveApprovalSteps(
  blendedScore: number,
  rules: ApprovalChainRule[]
): ApprovalStep[] {
  if (blendedScore <= 0) return [];
  const matched = rules.find(
    (r) => blendedScore >= r.minOverPoints && (r.maxOverPoints === null || blendedScore <= r.maxOverPoints)
  );
  if (!matched) return [];
  const steps: ApprovalStep[] = [];
  if (matched.requiresManager) steps.push({ step: "sales_manager", status: "pending" });
  if (matched.requiresFinance) steps.push({ step: "finance", status: "pending" });
  return steps;
}

/**
 * Anomaly detection: flag if a rep's discount on this quote is well above
 * their historical average (used by the Deal Health dashboard).
 */
export function isDiscountAnomaly(
  quoteAvgDiscount: number,
  repHistoricalAvg: number,
  thresholdMultiplier = 1.6
): boolean {
  if (repHistoricalAvg <= 0) return quoteAvgDiscount > 10;
  return quoteAvgDiscount > repHistoricalAvg * thresholdMultiplier;
}

export function averageDiscount(lines: QuoteLine[]): number {
  if (lines.length === 0) return 0;
  const totalValue = lines.reduce((s, l) => s + l.listPrice * l.quantity, 0) || 1;
  const weightedDiscount = lines.reduce(
    (s, l) => s + l.discountPercent * (l.listPrice * l.quantity),
    0
  );
  return Math.round((weightedDiscount / totalValue) * 100) / 100;
}
