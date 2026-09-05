import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/Badge";
import { evaluateDealHealth } from "@/lib/logic/dealHealth";

export default function WorkspaceHomePage() {
  const user = getCurrentUser()!;
  const db = readDB();

  const totalQuotes = db.quotations.length;
  const pendingApprovals = db.quotations.filter((q) =>
    q.approvalSteps.some((s) => s.status === "pending")
  ).length;

  const flags = evaluateDealHealth(db.quotations, db.users);
  const criticalFlags = flags.filter((f) => f.severity === "high").length;

  const totalPipeline = db.quotations.reduce((acc, q) =>
    acc + q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0), 0
  );

  const confirmedValue = db.quotations
    .filter((q) => ["confirmed", "fulfilling", "billed"].includes(q.status))
    .reduce((acc, q) =>
      acc + q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0), 0
    );

  const winRate = totalQuotes > 0
    ? Math.round((db.quotations.filter((q) => ["confirmed", "billed"].includes(q.status)).length / totalQuotes) * 100)
    : 0;

  const avgMargin = db.quotations.length > 0
    ? Math.round(
        db.quotations.reduce((acc, q) => acc + (q.marginPercentSnapshot || 0), 0) / db.quotations.length
      )
    : 0;

  const statusGroups: Record<string, number> = {};
  for (const q of db.quotations) {
    statusGroups[q.status] = (statusGroups[q.status] || 0) + 1;
  }

  const activeShipments = db.quotations.filter(
    (q) => q.warehousePlan || ["confirmed", "fulfilling"].includes(q.status)
  ).length;

  const recentQuotations = [...db.quotations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const pipelineStages = [
    { label: "Draft", status: "draft", color: "bg-slate-300", textColor: "text-slate-600" },
    { label: "In Approval", status: "pending_manager_approval", color: "bg-amber-400", textColor: "text-amber-700" },
    { label: "Sent", status: "sent", color: "bg-blue-400", textColor: "text-blue-700" },
    { label: "Negotiation", status: "under_negotiation", color: "bg-purple-400", textColor: "text-purple-700" },
    { label: "Confirmed", status: "confirmed", color: "bg-emerald-400", textColor: "text-emerald-700" },
    { label: "Billed", status: "billed", color: "bg-indigo-400", textColor: "text-indigo-700" },
  ];

  const topCustomers = db.customers.map((c) => {
    const quotes = db.quotations.filter((q) => q.customerId === c.id);
    const value = quotes.reduce((acc, q) =>
      acc + q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0), 0
    );
    return { ...c, quoteCount: quotes.length, totalValue: Math.round(value) };
  }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 4);

  const maxValue = topCustomers[0]?.totalValue || 1;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HERO COMMAND BANNER ── */}
      <div className="hero-card p-8 shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-56 h-56 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[500px] h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none rounded-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DealFlow360 — Autonomous CPQ Platform &nbsp;·&nbsp; Live</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span className="text-gradient">{user.name.split(" ")[0]}</span>
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-xl leading-relaxed">
              Signed in as&nbsp;
              <span className="font-semibold text-brand-300 capitalize">{user.role.replace("_", " ")}</span>.
              &nbsp;You have full access to configure CPQ deals, audit margin risk, evaluate governance alerts, and manage multi-warehouse dispatch orders.
            </p>

            {/* Live ticker strip */}
            <div className="mt-4 overflow-hidden rounded-lg bg-white/5 border border-white/10 py-2 px-3">
              <div className="ticker-track text-xs text-white/50 gap-8">
                {[
                  `📦 ${db.quotations.length} Total Quotations in Pipeline`,
                  `⚡ ${pendingApprovals} Approvals Pending Sign-off`,
                  `🏭 ${db.warehouses.length} Warehouse Depots Active`,
                  `🎯 Win Rate: ${winRate}%`,
                  `💰 $${Math.round(confirmedValue).toLocaleString()} Confirmed Revenue`,
                  `🔔 ${criticalFlags} High-Severity Flags Active`,
                  `📦 ${db.quotations.length} Total Quotations in Pipeline`,
                  `⚡ ${pendingApprovals} Approvals Pending Sign-off`,
                  `🏭 ${db.warehouses.length} Warehouse Depots Active`,
                  `🎯 Win Rate: ${winRate}%`,
                  `💰 $${Math.round(confirmedValue).toLocaleString()} Confirmed Revenue`,
                  `🔔 ${criticalFlags} High-Severity Flags Active`,
                ].map((item, i) => (
                  <span key={i} className="mr-10 font-medium">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 animate-slide-up-delay-2">
            <Link
              href="/workspace/quotations/new"
              className="group px-5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2.5 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Quotation</span>
            </Link>
            <Link
              href="/workspace/approvals"
              className="px-5 py-3 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2.5 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Approvals Queue ({pendingApprovals})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── IMPACT KPI ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Pipeline",
            value: `$${(totalPipeline / 1000).toFixed(0)}K`,
            sub: `${totalQuotes} quotations active`,
            gradient: "from-brand-600/10 to-indigo-600/10",
            border: "border-brand-200/60",
            glow: "glow-ring-brand",
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            iconColor: "text-brand-600",
            delay: "",
          },
          {
            label: "Confirmed Revenue",
            value: `$${(confirmedValue / 1000).toFixed(0)}K`,
            sub: `Win rate ${winRate}%`,
            gradient: "from-emerald-600/10 to-teal-600/10",
            border: "border-emerald-200/60",
            glow: "glow-ring-emerald",
            icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
            iconColor: "text-emerald-600",
            delay: "animate-slide-up-delay-1",
          },
          {
            label: "Pending Approvals",
            value: String(pendingApprovals),
            sub: "Awaiting manager sign-off",
            gradient: "from-amber-600/10 to-orange-600/10",
            border: pendingApprovals > 0 ? "border-amber-300" : "border-amber-200/60",
            glow: pendingApprovals > 0 ? "glow-ring-amber" : "",
            icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
            iconColor: "text-amber-600",
            delay: "animate-slide-up-delay-2",
          },
          {
            label: "Risk Alerts",
            value: String(criticalFlags),
            sub: `${flags.length} total anomaly flags`,
            gradient: "from-rose-600/10 to-red-600/10",
            border: criticalFlags > 0 ? "border-rose-300" : "border-rose-200/60",
            glow: criticalFlags > 0 ? "glow-ring-rose" : "",
            icon: "M13 10V3L4 14h7v7l9-11h-7z",
            iconColor: "text-rose-600",
            delay: "animate-slide-up-delay-3",
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`card ${kpi.delay} p-5 bg-gradient-to-br ${kpi.gradient} border ${kpi.border} ${kpi.glow} hover:scale-[1.02] transition-all cursor-default`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{kpi.label}</span>
                <div className="stat-number text-slate-900 mt-1">{kpi.value}</div>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">{kpi.sub}</p>
              </div>
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-white/80 ${kpi.iconColor} flex items-center justify-center shadow-sm`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={kpi.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── PIPELINE FUNNEL + TOP CUSTOMERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pipeline Status Funnel */}
        <div className="lg:col-span-3 card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pipeline Stage Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Quotation count across all workflow stages</p>
            </div>
            <Link href="/workspace/quotations?view=pipeline" className="text-xs font-bold text-brand-600 hover:underline">
              Kanban Board →
            </Link>
          </div>

          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const count = statusGroups[stage.status] || 0;
              const pct = totalQuotes > 0 ? Math.round((count / totalQuotes) * 100) : 0;
              return (
                <div key={stage.status} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 w-24 flex-shrink-0">{stage.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${stage.color} h-full rounded-full metric-bar`}
                      style={{ ["--target-width" as string]: `${pct}%`, width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold tabular-nums w-8 text-right ${stage.textColor}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mini win/loss summary */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60">
              <div className="text-xl font-black text-emerald-700">{winRate}%</div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mt-0.5">Win Rate</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xl font-black text-slate-700">{db.customers.length}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Accounts</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200/60">
              <div className="text-xl font-black text-indigo-700">{db.products.length}</div>
              <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mt-0.5">SKUs</div>
            </div>
          </div>
        </div>

        {/* Top Accounts by Value */}
        <div className="lg:col-span-2 card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Accounts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by total pipeline value</p>
            </div>
            <Link href="/backend/customers" className="text-xs font-bold text-brand-600 hover:underline">
              Manage →
            </Link>
          </div>

          <div className="space-y-4">
            {topCustomers.map((c, i) => {
              const tierColors: Record<string, string> = {
                Gold: "bg-amber-100 text-amber-800 border-amber-200",
                Silver: "bg-slate-200 text-slate-700 border-slate-300",
                Bronze: "bg-orange-100 text-orange-800 border-orange-200",
              };
              const barPct = maxValue > 0 ? Math.round((c.totalValue / maxValue) * 100) : 0;
              return (
                <div key={c.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold w-4">#{i + 1}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{c.name}</div>
                        <span className={`inline-block text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${tierColors[c.tier] || ""}`}>
                          {c.tier}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">${c.totalValue.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">{c.quoteCount} deals</div>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 metric-bar"
                      style={{ ["--target-width" as string]: `${barPct}%`, width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── QUICK LAUNCH MODULES ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Operational Hubs</h2>
          <span className="text-xs text-slate-500">All modules live with real-time data</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              title: "Approval Cockpit",
              desc: "Blended risk scoring & governance queue",
              href: "/workspace/approvals",
              alert: pendingApprovals > 0 ? `${pendingApprovals} pending` : null,
              alertColor: "bg-amber-500",
              gradient: "from-amber-500/10 to-orange-500/10",
              border: pendingApprovals > 0 ? "border-amber-200" : "border-slate-200/80",
              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              iconColor: "text-amber-600",
            },
            {
              title: "Logistics & Fulfillment",
              desc: "Multi-depot routing & backorder mgmt",
              href: "/workspace/fulfillment",
              alert: activeShipments > 0 ? `${activeShipments} orders` : null,
              alertColor: "bg-indigo-500",
              gradient: "from-indigo-500/10 to-blue-500/10",
              border: "border-slate-200/80",
              icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
              iconColor: "text-indigo-600",
            },
            {
              title: "Hybrid Billing",
              desc: "Recurring cycles & payment recording",
              href: "/workspace/billing",
              alert: null,
              alertColor: "",
              gradient: "from-emerald-500/10 to-teal-500/10",
              border: "border-slate-200/80",
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              iconColor: "text-emerald-600",
            },
            {
              title: "Deal Health Radar",
              desc: "Anomaly detection & nudge alerts",
              href: "/workspace/dashboard",
              alert: criticalFlags > 0 ? `${criticalFlags} critical` : null,
              alertColor: "bg-rose-500",
              gradient: "from-rose-500/10 to-pink-500/10",
              border: criticalFlags > 0 ? "border-rose-200" : "border-slate-200/80",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
              iconColor: "text-rose-600",
            },
          ].map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`relative p-5 rounded-2xl bg-gradient-to-br ${m.gradient} border ${m.border} hover:shadow-md hover:scale-[1.02] transition-all group flex flex-col gap-3`}
            >
              {m.alert && (
                <span className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] font-bold text-white ${m.alertColor} px-2 py-0.5 rounded-full shadow-sm`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                  {m.alert}
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl bg-white/80 ${m.iconColor} flex items-center justify-center shadow-sm`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={m.icon} />
                </svg>
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">{m.title}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.desc}</div>
              </div>
              <div className="text-xs font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform">
                Open Hub →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── RECENT ACTIVITY FEED ── */}
      <div className="card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Live Deal Activity Feed</h2>
            <p className="text-xs text-slate-500">Most recently updated quotations across all reps</p>
          </div>
          <Link href="/workspace/quotations" className="btn btn-outline text-xs py-1.5 px-3 hover:bg-white">
            View All Quotations →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Deal</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4 text-right">Net Value</th>
                <th className="py-3 px-4 text-right">Rep</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {recentQuotations.map((q, idx) => {
                const customer = db.customers.find((c) => c.id === q.customerId);
                const rep = db.users.find((u) => u.id === q.repId);
                const val = q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0);
                const riskLevel = q.blendedRiskScore > 5 ? "high" : q.blendedRiskScore > 0 ? "medium" : "ok";
                return (
                  <tr key={q.id} className={`hover:bg-slate-50/70 transition-colors animate-slide-up`} style={{ animationDelay: `${idx * 60}ms` }}>
                    <td className="py-3 px-6">
                      <Link href={`/workspace/quotations/${q.id}`} className="font-mono font-bold text-brand-600 hover:text-brand-700 hover:underline text-[11px]">
                        {q.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{customer?.name || "—"}</div>
                      <div className="text-[10px] text-slate-400">{customer?.tier} Tier</div>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={q.status} /></td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                        riskLevel === "high" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        riskLevel === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {riskLevel === "high" && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                        {q.blendedRiskScore > 0 ? `+${q.blendedRiskScore} pts` : "Clean"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      ${Math.round(val).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">{rep?.name?.split(" ")[0] || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/workspace/quotations/${q.id}`} className="btn btn-outline text-[10px] py-1 px-2.5 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200">
                        Open CPQ
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
