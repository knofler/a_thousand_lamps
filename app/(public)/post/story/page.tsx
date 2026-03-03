import { connectDB } from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { relativeTime } from '@/lib/utils';
import DispatchEmbed from '@/components/feed/DispatchEmbed';

interface StoryPost {
  _id: string;
  type: 'story' | 'embed';
  title?: string;
  caption?: string;
  imageUrl?: string;
  embedUrl?: string;
  tags?: string[];
  createdAt: string;
}

async function getStories(): Promise<StoryPost[]> {
  try {
    await connectDB();
    // Include both hand-written stories (type:'story') and Facebook embed posts (type:'embed')
    const posts = await Post.find({ isPublished: true, type: { $in: ['story', 'embed'] } })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(posts));
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'Field Dispatches',
  description: 'Unfiltered stories from the ground in Bangladesh.',
};

export default async function StoriesPage() {
  const stories = await getStories();
  const [featured, ...rest] = stories;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Ambient glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,158,11,0.15) 0%, transparent 70%)',
        }} />
        {/* Decorative large text behind */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="font-serif font-bold select-none" style={{
            fontSize: 'clamp(8rem, 25vw, 22rem)',
            lineHeight: 1,
            color: 'rgba(245,158,11,0.03)',
            whiteSpace: 'nowrap',
          }}>
            FIELD
          </span>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-5">
            Field Dispatches
          </p>
          <h1 className="font-serif font-bold leading-none mb-6" style={{
            fontSize: 'clamp(2.8rem, 8vw, 6rem)',
            color: 'var(--text)',
          }}>
            Stories from<br />
            <em className="not-italic text-amber-500">the Ground</em>
          </h1>
          <p className="text-base md:text-lg leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
            Real accounts. Real people. Unfiltered dispatches from Bangladesh — because every story deserves to be told.
          </p>
          {stories.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-8 text-xs" style={{ color: 'var(--muted)' }}>
              <span className="w-8 h-px bg-amber-500/40" />
              <span>{stories.length} {stories.length === 1 ? 'dispatch' : 'dispatches'} on record</span>
              <span className="w-8 h-px bg-amber-500/40" />
            </div>
          )}
        </div>
      </section>

      {/* ── Stories ── */}
      <section className="max-w-5xl mx-auto px-4 pb-32 space-y-6">

        {stories.length === 0 && (
          <div className="text-center py-32">
            <div className="text-7xl mb-6 opacity-10">🪔</div>
            <p className="font-serif text-2xl mb-2" style={{ color: 'var(--text)' }}>
              Stories are being gathered.
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Check back soon — dispatches from the field are on their way.
            </p>
          </div>
        )}

        {/* Featured story — full width */}
        {featured && <FeaturedStory story={featured} index={0} />}

        {/* Remaining stories — 2-col grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rest.map((story, i) => (
              <StoryCard key={story._id} story={story} index={i + 1} />
            ))}
          </div>
        )}

      </section>
    </div>
  );
}

/* ── Featured story ─────────────────────────────────────── */
function FeaturedStory({ story, index }: { story: StoryPost; index: number }) {
  // Embed-type posts: render the actual FB embed, not the editorial card
  if (story.type === 'embed' && story.embedUrl) {
    return <DispatchEmbed embedUrl={story.embedUrl} tags={story.tags} createdAt={story.createdAt} index={index} wide />;
  }

  const num = String(index + 1).padStart(2, '0');
  return (
    <article
      className="relative rounded-3xl overflow-hidden min-h-[480px] flex flex-col justify-end"
      style={{
        background: story.imageUrl
          ? `linear-gradient(to top, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.55) 50%, rgba(9,9,11,0.15) 100%), url(${story.imageUrl}) center/cover`
          : 'linear-gradient(135deg, #18181B 0%, #0c0c0f 100%)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Top amber bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

      {/* Decorative number */}
      <span aria-hidden className="absolute bottom-0 right-8 font-serif font-bold select-none pointer-events-none" style={{
        fontSize: '14rem', lineHeight: 0.85,
        color: 'rgba(245,158,11,0.05)',
      }}>
        {num}
      </span>

      <div className="relative p-8 md:p-12">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
            Dispatch {num}
          </span>
          {story.tags?.[0] && (
            <>
              <span className="text-amber-500/30">·</span>
              <span className="text-xs capitalize px-2 py-0.5 rounded-full border" style={{
                borderColor: 'rgba(245,158,11,0.2)',
                color: 'rgba(245,158,11,0.7)',
              }}>
                {story.tags[0]}
              </span>
            </>
          )}
        </div>

        {story.title && (
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
            {story.title}
          </h2>
        )}

        {story.caption && (
          <p className="text-base md:text-lg leading-relaxed mb-8 max-w-2xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {story.caption.length > 320 ? story.caption.slice(0, 320) + '…' : story.caption}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          {story.embedUrl && (
            <a
              href={story.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Read Full Dispatch ↗
            </a>
          )}
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {relativeTime(story.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── Story card (grid) ──────────────────────────────────── */
function StoryCard({ story, index }: { story: StoryPost; index: number }) {
  // Embed-type posts: render the actual FB embed
  if (story.type === 'embed' && story.embedUrl) {
    return <DispatchEmbed embedUrl={story.embedUrl} tags={story.tags} createdAt={story.createdAt} index={index} />;
  }

  const num = String(index + 1).padStart(2, '0');
  return (
    <article
      className="group relative rounded-2xl overflow-hidden min-h-72 flex flex-col justify-end"
      style={{
        background: story.imageUrl
          ? `linear-gradient(to top, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.45) 60%, rgba(9,9,11,0.1) 100%), url(${story.imageUrl}) center/cover`
          : 'linear-gradient(135deg, #18181B 0%, #111113 100%)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Left accent — grows on hover */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-amber-500/20 group-hover:bg-amber-500/60 transition-colors duration-300" />

      {/* Decorative number */}
      <span aria-hidden className="absolute top-4 right-5 font-serif font-bold select-none pointer-events-none" style={{
        fontSize: '5.5rem', lineHeight: 1,
        color: 'rgba(245,158,11,0.06)',
      }}>
        {num}
      </span>

      <div className="relative p-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-3 block">
          Dispatch {num}
        </span>

        {story.title && (
          <h3 className="font-serif text-xl font-bold text-white leading-snug mb-2">
            {story.title}
          </h3>
        )}

        {story.caption && (
          <p className="text-sm leading-relaxed mb-4" style={{
            color: 'rgba(255,255,255,0.6)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
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
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              View ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
