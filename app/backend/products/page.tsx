import { readDB } from "@/lib/db";
import { addProductAction } from "@/lib/actions";

export default function ProductsPage() {
  const db = readDB();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products &amp; Dynamic Price Lists</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tier-based pricing is automatically derived across Bronze (0%), Silver (5%), and Gold (10%) discount lists.
        </p>
      </div>

      <div className="table-container">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Target Margin</th>
              <th>Type</th>
              <th>Bronze</th>
              <th>Silver</th>
              <th>Gold</th>
            </tr>
          </thead>
          <tbody>
            {db.products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-400">{p.description}</div>
                </td>
                <td>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-50 text-slate-700">
                    {p.category}
                  </span>
                </td>
                <td className="font-bold text-slate-900">${p.basePrice}</td>
                <td>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {p.marginPercent}%
                  </span>
                </td>
                <td className="text-xs font-medium text-slate-600">
                  {p.isRecurring ? (
                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200">
                      Recurring
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] font-semibold">One-time</span>
                  )}
                </td>
                {(["Bronze", "Silver", "Gold"] as const).map((t) => {
                  const entry = db.priceLists.find((pl) => pl.productId === p.id && pl.tier === t);
                  return (
                    <td key={t} className="font-semibold text-slate-800">
                      ${entry?.price.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Catalog Product</h2>
            <p className="text-xs text-slate-500">Auto-generates multi-tier pricing entries for sales quotations</p>
          </div>
        </div>

        <form action={addProductAction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Product Name</label>
            <input name="name" className="input text-xs py-2" placeholder="e.g. UltraBook 15" required />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input text-xs py-2 font-medium">
              <option value="Hardware">Hardware</option>
              <option value="Services">Services</option>
              <option value="Subscriptions">Subscriptions</option>
            </select>
          </div>
          <div>
            <label className="label">Unit of Measure</label>
            <input name="unit" className="input text-xs py-2" defaultValue="unit" />
          </div>
          <div>
            <label className="label">Base Price ($)</label>
            <input name="basePrice" type="number" step="0.01" className="input text-xs py-2" defaultValue={100} required />
          </div>
          <div>
            <label className="label">Unit Cost ($)</label>
            <input name="unitCost" type="number" step="0.01" className="input text-xs py-2" defaultValue={60} required />
          </div>
          <div>
            <label className="label">Recurring Billing</label>
            <select name="isRecurring" className="input text-xs py-2 font-medium">
              <option value="false">No (One-time purchase)</option>
              <option value="true">Yes (Recurring subscription)</option>
            </select>
          </div>
          <div className="sm:col-span-2 md:col-span-3">
            <label className="label">Description</label>
            <input name="description" className="input text-xs py-2" placeholder="Product specification and overview..." />
          </div>
          <div className="sm:col-span-2 md:col-span-3 flex justify-end pt-2">
            <button type="submit" className="btn btn-primary text-xs py-2 px-6">
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
