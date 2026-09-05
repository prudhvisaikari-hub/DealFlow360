import { loginAction } from "@/lib/actions";
import { readDB } from "@/lib/db";
import LoginForm from "@/components/LoginForm";

const FEATURES = [
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Autonomous Discount Governance", sub: "Blended risk scoring + multi-tier approval chains" },
  { icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5", label: "Multi-Warehouse Fulfillment", sub: "Greedy split routing & real-time backorder tracking" },
  { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", label: "Hybrid Subscription Billing", sub: "Milestone invoicing + calendar-accurate proration" },
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Real-Time Deal Health Radar", sub: "Anomaly detection + automated manager nudges" },
];

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const db = readDB();
  const demoUsers = db.users;

  return (
    <div className="min-h-screen relative flex bg-slate-950 overflow-hidden">
      {/* ── Decorative Blobs ── */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* ── LEFT PANEL — Value Proposition ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-12 py-12 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-extrabold text-base shadow-lg shadow-brand-500/30">
            DF
          </div>
          <div>
            <div className="font-black text-white text-xl tracking-tight">DealFlow<span className="text-brand-400">360</span></div>
            <div className="text-[11px] text-slate-400 font-medium">Odoo Hackathon 2026 — Enterprise CPQ</div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/60 border border-brand-700/50 text-brand-300 text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Self-Governing Sales Operations Platform
            </div>
            <h1 className="text-5xl font-black text-white leading-none tracking-tight mb-4">
              The CPQ Engine<br />
              that{" "}
              <span className="relative">
                <span className="text-gradient">thinks ahead.</span>
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full" />
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Autonomous multi-tier discount governance, intelligent warehouse routing, and real-time margin protection — without manual oversight.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600/30 to-indigo-600/20 border border-brand-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{f.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          {["46 Tests Passing", "22 Pages Live", "5 Personas"].map((badge) => (
            <span key={badge} className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-extrabold text-lg shadow-lg mx-auto mb-3">
              DF
            </div>
            <h1 className="text-2xl font-black text-white">DealFlow<span className="text-brand-400">360</span></h1>
            <p className="text-slate-400 text-sm mt-1">Autonomous Sales Operations</p>
          </div>

          <div className="space-y-3 mb-6">
            <h2 className="text-xl font-black text-white">Sign in to DealFlow360</h2>
            <p className="text-slate-400 text-sm">Use the quick-switch persona buttons to instantly demo any role.</p>
          </div>

          <LoginForm
            demoUsers={demoUsers}
            hasError={!!searchParams?.error}
            loginAction={loginAction}
          />
        </div>
      </div>
    </div>
  );
}
