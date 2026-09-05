import Link from "next/link";
import { signupAction } from "@/lib/actions";

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-slate-950 overflow-hidden">
      {/* Background Decorative Mesh Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b15_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-extrabold text-base shadow-glow-brand shadow-brand-500/30">
              DF
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">DealFlow<span className="text-brand-400">360</span></span>
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Create Account</h1>
          <p className="text-slate-400 text-xs mt-1">Join the self-governing sales operations platform</p>
        </div>

        <form action={signupAction} className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white shadow-2xl space-y-4">
          {searchParams?.error === "exists" && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              An account with this email address already exists.
            </div>
          )}
          {searchParams?.error === "missing" && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              Please complete all required fields.
            </div>
          )}

          <div>
            <label className="label">Full Name</label>
            <input name="name" type="text" className="input" placeholder="e.g. Maya Chen" required />
          </div>

          <div>
            <label className="label">Work Email</label>
            <input name="email" type="email" className="input" placeholder="you@dealflow360.com" required />
          </div>

          <div>
            <label className="label">Password</label>
            <input name="password" type="password" className="input" placeholder="••••••••" required />
          </div>

          <div>
            <label className="label">Account Role</label>
            <select name="role" className="input text-xs py-2 font-medium" defaultValue="sales_rep">
              <option value="sales_rep">Sales Representative (Build quotes, upsells)</option>
              <option value="sales_manager">Sales Manager (1st-tier quote approvals)</option>
              <option value="finance">Finance Operations (2nd-tier approvals, fulfillment)</option>
              <option value="customer">Corporate Customer (Negotiation portal)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-gradient w-full py-3 text-sm shadow-md mt-2">
            Create Account &amp; Access Workspace
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Already registered? </span>
            <Link href="/login" className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
