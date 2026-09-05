import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/Badge";
import { actOnApprovalAction } from "@/lib/actions";

export default function ApprovalsPage() {
  const user = getCurrentUser()!;
  const db = readDB();

  // Find all quotations with pending approvals
  const pendingQuotes = db.quotations.filter((q) =>
    q.approvalSteps.some((s) => s.status === "pending")
  );

  const myPendingQuotes = pendingQuotes.filter((q) => {
    const step = q.approvalSteps.find((s) => s.status === "pending");
    if (!step) return false;
    if (user.role === "admin") return true;
    if (user.role === "sales_manager" && step.step === "sales_manager") return true;
    if (user.role === "finance" && step.step === "finance") return true;
    return false;
  });

  const historyQuotes = db.quotations.filter((q) =>
    q.approvalSteps.some((s) => s.status === "approved" || s.status === "rejected" || s.status === "returned")
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Discount Approval Cockpit
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Autonomous governance routing queues deals exceeding category or customer tier discount ceilings.
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card p-5 bg-gradient-to-br from-white to-amber-50/30 border-amber-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Awaiting My Review</span>
          <div className="text-3xl font-black text-amber-800 mt-2">{myPendingQuotes.length}</div>
          <p className="text-xs text-amber-600/80 mt-1 font-medium">Pending action for your role ({user.role.replace("_", " ")})</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-indigo-50/30 border-indigo-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Total In Approval Pipeline</span>
          <div className="text-3xl font-black text-brand-900 mt-2">{pendingQuotes.length}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Active multi-step governance reviews</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-emerald-50/30 border-emerald-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Processed Deals</span>
          <div className="text-3xl font-black text-emerald-800 mt-2">{historyQuotes.length}</div>
          <p className="text-xs text-emerald-600/80 mt-1 font-medium">Fully reviewed with signed audit trail</p>
        </div>
      </div>

      {/* Pending Reviews Table / Cards */}
      <section className="card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending Review Queue</h2>
            <p className="text-xs text-slate-500">Deals requiring immediate discount evaluation and decision</p>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
            {pendingQuotes.length} Action Items
          </span>
        </div>

        {pendingQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="font-bold text-slate-800 text-base">Approval Queue is Clear</div>
            <p className="text-xs text-slate-500 mt-1">No quotations currently violate discount ceilings or require sign-off.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingQuotes.map((q) => {
              const customer = db.customers.find((c) => c.id === q.customerId);
              const rep = db.users.find((u) => u.id === q.repId);
              const pendingStep = q.approvalSteps.find((s) => s.status === "pending")!;
              const total = q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0);

              const canReview =
                user.role === "admin" ||
                (user.role === "sales_manager" && pendingStep.step === "sales_manager") ||
                (user.role === "finance" && pendingStep.step === "finance");

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/workspace/quotations/${q.id}`}
                          className="font-bold text-slate-900 hover:text-brand-600 text-lg transition-colors"
                        >
                          {customer?.name}
                        </Link>
                        {customer?.tier && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                            {customer.tier}
                          </span>
                        )}
                        <StatusBadge status={q.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Rep: <strong>{rep?.name}</strong></span>
                        <span>•</span>
                        <span>Order Total: <strong>${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>
                        <span>•</span>
                        <span>Items: <strong>{q.lines.length} lines</strong></span>
                      </div>
                    </div>

                    <div className="text-right sm:self-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Blended Risk</span>
                      <span className="text-xl font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mt-0.5">
                        {q.blendedRiskScore.toFixed(2)} pts
                      </span>
                    </div>
                  </div>

                  {/* Lines Over Ceiling Preview */}
                  <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Discount Ceiling Violations:
                    </span>
                    {q.lines
                      .filter((l) => l.overPoints > 0)
                      .map((l) => {
                        const prod = db.products.find((p) => p.id === l.productId);
                        return (
                          <div key={l.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-800 font-medium">{prod?.name} ({prod?.category})</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Discount: {l.discountPercent}% (Ceiling: {l.categoryCeiling}%)</span>
                              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                +{l.overPoints} pts over
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Actions / Decision Form */}
                  {canReview ? (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Current Step: {pendingStep.step.replace("_", " ")} Decision
                      </span>
                      <form action={actOnApprovalAction.bind(null, q.id, pendingStep.step, "approved")} className="flex items-center gap-2">
                        <input name="reason" placeholder="Review note..." className="input text-xs py-1.5 px-3 w-48" />
                        <button formAction={actOnApprovalAction.bind(null, q.id, pendingStep.step, "approved")} className="btn btn-success text-xs py-1.5 px-3">
                          Approve Deal
                        </button>
                        <button formAction={actOnApprovalAction.bind(null, q.id, pendingStep.step, "returned")} className="btn btn-secondary text-xs py-1.5 px-3">
                          Return to Rep
                        </button>
                        <button formAction={actOnApprovalAction.bind(null, q.id, pendingStep.step, "rejected")} className="btn btn-danger text-xs py-1.5 px-3">
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>Awaiting <strong>{pendingStep.step.replace("_", " ")}</strong> review</span>
                      <Link href={`/workspace/quotations/${q.id}`} className="font-semibold text-brand-600 hover:underline">
                        View Quotation &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
