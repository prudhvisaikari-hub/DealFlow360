import Link from "next/link";
import { readDB } from "@/lib/db";
import { evaluateDealHealth } from "@/lib/logic/dealHealth";
import { SeverityBadge } from "@/components/Badge";
import { triggerNudgeAction } from "@/lib/actions";

const TYPE_CONFIG: Record<string, {
  label: string;
  iconBg: string;
  textColor: string;
  icon: string;
  bgGradient: string;
  borderColor: string;
}> = {
  stalled: {
    label: "Stalled Deal Pipeline",
    iconBg: "bg-amber-100 text-amber-600",
    textColor: "text-amber-700",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    bgGradient: "from-amber-50 to-orange-50/30",
    borderColor: "border-amber-200",
  },
  discount_anomaly: {
    label: "Discount Margin Anomaly",
    iconBg: "bg-rose-100 text-rose-600",
    textColor: "text-rose-700",
    icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    bgGradient: "from-rose-50 to-red-50/30",
    borderColor: "border-rose-200",
  },
  delivery_slippage: {
    label: "Fulfillment & Stock Slippage",
    iconBg: "bg-orange-100 text-orange-600",
    textColor: "text-orange-700",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    bgGradient: "from-orange-50 to-amber-50/20",
    borderColor: "border-orange-200",
  },
};

const SEVERITY_SCORE: Record<string, number> = { high: 3, medium: 2, low: 1 };

