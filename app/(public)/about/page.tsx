import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About' };

const VALUES = [
  ['🤝', 'Dignity',        'We serve with respect, never charity-shaming.'],
  ['📸', 'Transparency',   'Every donation is accounted for publicly.'],
  ['🌱', 'Sustainability', 'We focus on programs with lasting impact.'],
  ['❤️', 'Love',           'We are motivated by love, not obligation.'],
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Who We Are</p>
      <h1 className="font-serif text-4xl font-bold mb-8" style={{ color: 'var(--text)' }}>About Us</h1>

      <div className="space-y-5 text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
        <p>
          A Thousand Lamps is a volunteer-run charitable initiative based in Bangladesh.
          We believe that every act of generosity, no matter how small, creates a ripple
          that lights up countless lives.
        </p>
        <p>
          Founded by a group of friends and family members spread across the world, we
          pool our resources to deliver targeted, high-impact programs during Ramadan,
          Eid, and throughout the year.
        </p>
        <p>
          We operate with absolute transparency — every distribution is photographed and
          posted publicly. We take no admin fees. Every single taka goes directly to the
          people we serve.
        </p>
      </div>

      <div className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-6">
          Our Values
        </p>
        <ul className="space-y-4">
          {VALUES.map(([icon, title, desc]) => (
            <li
              key={title}
              className="flex gap-4 p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
                <span className="text-sm ml-2" style={{ color: 'var(--muted)' }}>— {desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
