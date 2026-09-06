"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") setDark(true);
    else if (stored === "light") setDark(false);
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefersDark);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setDark(!dark)}
      className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      {dark ? (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0L6.64 5.22a1 1 0 11-1.42 1.42L4.22 5.64a1 1 0 010-1.42zM2 10a1 1 0 011-1h2a1 1 0 110 2H3a1 1 0 01-1-1zm8 5a5 5 0 100-10 5 5 0 000 10zM15 10a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-1.36 4.64a1 1 0 010 1.42l-1.42 1.42a1 1 0 11-1.42-1.42l1.42-1.42a1 1 0 011.42 0zM10 16a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM5.64 15.78a1 1 0 011.42 0l1.02 1.02a1 1 0 11-1.42 1.42L5.64 17.2a1 1 0 010-1.42z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 000 16 8 8 0 010-16zM9 4a6 6 0 010 12A6 6 0 019 4z" />
        </svg>
      )}
    </button>
  );
}
