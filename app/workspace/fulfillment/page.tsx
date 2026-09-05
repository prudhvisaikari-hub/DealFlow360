import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/Badge";
import { dispatchFulfillmentAction } from "@/lib/actions";

export default function FulfillmentPage() {
  const user = getCurrentUser()!;
  const db = readDB();

  // Find all quotes that have warehouse plans or need fulfillment
  const fulfillmentQuotes = db.quotations.filter(
    (q) => q.warehousePlan || ["confirmed", "fulfilling", "billed"].includes(q.status)
  );

  const totalShipments = fulfillmentQuotes.reduce(
    (sum, q) => sum + (q.warehousePlan?.shipmentCount || 1),
    0
  );

  const totalBackorders = fulfillmentQuotes.reduce(
    (sum, q) => sum + (q.warehousePlan?.backorderLines?.length || 0),
    0
  );

  const totalShippingCost = fulfillmentQuotes.reduce(
    (sum, q) => sum + (q.warehousePlan?.estimatedShippingCost || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Multi-Warehouse Logistics &amp; Fulfillment
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Screen B6: Real-time inventory routing, split shipment cost minimization, and backorder tracking across distributed depots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/backend/warehouses" className="btn btn-secondary text-xs">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Manage Warehouses</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-white to-blue-50/30 border-blue-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Active Allocations</span>
          <div className="text-3xl font-black text-blue-900 mt-2">{fulfillmentQuotes.length}</div>
          <p className="text-xs text-blue-600/80 mt-1 font-medium">Orders routed across network</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-indigo-50/30 border-indigo-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total Shipments</span>
          <div className="text-3xl font-black text-indigo-900 mt-2">{totalShipments}</div>
          <p className="text-xs text-indigo-600/80 mt-1 font-medium">Consolidated dispatch legs</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-amber-50/30 border-amber-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Backorder Lines</span>
          <div className="text-3xl font-black text-amber-800 mt-2">{totalBackorders}</div>
          <p className="text-xs text-amber-600/80 mt-1 font-medium">Auto-queued replenishment</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-emerald-50/30 border-emerald-200/60 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Est. Shipping Freight</span>
          <div className="text-3xl font-black text-emerald-800 mt-2">${totalShippingCost.toLocaleString()}</div>
          <p className="text-xs text-emerald-600/80 mt-1 font-medium">Weighted distance optimized</p>
        </div>
      </div>

      {/* Real-time Depot Stock Status */}
      <section className="card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Depot Network &amp; On-Hand Inventory</h2>
            <p className="text-xs text-slate-500">Live stock levels informing the automatic allocation engine</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            {db.warehouses.length} Active Hubs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {db.warehouses.map((wh) => (
            <div key={wh.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{wh.name}</span>
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      Weight: {wh.shippingCostWeight}x
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{wh.location} &bull; Replenishment: {wh.replenishmentDays} days</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  WH
                </div>
              </div>

              <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400">Stocked Hardware Skus</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(wh.stock).map(([productId, qty]) => {
                    const prod = db.products.find((p) => p.id === productId);
                    return (
                      <div key={productId} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                        <span className="text-slate-700 truncate font-medium max-w-[130px]" title={prod?.name || productId}>
                          {prod?.name || productId}
                        </span>
                        <span className={`font-mono font-bold ${qty < 5 ? "text-rose-600" : "text-emerald-700"}`}>
                          {qty} units
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Orders & Multi-Warehouse Splits */}
      <section className="card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Quotation Logistics &amp; Dispatch Breakdown</h2>
            <p className="text-xs text-slate-500">Autonomous multi-warehouse split assignments and backorder triggers</p>
          </div>
        </div>

        {fulfillmentQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="font-bold text-slate-800 text-base">No Orders Pending Logistics Routing</div>
            <p className="text-xs text-slate-500 mt-1">Confirmed orders with physical hardware lines will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fulfillmentQuotes.map((q) => {
              const customer = db.customers.find((c) => c.id === q.customerId);
              const rep = db.users.find((u) => u.id === q.repId);
              const plan = q.warehousePlan;

              return (
                <div key={q.id} className="p-5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/workspace/quotations/${q.id}`}
                          className="font-bold text-brand-600 hover:text-brand-700 text-base"
                        >
                          {q.id}
                        </Link>
                        <StatusBadge status={q.status} />
                        {plan?.isManualOverride && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                            Manual Logistics Override
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Customer: <span className="font-semibold text-slate-800">{customer?.name || q.customerId}</span> ({customer?.tier} Tier) &bull; Rep: {rep?.name || "Unassigned"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {q.status === "confirmed" && (
                        <form
                          action={async () => {
                            "use server";
                            await dispatchFulfillmentAction(q.id);
                          }}
                        >
                          <button type="submit" className="btn btn-primary text-xs py-1.5 px-3">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Dispatch Fulfillment</span>
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/workspace/quotations/${q.id}`}
                        className="btn btn-outline text-xs py-1.5 px-3"
                      >
                        Inspect Route &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Split Lines Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Dispatch Lines by Warehouse
                      </span>
                      {plan?.lines && plan.lines.length > 0 ? (
                        <div className="space-y-1.5">
                          {plan.lines.map((l, idx) => {
                            const wh = db.warehouses.find((w) => w.id === l.warehouseId);
                            const prod = db.products.find((p) => p.id === l.productId);
                            return (
                              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{wh?.name || l.warehouseId}</span>
                                  <span className="text-slate-400">&rarr;</span>
                                  <span className="text-slate-700 font-medium">{prod?.name || l.productId}</span>
                                </div>
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  Qty: {l.quantity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-500 italic">
                          No physical warehouse dispatch required (digital subscriptions or services only).
                        </div>
                      )}
                    </div>

                    {/* Logistics Summary */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Routing Intelligence
                      </span>
                      <div className="flex justify-between text-slate-600">
                        <span>Shipment Legs:</span>
                        <span className="font-bold text-slate-900">{plan?.shipmentCount || 1}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Est. Freight:</span>
                        <span className="font-bold text-slate-900">${plan?.estimatedShippingCost || 0}</span>
                      </div>
                      {plan?.backorderLines && plan.backorderLines.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-amber-200/60 bg-amber-50/50 p-2 rounded text-amber-800">
                          <span className="font-bold block text-[11px]">Backorder Active:</span>
                          {plan.backorderLines.map((b, bIdx) => {
                            const p = db.products.find((pr) => pr.id === b.productId);
                            return (
                              <div key={bIdx} className="text-[10px] text-amber-700">
                                {p?.name || b.productId}: {b.quantity} units queued
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
