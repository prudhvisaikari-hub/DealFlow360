"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { readDB, writeDB, resetDB } from "./db";
import { setCurrentUser, clearCurrentUser, getCurrentUser } from "./session";
import {
  effectiveCeilingForLine,
  computeBlendedRiskScore,
  resolveApprovalSteps,
} from "./logic/discountRisk";
import { computeWarehouseSplit, consolidateBackorder } from "./logic/warehouseSplit";
import {
  buildBillingSchedule,
  prorateQuantityChange,
  calculateCancellationRefund,
  computeDaysRemainingInCycle,
} from "./logic/billing";
import { QuoteLine, AuditEntry, ApprovalStep, Product, CustomerTier, Customer, User } from "./types";

// ---------------- Auth ----------------

const DEMO_PASSWORD = "demo123";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    redirect("/login?error=1");
  }
  const isValid = user.passwordHash
    ? bcrypt.compareSync(password, user.passwordHash)
    : password === "demo123";

  if (!isValid) {
    redirect("/login?error=1");
  }
  setCurrentUser(user);
  if (user.role === "customer") redirect("/portal");
  redirect("/workspace");
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = (String(formData.get("role") || "sales_rep").trim()) as User["role"];

  if (!name || !email || !password) {
    redirect("/signup?error=missing");
  }

  const db = readDB();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    redirect("/signup?error=exists");
  }

  const id = "u-" + uuid().slice(0, 8);
  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser: User = { id, name, email, role, passwordHash };

  db.users.push(newUser);
  writeDB(db);

  setCurrentUser(newUser);
  if (role === "customer") redirect("/portal");
  redirect("/workspace");
}

export async function logoutAction() {
  clearCurrentUser();
  redirect("/login");
}

export async function resetDemoAction() {
  resetDB();
  revalidatePath("/", "layout");
  redirect("/workspace");
}

// ---------------- Helpers ----------------

function audit(action: string, detail: string): AuditEntry {
  const user = getCurrentUser();
  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    userId: user?.id ?? "system",
    userName: user?.name ?? "System",
    action,
    detail,
  };
}

function recalcQuoteLine(
  productId: string,
  quantity: number,
  discountPercent: number,
  isRecurring: boolean,
  subscriptionPlanId: string | undefined,
  tier: "Bronze" | "Silver" | "Gold",
  db: ReturnType<typeof readDB>,
  existingId?: string,
  variantId?: string
): QuoteLine {
  const product = db.products.find((p) => p.id === productId)!;
  const priceEntry = db.priceLists.find((pl) => pl.productId === productId && pl.tier === tier)!;
  const ceiling = effectiveCeilingForLine(tier, product.category, db.discountTiers, db.categoryCeilings);
  const variant = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
  const extraPrice = variant?.extraPrice ?? 0;
  return {
    id: existingId ?? uuid(),
    productId,
    quantity,
    listPrice: (priceEntry?.price ?? product.basePrice) + extraPrice,
    discountPercent,
    categoryCeiling: ceiling,
    overPoints: Math.round((discountPercent - ceiling) * 100) / 100,
    isRecurring,
    subscriptionPlanId,
    variantId: variant?.id,
    variantLabel: variant ? `${variant.attribute}: ${variant.value}` : undefined,
  };
}

// ---------------- Quotation lifecycle ----------------

export async function createQuotationAction(formData: FormData) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const customerId = String(formData.get("customerId"));
  const db = readDB();
  const newQuote = {
    id: uuid(),
    customerId,
    repId: user!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft" as const,
    lines: [],
    blendedRiskScore: 0,
    approvalSteps: [],
    auditTrail: [audit("created", `Quotation created for customer ${customerId}`)],
    warehousePlan: undefined,
    billingSchedule: [],
    negotiation: [],
    lastActivityAt: new Date().toISOString(),
    upsellAccepted: [],
  };
  db.quotations.push(newQuote);
  writeDB(db);
  redirect(`/workspace/quotations/${newQuote.id}`);
}

