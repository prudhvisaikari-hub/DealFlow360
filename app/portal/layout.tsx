import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "customer") redirect("/workspace");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              DF
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-none text-base tracking-tight group-hover:text-brand-600 transition-colors">
                Customer Portal
              </span>
              <span className="text-[10px] text-slate-400 font-medium">DealFlow360 Quotation Review</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs mr-1">
              <div className="font-semibold text-slate-800">{user.name}</div>
              <span className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider">Authorized Buyer</span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn btn-outline text-xs py-1.5 px-3 text-slate-600 hover:text-rose-600 hover:border-rose-200"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 animate-fade-in">{children}</main>
    </div>
  );
}
