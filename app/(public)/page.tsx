import Link from 'next/link';
import { connectDB } from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import HeroSection from '@/components/sections/HeroSection';
import ProgramCard from '@/components/sections/ProgramCard';
import TransparencySection from '@/components/sections/TransparencySection';
import HomeTeaserEmbed from '@/components/feed/HomeTeaserEmbed';

const PROGRAMS = [
  { slug: 'ramadan',      emoji: '🌙', title: 'Ramadan Meals',   description: 'Hot iftar and sehri meals for families who go without.' },
  { slug: 'eid-gifts',    emoji: '🎁', title: 'Eid Gifts',       description: 'New clothes and gifts for children who deserve to celebrate.' },
  { slug: 'mega-eid',     emoji: '🌟', title: 'Mega Eid',        description: 'Large-scale Eid distributions across multiple villages.' },
  { slug: 'limb-support', emoji: '🦾', title: 'Limb Support',    description: 'Prosthetics and mobility aids for people with disabilities.' },
];

interface StoryDoc {
  _id: string;
  type: string;
  title?: string;
  caption?: string;
  imageUrl?: string;
  embedUrl?: string;
  tags?: string[];
  createdAt: string;
}

async function getRecentStories(): Promise<StoryDoc[]> {
  try {
    await connectDB();
    // Prefer posts with an image — sort imageUrl descending puts set-fields first
    const posts = await Post.find({ isPublished: true, type: { $in: ['story', 'embed'] } })
      .sort({ imageUrl: -1, createdAt: -1 })
      .limit(3)
      .lean();
    return JSON.parse(JSON.stringify(posts));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const stories = await getRecentStories();

  return (
    <>
      <HeroSection />

      {/* ── Programs ── */}
      <section className="py-16 px-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2 text-center">
            What We Do
          </p>
          <h2 className="font-serif text-3xl font-bold text-center mb-10" style={{ color: 'var(--text)' }}>
            Our Programs
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {PROGRAMS.map((p) => (
              <div key={p.slug} className="snap-start">
                <ProgramCard {...p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stories from the field ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">
                Field Dispatches
              </p>
              <h2 className="font-serif text-3xl font-bold" style={{ color: 'var(--text)' }}>
                Stories from the Ground
              </h2>
            </div>
            <Link
              href="/post/story"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium link-muted hover:text-amber-500 transition-colors"
            >
              All dispatches <span>→</span>
            </Link>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <div className="text-4xl mb-3 opacity-20">🪔</div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Stories from the field are on their way.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {stories.map((story, i) => (
                <HomeTeaserEmbed key={story._id} story={story} index={i} />
              ))}
            </div>
          )}

          {/* Mobile CTA */}
          <div className="mt-8 text-center md:hidden">
            <Link href="/post/story" className="btn-ghost inline-flex items-center gap-2">
              All dispatches →
            </Link>
          </div>
        </div>
      </section>

      <TransparencySection />
    </>
  );
}

