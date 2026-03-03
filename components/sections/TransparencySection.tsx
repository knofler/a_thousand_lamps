const STATS = [
  { value: '500+', label: 'Families Supported' },
  { value: '14',   label: 'Programs Run' },
  { value: '100%', label: 'Volunteer-Led' },
  { value: '3',    label: 'Years Active' },
];

const BADGES = [
  { icon: '📋', label: 'All spending posted publicly on Facebook' },
  { icon: '🤝', label: 'No admin fees — 100% goes to beneficiaries' },
  { icon: '📸', label: 'Photo evidence for every distribution' },
];

export default function TransparencySection() {
  return (
    <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">
          Accountability
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          Our Promise of Transparency
        </h2>
        <p className="text-sm mb-14" style={{ color: 'var(--muted)' }}>
          Every taka is accounted for. Every distribution is photographed.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-serif text-4xl font-bold text-amber-500 mb-1">{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
