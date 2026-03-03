import Link from 'next/link';
import { connectDB } from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import HeroSection from '@/components/sections/HeroSection';
import ProgramCard from '@/components/sections/ProgramCard';
import TransparencySection from '@/components/sections/TransparencySection';
import { relativeTime } from '@/lib/utils';

const PROGRAMS = [
  { slug: 'ramadan',      emoji: '🌙', title: 'Ramadan Meals',   description: 'Hot iftar and sehri meals for families who go without.' },
  { slug: 'eid-gifts',    emoji: '🎁', title: 'Eid Gifts',       description: 'New clothes and gifts for children who deserve to celebrate.' },
  { slug: 'mega-eid',     emoji: '🌟', title: 'Mega Eid',        description: 'Large-scale Eid distributions across multiple villages.' },
  { slug: 'limb-support', emoji: '🦾', title: 'Limb Support',    description: 'Prosthetics and mobility aids for people with disabilities.' },
];

async function getRecentStories() {
  try {
    await connectDB();
    const posts = await Post.find({ isPublished: true, type: 'story' })
      .sort({ createdAt: -1 })
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
              {stories.map((story: { _id: string; title?: string; caption?: string; imageUrl?: string; embedUrl?: string; createdAt: string }) => (
                <StoryTeaser key={story._id} story={story} />
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

function StoryTeaser({ story }: {
  story: { _id: string; title?: string; caption?: string; imageUrl?: string; embedUrl?: string; createdAt: string }
}) {
  return (
    <article
      className="group relative rounded-2xl overflow-hidden min-h-64 flex flex-col justify-end"
      style={{
        background: story.imageUrl
          ? `linear-gradient(to top, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.3) 70%), url(${story.imageUrl}) center/cover`
          : 'linear-gradient(135deg, #18181B 0%, #111113 100%)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-amber-500/20 group-hover:bg-amber-500 transition-colors duration-300" />

      <div className="relative p-5">
        {story.title && (
          <h3 className="font-serif text-lg font-bold text-white leading-snug mb-1.5">
            {story.title}
          </h3>
        )}
        {story.caption && (
          <p className="text-xs leading-relaxed mb-3" style={{
            color: 'rgba(255,255,255,0.55)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}>
            {story.caption}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {relativeTime(story.createdAt)}
          </span>
          {story.embedUrl && (
            <a
              href={story.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
            >
              View ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
