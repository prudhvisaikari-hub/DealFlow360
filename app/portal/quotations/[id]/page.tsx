import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/Badge";
import { addNegotiationMessageAction, confirmQuotationAction } from "@/lib/actions";

export default function PortalQuotationPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser()!;
  const db = readDB();
  const quote = db.quotations.find((q) => q.id === params.id);
  if (!quote) notFound();
  const customer = db.customers.find((c) => c.id === quote.customerId)!;
  if (customer.portalUserId !== user.id) redirect("/portal");

  const total = quote.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0);
  const canAct = !["confirmed", "billed", "rejected", "draft"].includes(quote.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link href="/portal" className="hover:text-brand-600 transition-colors">
          Quotations
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-semibold">Proposal #{quote.id.slice(-6).toUpperCase()}</span>
      </div>

      {/* Header Card */}
      <div className="card p-6 bg-gradient-to-br from-white to-brand-50/20 shadow-soft border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Quotation #{quote.id.slice(-6).toUpperCase()}
              </h1>
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Issued for <strong>{customer.name}</strong> · Terms: Net 30 days
            </p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 text-right shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Investment</span>
            <div className="text-2xl font-black text-brand-600 tracking-tight">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <section className="card p-6 shadow-soft">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
          Itemized Hardware, Services &amp; Subscriptions
        </h2>
        <div className="table-container mb-4">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Qty</th>
                <th>Catalog Price</th>
                <th>Discount Applied</th>
                <th className="text-right">Net Line Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((line) => {
                const product = db.products.find((p) => p.id === line.productId)!;
                const lineTotal = line.listPrice * line.quantity * (1 - line.discountPercent / 100);
                return (
                  <tr key={line.id}>
                    <td>
                      <div className="font-bold text-slate-900">{product.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {product.category}
                        {line.variantLabel && ` · ${line.variantLabel}`}
                        {line.isRecurring && " · Recurring Subscription"}
                      </div>
                    </td>
                    <td className="font-bold text-slate-800">{line.quantity}</td>
                    <td className="text-slate-600">${line.listPrice.toFixed(2)}</td>
                    <td>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {line.discountPercent}% Off
                      </span>
                    </td>
                    <td className="text-right font-bold text-slate-900">${lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium mr-3">Grand Total Payable:</span>
            <span className="text-xl font-black text-slate-900">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </section>

      {/* Negotiation & Confirmation Section */}
      {canAct && (
        <section className="card p-6 shadow-soft border-brand-200/80 bg-gradient-to-br from-white to-brand-50/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Review, Counter, or Execute Quotation</h2>
              <p className="text-xs text-slate-500">Request line adjustments or execute this proposal to trigger fulfillment.</p>
            </div>
          </div>

          <form action={addNegotiationMessageAction.bind(null, quote.id)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Target Line Item (Optional)</label>
                <select name="lineId" className="input text-xs py-2 font-medium">
                  <option value="">General Proposal Comment</option>
                  {quote.lines.map((l) => {
                    const p = db.products.find((pr) => pr.id === l.productId);
                    return (
                      <option key={l.id} value={l.id}>
                        {p?.name} (current {l.discountPercent}% discount)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="label">Counter Discount % (Optional)</label>
                <input
                  name="counterDiscountPercent"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 15"
                  className="input text-xs py-2"
                />
              </div>
            </div>

            <div>
              <label className="label">Note to Sales Representative</label>
              <textarea
                name="message"
                className="input text-xs"
                rows={3}
                placeholder="Explain the reason for discount counter or budget requirements..."
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button type="submit" className="btn btn-outline text-xs py-2 px-4 shadow-2xs">
                Submit Request
              </button>

              <button
                formAction={confirmQuotationAction.bind(null, quote.id)}
                formNoValidate
                className="btn btn-gradient text-xs py-2.5 px-6 shadow-md"
              >
                <span>Confirm Quotation</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Conversation Thread */}
      {quote.negotiation.length > 0 && (
        <section className="card p-6 shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Negotiation &amp; Dialogue Thread
          </h2>
          <div className="space-y-3">
            {quote.negotiation.map((n) => {
              const isCustomer = n.authorRole === "customer";
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border text-sm ${
                    isCustomer
                      ? "bg-brand-50/50 border-brand-200/80 ml-4"
                      : "bg-slate-50 border-slate-200/80 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{n.authorName}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-700 leading-relaxed">
                    {n.message}
                    {n.counterDiscountPercent !== undefined && (
                      <span className="ml-2 inline-block text-xs font-bold text-brand-700 bg-brand-100/80 px-2 py-0.5 rounded border border-brand-200">
                        Countered at {n.counterDiscountPercent}% discount
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
