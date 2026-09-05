import { readDB } from "@/lib/db";
import { addUpsellRuleAction } from "@/lib/actions";

export default function UpsellPage() {
  const db = readDB();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Upsell &amp; Cross-Sell Heuristics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cart-level product affinity and minimum margin thresholds govern real-time sales recommendations.
        </p>
      </div>

      <div className="table-container">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Trigger Item (In Cart)</th>
              <th>Recommended Upsell Item</th>
              <th>Affinity Score</th>
              <th>Campaign Status</th>
              <th>Min Margin Threshold</th>
            </tr>
          </thead>
          <tbody>
            {db.upsellRules.map((r) => {
              const trigger = db.products.find((p) => p.id === r.triggerProductId);
              const suggested = db.products.find((p) => p.id === r.suggestedProductId);
              return (
                <tr key={r.id}>
                  <td className="text-slate-600 font-medium">{trigger?.name}</td>
                  <td className="font-bold text-slate-900">{suggested?.name}</td>
                  <td>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {(r.coPurchaseScore * 100).toFixed(0)}% Match
                    </span>
                  </td>
                  <td>
                    {r.promoted ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Promoted Campaign
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Standard</span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      &ge; {r.minMarginPercent}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            U
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Define Cross-Sell Rule</h2>
            <p className="text-xs text-slate-500">Configure trigger association, recommendation affinity, and margin filters</p>
          </div>
        </div>

        <form action={addUpsellRuleAction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label">Trigger Product</label>
            <select name="triggerProductId" className="input text-xs py-2 font-medium">
              {db.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Suggested Recommendation</label>
            <select name="suggestedProductId" className="input text-xs py-2 font-medium">
              {db.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Co-purchase Score (0–1)</label>
            <input
              name="coPurchaseScore"
              type="number"
              step="0.05"
              min={0}
              max={1}
              defaultValue={0.5}
              className="input text-xs py-2 text-center font-semibold"
            />
          </div>

          <div>
            <label className="label">Min Margin %</label>
            <input
              name="minMarginPercent"
              type="number"
              step="1"
              defaultValue={15}
              className="input text-xs py-2 text-center font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 pb-2.5">
            <input
              type="checkbox"
              name="promoted"
              id="promoted"
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="promoted" className="text-xs font-semibold text-slate-700">
              Promoted Campaign
            </label>
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-2">
            <button type="submit" className="btn btn-primary text-xs py-2 px-6">
              Add Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
