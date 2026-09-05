import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/Badge";
import { markInvoiceStatusAction } from "@/lib/actions";

export default function BillingPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const user = getCurrentUser()!;
  const db = readDB();

  const filterStatus = searchParams?.status || "all";

  // Gather all billing entries across all quotations
  interface FlattenedBillingEntry {
    quotationId: string;
    customerName: string;
    customerTier: string;
    productName: string;
    isRecurring: boolean;
    cycleName?: string;
    id: string;
    dueDate: string;
    amount: number;
    status: "scheduled" | "invoiced" | "paid" | "credited";
    note?: string;
  }

  const allEntries: FlattenedBillingEntry[] = [];

  for (const q of db.quotations) {
    const cust = db.customers.find((c) => c.id === q.customerId);
    for (const b of q.billingSchedule || []) {
      const line = q.lines.find((l) => l.id === b.lineId);
      const prod = db.products.find((p) => p.id === line?.productId);
      const plan = db.subscriptionPlans.find((p) => p.id === line?.subscriptionPlanId);

      allEntries.push({
        quotationId: q.id,
        customerName: cust?.name || q.customerId,
        customerTier: cust?.tier || "Bronze",
        productName: prod?.name || line?.productId || "Order Item",
        isRecurring: !!line?.isRecurring,
        cycleName: plan?.cycle,
        id: b.id,
        dueDate: b.dueDate,
        amount: b.amount,
        status: b.status,
        note: b.note,
      });
    }
  }

  const filteredEntries = filterStatus === "all"
    ? allEntries
    : allEntries.filter((e) => e.status === filterStatus);

  const totalBilled = allEntries.reduce((s, e) => s + e.amount, 0);
  const paidRevenue = allEntries.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const scheduledRevenue = allEntries.filter((e) => e.status === "scheduled" || e.status === "invoiced").reduce((s, e) => s + e.amount, 0);
  const recurringCount = allEntries.filter((e) => e.isRecurring).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hybrid Billing &amp; Subscription Invoicing
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Screen B7: Consolidated one-time milestone invoicing and recurring subscription billing schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/backend/subscriptions" className="btn btn-secondary text-xs">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Subscription Rules</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed Schedule</span>
          <div className="text-3xl font-black text-slate-900 mt-2">${totalBilled.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">{allEntries.length} invoice entries active</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-emerald-50/30 border-emerald-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Collected Revenue</span>
          <div className="text-3xl font-black text-emerald-800 mt-2">${paidRevenue.toLocaleString()}</div>
          <p className="text-xs text-emerald-600/80 mt-1 font-medium">Reconciled and settled</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-amber-50/30 border-amber-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Receivables</span>
          <div className="text-3xl font-black text-amber-800 mt-2">${scheduledRevenue.toLocaleString()}</div>
          <p className="text-xs text-amber-600/80 mt-1 font-medium">Scheduled &amp; issued invoices</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-purple-50/30 border-purple-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Recurring Subscriptions</span>
          <div className="text-3xl font-black text-purple-800 mt-2">{recurringCount}</div>
          <p className="text-xs text-purple-600/80 mt-1 font-medium">Auto-renewing recurring lines</p>
        </div>
      </div>

      {/* Invoicing Table */}
      <section className="card p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Consolidated Invoicing Register</h2>
            <p className="text-xs text-slate-500">Real-time status of physical deliverables and recurring cycle billings</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "scheduled", "invoiced", "paid", "credited"].map((s) => (
              <Link
                key={s}
                href={`/workspace/billing${s === "all" ? "" : `?status=${s}`}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterStatus === s
                    ? "bg-brand-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="font-bold text-slate-800 text-base">No Invoices Found</div>
            <p className="text-xs text-slate-500 mt-1">No billing schedules match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Invoice / Line</th>
                  <th className="py-3 px-3">Quotation Ref</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Billing Type</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((e) => {
                  const statusColors = {
                    scheduled: "bg-slate-100 text-slate-700 border-slate-200",
                    invoiced: "bg-amber-50 text-amber-700 border-amber-200",
                    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    credited: "bg-purple-50 text-purple-700 border-purple-200",
                  };

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900">{e.productName}</div>
                        <span className="font-mono text-[10px] text-slate-400">ID: {e.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          href={`/workspace/quotations/${e.quotationId}`}
                          className="font-mono font-bold text-brand-600 hover:underline"
                        >
                          {e.quotationId}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{e.customerName}</div>
                        <span className="text-[10px] text-slate-400">{e.customerTier} Tier</span>
                      </td>
                      <td className="py-3 px-3">
                        {e.isRecurring ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {e.cycleName ? `${e.cycleName} Sub` : "Recurring"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                            One-time Hardware
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {e.dueDate ? new Date(e.dueDate).toLocaleDateString() : "Immediate"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        ${e.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColors[e.status]}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {e.status === "scheduled" && (
                          <form
                            action={async () => {
                              "use server";
                              await markInvoiceStatusAction(e.quotationId, e.id, "invoiced");
                            }}
                            className="inline"
                          >
                            <button
                              type="submit"
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold shadow-2xs"
                              title="Send invoice to customer"
                            >
                              Issue Invoice
                            </button>
                          </form>
                        )}
                        {e.status === "invoiced" && (
                          <form
                            action={async () => {
                              "use server";
                              await markInvoiceStatusAction(e.quotationId, e.id, "paid");
                            }}
                            className="inline"
                          >
                            <button
                              type="submit"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-2xs"
                              title="Reconcile and mark as paid"
                            >
                              Record Payment
                            </button>
                          </form>
                        )}
                        {e.status === "paid" && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
