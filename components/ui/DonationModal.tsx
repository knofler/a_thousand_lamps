'use client';

import { useEffect, useRef } from 'react';

const TIERS = [
  { amount: '1,000', desc: 'Feed a family for a day' },
  { amount: '3,000', desc: 'Sponsor an Eid gift pack' },
  { amount: '5,000', desc: 'Fund a limb-support kit' },
];

const METHODS = [
  { name: 'bKash',         emoji: '📱', detail: 'Send to: 01XXXXXXXXX\nReference: ATL' },
  { name: 'Nagad',         emoji: '📱', detail: 'Send to: 01XXXXXXXXX\nReference: ATL' },
  { name: 'Bank Transfer', emoji: '🏦', detail: 'Bank: Dutch-Bangla\nAcc: XXXXXXXX\nName: A Thousand Lamps' },
  { name: 'International', emoji: '🌍', detail: 'PayPal / Wise coming soon.\nContact us for details.' },
];

export default function DonationModal({ onClose }: { onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--text)' }}>
            🎉 Celebrate &amp; Give
          </h2>
          <button onClick={onClose} className="btn-ghost px-2 py-1 text-lg">✕</button>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TIERS.map((t) => (
            <div
              key={t.amount}
              className="border rounded-xl p-3 text-center cursor-pointer hover:border-amber-500/60 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="font-bold text-amber-500 text-sm">{t.amount} BDT</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{t.desc}</div>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="space-y-2">
          {METHODS.map((m) => (
            <details
              key={m.name}
              className="border rounded-xl p-3 cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
            >
              <summary
                className="font-medium text-sm flex items-center gap-2 select-none list-none"
                style={{ color: 'var(--text)' }}
              >
                <span>{m.emoji}</span> {m.name}
              </summary>
              <pre
                className="mt-2 text-xs whitespace-pre-wrap font-mono p-2 rounded-lg"
                style={{ backgroundColor: 'var(--elevated)', color: 'var(--muted)' }}
              >
                {m.detail}
              </pre>
            </details>
          ))}
        </div>

        <p className="text-xs text-center mt-5" style={{ color: 'var(--muted)' }}>
          Every contribution lights a lamp. Thank you. 🙏
        </p>
      </div>
    </div>
  );
}
