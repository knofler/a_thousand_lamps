'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [token, setToken] = useState('');
  const [total, setTotal] = useState<number | null>(null);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('atl_admin_token');
    if (stored) { setAuthed(true); fetchTotal(stored); }
    else setAuthed(false);
  }, []);

  async function fetchTotal(t: string) {
    try {
      const res = await fetch('/api/posts?limit=1', { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setTotal(data.pagination?.total ?? 0);
    } catch { /* non-critical */ }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      sessionStorage.setItem('atl_admin_token', token);
      setAuthed(true);
      fetchTotal(token);
    } else {
      setLoginError('Invalid token.');
    }
  }

  if (authed === null) return null;

  // ── Login form ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <form
          onSubmit={handleLogin}
          className="rounded-2xl border p-8 w-full max-w-sm space-y-5"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🪔</div>
            <h1 className="font-serif text-xl font-bold" style={{ color: 'var(--text)' }}>Admin Login</h1>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Admin Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input"
              placeholder="Enter your admin token"
              required
            />
          </div>
          {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
          <button type="submit" className="btn-primary w-full">Sign In</button>
        </form>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  const STATS = [
    { label: 'Total Posts', value: total ?? '—', icon: '📝' },
    { label: 'Published',   value: total ?? '—', icon: '✅' },
    { label: 'Drafts',      value: 0,             icon: '📋' },
    { label: 'Embeds',      value: '—',           icon: '🔗' },
  ];

  const ACTIONS = [
    { href: '/admin/upload', icon: '📷', label: 'Upload Photo', desc: 'Add a photo post to the feed' },
    { href: '/admin/embeds', icon: '🔗', label: 'Add Embed',    desc: 'Add a Facebook or Instagram post' },
    { href: '/admin/posts',  icon: '📝', label: 'Manage Posts', desc: 'Edit or delete existing posts' },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {STATS.map(({ label, value, icon }) => (
          <div
            key={label}
            className="rounded-2xl border p-5 text-center"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-3xl mb-1">{icon}</div>
            <div className="font-bold text-2xl text-amber-500">{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Quick Actions</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-2xl border p-5 hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-3xl mb-2">{action.icon}</div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{action.label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{action.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
