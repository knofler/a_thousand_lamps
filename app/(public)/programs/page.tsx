import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Programs' };

const PROGRAMS = [
  { slug: 'ramadan',     emoji: '🌙', title: 'Ramadan Meals',  impact: 'Served 200+ families per Ramadan season.',
    description: 'Every Ramadan, we organise hot iftar and sehri meals for families living in extreme poverty. No one should break their fast hungry.' },
  { slug: 'eid-gifts',   emoji: '🎁', title: 'Eid Gifts',      impact: 'Distributed to 150+ children across 3 villages.',
    description: 'New clothes and gift packs for children during Eid ul-Fitr. Every child deserves to feel celebrated.' },
  { slug: 'mega-eid',    emoji: '🌟', title: 'Mega Eid',       impact: '500+ beneficiaries across multiple districts.',
    description: 'Our largest annual event — a large-scale Eid distribution combining food, clothes, and essential household items.' },
  { slug: 'limb-support',emoji: '🦾', title: 'Limb Support',   impact: '12 prosthetics funded to date.',
    description: 'We partner with rehabilitation organisations to provide prosthetics, wheelchairs, and mobility aids to people with disabilities.' },
];

export default function ProgramsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3 text-center">
        Impact Areas
      </p>
      <h1 className="font-serif text-4xl font-bold mb-2 text-center" style={{ color: 'var(--text)' }}>
        Our Programs
      </h1>
      <p className="text-center mb-14 text-sm" style={{ color: 'var(--muted)' }}>
        Targeted. Transparent. Impactful.
      </p>

      <div className="space-y-6">
        {PROGRAMS.map((program) => (
          <div
            key={program.slug}
            id={program.slug}
            className="rounded-2xl border p-6 flex gap-5"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-5xl flex-shrink-0">{program.emoji}</div>
            <div>
              <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                {program.title}
              </h2>
              <p className="leading-relaxed mb-3 text-sm" style={{ color: 'var(--muted)' }}>
                {program.description}
              </p>
              <span className="tag-badge">📊 {program.impact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
