import { readDB } from "@/lib/db";
import { updateDiscountTierAction, updateCategoryCeilingAction } from "@/lib/actions";

export default function DiscountsPage() {
  const db = readDB();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Discount Tiers &amp; Governance Rules</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Every quotation line is evaluated against the stricter of customer tier ceiling vs. product category ceiling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              T
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Tier Ceilings</h2>
              <p className="text-xs text-slate-500">Maximum allowed discount by customer tier</p>
            </div>
          </div>

          <div className="space-y-3">
            {db.discountTiers.map((t) => (
              <form key={t.tier} action={updateDiscountTierAction} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <input type="hidden" name="tier" value={t.tier} />
                <span className="w-24 text-xs font-bold text-slate-800 uppercase tracking-wide">{t.tier} Tier</span>
                <div className="flex items-center gap-1">
                  <input
                    name="maxDiscountPercent"
                    type="number"
                    step="0.5"
                    defaultValue={t.maxDiscountPercent}
                    className="input w-20 py-1 px-2 text-xs font-semibold text-center"
                  />
                  <span className="text-xs text-slate-500 font-medium">%</span>
                </div>
                <button type="submit" className="btn btn-outline text-xs py-1 px-3 ml-auto hover:bg-brand-50 hover:text-brand-600">
                  Save
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="card p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              C
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Category Ceilings</h2>
              <p className="text-xs text-slate-500">Hard caps per product category</p>
            </div>
          </div>

          <div className="space-y-3">
            {db.categoryCeilings.map((c) => (
              <form key={c.category} action={updateCategoryCeilingAction} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <input type="hidden" name="category" value={c.category} />
                <span className="w-28 text-xs font-bold text-slate-800">{c.category}</span>
                <div className="flex items-center gap-1">
                  <input
                    name="maxDiscountPercent"
                    type="number"
                    step="0.5"
                    defaultValue={c.maxDiscountPercent}
                    className="input w-20 py-1 px-2 text-xs font-semibold text-center"
                  />
                  <span className="text-xs text-slate-500 font-medium">%</span>
                </div>
                <button type="submit" className="btn btn-outline text-xs py-1 px-3 ml-auto hover:bg-brand-50 hover:text-brand-600">
                  Save
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 shadow-soft">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
          Configured Approval Chain Routing
        </h2>
        <div className="table-container">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Risk Score Range</th>
                <th>Sales Manager Step</th>
                <th>Finance Review Step</th>
                <th>Governance Tier Label</th>
              </tr>
            </thead>
            <tbody>
              {db.approvalChainRules.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold text-slate-900">
                    {r.minOverPoints} – {r.maxOverPoints ?? "∞"} pts
                  </td>
                  <td>
                    {r.requiresManager ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Required
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td>
                    {r.requiresFinance ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Required
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="font-semibold text-slate-700">{r.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
