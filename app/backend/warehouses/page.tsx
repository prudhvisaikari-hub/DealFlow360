import { readDB } from "@/lib/db";
import { addWarehouseAction, updateStockAction } from "@/lib/actions";

export default function WarehousesPage() {
  const db = readDB();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fulfillment Centers &amp; Stock Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Shipping weight coefficients and physical stock levels drive greedy multi-warehouse fulfillment allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {db.warehouses.map((w) => (
          <div key={w.id} className="card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs">
                  WH
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">{w.name}</h2>
                  <p className="text-xs text-slate-400">
                    {w.location} · Weight: <strong>{w.shippingCostWeight}x</strong> · Lead: <strong>{w.replenishmentDays}d</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="table-container mb-2">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Hardware Product</th>
                    <th className="text-right">Available Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {db.products.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold text-slate-800 text-xs">{p.name}</td>
                      <td className="text-right">
                        <form action={updateStockAction.bind(null, w.id)} className="flex items-center justify-end gap-1.5">
                          <input type="hidden" name="productId" value={p.id} />
                          <input
                            name="qty"
                            type="number"
                            min={0}
                            defaultValue={w.stock[p.id] ?? 0}
                            className="input w-20 py-1 px-2 text-xs font-bold text-center"
                          />
                          <button type="submit" className="btn btn-outline text-xs py-1 px-2.5 hover:bg-brand-50 hover:text-brand-600">
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Provision New Fulfillment Center</h2>
            <p className="text-xs text-slate-500">Configure logistics hub coordinates and lead time parameters</p>
          </div>
        </div>

        <form action={addWarehouseAction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Center Name</label>
            <input name="name" className="input text-xs py-2" placeholder="e.g. West Coast Hub" required />
          </div>
          <div>
            <label className="label">Location Region</label>
            <input name="location" className="input text-xs py-2" placeholder="e.g. Reno, NV" />
          </div>
          <div>
            <label className="label">Shipping Cost Weight</label>
            <input name="shippingCostWeight" type="number" step="0.1" defaultValue={1} className="input text-xs py-2" />
          </div>
          <div>
            <label className="label">Replenishment (Days)</label>
            <input name="replenishmentDays" type="number" defaultValue={5} className="input text-xs py-2" />
          </div>
          <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-2">
            <button type="submit" className="btn btn-primary text-xs py-2 px-6">
              Add Warehouse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
