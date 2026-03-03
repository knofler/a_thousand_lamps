import type { Metadata } from 'next';
import ComicStory from '@/components/sections/ComicStory';

export const metadata: Metadata = { title: 'Our Story' };

export default function StoryPage() {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">
          How It Started
        </p>
        <h1 className="font-serif text-4xl font-bold mb-6" style={{ color: 'var(--text)' }}>
          Our Story
        </h1>
        <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
          It started with a single WhatsApp message between friends. One person wanted
          to send iftar to a neighbour in Bangladesh. Another wanted to add to it.
          Then another. Before anyone realised, a hundred families were fed — from
          people scattered across three continents, united by one idea: that generosity
          has no borders.
        </p>
        <p className="leading-relaxed mt-4" style={{ color: 'var(--muted)' }}>
          That was the first lamp. This is what happened next.
        </p>
      </div>

      <ComicStory />

      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
          Today
        </p>
        <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
          Years later, we have run Ramadan meals, Eid gift distributions, limb-support
          programs, and large community events — all funded entirely by volunteers and
          donors who believe in what a small group of people can do together.
        </p>
        <p className="leading-relaxed mt-4" style={{ color: 'var(--muted)' }}>
          We are not a registered charity. We are a community of people who care —
          and we prove it with photographs, receipts, and the smiles of the people we serve.
        </p>
      </div>
    </div>
  );
}
