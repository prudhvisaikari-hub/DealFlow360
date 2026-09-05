// ============================================================
// DealFlow360 — Core Data Model
// ============================================================

export type Role = "admin" | "sales_manager" | "finance" | "sales_rep" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tier?: CustomerTier; // only for customer role
  avgDiscountHistory?: number; // used for anomaly detection, rep-level
  passwordHash?: string;
}

export type CustomerTier = "Bronze" | "Silver" | "Gold";

export interface Customer {
  id: string;
  name: string;
  tier: CustomerTier;
  portalUserId: string;
  currency: string;
}

export type ProductCategory = "Hardware" | "Services" | "Subscriptions";

export interface ProductVariant {
  id: string;
  attribute: string; // e.g. "Size", "Pack"
  value: string;
  extraPrice: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  unit: string;
  tax: number; // percent
  description: string;
  variants: ProductVariant[];
  marginPercent: number; // baseline margin used for margin calculations
  isRecurring: boolean;
  recurringPlanId?: string; // link to a SubscriptionPlan if isRecurring
}

export interface PriceListEntry {
  id: string;
  productId: string;
  tier: CustomerTier;
  currency: string;
  price: number;
}

// ---- Discount governance ----

export interface DiscountTier {
  tier: CustomerTier;
  maxDiscountPercent: number;
}

export interface CategoryDiscountCeiling {
  category: ProductCategory;
  maxDiscountPercent: number;
}

export interface ApprovalChainRule {
  id: string;
  minOverPoints: number; // blended risk score threshold (points over limit)
  maxOverPoints: number | null; // null = no upper bound
  requiresManager: boolean;
  requiresFinance: boolean;
  label: string;
}

// ---- Warehouses ----

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  shippingCostWeight: number; // relative cost weighting used to minimize shipments
  stock: Record<string, number>; // productId -> qty on hand
  replenishmentDays: number;
}

// ---- Subscriptions ----

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  name: string;
  cycle: BillingCycle;
  prorationEnabled: boolean;
  cancellationRefundPolicy: "full" | "prorated" | "none";
}

// ---- Upsell rules ----

export interface UpsellRule {
  id: string;
  triggerProductId: string;
  suggestedProductId: string;
  coPurchaseScore: number; // 0-1, historical strength
  promoted: boolean;
  minMarginPercent: number;
}

// ---- Quotation ----

export type QuoteStatus =
  | "draft"
  | "pending_manager_approval"
  | "pending_finance_approval"
  | "approved"
  | "rejected"
  | "sent"
  | "under_negotiation"
  | "confirmed"
  | "fulfilling"
  | "billed";

export interface QuoteLine {
  id: string;
  productId: string;
  quantity: number;
  listPrice: number;
  discountPercent: number;
  categoryCeiling: number; // ceiling applicable to this line's category
  overPoints: number; // discountPercent - allowedCeiling (can be negative)
  isRecurring: boolean;
  subscriptionPlanId?: string;
  variantId?: string;
  variantLabel?: string;
}

export interface ApprovalStep {
  step: "sales_manager" | "finance";
  status: "pending" | "approved" | "rejected" | "returned";
  actedBy?: string;
  actedAt?: string;
  reason?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
}

export interface WarehouseSplitLine {
  warehouseId: string;
  productId: string;
  quantity: number;
}

export interface WarehouseSplitPlan {
  lines: WarehouseSplitLine[];
  shipmentCount: number;
  estimatedShippingCost: number;
  backorderLines: { productId: string; quantity: number }[];
  isManualOverride: boolean;
}

export interface BillingScheduleEntry {
  id: string;
  lineId: string;
  dueDate: string;
  amount: number;
  status: "scheduled" | "invoiced" | "paid" | "credited";
  note?: string;
}

export interface NegotiationMessage {
  id: string;
  authorRole: Role;
  authorName: string;
  timestamp: string;
  lineId?: string; // line-level comment, optional
  message: string;
  counterDiscountPercent?: number;
}

export interface Quotation {
  id: string;
  customerId: string;
  repId: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  lines: QuoteLine[];
  blendedRiskScore: number;
  approvalSteps: ApprovalStep[];
  auditTrail: AuditEntry[];
  warehousePlan?: WarehouseSplitPlan;
  billingSchedule: BillingScheduleEntry[];
  negotiation: NegotiationMessage[];
  lastActivityAt: string;
  upsellAccepted: string[]; // productIds accepted from suggestions
  marginPercentSnapshot?: number;
}

// ---- Root DB shape ----

export interface DB {
  users: User[];
  customers: Customer[];
  products: Product[];
  priceLists: PriceListEntry[];
  discountTiers: DiscountTier[];
  categoryCeilings: CategoryDiscountCeiling[];
  approvalChainRules: ApprovalChainRule[];
  warehouses: Warehouse[];
  subscriptionPlans: SubscriptionPlan[];
  upsellRules: UpsellRule[];
  quotations: Quotation[];
}
