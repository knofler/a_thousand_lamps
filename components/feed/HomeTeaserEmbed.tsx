import Link from 'next/link';
import { relativeTime } from '@/lib/utils';

interface Props {
  story: {
    _id: string;
    type: string;
    title?: string;
    caption?: string;
    imageUrl?: string;
    embedUrl?: string;
    tags?: string[];
    createdAt: string;
  };
  index: number;
}

export default function HomeTeaserEmbed({ story, index }: Props) {
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
      {/* Left amber accent */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-amber-500/20 group-hover:bg-amber-500/70 transition-colors duration-300" />

      {/* Decorative number */}
      <span
        aria-hidden
        className="absolute top-4 right-4 font-serif font-bold select-none pointer-events-none"
        style={{ fontSize: '5rem', lineHeight: 1, color: 'rgba(245,158,11,0.06)' }}
      >
        {num}
      </span>

      <div className="relative p-6">
        {/* Dispatch label + tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
            Dispatch {num}
          </span>
          {story.tags?.[0] && (
            <>
              <span className="text-amber-500/30">·</span>
              <span
                className="text-xs capitalize px-2 py-0.5 rounded-full border"
                style={{ borderColor: 'rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.7)' }}
              >
                {story.tags[0]}
              </span>
            </>
          )}
        </div>

        {story.title ? (
          <h3 className="font-serif text-lg font-bold text-white leading-snug mb-2">
            {story.title}
          </h3>
        ) : (
          <h3 className="font-serif text-lg font-bold text-white leading-snug mb-2 opacity-40 italic">
            Field Update
          </h3>
        )}

        {story.caption && (
          <p
            className="text-xs leading-relaxed mb-4"
            style={{
              color: 'rgba(255,255,255,0.55)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {story.caption}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {relativeTime(story.createdAt)}
          </span>
          {story.embedUrl ? (
            <a
              href={story.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
            >
              View ↗
            </a>
          ) : (
            <Link
              href="/post/story"
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
            >
              Read ↗
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
