"use client";

import { useState } from "react";
import Link from "next/link";

export default function MenuOverlay() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMenuOpen(true)}
        className="p-2 rounded-md hover:bg-slate-200 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {menuOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex flex-col items-center justify-center z-50">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 text-white text-3xl"
            aria-label="Close menu"
          >
            ✕
          </button>
          <nav className="flex flex-col gap-6 text-center">
            <Link href="/workspace/quotations" className="text-2xl font-bold text-white hover:underline" onClick={() => setMenuOpen(false)}>Quotations</Link>
            <Link href="/workspace/quotations?view=pipeline" className="text-2xl font-bold text-white hover:underline" onClick={() => setMenuOpen(false)}>Pipeline</Link>
            <Link href="/workspace/approvals" className="text-2xl font-bold text-white hover:underline" onClick={() => setMenuOpen(false)}>Approvals</Link>
            <Link href="/workspace/fulfillment" className="text-2xl font-bold text-white hover:underline" onClick={() => setMenuOpen(false)}>Fulfillment</Link>
            <Link href="/workspace/billing" className="text-2xl font-bold text-white hover:underline" onClick={() => setMenuOpen(false)}>Billing</Link>
            <Link href="/workspace/dashboard" className="text-2xl font-bold text-white hover:underline" onClick={() => setMenuOpen(false)}>Deal Health</Link>
            <Link href="/workspace/reports" className="text-2xl font-bold text-white hover:underline" onClick={() => setMenuOpen(false)}>Reports</Link>
          </nav>
        </div>
      )}
    </>
  );
}
