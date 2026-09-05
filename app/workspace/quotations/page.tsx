import Link from "next/link";
import { readDB } from "@/lib/db";
import { StatusBadge } from "@/components/Badge";
import { QuoteStatus } from "@/lib/types";

const PIPELINE_COLUMNS: { status: QuoteStatus; label: string; dot: string }[] = [
  { status: "draft", label: "Draft", dot: "bg-slate-400" },
  { status: "pending_manager_approval", label: "Pending Manager", dot: "bg-amber-500" },
  { status: "pending_finance_approval", label: "Pending Finance", dot: "bg-orange-500" },
  { status: "approved", label: "Approved", dot: "bg-emerald-500" },
  { status: "sent", label: "Sent to Client", dot: "bg-blue-500" },
  { status: "under_negotiation", label: "Under Negotiation", dot: "bg-purple-500" },
  { status: "confirmed", label: "Confirmed", dot: "bg-teal-500" },
  { status: "fulfilling", label: "Fulfilling", dot: "bg-indigo-500" },
  { status: "billed", label: "Billed", dot: "bg-emerald-600" },
  { status: "rejected", label: "Rejected", dot: "bg-rose-500" },
];

export default function QuotationsPage({ searchParams }: { searchParams: { view?: string } }) {
  const db = readDB();
  const isPipeline = searchParams?.view === "pipeline";

  const totalPipelineValue = db.quotations.reduce((sum, q) => {
    const quoteTotal = q.lines.reduce(
      (s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100),
      0
    );
    return sum + quoteTotal;
  }, 0);

  const pendingApprovalsCount = db.quotations.filter(
    (q) => q.status === "pending_manager_approval" || q.status === "pending_finance_approval"
  ).length;

  const quoteCard = (q: (typeof db.quotations)[number]) => {
    const customer = db.customers.find((c) => c.id === q.customerId);
    const rep = db.users.find((u) => u.id === q.repId);
    const total = q.lines.reduce(
      (s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100),
      0
    );

    const tierColors: Record<string, string> = {
      gold: "bg-amber-50 text-amber-700 border-amber-200",
      silver: "bg-slate-100 text-slate-700 border-slate-200",
      bronze: "bg-orange-50 text-orange-700 border-orange-200",
    };

    return (
      <Link
        key={q.id}
        href={`/workspace/quotations/${q.id}`}
        className="card p-4 block hover:shadow-soft hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                {customer?.name}
              </span>
              {customer?.tier && (
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${tierColors[customer.tier] || "bg-slate-100"}`}>
                  {customer.tier}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span>Rep:</span>
              <span className="font-medium text-slate-700">{rep?.name}</span>
            </div>
          </div>
          <StatusBadge status={q.status} />
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Net Value</span>
            <div className="text-lg font-bold text-slate-900 tracking-tight">
              ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block mb-0.5">Items</span>
            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {q.lines.length} {q.lines.length === 1 ? "line" : "lines"}
            </div>
          </div>
        </div>

        {q.blendedRiskScore > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Blended Risk:
            </span>
            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {q.blendedRiskScore.toFixed(2)} pts
            </span>
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-gradient-to-br from-white to-indigo-50/20">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pipeline</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              ${totalPipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-gradient-to-br from-white to-blue-50/20">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deals</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{db.quotations.length}</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-gradient-to-br from-white to-amber-50/20">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Approvals</div>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{pendingApprovalsCount}</div>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isPipeline ? "Pipeline Kanban" : "Quotations Directory"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage quotations, monitor pricing compliance, and track deal stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <Link
              href="/workspace/quotations"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isPipeline ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List view
            </Link>
            <Link
              href="/workspace/quotations?view=pipeline"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isPipeline ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pipeline view
            </Link>
          </div>

          <Link
            href="/workspace/quotations/new"
            className="btn btn-primary shadow-sm hover:shadow-glow-brand"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* Content View */}
      {isPipeline ? (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
          {PIPELINE_COLUMNS.map((col) => {
            const items = db.quotations.filter((q) => q.status === col.status);
            return (
              <div
                key={col.status}
                className="min-w-[280px] w-[280px] flex-shrink-0 bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60"
              >
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span>{col.label}</span>
                  </div>
                  <span className="bg-white text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-2xs border border-slate-200/60">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {items.map(quoteCard)}
                  {items.length === 0 && (
                    <div className="h-28 rounded-xl border border-dashed border-slate-300/80 flex items-center justify-center text-xs text-slate-400 font-medium">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {db.quotations.map(quoteCard)}
        </div>
      )}
    </div>
  );
}
