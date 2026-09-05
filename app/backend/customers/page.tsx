import { readDB } from "@/lib/db";
import { updateCustomerTierAction, addCustomerAction } from "@/lib/actions";
import { CustomerTier } from "@/lib/types";

export default function BackendCustomersPage() {
  const db = readDB();

  const goldCount = db.customers.filter((c) => c.tier === "Gold").length;
  const silverCount = db.customers.filter((c) => c.tier === "Silver").length;
  const bronzeCount = db.customers.filter((c) => c.tier === "Bronze").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Accounts &amp; Tier Pricing
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Screen A2/A3: Configure customer accounts, currencies, portal user assignments, and pricing tier levels (Bronze, Silver, Gold).
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Accounts</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{db.customers.length}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Mapped portal clients</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-amber-50/40 border-amber-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Gold Tier</span>
          <div className="text-3xl font-black text-amber-800 mt-2">{goldCount}</div>
          <p className="text-xs text-amber-600/80 mt-1 font-medium">Up to 20% discount ceiling</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-slate-100/50 border-slate-300/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Silver Tier</span>
          <div className="text-3xl font-black text-slate-800 mt-2">{silverCount}</div>
          <p className="text-xs text-slate-600/80 mt-1 font-medium">Up to 15% discount ceiling</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-orange-50/30 border-orange-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Bronze Tier</span>
          <div className="text-3xl font-black text-orange-800 mt-2">{bronzeCount}</div>
          <p className="text-xs text-orange-600/80 mt-1 font-medium">Up to 10% discount ceiling</p>
        </div>
      </div>

      {/* Add Customer Form */}
      <section className="card p-6 shadow-soft">
        <h2 className="text-base font-bold text-slate-900 mb-1">Provision New Customer Account</h2>
        <p className="text-xs text-slate-500 mb-4">Creates a client record and maps an active self-service portal credential (default demo password: <code className="font-mono text-brand-600 font-bold">demo123</code>)</p>

        <form action={addCustomerAction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Company / Customer Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Apex Dynamics Ltd"
              className="input text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Portal Contact Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="billing@company.com"
              className="input text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Pricing Tier</label>
            <select name="tier" className="input text-xs w-full">
              <option value="Bronze">Bronze (Standard)</option>
              <option value="Silver">Silver (Preferred)</option>
              <option value="Gold">Gold (VIP Strategic)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Billing Currency</label>
            <div className="flex gap-2">
              <select name="currency" className="input text-xs flex-1">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
              <button type="submit" className="btn btn-primary text-xs py-2 px-3 whitespace-nowrap">
                + Add Customer
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Customer Directory */}
      <section className="card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Customer Accounts Directory</h2>
            <p className="text-xs text-slate-500">Tier controls determine automated price lists and discount eligibility</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            {db.customers.length} Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Customer / ID</th>
                <th className="py-3 px-3">Portal Contact</th>
                <th className="py-3 px-3">Currency</th>
                <th className="py-3 px-3">Assigned Tier</th>
                <th className="py-3 px-3">Total Deals</th>
                <th className="py-3 px-3 text-right">Lifetime Pipeline</th>
                <th className="py-3 px-3 text-right">Modify Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.customers.map((c) => {
                const user = db.users.find((u) => u.id === c.portalUserId);
                const quotes = db.quotations.filter((q) => q.customerId === c.id);
                const totalValue = quotes.reduce((acc, q) => {
                  return acc + q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0);
                }, 0);

                const tierColors: Record<CustomerTier, string> = {
                  Gold: "bg-amber-100 text-amber-800 border-amber-300",
                  Silver: "bg-slate-200 text-slate-800 border-slate-300",
                  Bronze: "bg-orange-100 text-orange-800 border-orange-200",
                };

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <span className="font-mono text-[10px] text-slate-400">ID: {c.id}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{user?.email || "No Portal Login"}</div>
                      <span className="text-[10px] text-slate-400 font-mono">User ID: {c.portalUserId}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {c.currency}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierColors[c.tier]}`}>
                        {c.tier} Tier
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {quotes.length} quotations
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ${Math.round(totalValue).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          const newTier = formData.get("tier") as CustomerTier;
                          await updateCustomerTierAction(c.id, newTier);
                        }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <select
                          name="tier"
                          defaultValue={c.tier}
                          className="input text-[11px] py-1 px-2 border-slate-300"
                        >
                          <option value="Bronze">Bronze</option>
                          <option value="Silver">Silver</option>
                          <option value="Gold">Gold</option>
                        </select>
                        <button
                          type="submit"
                          className="btn btn-outline text-[10px] py-1 px-2 hover:bg-slate-100"
                        >
                          Update
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
