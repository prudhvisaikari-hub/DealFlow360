import Link from "next/link";
import { readDB } from "@/lib/db";
import { StatusBadge } from "@/components/Badge";

interface Filters {
  repId?: string;
  status?: string;
  category?: string;
  period?: string;
}

function withinPeriod(dateStr: string, period?: string): boolean {
  if (!period || period === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const days = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 3650;
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= days;
}

export default function ReportsPage({ searchParams }: { searchParams: Filters }) {
  const db = readDB();
  const reps = db.users.filter((u) => u.role === "sales_rep");

  const filtered = db.quotations.filter((q) => {
    if (searchParams.repId && q.repId !== searchParams.repId) return false;
    if (searchParams.status && q.status !== searchParams.status) return false;
    if (
      searchParams.category &&
      !q.lines.some((l) => db.products.find((p) => p.id === l.productId)?.category === searchParams.category)
    )
      return false;
    if (!withinPeriod(q.createdAt, searchParams.period)) return false;
    return true;
  });

  const totalValue = filtered.reduce(
    (s, q) => s + q.lines.reduce((ls, l) => ls + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0),
    0
  );

  const qs = new URLSearchParams(searchParams as any).toString();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Filter quotations across time periods, sales reps, discount status, and export certified reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            className="btn btn-outline text-xs py-2 px-3.5 shadow-2xs hover:bg-slate-50"
            href={`/api/export?format=csv&${qs}`}
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export XLS/CSV</span>
          </a>
          <a
            className="btn btn-primary text-xs py-2 px-3.5 shadow-sm"
            href={`/api/export?format=pdf&${qs}`}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Export PDF</span>
          </a>
        </div>
      </div>

      {/* Filter Card */}
      <form className="card p-5 bg-white shadow-soft grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Reporting Period</label>
          <select name="period" defaultValue={searchParams.period ?? "all"} className="input text-xs py-2 font-medium">
            <option value="all">All Time</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>

        <div>
          <label className="label">Assigned Sales Rep</label>
          <select name="repId" defaultValue={searchParams.repId ?? ""} className="input text-xs py-2 font-medium">
            <option value="">All Representatives</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Workflow Status</label>
          <select name="status" defaultValue={searchParams.status ?? ""} className="input text-xs py-2 font-medium">
            <option value="">All Lifecycle Stages</option>
            {[
              "draft",
              "pending_manager_approval",
              "pending_finance_approval",
              "approved",
              "rejected",
              "sent",
              "under_negotiation",
              "confirmed",
              "fulfilling",
              "billed",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Product Category</label>
          <select name="category" defaultValue={searchParams.category ?? ""} className="input text-xs py-2 font-medium">
            <option value="">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Services">Services</option>
            <option value="Subscriptions">Subscriptions</option>
          </select>
        </div>

        <div className="col-span-1 sm:col-span-2 md:col-span-4 flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filtered.length}</strong> quotations totaling{" "}
            <strong className="text-brand-600 font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
          </div>
          <div className="flex gap-2">
            <Link href="/workspace/reports" className="btn btn-outline text-xs py-1.5 px-3">
              Reset Filters
            </Link>
            <button type="submit" className="btn btn-primary text-xs py-1.5 px-4">
              Apply Filters
            </button>
          </div>
        </div>
      </form>

      {/* Reports Table */}
      <div className="table-container">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Customer Account</th>
              <th>Representative</th>
              <th>Status</th>
              <th>Creation Date</th>
              <th>Total Net Value</th>
              <th className="text-right">Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => {
              const customer = db.customers.find((c) => c.id === q.customerId);
              const rep = db.users.find((u) => u.id === q.repId);
              const value = q.lines.reduce(
                (s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100),
                0
              );
              return (
                <tr key={q.id}>
                  <td>
                    <Link
                      href={`/workspace/quotations/${q.id}`}
                      className="font-bold text-slate-900 hover:text-brand-600 transition-colors"
                    >
                      {customer?.name}
                    </Link>
                    <div className="text-[11px] text-slate-400">{customer?.tier?.toUpperCase()} Tier</div>
                  </td>
                  <td className="font-medium text-slate-700">{rep?.name}</td>
                  <td>
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="text-xs text-slate-600">{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="font-bold text-slate-900">
                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right font-semibold">
                    {q.blendedRiskScore > 0 ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs">
                        {q.blendedRiskScore.toFixed(2)} pts
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">0.00</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-12">
                  No matching quotations found for the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