export async function addLineAction(quotationId: string, formData: FormData) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const customer = db.customers.find((c) => c.id === quote.customerId)!;
  const productId = String(formData.get("productId"));
  const quantity = Number(formData.get("quantity") || 1);
  const discountPercent = Number(formData.get("discountPercent") || 0);
  const variantId = formData.get("variantId") ? String(formData.get("variantId")) : undefined;
  const product = db.products.find((p) => p.id === productId)!;

  const line = recalcQuoteLine(
    productId,
    quantity,
    discountPercent,
    product.isRecurring,
    product.recurringPlanId,
    customer.tier,
    db,
    undefined,
    variantId
  );
  quote.lines.push(line);
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  const variantText = line.variantLabel ? ` (${line.variantLabel})` : "";
  quote.auditTrail.push(audit("line_added", `Added ${quantity} x ${product.name}${variantText} at ${discountPercent}% discount`));
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function updateLineDiscountAction(quotationId: string, lineId: string, formData: FormData) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const customer = db.customers.find((c) => c.id === quote.customerId)!;
  const line = quote.lines.find((l) => l.id === lineId);
  if (!line) return;
  const discountPercent = Number(formData.get("discountPercent") || 0);
  const quantity = Number(formData.get("quantity") || line.quantity);
  const product = db.products.find((p) => p.id === line.productId)!;
  const ceiling = effectiveCeilingForLine(customer.tier, product.category, db.discountTiers, db.categoryCeilings);
  line.discountPercent = discountPercent;
  line.quantity = quantity;
  line.categoryCeiling = ceiling;
  line.overPoints = Math.round((discountPercent - ceiling) * 100) / 100;
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  quote.auditTrail.push(audit("line_updated", `Updated ${product.name}: qty=${quantity}, discount=${discountPercent}%`));
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function removeLineAction(quotationId: string, lineId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  quote.lines = quote.lines.filter((l) => l.id !== lineId);
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function acceptUpsellAction(quotationId: string, productId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const customer = db.customers.find((c) => c.id === quote.customerId)!;
  const product = db.products.find((p) => p.id === productId)!;
  const line = recalcQuoteLine(productId, 1, 0, product.isRecurring, product.recurringPlanId, customer.tier, db);
  quote.lines.push(line);
  quote.upsellAccepted.push(productId);
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  quote.auditTrail.push(audit("upsell_accepted", `Added suggested product ${product.name}`));
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function submitForApprovalAction(quotationId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const score = computeBlendedRiskScore(quote.lines);
  const steps = resolveApprovalSteps(score, db.approvalChainRules);
  quote.blendedRiskScore = score;
  quote.approvalSteps = steps;

  if (steps.length === 0) {
    quote.status = "approved";
    quote.warehousePlan = computeWarehouseSplit(quote.lines, db.warehouses, db.products);
    quote.billingSchedule = buildBillingSchedule(quote.lines, db.subscriptionPlans, new Date());
    quote.auditTrail.push(audit("auto_approved", `No approval required (blended risk score ${score}). Auto-approved.`));
  } else {
    quote.status = steps[0].step === "sales_manager" ? "pending_manager_approval" : "pending_finance_approval";
    quote.auditTrail.push(audit("submitted_for_approval", `Submitted for approval — blended risk score ${score}. Steps: ${steps.map((s) => s.step).join(", ")}`));
  }
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function actOnApprovalAction(
  quotationId: string,
  stepType: "sales_manager" | "finance",
  decision: "approved" | "rejected" | "returned",
  formData: FormData
) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const user = getCurrentUser();
  const reason = String(formData.get("reason") || "");
  const step = quote.approvalSteps.find((s) => s.step === stepType);
  if (!step) return;
  step.status = decision;
  step.actedBy = user?.name;
  step.actedAt = new Date().toISOString();
  step.reason = reason;

  quote.auditTrail.push(audit(`approval_${decision}`, `${stepType.replace("_", " ")} step ${decision}${reason ? `: ${reason}` : ""}`));

  if (decision === "rejected") {
    quote.status = "rejected";
  } else if (decision === "returned") {
    quote.status = "draft";
  } else {
    // approved -> move to next pending step, or fully approve
    const nextPending = quote.approvalSteps.find((s) => s.status === "pending");
    if (nextPending) {
      quote.status = nextPending.step === "sales_manager" ? "pending_manager_approval" : "pending_finance_approval";
    } else {
      quote.status = "approved";
      quote.warehousePlan = computeWarehouseSplit(quote.lines, db.warehouses, db.products);
      quote.billingSchedule = buildBillingSchedule(quote.lines, db.subscriptionPlans, new Date());
      quote.auditTrail.push(audit("fully_approved", "All required approvals complete."));
    }
  }
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function acceptWarehouseSplitAction(quotationId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  quote.status = "fulfilling";
  quote.auditTrail.push(audit("fulfillment_accepted", "Suggested warehouse split accepted."));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function overrideWarehouseSplitAction(quotationId: string, formData: FormData) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote || !quote.warehousePlan) return;
  // Expect fields named split-<lineIndex>-warehouseId
  const newLines = quote.warehousePlan.lines.map((line, idx) => {
    const overrideWh = formData.get(`split-${idx}-warehouseId`);
    return overrideWh ? { ...line, warehouseId: String(overrideWh) } : line;
  });
  quote.warehousePlan = { ...quote.warehousePlan, lines: newLines, isManualOverride: true };
  quote.status = "fulfilling";
  quote.auditTrail.push(audit("fulfillment_overridden", "Manager manually overrode warehouse split."));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function consolidateBackorderAction(quotationId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote || !quote.warehousePlan) return;
  const newLines = consolidateBackorder(quote.warehousePlan.backorderLines, db.warehouses);
  quote.warehousePlan.lines.push(...newLines);
  quote.warehousePlan.backorderLines = [];
  quote.auditTrail.push(audit("backorder_consolidated", "Remaining backorder consolidated into shipment."));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

// ---------------- Subscription / billing actions ----------------

export async function changeSubscriptionQuantityAction(quotationId: string, lineId: string, formData: FormData) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const line = quote.lines.find((l) => l.id === lineId);
  if (!line || !line.isRecurring) return;
  const plan = db.subscriptionPlans.find((p) => p.id === line.subscriptionPlanId);
  if (!plan) return;
  const newQuantity = Number(formData.get("newQuantity") || line.quantity);
  const cycleStart = new Date(quote.createdAt);
  const daysRemaining = formData.has("daysRemaining") && formData.get("daysRemaining") !== ""
    ? Number(formData.get("daysRemaining"))
    : computeDaysRemainingInCycle(cycleStart, plan.cycle);
  const result = prorateQuantityChange(line, plan, line.quantity, newQuantity, daysRemaining);
  line.quantity = newQuantity;

  quote.billingSchedule.push({
    id: uuid(),
    lineId: line.id,
    dueDate: new Date().toISOString(),
    amount: result.amount,
    status: result.type === "credit" ? "credited" : "scheduled",
    note: result.note,
  });
  quote.auditTrail.push(audit("subscription_quantity_changed", `${result.note} New quantity: ${newQuantity}`));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function cancelSubscriptionLineAction(quotationId: string, lineId: string, formData: FormData) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const line = quote.lines.find((l) => l.id === lineId);
  if (!line || !line.isRecurring) return;
  const plan = db.subscriptionPlans.find((p) => p.id === line.subscriptionPlanId);
  if (!plan) return;
  const cycleStart = new Date(quote.createdAt);
  const daysRemaining = formData.has("daysRemaining") && formData.get("daysRemaining") !== ""
    ? Number(formData.get("daysRemaining"))
    : computeDaysRemainingInCycle(cycleStart, plan.cycle);
  const refund = calculateCancellationRefund(line, plan, daysRemaining);

  quote.billingSchedule = quote.billingSchedule.filter((b) => b.lineId !== line.id || b.status === "paid" || b.status === "invoiced");
  if (refund.refundAmount > 0) {
    quote.billingSchedule.push({
      id: uuid(),
      lineId: line.id,
      dueDate: new Date().toISOString(),
      amount: refund.refundAmount,
      status: "credited",
      note: refund.note,
    });
  }
  quote.lines = quote.lines.filter((l) => l.id !== lineId);
  quote.auditTrail.push(audit("subscription_cancelled", `Cancelled subscription line. ${refund.note}`));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function recordPaymentAction(quotationId: string, scheduleEntryId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const entry = quote.billingSchedule.find((b) => b.id === scheduleEntryId);
  if (!entry) return;
  entry.status = "paid";
  quote.auditTrail.push(audit("payment_recorded", `Payment recorded for ${entry.amount} (${entry.note ?? ""})`));
  const allInvoicedPaid = quote.billingSchedule.filter((b) => b.status !== "scheduled").every((b) => b.status === "paid" || b.status === "credited");
  if (allInvoicedPaid) quote.status = "billed";
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

// ---------------- Customer portal / negotiation ----------------

export async function sendQuotationToCustomerAction(quotationId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  quote.status = "sent";
  quote.auditTrail.push(audit("sent_to_customer", "Quotation sent to customer portal."));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function addNegotiationMessageAction(quotationId: string, formData: FormData) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const user = getCurrentUser();
  const message = String(formData.get("message") || "");
  const counter = formData.get("counterDiscountPercent");
  const lineId = formData.get("lineId");
  quote.negotiation.push({
    id: uuid(),
    authorRole: user?.role ?? "customer",
    authorName: user?.name ?? "Customer",
    timestamp: new Date().toISOString(),
    lineId: lineId ? String(lineId) : undefined,
    message,
    counterDiscountPercent: counter ? Number(counter) : undefined,
  });
  quote.status = "under_negotiation";
  quote.auditTrail.push(audit("negotiation_message", `${user?.role === "customer" ? "Customer" : "Rep"} added a negotiation message`));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
  revalidatePath(`/portal/quotations/${quotationId}`);
}

export async function applyCounterDiscountAction(quotationId: string, lineId: string, newDiscountPercent: number) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const customer = db.customers.find((c) => c.id === quote.customerId)!;
  const line = quote.lines.find((l) => l.id === lineId);
  if (!line) return;
  const product = db.products.find((p) => p.id === line.productId)!;
  const ceiling = effectiveCeilingForLine(customer.tier, product.category, db.discountTiers, db.categoryCeilings);
  line.discountPercent = newDiscountPercent;
  line.categoryCeiling = ceiling;
  line.overPoints = Math.round((newDiscountPercent - ceiling) * 100) / 100;
  quote.auditTrail.push(audit("counter_applied", `Applied customer counter discount of ${newDiscountPercent}% on ${product.name}`));
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
  revalidatePath(`/portal/quotations/${quotationId}`);
}

export async function confirmQuotationAction(quotationId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const customer = db.customers.find((c) => c.id === quote.customerId)!;

  // Apply any pending customer counter-discount requests to their matching
  // lines before recomputing risk, so a confirmed negotiation can
  // automatically re-trigger the approval flow if it now exceeds thresholds.
  for (const msg of quote.negotiation) {
    if (msg.lineId && msg.counterDiscountPercent !== undefined) {
      const line = quote.lines.find((l) => l.id === msg.lineId);
      if (line) {
        const product = db.products.find((p) => p.id === line.productId)!;
        const ceiling = effectiveCeilingForLine(customer.tier, product.category, db.discountTiers, db.categoryCeilings);
        line.discountPercent = msg.counterDiscountPercent;
        line.categoryCeiling = ceiling;
        line.overPoints = Math.round((msg.counterDiscountPercent - ceiling) * 100) / 100;
      }
    }
  }

  const score = computeBlendedRiskScore(quote.lines);
  const steps = resolveApprovalSteps(score, db.approvalChainRules);
  quote.blendedRiskScore = score;

  if (steps.length > 0) {
    quote.approvalSteps = steps;
    quote.status = steps[0].step === "sales_manager" ? "pending_manager_approval" : "pending_finance_approval";
    quote.auditTrail.push(audit("re_entered_approval", `Customer-confirmed terms exceed thresholds (score ${score}). Re-routed for approval.`));
  } else {
    quote.status = "confirmed";
    quote.warehousePlan = computeWarehouseSplit(quote.lines, db.warehouses, db.products);
    quote.billingSchedule = buildBillingSchedule(quote.lines, db.subscriptionPlans, new Date());
    quote.auditTrail.push(audit("confirmed", "Customer confirmed quotation. Moving to fulfillment."));
  }
  quote.updatedAt = new Date().toISOString();
  quote.lastActivityAt = quote.updatedAt;
  writeDB(db);
  revalidatePath(`/workspace/quotations/${quotationId}`);
  revalidatePath(`/portal/quotations/${quotationId}`);
}

// ---------------- Admin config actions ----------------

export async function updateDiscountTierAction(formData: FormData) {
  const db = readDB();
  const tier = String(formData.get("tier")) as "Bronze" | "Silver" | "Gold";
  const max = Number(formData.get("maxDiscountPercent"));
  const t = db.discountTiers.find((d) => d.tier === tier);
  if (t) t.maxDiscountPercent = max;
  writeDB(db);
  revalidatePath("/backend/discounts");
}

export async function updateCategoryCeilingAction(formData: FormData) {
  const db = readDB();
  const category = String(formData.get("category")) as Product["category"];
  const max = Number(formData.get("maxDiscountPercent"));
  const c = db.categoryCeilings.find((x) => x.category === category);
  if (c) c.maxDiscountPercent = max;
  writeDB(db);
  revalidatePath("/backend/discounts");
}

export async function addProductAction(formData: FormData) {
  const db = readDB();
  const id = "prod-" + uuid().slice(0, 8);
  const name = String(formData.get("name"));
  const category = String(formData.get("category")) as Product["category"];
  const basePrice = Number(formData.get("basePrice"));
  const marginPercent = Number(formData.get("marginPercent"));
  const unit = String(formData.get("unit") || "unit");
  const tax = Number(formData.get("tax") || 0);
  const description = String(formData.get("description") || "");
  const isRecurring = formData.get("isRecurring") === "on";
  const recurringPlanId = isRecurring ? String(formData.get("recurringPlanId") || "") : undefined;

  db.products.push({ id, name, category, basePrice, unit, tax, description, variants: [], marginPercent, isRecurring, recurringPlanId });
  for (const tier of ["Bronze", "Silver", "Gold"] as const) {
    db.priceLists.push({ id: uuid(), productId: id, tier, currency: "USD", price: basePrice });
  }
  writeDB(db);
  revalidatePath("/backend/products");
}

export async function addWarehouseAction(formData: FormData) {
  const db = readDB();
  const id = "wh-" + uuid().slice(0, 8);
  const name = String(formData.get("name"));
  const location = String(formData.get("location") || "");
  const shippingCostWeight = Number(formData.get("shippingCostWeight") || 1);
  const replenishmentDays = Number(formData.get("replenishmentDays") || 5);
  db.warehouses.push({ id, name, location, shippingCostWeight, replenishmentDays, stock: {} });
  writeDB(db);
  revalidatePath("/backend/warehouses");
}

export async function updateStockAction(warehouseId: string, formData: FormData) {
  const db = readDB();
  const wh = db.warehouses.find((w) => w.id === warehouseId);
  if (!wh) return;
  const productId = String(formData.get("productId"));
  const qty = Number(formData.get("qty") || 0);
  wh.stock[productId] = qty;
  writeDB(db);
  revalidatePath("/backend/warehouses");
}

export async function addUpsellRuleAction(formData: FormData) {
  const db = readDB();
  db.upsellRules.push({
    id: uuid(),
    triggerProductId: String(formData.get("triggerProductId")),
    suggestedProductId: String(formData.get("suggestedProductId")),
    coPurchaseScore: Number(formData.get("coPurchaseScore") || 0.5),
    promoted: formData.get("promoted") === "on",
    minMarginPercent: Number(formData.get("minMarginPercent") || 0),
  });
  writeDB(db);
  revalidatePath("/backend/upsell");
}

export async function addSubscriptionPlanAction(formData: FormData) {
  const db = readDB();
  db.subscriptionPlans.push({
    id: "plan-" + uuid().slice(0, 8),
    name: String(formData.get("name")),
    cycle: String(formData.get("cycle")) as "monthly" | "quarterly" | "yearly",
    prorationEnabled: formData.get("prorationEnabled") === "on",
    cancellationRefundPolicy: String(formData.get("cancellationRefundPolicy")) as "full" | "prorated" | "none",
  });
  writeDB(db);
  revalidatePath("/backend/subscriptions");
}

export async function triggerNudgeAction(quotationId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  quote.auditTrail.push(audit("nudge_sent", "Manager triggered an automated nudge to the rep for this stalled deal."));
  writeDB(db);
  revalidatePath("/workspace/dashboard");
}

export async function markInvoiceStatusAction(
  quotationId: string,
  entryId: string,
  status: "scheduled" | "invoiced" | "paid" | "credited"
) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  const entry = quote.billingSchedule.find((b) => b.id === entryId);
  if (!entry) return;
  entry.status = status;
  quote.auditTrail.push(
    audit(
      "invoice_status_updated",
      `Invoice entry ${entryId.slice(0, 8)} updated to status '${status}' ($${entry.amount.toLocaleString()}).`
    )
  );
  if (quote.status === "fulfilling" && quote.billingSchedule.every((b) => b.status === "paid")) {
    quote.status = "billed";
  }
  writeDB(db);
  revalidatePath("/workspace/billing");
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function dispatchFulfillmentAction(quotationId: string) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === quotationId);
  if (!quote) return;
  quote.status = "fulfilling";
  quote.auditTrail.push(
    audit("fulfillment_dispatched", "Fulfillment orders released to warehouse dispatch lines.")
  );
  writeDB(db);
  revalidatePath("/workspace/fulfillment");
  revalidatePath(`/workspace/quotations/${quotationId}`);
}

export async function updateCustomerTierAction(customerId: string, newTier: CustomerTier) {
  const db = readDB();
  const customer = db.customers.find((c) => c.id === customerId);
  if (!customer) return;
  customer.tier = newTier;
  const user = db.users.find((u) => u.id === customer.portalUserId);
  if (user) {
    user.tier = newTier;
  }
  writeDB(db);
  revalidatePath("/backend/customers");
}

export async function addCustomerAction(formData: FormData) {
  const db = readDB();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const tier = (String(formData.get("tier") || "Bronze")) as CustomerTier;
  const currency = String(formData.get("currency") || "USD").toUpperCase();

  if (!name || !email) return;

  const userId = "u-" + uuid().slice(0, 8);
  const customerId = "c-" + uuid().slice(0, 8);
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const newUser: User = {
    id: userId,
    name,
    email,
    role: "customer",
    tier,
    passwordHash,
  };
  db.users.push(newUser);

  const newCustomer: Customer = {
    id: customerId,
    name,
    tier,
    portalUserId: userId,
    currency,
  };
  db.customers.push(newCustomer);

  writeDB(db);
  revalidatePath("/backend/customers");
}

