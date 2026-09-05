import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions";

export default function BackendLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "sales_manager"].includes(user.role)) redirect("/workspace");

  const nav = [
    {
      href: "/backend",
      label: "Overview & Health",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      href: "/backend/products",
      label: "Products & Price Lists",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      href: "/backend/discounts",
      label: "Discount Tiers & Rules",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      href: "/backend/warehouses",
      label: "Warehouses & Stock",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
    {
      href: "/backend/subscriptions",
      label: "Subscription Plans",
      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    },
    {
      href: "/backend/upsell",
      label: "Upsell Engine Rules",
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    },
    {
      href: "/backend/customers",
      label: "Customers & Accounts",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              DF
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-none block">
                Administrative Control Panel
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Platform Rules &amp; Price Governance</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className="btn btn-secondary text-xs py-1.5 px-3 hover:bg-slate-200"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Workspace</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="btn btn-outline text-xs py-1.5 px-3 text-slate-600 hover:text-rose-600 hover:border-rose-200"
              >
                Close Workspace
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 animate-fade-in">
        <nav className="w-full md:w-64 flex-shrink-0 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
            Configuration Modules
          </span>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white hover:text-brand-600 hover:shadow-2xs border border-transparent hover:border-slate-200/60 transition-all"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={n.icon} />
              </svg>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
