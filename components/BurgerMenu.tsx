"use client";

import { useState } from "react";
import Link from "next/link";

export default function BurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="p-2 rounded-md hover:bg-slate-200 transition-colors"
      >
        <svg
          className="w-6 h-6 text-slate-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-8 w-11/12 max-w-md shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
            <nav className="flex flex-col gap-4 text-center">
              <Link href="/workspace/quotations" className="text-lg font-medium text-slate-800 hover:text-brand-600" onClick={() => setOpen(false)}>
                Quotations
              </Link>
              <Link href="/workspace/quotations?view=pipeline" className="text-lg font-medium text-slate-800 hover:text-brand-600" onClick={() => setOpen(false)}>
                Pipeline
              </Link>
              <Link href="/workspace/approvals" className="text-lg font-medium text-slate-800 hover:text-brand-600" onClick={() => setOpen(false)}>
                Approvals
              </Link>
              <Link href="/workspace/fulfillment" className="text-lg font-medium text-slate-800 hover:text-brand-600" onClick={() => setOpen(false)}>
                Fulfillment
              </Link>
              <Link href="/workspace/billing" className="text-lg font-medium text-slate-800 hover:text-brand-600" onClick={() => setOpen(false)}>
                Billing
              </Link>
              <Link href="/workspace/dashboard" className="text-lg font-medium text-slate-800 hover:text-brand-600" onClick={() => setOpen(false)}>
                Deal Health
              </Link>
              <Link href="/workspace/reports" className="text-lg font-medium text-slate-800 hover:text-brand-600" onClick={() => setOpen(false)}>
                Reports
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
