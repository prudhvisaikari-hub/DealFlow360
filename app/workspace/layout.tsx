
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction, resetDemoAction } from "@/lib/actions";
import BurgerMenu from "@/components/BurgerMenu";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  
  if (!user) redirect("/login");
  if (user.role === "customer") redirect("/portal");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    sales_manager: "bg-indigo-100 text-indigo-700 border-indigo-200",
    finance: "bg-emerald-100 text-emerald-700 border-emerald-200",
    sales_rep: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/workspace" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
                DF
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-none text-base tracking-tight group-hover:text-brand-600 transition-colors">
                  DealFlow<span className="text-brand-600">360</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Enterprise CPQ</span>
              </div>
            </Link>
            <BurgerMenu />

          </div>

          <div className="flex items-center gap-3">
            <form action={resetDemoAction}>
              <button
                type="submit"
                className="btn btn-outline text-xs py-1.5 px-3 hover:border-slate-300"
                title="Reload / reset demo data"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reload Data</span>
              </button>
            </form>

            {user.role === "admin" && (
              <Link href="/backend" className="btn btn-secondary text-xs py-1.5 px-3">
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Go to Back-end</span>
              </Link>
            )}

            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-inner">
                {initials}
              </div>
              <div className="text-right text-xs">
                <div className="font-semibold text-slate-800 leading-tight">{user.name}</div>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border capitalize ${roleColors[user.role] || "bg-slate-100 text-slate-600"}`}>
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="btn btn-outline text-xs py-1.5 px-3 text-slate-600 hover:text-rose-600 hover:border-rose-200"
                title="Sign out"
              >
                Close Workspace
              </button>
            </form>
          </div>
        </div>
      </header>


      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 animate-fade-in">{children}</main>
    </div>
  );
}
