import { notFound } from "next/navigation";
import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/Badge";
import { AddLineForm } from "@/components/AddLineForm";
import { getUpsellSuggestions, computeOrderMargin } from "@/lib/logic/upsell";
import {
  addLineAction,
  updateLineDiscountAction,
  removeLineAction,
  acceptUpsellAction,
  submitForApprovalAction,
  actOnApprovalAction,
  acceptWarehouseSplitAction,
  overrideWarehouseSplitAction,
  consolidateBackorderAction,
  changeSubscriptionQuantityAction,
  cancelSubscriptionLineAction,
  recordPaymentAction,
  sendQuotationToCustomerAction,
} from "@/lib/actions";

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === params.id);
  if (!quote) notFound();

  const user = getCurrentUser()!;
  const customer = db.customers.find((c) => c.id === quote.customerId)!;
  const rep = db.users.find((u) => u.id === quote.repId)!;
  const total = quote.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0);
  const margin = computeOrderMargin(quote.lines, db.products);
  const upsellSuggestions = getUpsellSuggestions(quote.lines, db.products, db.upsellRules, quote.upsellAccepted);

  const canEdit = quote.status === "draft";
  const canSubmit = quote.status === "draft" && quote.lines.length > 0;
  const pendingStep = quote.approvalSteps.find((s) => s.status === "pending");
  const canActOnApproval =
    pendingStep &&
    ((pendingStep.step === "sales_manager" && user.role === "sales_manager") ||
      (pendingStep.step === "finance" && user.role === "finance") ||
      user.role === "admin");

  const tierBadges: Record<string, string> = {
    gold: "bg-amber-100 text-amber-800 border-amber-300",
    silver: "bg-slate-100 text-slate-700 border-slate-300",
    bronze: "bg-orange-100 text-orange-800 border-orange-300",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link href="/workspace/quotations" className="hover:text-brand-600 transition-colors">
          Quotations
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-semibold">{customer?.name || "Quote"}</span>
        <span>/</span>
        <span className="font-mono text-slate-400">{quote.id.slice(0, 8)}...</span>
      </div>

      {/* Quote Summary Header Card */}
      <div className="card p-6 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 shadow-soft border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{customer.name}</h1>
              {customer.tier && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierBadges[customer.tier] || "bg-slate-100"}`}>
                  {customer.tier} Tier
                </span>
              )}
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-3">
              <span><strong>Account Rep:</strong> {rep.name}</span>
              <span>•</span>
              <span><strong>Created:</strong> {new Date(quote.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span><strong>Terms:</strong> Net 30</span>
            </p>
          </div>

          {/* Financial KPI Metrics */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-white/80 p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Order Total</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="h-9 w-px bg-slate-200" />

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Live Margin</span>
              <div className={`text-2xl font-black ${margin < 15 ? "text-rose-600" : "text-emerald-600"}`}>
                {margin}%
              </div>
            </div>

            <div className="h-9 w-px bg-slate-200" />

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Blended Risk</span>
              <div className="text-lg font-bold text-slate-800">
                {quote.blendedRiskScore > 0 ? (
                  <span className="text-amber-600 font-black">{quote.blendedRiskScore.toFixed(2)} pts</span>
                ) : (
                  <span className="text-emerald-600 font-semibold text-sm">0.00 (Clean)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quotation Lines Section */}
          <section className="card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Quotation Line Items</h2>
                <p className="text-xs text-slate-500">Configured hardware, professional services, and subscriptions</p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {quote.lines.length} {quote.lines.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="table-container mb-5">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Product &amp; Category</th>
                    <th>Qty</th>
                    <th>List Price</th>
                    <th>Discount</th>
                    <th>Ceiling</th>
                    <th>Status / Over</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lines.map((line) => {
                    const product = db.products.find((p) => p.id === line.productId)!;
                    const catColors: Record<string, string> = {
                      hardware: "bg-blue-50 text-blue-700 border-blue-200",
                      service: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      subscription: "bg-purple-50 text-purple-700 border-purple-200",
                    };

                    return (
                      <tr key={line.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{product.name}</span>
                            {line.variantLabel && (
                              <span className="text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded">
                                {line.variantLabel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${catColors[product.category] || "bg-slate-100"}`}>
                              {product.category}
                            </span>
                            {line.isRecurring && (
                              <span className="text-[10px] text-purple-600 font-medium">⚡ Recurring billing</span>
                            )}
                          </div>
                        </td>

                        {canEdit ? (
                          <>
                            <td className="py-3.5" colSpan={2}>
                              <form id={`line-form-${line.id}`} action={updateLineDiscountAction.bind(null, quote.id, line.id)} className="flex items-center gap-2">
                                <input
                                  name="quantity"
                                  type="number"
                                  min={1}
                                  defaultValue={line.quantity}
                                  className="input w-16 py-1 px-2 text-xs font-semibold text-center"
                                />
                                <span className="text-xs text-slate-500 font-medium">@ ${line.listPrice.toFixed(2)}</span>
                              </form>
                            </td>
                            <td className="py-3.5">
                              <input
                                form={`line-form-${line.id}`}
                                name="discountPercent"
                                type="number"
                                step="0.5"
                                min={0}
                                defaultValue={line.discountPercent}
                                className="input w-20 py-1 px-2 text-xs font-semibold text-center"
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3.5 font-bold text-slate-800">{line.quantity}</td>
                            <td className="py-3.5 text-slate-600">${line.listPrice.toFixed(2)}</td>
                            <td className="py-3.5 font-semibold text-slate-800">{line.discountPercent}%</td>
                          </>
                        )}

                        <td className="py-3.5 text-slate-500 font-medium">{line.categoryCeiling}%</td>

                        <td className="py-3.5">
                          {line.overPoints > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              +{line.overPoints} pts
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              OK
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 text-right whitespace-nowrap">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                form={`line-form-${line.id}`}
                                type="submit"
                                className="btn btn-outline py-1 px-2.5 text-xs hover:bg-brand-50 hover:text-brand-600"
                              >
                                Update
                              </button>
                              <form action={removeLineAction.bind(null, quote.id, line.id)} className="inline">
                                <button type="submit" className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors px-1">
                                  Remove
                                </button>
                              </form>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {quote.lines.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-400 py-10">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">No quotation lines added yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Use the product catalog below to attach hardware, services, or subscriptions.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {canEdit && (
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
                  + Add Product to Quotation
                </span>
                <AddLineForm products={db.products} action={addLineAction.bind(null, quote.id)} />
              </div>
            )}

            {canSubmit && (
              <form action={submitForApprovalAction.bind(null, quote.id)} className="mt-5">
                <button type="submit" className="btn btn-gradient w-full py-3 text-base shadow-md">
                  <span>Confirm &amp; Submit</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
            )}

            {quote.status === "approved" && (
              <form action={sendQuotationToCustomerAction.bind(null, quote.id)} className="mt-5">
                <button type="submit" className="btn btn-primary w-full py-3 text-base shadow-md">
                  <span>Send to Customer Portal</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            )}
          </section>

          {/* Discount Approval Governance Card */}
          {quote.blendedRiskScore > 0 && (
            <section className="card p-6 shadow-soft border-amber-200/60 bg-gradient-to-br from-white to-amber-50/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Discount Governance &amp; Multi-Step Approvals</h2>
                    <p className="text-xs text-slate-500">Autonomous workflow routing based on blended risk score</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Risk Score</span>
                  <span className="text-lg font-black text-amber-700">{quote.blendedRiskScore.toFixed(2)} pts</span>
                </div>
              </div>

              <div className="space-y-2.5 my-4">
                {quote.approvalSteps.map((step) => (
                  <div key={step.step} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {step.step === "sales_manager" ? "M" : "F"}
                      </div>
                      <div>
                        <div className="text-xs font-bold capitalize text-slate-900">{step.step.replace("_", " ")} Review</div>
                        {step.actedBy && (
                          <div className="text-[11px] text-slate-500">
                            Signed by <strong className="text-slate-700">{step.actedBy}</strong> {step.reason && `— "${step.reason}"`}
                          </div>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={step.status} />
                  </div>
                ))}
              </div>

              {canActOnApproval && pendingStep && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                    Action Required: Pending {pendingStep.step.replace("_", " ")} Decision
                  </span>
                  <form action={actOnApprovalAction.bind(null, quote.id, pendingStep.step, "approved")} className="flex flex-wrap gap-2">
                    <input name="reason" placeholder="Add optional approval/rejection note..." className="input flex-1 py-2 text-xs" />
                    <button formAction={actOnApprovalAction.bind(null, quote.id, pendingStep.step, "approved")} className="btn btn-success text-xs">
                      Approve
                    </button>
                    <button formAction={actOnApprovalAction.bind(null, quote.id, pendingStep.step, "returned")} className="btn btn-secondary text-xs">
                      Return
                    </button>
                    <button formAction={actOnApprovalAction.bind(null, quote.id, pendingStep.step, "rejected")} className="btn btn-danger text-xs">
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </section>
          )}

          {/* Fulfillment & Warehouse Split Section */}
          {quote.warehousePlan && (
            <section className="card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Multi-Warehouse Fulfillment Plan</h2>
                  <p className="text-xs text-slate-500">Greedy inventory allocation optimized for minimal freight cost</p>
                </div>
                {quote.warehousePlan.isManualOverride && (
                  <span className="badge bg-purple-100 text-purple-800 border-purple-200">
                    Manual Override Active
                  </span>
                )}
              </div>

              {quote.status === "approved" ? (
                <form action={overrideWarehouseSplitAction.bind(null, quote.id)} className="space-y-4">
                  <div className="table-container">
                    <table className="table-modern">
                      <thead>
                        <tr>
                          <th>Warehouse Assignment</th>
                          <th>Hardware Product</th>
                          <th>Fulfill Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.warehousePlan.lines.map((l, idx) => {
                          const product = db.products.find((p) => p.id === l.productId);
                          return (
                            <tr key={idx}>
                              <td>
                                <select
                                  name={`split-${idx}-warehouseId`}
                                  defaultValue={l.warehouseId}
                                  className="input text-xs py-1.5 font-medium max-w-xs"
                                >
                                  {db.warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name} ({w.location})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="font-semibold text-slate-900">{product?.name}</td>
                              <td className="font-bold text-slate-800">{l.quantity}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500">
                      Estimated Shipments: <strong className="text-slate-800">{quote.warehousePlan.shipmentCount}</strong> · Est. Freight: <strong className="text-slate-800">${quote.warehousePlan.estimatedShippingCost}</strong>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn btn-secondary text-xs">
                        Override Warehouse Split
                      </button>
                      <button formAction={acceptWarehouseSplitAction.bind(null, quote.id)} className="btn btn-primary text-xs">
                        Accept Suggested Split
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <div className="table-container mb-3">
                    <table className="table-modern">
                      <thead>
                        <tr>
                          <th>Warehouse</th>
                          <th>Hardware Product</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.warehousePlan.lines.map((l, idx) => {
                          const wh = db.warehouses.find((w) => w.id === l.warehouseId);
                          const product = db.products.find((p) => p.id === l.productId);
                          return (
                            <tr key={idx}>
                              <td className="font-medium text-slate-800">{wh?.name}</td>
                              <td className="font-semibold text-slate-900">{product?.name}</td>
                              <td className="font-bold text-slate-800">{l.quantity}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs text-slate-500">
                    Shipment count: <strong className="text-slate-800">{quote.warehousePlan.shipmentCount}</strong> · Est. shipping: <strong className="text-slate-800">${quote.warehousePlan.estimatedShippingCost}</strong>
                  </div>
                </>
              )}

              {/* Backorder Management Banner */}
              {quote.warehousePlan.backorderLines.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80">
                  <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Stock Backorder Notice
                  </div>
                  <div className="text-xs text-amber-800 space-y-1 mb-3">
                    {quote.warehousePlan.backorderLines.map((b, i) => {
                      const product = db.products.find((p) => p.id === b.productId);
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <span>{product?.name}</span>
                          <strong className="bg-white px-2 py-0.5 rounded border border-amber-200">{b.quantity} unit(s) pending stock</strong>
                        </div>
                      );
                    })}
                  </div>
                  <form action={consolidateBackorderAction.bind(null, quote.id)}>
                    <button type="submit" className="btn btn-outline text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100">
                      Consolidate Remaining Backorder
                    </button>
                  </form>
                </div>
              )}
            </section>
          )}

          {/* Hybrid Subscription & Billing Schedule Section */}
          {quote.billingSchedule.length > 0 && (
            <section className="card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Hybrid Billing Schedule</h2>
                  <p className="text-xs text-slate-500">One-time and recurring automated invoice installments</p>
                </div>
              </div>

              <div className="table-container mb-4">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Installment Line</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.billingSchedule.map((b) => {
                      const line = quote.lines.find((l) => l.id === b.lineId);
                      const product = line ? db.products.find((p) => p.id === line.productId) : null;
                      return (
                        <tr key={b.id}>
                          <td>
                            <div className="font-semibold text-slate-900">{product?.name ?? "Installment"}</div>
                            <div className="text-[11px] text-slate-400">{b.note}</div>
                          </td>
                          <td className="text-xs font-medium text-slate-600">{new Date(b.dueDate).toLocaleDateString()}</td>
                          <td className="font-bold text-slate-900">${b.amount.toFixed(2)}</td>
                          <td><StatusBadge status={b.status} /></td>
                          <td className="text-right">
                            {b.status === "invoiced" && (
                              <form action={recordPaymentAction.bind(null, quote.id, b.id)}>
                                <button type="submit" className="btn btn-outline text-xs py-1 px-2.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                                  Record Payment
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {quote.lines.filter((l) => l.isRecurring).map((line) => {
                const product = db.products.find((p) => p.id === line.productId)!;
                return (
                  <div key={line.id} className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{product.name}</div>
                      <div className="text-[11px] text-slate-500">Live subscription · Manage seat count with dynamic proration</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={changeSubscriptionQuantityAction.bind(null, quote.id, line.id)} className="flex items-center gap-2">
                        <input
                          name="newQuantity"
                          type="number"
                          min={1}
                          defaultValue={line.quantity}
                          className="input w-16 py-1.5 px-2 text-xs font-semibold text-center"
                        />
                        <button type="submit" className="btn btn-outline text-xs py-1.5 px-3">
                          Change Qty (Prorate)
                        </button>
                      </form>
                      <form action={cancelSubscriptionLineAction.bind(null, quote.id, line.id)}>
                        <button type="submit" className="btn btn-danger text-xs py-1.5 px-3">
                          Cancel
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Customer Negotiation History */}
          {quote.negotiation.length > 0 && (
            <section className="card p-6 shadow-soft">
              <h2 className="text-base font-bold text-slate-900 mb-3">Customer Negotiation Log</h2>
              <div className="space-y-3">
                {quote.negotiation.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{n.authorName}</span>
                      <span className="text-[11px] text-slate-400">{new Date(n.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-700">
                      {n.message}
                      {n.counterDiscountPercent !== undefined && (
                        <span className="ml-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          Requested {n.counterDiscountPercent}% discount
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar: Upsells & Audit Trail */}
        <div className="space-y-6">
          {/* Upsell Engine Recommendations */}
          {canEdit && upsellSuggestions.length > 0 && (
            <section className="card p-6 shadow-soft bg-gradient-to-br from-white to-purple-50/20 border-purple-200/60">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Upsell Recommendations</h2>
                  <p className="text-xs text-slate-500">Margin &amp; co-purchase optimized</p>
                </div>
              </div>

              <div className="space-y-3">
                {upsellSuggestions.map((s) => (
                  <div key={s.productId} className="p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{s.productName}</span>
                      {s.promoted && (
                        <span className="badge bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                          Promoted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.reason}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +${s.marginDelta.toFixed(2)} margin
                      </span>
                    </div>
                    <form action={acceptUpsellAction.bind(null, quote.id, s.productId)} className="pt-2">
                      <button type="submit" className="btn btn-primary text-xs w-full py-2">
                        Add to Quote
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Audit Trail Section */}
          <section className="card p-6 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
              Governance Audit Log
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {[...quote.auditTrail].reverse().map((a) => (
                <div key={a.id} className="text-xs border-l-2 border-brand-300 pl-3 py-1 space-y-0.5">
                  <div className="font-medium text-slate-800 leading-snug">{a.detail}</div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {a.userName} · {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
