"use client";

import { useState } from "react";
import { User } from "@/lib/types";

interface LoginFormProps {
  demoUsers: User[];
  hasError?: boolean;
  loginAction: (formData: FormData) => Promise<void>;
}

export default function LoginForm({ demoUsers, hasError, loginAction }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo123");
  const [activeRole, setActiveRole] = useState<string | null>(null);

  function handleSelectPersona(user: User) {
    setEmail(user.email);
    setPassword("demo123");
    setActiveRole(user.id);
  }

  const roleBadges: Record<string, { label: string; color: string }> = {
    sales_rep: { label: "Sales Rep", color: "bg-blue-50 text-blue-700 border-blue-200" },
    sales_manager: { label: "Sales Manager", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    finance: { label: "Finance & Operations", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    admin: { label: "System Admin", color: "bg-purple-50 text-purple-700 border-purple-200" },
    customer: { label: "Customer Portal", color: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Persona Selector */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            ⚡ Quick-Switch Demo Persona
          </span>
          <span className="text-[11px] text-slate-400">Click to autofill</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {demoUsers.map((u) => {
            const isSelected = email.toLowerCase() === u.email.toLowerCase();
            const badge = roleBadges[u.role] || { label: u.role, color: "bg-slate-50 text-slate-700" };
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectPersona(u)}
                className={`text-left p-2.5 rounded-xl border transition-all duration-150 text-xs flex flex-col justify-between ${
                  isSelected
                    ? "bg-brand-600/30 border-brand-400 text-white shadow-glow-brand"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className="font-semibold truncate text-white">{u.name}</div>
                <div className="text-[10px] text-slate-400 truncate mb-1">{u.email}</div>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.color}`}>
                  {badge.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Login Form */}
      <form action={loginAction} className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white shadow-2xl space-y-4">
        {hasError && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>Invalid email or password. Please verify credentials.</span>
          </div>
        )}

        <div>
          <label className="label">Work Email</label>
          <div className="relative">
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="e.g. aditya@dealflow360.com"
              required
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
              placeholder="••••••••"
              required
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <button type="submit" className="btn btn-gradient w-full py-3 text-base shadow-lg shadow-brand-500/25">
          <span>Sign in to DealFlow360</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        <div className="pt-2 text-center space-y-1.5">
          <p className="text-xs text-slate-500">
            Demo account password: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-medium">demo123</code> (secured via bcrypt)
          </p>
          <div>
            <span className="text-xs text-slate-500">New sales representative or buyer? </span>
            <a href="/signup" className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline">
              Create an account
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
