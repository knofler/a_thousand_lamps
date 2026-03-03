'use client';

import { useEffect, useRef } from 'react';
import { relativeTime } from '@/lib/utils';

declare global {
  interface Window {
    FB?: { XFBML?: { parse: (el?: HTMLElement) => void } };
    fbAsyncInit?: () => void;
  }
}

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
}

export default function HomeTeaserEmbed({ story }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (story.type !== 'embed' || !story.embedUrl) return;
    if (window.FB?.XFBML) {
      window.FB.XFBML.parse(containerRef.current ?? undefined);
    } else {
      const prev = window.fbAsyncInit;
      window.fbAsyncInit = () => {
        prev?.();
        window.FB?.XFBML?.parse(containerRef.current ?? undefined);
      };
    }
  }, [story.embedUrl, story.type]);

  // ── Embed post: render FB iframe ─────────────────────────
  if (story.type === 'embed' && story.embedUrl) {
    return (
      <article
        ref={containerRef}
        className="group rounded-2xl overflow-hidden flex flex-col"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Field Update
            </span>
            {story.tags?.[0] && (
              <span className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
                · {story.tags[0]}
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {relativeTime(story.createdAt)}
          </span>
        </div>

        {/* FB embed */}
        <div className="flex justify-center p-3 bg-white flex-1">
          <div
            className="fb-post w-full"
            data-href={story.embedUrl}
            data-width="360"
            data-show-text="true"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
          <a
            href={story.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
          >
            View on Facebook ↗
          </a>
        </div>
      </article>
    );
  }

  // ── Story post: editorial dark card ──────────────────────
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
          <p
            className="text-xs leading-relaxed mb-3"
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
