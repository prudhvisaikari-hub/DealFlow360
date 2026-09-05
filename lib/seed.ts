import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import {
  DB,
  User,
  Customer,
  Product,
  PriceListEntry,
  DiscountTier,
  CategoryDiscountCeiling,
  ApprovalChainRule,
  Warehouse,
  SubscriptionPlan,
  UpsellRule,
  Quotation,
  QuoteLine,
} from "./types";
import { effectiveCeilingForLine, computeBlendedRiskScore, resolveApprovalSteps } from "./logic/discountRisk";
import { computeWarehouseSplit } from "./logic/warehouseSplit";
import { buildBillingSchedule } from "./logic/billing";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function buildSeedData(): DB {
  // ---------------- Users ----------------
  const demoHash = bcrypt.hashSync("demo123", 10);
  const admin: User = { id: "u-admin", name: "Priya Shah", email: "priya@dealflow360.com", role: "admin", passwordHash: demoHash };
  const manager: User = { id: "u-manager", name: "Karan Mehta", email: "karan@dealflow360.com", role: "sales_manager", passwordHash: demoHash };
  const finance: User = { id: "u-finance", name: "Ritu Nair", email: "ritu@dealflow360.com", role: "finance", passwordHash: demoHash };
  const rep1: User = { id: "u-rep1", name: "Aditya Rao", email: "aditya@dealflow360.com", role: "sales_rep", avgDiscountHistory: 6, passwordHash: demoHash };
  const rep2: User = { id: "u-rep2", name: "Neha Kapoor", email: "neha@dealflow360.com", role: "sales_rep", avgDiscountHistory: 9, passwordHash: demoHash };

  const customerUser1: User = { id: "u-cust1", name: "Acme Corp Buyer", email: "buyer@acme.com", role: "customer", tier: "Gold", passwordHash: demoHash };
  const customerUser2: User = { id: "u-cust2", name: "Beta Industries Buyer", email: "buyer@beta.com", role: "customer", tier: "Silver", passwordHash: demoHash };
  const customerUser3: User = { id: "u-cust3", name: "Gamma Retail Buyer", email: "buyer@gamma.com", role: "customer", tier: "Bronze", passwordHash: demoHash };

  const users: User[] = [admin, manager, finance, rep1, rep2, customerUser1, customerUser2, customerUser3];

  // ---------------- Customers ----------------
  const customers: Customer[] = [
    { id: "cust-acme", name: "Acme Corp", tier: "Gold", portalUserId: customerUser1.id, currency: "USD" },
    { id: "cust-beta", name: "Beta Industries", tier: "Silver", portalUserId: customerUser2.id, currency: "USD" },
    { id: "cust-gamma", name: "Gamma Retail", tier: "Bronze", portalUserId: customerUser3.id, currency: "USD" },
  ];

  // ---------------- Subscription plans ----------------
  const planMonthly: SubscriptionPlan = { id: "plan-monthly-support", name: "Monthly Support Plan", cycle: "monthly", prorationEnabled: true, cancellationRefundPolicy: "prorated" };
  const planYearly: SubscriptionPlan = { id: "plan-yearly-license", name: "Annual Software License", cycle: "yearly", prorationEnabled: true, cancellationRefundPolicy: "prorated" };
  const planQuarterly: SubscriptionPlan = { id: "plan-quarterly-maintenance", name: "Quarterly Maintenance", cycle: "quarterly", prorationEnabled: false, cancellationRefundPolicy: "none" };
  const subscriptionPlans = [planMonthly, planYearly, planQuarterly];

  // ---------------- Products ----------------
  const products: Product[] = [
    {
      id: "prod-laptop", name: "ProBook Laptop 14\"", category: "Hardware", basePrice: 1200, unit: "unit",
      tax: 8, description: "Business-grade laptop, 16GB RAM / 512GB SSD.",
      variants: [{ id: uuid(), attribute: "RAM", value: "32GB Upgrade", extraPrice: 150 }],
      marginPercent: 22, isRecurring: false,
    },
    {
      id: "prod-monitor", name: "27\" 4K Monitor", category: "Hardware", basePrice: 340, unit: "unit",
      tax: 8, description: "27-inch 4K UHD display with USB-C.",
      variants: [], marginPercent: 25, isRecurring: false,
    },
    {
      id: "prod-dock", name: "USB-C Docking Station", category: "Hardware", basePrice: 95, unit: "unit",
      tax: 8, description: "Universal docking station, triple display support.",
      variants: [], marginPercent: 30, isRecurring: false,
    },
    {
      id: "prod-setup-service", name: "On-site Setup Service", category: "Services", basePrice: 500, unit: "engagement",
      tax: 0, description: "On-site hardware setup and configuration for new deployments.",
      variants: [], marginPercent: 40, isRecurring: false,
    },
    {
      id: "prod-training", name: "Admin Training Workshop", category: "Services", basePrice: 800, unit: "engagement",
      tax: 0, description: "Half-day training workshop for IT administrators.",
      variants: [], marginPercent: 45, isRecurring: false,
    },
    {
      id: "prod-support-plan", name: "Monthly Support Plan", category: "Subscriptions", basePrice: 150, unit: "month",
      tax: 0, description: "Priority support with 24hr SLA, billed monthly.",
      variants: [], marginPercent: 55, isRecurring: true, recurringPlanId: planMonthly.id,
    },
    {
      id: "prod-software-license", name: "DealFlow Add-on License", category: "Subscriptions", basePrice: 1800, unit: "year",
      tax: 0, description: "Annual license for the CRM add-on module.",
      variants: [], marginPercent: 60, isRecurring: true, recurringPlanId: planYearly.id,
    },
    {
      id: "prod-maintenance", name: "Hardware Maintenance Plan", category: "Subscriptions", basePrice: 300, unit: "quarter",
      tax: 0, description: "Quarterly maintenance & replacement coverage.",
      variants: [], marginPercent: 35, isRecurring: true, recurringPlanId: planQuarterly.id,
    },
  ];

  // ---------------- Price lists ----------------
  const priceLists: PriceListEntry[] = [];
  const tiers: ("Bronze" | "Silver" | "Gold")[] = ["Bronze", "Silver", "Gold"];
  for (const p of products) {
    for (const t of tiers) {
      const tierDiscountFactor = t === "Gold" ? 0.97 : t === "Silver" ? 0.99 : 1;
      priceLists.push({
        id: uuid(),
        productId: p.id,
        tier: t,
        currency: "USD",
        price: Math.round(p.basePrice * tierDiscountFactor * 100) / 100,
      });
    }
  }

  // ---------------- Discount governance ----------------
  const discountTiers: DiscountTier[] = [
    { tier: "Bronze", maxDiscountPercent: 5 },
    { tier: "Silver", maxDiscountPercent: 10 },
    { tier: "Gold", maxDiscountPercent: 15 },
  ];

  const categoryCeilings: CategoryDiscountCeiling[] = [
    { category: "Hardware", maxDiscountPercent: 15 },
    { category: "Services", maxDiscountPercent: 10 },
    { category: "Subscriptions", maxDiscountPercent: 12 },
  ];

  const approvalChainRules: ApprovalChainRule[] = [
    { id: uuid(), minOverPoints: 0.01, maxOverPoints: 3, requiresManager: true, requiresFinance: false, label: "Minor overage — Manager review" },
    { id: uuid(), minOverPoints: 3.01, maxOverPoints: null, requiresManager: true, requiresFinance: true, label: "Significant overage — Manager + Finance review" },
  ];

  // ---------------- Warehouses ----------------
  const warehouses: Warehouse[] = [
    {
      id: "wh-main", name: "Main Warehouse", location: "Newark, NJ", shippingCostWeight: 1.0, replenishmentDays: 5,
      stock: { "prod-laptop": 10, "prod-monitor": 4, "prod-dock": 25 },
    },
    {
      id: "wh-east", name: "East Depot", location: "Columbus, OH", shippingCostWeight: 1.4, replenishmentDays: 3,
      stock: { "prod-laptop": 3, "prod-monitor": 15, "prod-dock": 8 },
    },
  ];

  // ---------------- Upsell rules ----------------
  const upsellRules: UpsellRule[] = [
    { id: uuid(), triggerProductId: "prod-laptop", suggestedProductId: "prod-monitor", coPurchaseScore: 0.72, promoted: true, minMarginPercent: 15 },
    { id: uuid(), triggerProductId: "prod-laptop", suggestedProductId: "prod-dock", coPurchaseScore: 0.65, promoted: false, minMarginPercent: 15 },
    { id: uuid(), triggerProductId: "prod-laptop", suggestedProductId: "prod-support-plan", coPurchaseScore: 0.5, promoted: false, minMarginPercent: 20 },
    { id: uuid(), triggerProductId: "prod-monitor", suggestedProductId: "prod-dock", coPurchaseScore: 0.4, promoted: false, minMarginPercent: 15 },
    { id: uuid(), triggerProductId: "prod-setup-service", suggestedProductId: "prod-training", coPurchaseScore: 0.55, promoted: true, minMarginPercent: 20 },
  ];

  // ---------------- Sample quotations ----------------
  const quotations: Quotation[] = [];

  // Q1: Draft quote for Acme (Gold) — used for the "quick test flow" demo,
  // deliberately over-discounted on the Services line to trigger approval.
  function makeLine(productId: string, quantity: number, discountPercent: number, isRecurring = false, subscriptionPlanId?: string): QuoteLine {
    const product = products.find((p) => p.id === productId)!;
    const priceEntry = priceLists.find((pl) => pl.productId === productId && pl.tier === "Gold")!;
    const ceiling = effectiveCeilingForLine("Gold", product.category, discountTiers, categoryCeilings);
    return {
      id: uuid(),
      productId,
      quantity,
      listPrice: priceEntry.price,
      discountPercent,
      categoryCeiling: ceiling,
      overPoints: Math.round((discountPercent - ceiling) * 100) / 100,
      isRecurring,
      subscriptionPlanId,
    };
  }

  const q1Lines: QuoteLine[] = [
    makeLine("prod-laptop", 5, 12), // within ceiling (15)
    makeLine("prod-setup-service", 1, 18), // over the Services ceiling (10) -> +8 pts
    makeLine("prod-support-plan", 5, 5, true, planMonthly.id), // recurring line, within ceiling
  ];
  const q1Score = computeBlendedRiskScore(q1Lines);
  const q1Steps = resolveApprovalSteps(q1Score, approvalChainRules);
  const q1WarehousePlan = computeWarehouseSplit(q1Lines, warehouses, products);
  const q1Billing = buildBillingSchedule(q1Lines, subscriptionPlans, new Date());

  quotations.push({
    id: "quote-acme-001",
    customerId: "cust-acme",
    repId: rep1.id,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
    status: q1Steps.length > 0 ? "pending_manager_approval" : "approved",
    lines: q1Lines,
    blendedRiskScore: q1Score,
    approvalSteps: q1Steps,
    auditTrail: [
      { id: uuid(), timestamp: daysAgo(2), userId: rep1.id, userName: rep1.name, action: "created", detail: "Quotation created for Acme Corp" },
      { id: uuid(), timestamp: daysAgo(0), userId: rep1.id, userName: rep1.name, action: "submitted", detail: `Submitted for approval — blended risk score ${q1Score}` },
    ],
    warehousePlan: q1WarehousePlan,
    billingSchedule: q1Billing,
    negotiation: [],
    lastActivityAt: daysAgo(0),
    upsellAccepted: ["prod-monitor"],
  });

  // Q2: Beta Industries (Silver) — stalled quote, no approval needed, sitting idle.
  const q2Lines: QuoteLine[] = [
    makeLineForTier("prod-monitor", 3, 8, "Silver"),
    makeLineForTier("prod-dock", 3, 5, "Silver"),
  ];
  function makeLineForTier(productId: string, quantity: number, discountPercent: number, tier: "Bronze" | "Silver" | "Gold"): QuoteLine {
    const product = products.find((p) => p.id === productId)!;
    const priceEntry = priceLists.find((pl) => pl.productId === productId && pl.tier === tier)!;
    const ceiling = effectiveCeilingForLine(tier, product.category, discountTiers, categoryCeilings);
    return {
      id: uuid(), productId, quantity, listPrice: priceEntry.price, discountPercent,
      categoryCeiling: ceiling, overPoints: Math.round((discountPercent - ceiling) * 100) / 100,
      isRecurring: false,
    };
  }
  quotations.push({
    id: "quote-beta-001",
    customerId: "cust-beta",
    repId: rep2.id,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(6),
    status: "sent",
    lines: q2Lines,
    blendedRiskScore: computeBlendedRiskScore(q2Lines),
    approvalSteps: [],
    auditTrail: [
      { id: uuid(), timestamp: daysAgo(9), userId: rep2.id, userName: rep2.name, action: "created", detail: "Quotation created for Beta Industries" },
      { id: uuid(), timestamp: daysAgo(6), userId: rep2.id, userName: rep2.name, action: "sent", detail: "Sent to customer portal" },
    ],
    warehousePlan: computeWarehouseSplit(q2Lines, warehouses, products),
    billingSchedule: buildBillingSchedule(q2Lines, subscriptionPlans, new Date(daysAgo(6))),
    negotiation: [
      { id: uuid(), authorRole: "customer", authorName: "Beta Industries Buyer", timestamp: daysAgo(6), message: "Can we get a better price on the docks?", counterDiscountPercent: 8 },
    ],
    lastActivityAt: daysAgo(6),
    upsellAccepted: [],
  });

  // Q3: Gamma Retail (Bronze) — confirmed & billed, healthy example.
  const q3Lines: QuoteLine[] = [
    makeLineForTier("prod-dock", 10, 3, "Bronze"),
  ];
  quotations.push({
    id: "quote-gamma-001",
    customerId: "cust-gamma",
    repId: rep1.id,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(12),
    status: "billed",
    lines: q3Lines,
    blendedRiskScore: 0,
    approvalSteps: [],
    auditTrail: [
      { id: uuid(), timestamp: daysAgo(15), userId: rep1.id, userName: rep1.name, action: "created", detail: "Quotation created for Gamma Retail" },
      { id: uuid(), timestamp: daysAgo(13), userId: customerUser3.id, userName: customerUser3.name, action: "confirmed", detail: "Customer confirmed quotation via portal" },
      { id: uuid(), timestamp: daysAgo(12), userId: finance.id, userName: finance.name, action: "billed", detail: "Invoice generated and payment recorded" },
    ],
    warehousePlan: computeWarehouseSplit(q3Lines, warehouses, products),
    billingSchedule: buildBillingSchedule(q3Lines, subscriptionPlans, new Date(daysAgo(13))).map((b) => ({ ...b, status: "paid" as const })),
    negotiation: [],
    lastActivityAt: daysAgo(12),
    upsellAccepted: [],
  });

  return {
    users,
    customers,
    products,
    priceLists,
    discountTiers,
    categoryCeilings,
    approvalChainRules,
    warehouses,
    subscriptionPlans,
    upsellRules,
    quotations,
  };
}
