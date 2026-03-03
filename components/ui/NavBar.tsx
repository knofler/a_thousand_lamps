'use client';

import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { href: '/programs',    label: 'Programs' },
  { href: '/post/story',  label: 'Stories' },
  { href: '/transparency',label: 'Transparency' },
  { href: '/about',       label: 'About' },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif font-bold text-base flex items-center gap-2 shrink-0"
          style={{ color: 'var(--text)' }}
        >
          🪔 <span>A Thousand Lamps</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium link-muted"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/celebrate"
            className="hidden md:inline-flex btn-primary text-sm py-1.5 px-4"
          >
            🎉 Celebrate
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden btn-ghost px-2.5 py-1.5 text-sm"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-4 flex flex-col gap-1 animate-fade-in"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/celebrate"
            onClick={() => setMenuOpen(false)}
            className="btn-primary mt-2 text-center text-sm"
          >
            🎉 Celebrate
          </Link>
        </div>
      )}
    </nav>
  );
}
