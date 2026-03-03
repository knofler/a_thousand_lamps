import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Celebrate & Give' };

const TIERS = [
  { amount: '1,000', emoji: '🍽️', description: 'Feed a family for a day' },
  { amount: '3,000', emoji: '🎁', description: 'Sponsor an Eid gift pack' },
  { amount: '5,000', emoji: '🦾', description: 'Fund a limb-support kit' },
  { amount: 'Any',   emoji: '🌟', description: 'Every taka makes a difference' },
];

const METHODS = [
  { name: 'bKash',          emoji: '📱', steps: ['Open your bKash app', 'Send Money → 01XXXXXXXXX', 'Reference: A Thousand Lamps'] },
  { name: 'Nagad',          emoji: '📱', steps: ['Open your Nagad app', 'Send Money → 01XXXXXXXXX', 'Reference: ATL Donation'] },
  { name: 'Bank Transfer',  emoji: '🏦', steps: ['Bank: Dutch-Bangla Bank', 'Account: XXXXXXXXXXXXXXXX', 'Account Name: A Thousand Lamps'] },
  { name: 'International',  emoji: '🌍', steps: ['PayPal / Wise support coming soon.', 'Contact us directly to donate internationally.'] },
];

export default function CelebratePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="font-serif text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>
          Celebrate &amp; Give
        </h1>
        <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
          100% of your donation reaches people in need.<br />
          Choose an amount and payment method below.
        </p>
      </div>

      {/* Donation tiers */}
      <div className="grid grid-cols-2 gap-3 mb-12">
        {TIERS.map((tier) => (
          <div
            key={tier.amount}
            className="rounded-2xl p-5 text-center border cursor-pointer
                       hover:border-amber-500/60 hover:-translate-y-0.5
                       transition-all duration-200 group"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-3xl mb-2">{tier.emoji}</div>
            <div className="font-bold text-amber-500 text-lg group-hover:text-amber-400 transition-colors">
              {tier.amount} <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>BDT</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{tier.description}</div>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
        How to Send
      </p>
      <div className="space-y-3">
        {METHODS.map((method) => (
          <details
            key={method.name}
            className="rounded-2xl border overflow-hidden group cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <summary
              className="flex items-center gap-3 px-5 py-4 font-medium text-sm select-none list-none"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            >
              <span className="text-xl">{method.emoji}</span>
              <span>{method.name}</span>
              <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>▾</span>
            </summary>
            <ul className="px-5 py-4 space-y-2 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--elevated)' }}>
              {method.steps.map((step) => (
                <li key={step} className="flex gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                  <span className="text-amber-500">→</span> {step}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <p className="text-center text-xs mt-10" style={{ color: 'var(--muted)', opacity: 0.6 }}>
        🙏 JazakAllah Khair. Every lamp you light changes a life forever.
      </p>
    </div>
  );
}
