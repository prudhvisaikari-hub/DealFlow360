import Link from "next/link";
import { readDB } from "@/lib/db";

export default function BackendOverview() {
  const db = readDB();

  const totalRevenue = db.quotations.reduce((acc, q) =>
    acc + q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0), 0
  );

  const pendingApprovals = db.quotations.filter((q) =>
    q.approvalSteps.some((s) => s.status === "pending")
  ).length;

  const billedQuotes = db.quotations.filter((q) => q.status === "billed").length;
  const winRate = db.quotations.length > 0
    ? Math.round((db.quotations.filter((q) => ["confirmed", "billed"].includes(q.status)).length / db.quotations.length) * 100)
    : 0;

  const goldAccounts = db.customers.filter((c) => c.tier === "Gold").length;
  const promotedRules = db.upsellRules.filter((r) => r.promoted).length;

  const modules = [
    {
      href: "/backend/products",
      label: "Products & Price Lists",
      desc: "Manage SKUs, variant attributes, and per-tier pricing",
      value: db.products.length,
      unit: "products",
      gradient: "from-blue-600/10 to-indigo-600/10",
      border: "border-blue-200/60",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      href: "/backend/discounts",
      label: "Discount Tiers & Approval Rules",
      desc: "Set ceiling limits and configure multi-band governance",
      value: db.discountTiers.length,
      unit: "tier rules",
      gradient: "from-amber-600/10 to-orange-600/10",
      border: pendingApprovals > 0 ? "border-amber-300" : "border-amber-200/60",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      alert: pendingApprovals > 0 ? `${pendingApprovals} pending` : null,
    },
    {
      href: "/backend/warehouses",
      label: "Warehouses & Depots",
      desc: "Configure fulfillment hubs, shipping weights, and stock",
      value: db.warehouses.length,
      unit: "depots",
      gradient: "from-indigo-600/10 to-violet-600/10",
      border: "border-indigo-200/60",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
    {
      href: "/backend/subscriptions",
      label: "Subscription Plans",
      desc: "Define recurring cycles, proration rules, and refund policies",
      value: db.subscriptionPlans.length,
      unit: "plans",
      gradient: "from-purple-600/10 to-pink-600/10",
      border: "border-purple-200/60",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    },
    {
      href: "/backend/upsell",
      label: "Upsell Engine Rules",
      desc: "AI co-purchase heuristics with margin gates and promotion flags",
      value: db.upsellRules.length,
      unit: "rules",
      gradient: "from-emerald-600/10 to-teal-600/10",
      border: "border-emerald-200/60",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      badge: promotedRules > 0 ? `${promotedRules} promoted` : null,
    },
    {
      href: "/backend/customers",
      label: "Customer Accounts & Tiers",
      desc: "Manage Bronze/Silver/Gold tiers, currencies, and portal mapping",
      value: db.customers.length,
      unit: "accounts",
      gradient: "from-cyan-600/10 to-blue-600/10",
      border: "border-cyan-200/60",
      iconColor: "text-cyan-700",
      iconBg: "bg-cyan-100",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      badge: goldAccounts > 0 ? `${goldAccounts} Gold` : null,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 p-7 shadow-xl" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1a0533 100%)" }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-20 w-48 h-48 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none rounded-2xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Platform Control Tower — Admin View
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Administrative Control Panel</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Configure global business rules governing CPQ pricing, discount governance, fulfillment routing, and recurring billing policies across the entire platform.
          </p>

          {/* Inline platform stats */}
          <div className="mt-5 flex flex-wrap gap-4">
            {[
              { label: "Total Pipeline", value: `$${Math.round(totalRevenue / 1000)}K`, color: "text-brand-300" },
              { label: "Win Rate", value: `${winRate}%`, color: "text-emerald-300" },
              { label: "Pending Approvals", value: String(pendingApprovals), color: pendingApprovals > 0 ? "text-amber-300" : "text-slate-400" },
              { label: "Deals Billed", value: String(billedQuotes), color: "text-purple-300" },
              { label: "Gold Accounts", value: String(goldAccounts), color: "text-yellow-300" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm">
                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Modules Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Configuration Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`relative group card p-5 bg-gradient-to-br ${m.gradient} border ${m.border} hover:shadow-md hover:scale-[1.015] transition-all`}
            >
              {(m as { alert?: string | null }).alert && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[9px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  {(m as { alert?: string | null }).alert}
                </span>
              )}
              {(m as { badge?: string | null }).badge && !((m as { alert?: string | null }).alert) && (
                <span className="absolute top-4 right-4 text-[10px] font-bold bg-white/60 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                  {(m as { badge?: string | null }).badge}
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl ${m.iconBg} ${m.iconColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={m.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition-colors">{m.label}</h3>
                    <span className="text-2xl font-black text-slate-800 tabular-nums flex-shrink-0">{m.value}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.desc}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{m.value} {m.unit}</span>
                    <span className="text-xs font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform">Manage →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats Table */}
      <div className="card p-6 shadow-soft">
        <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">Platform Configuration Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: "Max Hardware Discount", value: `${Math.max(...db.categoryCeilings.filter(c => c.category === "Hardware").map(c => c.maxDiscountPercent), 0)}%`, sub: "Hardware category ceiling" },
            { label: "Max Services Discount", value: `${Math.max(...db.categoryCeilings.filter(c => c.category === "Services").map(c => c.maxDiscountPercent), 0)}%`, sub: "Services category ceiling" },
            { label: "Price List Entries", value: String(db.priceLists.length), sub: "Tier-product price mappings" },
            { label: "Approval Chain Bands", value: String(db.approvalChainRules.length), sub: "Risk score thresholds" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{s.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
