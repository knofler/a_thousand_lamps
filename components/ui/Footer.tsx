import Link from 'next/link';

const LINKS = {
  Explore: [
    { href: '/programs',     label: 'Programs' },
    { href: '/story',        label: 'Our Story' },
    { href: '/transparency', label: 'Transparency' },
    { href: '/about',        label: 'About' },
  ],
  Contribute: [
    { href: '/celebrate', label: '🎉 Celebrate & Give' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t mt-24" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="font-serif text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
            🪔 A Thousand Lamps
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Bringing light to lives in Bangladesh — one lamp at a time.
          </p>
        </div>

        {Object.entries(LINKS).map(([section, links]) => (
          <div key={section}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-amber-500">
              {section}
            </p>
            <ul className="space-y-2">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm link-muted"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="border-t px-4 py-5 text-center text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        © {new Date().getFullYear()} A Thousand Lamps. All rights reserved.
      </div>
    </footer>
  );
}
