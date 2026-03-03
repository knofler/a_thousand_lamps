'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // On mount, read preference from localStorage (dark is default)
    const stored = localStorage.getItem('theme');
    const prefersDark = stored !== 'light';
    setDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 flex items-center justify-center rounded-lg border
                 border-zinc-700 dark:border-zinc-700 text-zinc-400
                 hover:border-amber-500/50 hover:text-amber-500
                 transition-all duration-200 text-base"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