export default function DashboardPage() {
  const db = readDB();
  const flags = evaluateDealHealth(db.quotations, db.users);

  const stalled = flags.filter((f) => f.type === "stalled").length;
  const anomalies = flags.filter((f) => f.type === "discount_anomaly").length;
  const slippage = flags.filter((f) => f.type === "delivery_slippage").length;
  const highFlags = flags.filter((f) => f.severity === "high").length;
  const mediumFlags = flags.filter((f) => f.severity === "medium").length;

  // Compute a "Platform Health Score" (0–100, higher = healthier)
  const riskPoints = flags.reduce((acc, f) => acc + (SEVERITY_SCORE[f.severity] || 0), 0);
  const maxRiskPoints = Math.max(flags.length * 3, 1);
  const healthScore = Math.max(0, Math.round(100 - (riskPoints / maxRiskPoints) * 60));

  const healthColor =
    healthScore >= 80 ? "text-emerald-600" :
    healthScore >= 60 ? "text-amber-600" :
    "text-rose-600";

  const healthRingColor =
    healthScore >= 80 ? "glow-ring-emerald" :
    healthScore >= 60 ? "glow-ring-amber" :
    "glow-ring-rose";

  // Sort flags by severity (high first)
  const sortedFlags = [...flags].sort(
    (a, b) => (SEVERITY_SCORE[b.severity] || 0) - (SEVERITY_SCORE[a.severity] || 0)
  );

  // Compute deal velocity (avg days since last activity for active deals)
  const activeDealDays = db.quotations
    .filter((q) => !["confirmed", "billed", "rejected"].includes(q.status))
    .map((q) => (Date.now() - new Date(q.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
  const avgStaleDays = activeDealDays.length > 0
    ? Math.round(activeDealDays.reduce((a, b) => a + b, 0) / activeDealDays.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${highFlags > 0 ? "bg-rose-400" : "bg-emerald-400"}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${highFlags > 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Deal Health &amp; Pipeline Risk Radar
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            Autonomous engine monitoring deal velocity, discount anomalies, and fulfillment constraints. Acts as your always-on risk control tower.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/workspace/quotations" className="btn btn-secondary text-xs">
            View All Deals →
          </Link>
        </div>
      </div>

      {/* Health Score + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Big Health Score */}
        <div className={`card p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br ${
          healthScore >= 80 ? "from-emerald-50 to-teal-50/40 border-emerald-200/60" :
          healthScore >= 60 ? "from-amber-50 to-yellow-50/40 border-amber-200/60" :
          "from-rose-50 to-red-50/40 border-rose-200/60"
        } shadow-soft ${healthRingColor}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Platform Health</span>
          <div className={`text-6xl font-black tabular-nums ${healthColor} leading-none`}>{healthScore}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">/ 100 score</div>
          <div className={`mt-3 text-xs font-bold px-3 py-1 rounded-full border ${
            healthScore >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
            healthScore >= 60 ? "bg-amber-100 text-amber-700 border-amber-200" :
            "bg-rose-100 text-rose-700 border-rose-200"
          }`}>
            {healthScore >= 80 ? "✓ All Systems Healthy" : healthScore >= 60 ? "⚠ Moderate Risk" : "✗ Elevated Risk"}
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full metric-bar ${
                healthScore >= 80 ? "bg-emerald-500" : healthScore >= 60 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ ["--target-width" as string]: `${healthScore}%`, width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Flag Breakdown KPIs */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: "Stalled Deals",
              value: stalled,
              sub: `Avg ${avgStaleDays} days without activity`,
              gradient: "from-amber-500/10 to-orange-500/10",
              border: stalled > 0 ? "border-amber-300" : "border-amber-200/60",
              glow: stalled > 0 ? "glow-ring-amber" : "",
              numColor: "text-amber-800",
              icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              iconBg: "bg-amber-100 text-amber-600",
            },
            {
              title: "Discount Anomalies",
              value: anomalies,
              sub: `Rep discount well above historical avg`,
              gradient: "from-rose-500/10 to-red-500/10",
              border: anomalies > 0 ? "border-rose-300" : "border-rose-200/60",
              glow: anomalies > 0 ? "glow-ring-rose" : "",
              numColor: "text-rose-800",
              icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
              iconBg: "bg-rose-100 text-rose-600",
            },
            {
              title: "Delivery Slippage",
              value: slippage,
              sub: `Backorder lines or unshipped orders`,
              gradient: "from-orange-500/10 to-amber-500/10",
              border: slippage > 0 ? "border-orange-300" : "border-orange-200/60",
              glow: slippage > 0 ? "glow-ring-amber" : "",
              numColor: "text-orange-800",
              icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
              iconBg: "bg-orange-100 text-orange-600",
            },
          ].map((kpi) => (
            <div key={kpi.title} className={`card p-5 bg-gradient-to-br ${kpi.gradient} border ${kpi.border} ${kpi.glow} shadow-sm hover:scale-[1.02] transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{kpi.title}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={kpi.icon} />
                  </svg>
                </div>
              </div>
              <div className={`text-4xl font-black ${kpi.numColor}`}>{kpi.value}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">{kpi.sub}</p>
            </div>
          ))}

          {/* Severity breakdown mini-bars */}
          <div className="sm:col-span-3 card p-4 bg-slate-50/50 border-slate-200/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Severity Breakdown</span>
              <span className="text-xs text-slate-400">{flags.length} total flags</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "High", count: highFlags, color: "bg-rose-500", textColor: "text-rose-700" },
                { label: "Medium", count: mediumFlags, color: "bg-amber-400", textColor: "text-amber-700" },
                { label: "Low", count: flags.length - highFlags - mediumFlags, color: "bg-blue-400", textColor: "text-blue-700" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-12 ${row.textColor}`}>{row.label}</span>
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color} metric-bar`}
                      style={{
                        ["--target-width" as string]: flags.length > 0 ? `${Math.round((row.count / flags.length) * 100)}%` : "0%",
                        width: flags.length > 0 ? `${Math.round((row.count / flags.length) * 100)}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-4 text-right">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Alert Feed */}
      <div className="card overflow-hidden shadow-soft">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50/50 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">🔔 Active Anomaly Alert Feed</h2>
            <p className="text-xs text-slate-500 mt-0.5">{flags.length} items requiring your attention — sorted by severity</p>
          </div>
          {highFlags > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {highFlags} critical action required
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {flags.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-bold text-slate-900 text-lg">All Deals Fully Healthy</div>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                No risk thresholds, discount anomalies, or delivery constraints currently violated. Pipeline is running clean.
              </p>
            </div>
          )}

          {sortedFlags.map((f, i) => {
            const quote = db.quotations.find((q) => q.id === f.quotationId);
            const customer = quote ? db.customers.find((c) => c.id === quote.customerId) : null;
            const rep = quote ? db.users.find((u) => u.id === quote.repId) : null;
            const config = TYPE_CONFIG[f.type] || {
              label: f.type,
              iconBg: "bg-slate-100 text-slate-600",
              textColor: "text-slate-700",
              icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
              bgGradient: "from-slate-50 to-slate-50",
              borderColor: "border-slate-200",
            };

            const dealValue = quote
              ? quote.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0)
              : 0;

            return (
              <div
                key={i}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-gradient-to-r hover:${config.bgGradient} animate-slide-up`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={config.icon} />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${config.textColor}`}>
                        {config.label}
                      </span>
                      <SeverityBadge severity={f.severity} />
                      {f.severity === "high" && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> URGENT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/workspace/quotations/${f.quotationId}`}
                        className="font-bold text-slate-900 hover:text-brand-600 transition-colors text-base"
                      >
                        {customer?.name || "Unknown Account"}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        {f.quotationId}
                      </span>
                      {rep && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Rep: {rep.name}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{f.message}</p>

                    {/* Inline deal value & days since activity */}
                    {quote && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-500">
                          Deal value:{" "}
                          <span className="font-bold text-slate-800">${Math.round(dealValue).toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          Last active:{" "}
                          <span className="font-bold text-slate-800">
                            {Math.round((Date.now() - new Date(quote.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Link
                    href={`/workspace/quotations/${f.quotationId}`}
                    className="btn btn-outline text-xs hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 whitespace-nowrap"
                  >
                    Open Deal →
                  </Link>
                  <form action={triggerNudgeAction.bind(null, f.quotationId)}>
                    <button
                      type="submit"
                      className="btn btn-primary text-xs whitespace-nowrap"
                      title="Send automated nudge to the rep"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span>Nudge Rep</span>
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
