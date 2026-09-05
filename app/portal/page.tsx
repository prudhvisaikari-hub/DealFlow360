import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/Badge";

export default function PortalHome() {
  const user = getCurrentUser()!;
  const db = readDB();
  const customer = db.customers.find((c) => c.portalUserId === user.id);
  const quotes = db.quotations.filter((q) => q.customerId === customer?.id && q.status !== "draft");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card p-6 bg-gradient-to-br from-white to-brand-50/30 border-brand-100 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Enterprise Procurement</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Welcome, {customer?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review received proposals, request discount counters, and execute quotations with 1-click confirmation.
            </p>
          </div>
          {customer?.tier && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
              {customer.tier} Tier Account
            </span>
          )}
        </div>
      </div>

      {/* Proposals List */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          Available Quotations ({quotes.length})
        </h2>

        <div className="space-y-3">
          {quotes.map((q) => {
            const total = q.lines.reduce(
              (s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100),
              0
            );
            return (
              <Link
                key={q.id}
                href={`/portal/quotations/${q.id}`}
                className="card p-5 flex items-center justify-between hover:shadow-soft hover:border-brand-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                    Q
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      Quotation #{q.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {q.lines.length} configured items · Issued {new Date(q.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Net Value</span>
                    <span className="text-base font-black text-slate-900">
                      ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <StatusBadge status={q.status} />
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}

          {quotes.length === 0 && (
            <div className="card p-12 text-center text-slate-400">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700 text-sm">No proposals pending review</p>
              <p className="text-xs text-slate-500 mt-1">Check back when your DealFlow360 account representative publishes a formal quotation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
