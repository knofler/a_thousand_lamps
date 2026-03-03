'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin',           label: 'Dashboard',     icon: '📊' },
  { href: '/admin/upload',    label: 'Upload Photo',  icon: '📷' },
  { href: '/admin/embeds',    label: 'Add Embed',     icon: '🔗' },
  { href: '/admin/stories',   label: 'Stories',       icon: '📖' },
  { href: '/admin/posts',     label: 'Manage Posts',  icon: '📝' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    sessionStorage.removeItem('atl_admin_token');
    router.push('/admin');
  }

  return (
    <nav
      className="border-r w-56 flex flex-col p-4 fixed top-0 left-0 min-h-screen"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <Link href="/" className="font-serif text-base font-bold mb-8 pt-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        🪔 ATL Admin
      </Link>

      <ul className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'border border-transparent hover:border-zinc-700'
                }`}
                style={active ? {} : { color: 'var(--muted)' }}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        onClick={handleLogout}
        className="text-xs px-3 py-2 text-left rounded-lg transition-colors hover:text-red-400 border border-transparent hover:border-red-400/20"
        style={{ color: 'var(--muted)' }}
      >
        ← Sign out
      </button>
    </nav>
  );
}
