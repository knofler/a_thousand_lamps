import type { Metadata } from 'next';
import TransparencySection from '@/components/sections/TransparencySection';

export const metadata: Metadata = { title: 'Transparency' };

const STEPS = [
  'Donations collected via bKash, Nagad, bank transfer, or international transfer.',
  'Every donation is acknowledged and logged.',
  'Funds are pooled and allocated to the active program.',
  'Distribution is carried out on the ground by trusted community members.',
  'Photos and spending breakdowns are posted to Facebook within 48 hours.',
];

export default function TransparencyPage() {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">
          Our Commitment
        </p>
        <h1 className="font-serif text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
          Transparency
        </h1>
        <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
          You have the right to know exactly how your donation is used.
          Every program is documented with photos, receipts, and a public post.
        </p>
      </div>

      <TransparencySection />

      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-6 text-center">
          The Process
        </p>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex gap-4 items-start rounded-xl p-4 border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <span className="bg-amber-500 text-zinc-950 font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--muted)' }}>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
