import { readDB } from "@/lib/db";
import { addSubscriptionPlanAction } from "@/lib/actions";

export default function SubscriptionsPage() {
  const db = readDB();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Plans &amp; Billing Cycles</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Billing frequency, calendar proration, and refund terms determine mid-cycle line seat modifications.
        </p>
      </div>

      <div className="table-container">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Billing Cadence</th>
              <th>Proration Support</th>
              <th>Mid-Cycle Cancellation Terms</th>
            </tr>
          </thead>
          <tbody>
            {db.subscriptionPlans.map((p) => (
              <tr key={p.id}>
                <td className="font-bold text-slate-900">{p.name}</td>
                <td>
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded border bg-slate-50 text-slate-700">
                    {p.cycle}
                  </span>
                </td>
                <td>
                  {p.prorationEnabled ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Enabled (Daily Rate)
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Disabled</span>
                  )}
                </td>
                <td>
                  <span className="text-xs font-semibold capitalize text-slate-800">
                    {p.cancellationRefundPolicy} Refund Policy
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            P
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Define New Recurring Plan</h2>
            <p className="text-xs text-slate-500">Configure renewal interval and customer refund governance</p>
          </div>
        </div>

        <form action={addSubscriptionPlanAction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label">Plan Name</label>
            <input name="name" className="input text-xs py-2" placeholder="e.g. Enterprise SLA Monthly" required />
          </div>
          <div>
            <label className="label">Cycle Frequency</label>
            <select name="cycle" className="input text-xs py-2 font-medium">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="label">Cancellation Policy</label>
            <select name="cancellationRefundPolicy" className="input text-xs py-2 font-medium">
              <option value="full">Full refund</option>
              <option value="prorated">Prorated refund</option>
              <option value="none">No refund</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pb-2.5">
            <input
              type="checkbox"
              name="prorationEnabled"
              id="prorationEnabled"
              defaultChecked
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="prorationEnabled" className="text-xs font-semibold text-slate-700">
              Proration Enabled
            </label>
          </div>
          <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-2">
            <button type="submit" className="btn btn-primary text-xs py-2 px-6">
              Add Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
