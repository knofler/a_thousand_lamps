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
  embedUrl: string;
  tags?: string[];
  createdAt: string;
  index: number;
  wide?: boolean;
}

export default function DispatchEmbed({ embedUrl, tags, createdAt, index, wide = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const num = String(index + 1).padStart(2, '0');

  useEffect(() => {
    if (window.FB?.XFBML) {
      window.FB.XFBML.parse(containerRef.current ?? undefined);
    } else {
      const prev = window.fbAsyncInit;
      window.fbAsyncInit = () => {
        prev?.();
        window.FB?.XFBML?.parse(containerRef.current ?? undefined);
      };
    }
  }, [embedUrl]);

  return (
    <article
      ref={containerRef}
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* Dispatch header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
            Dispatch {num}
          </span>
          {tags?.[0] && (
            <>
              <span className="text-amber-500/30">·</span>
              <span
                className="text-xs capitalize px-2 py-0.5 rounded-full border"
                style={{ borderColor: 'rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.7)' }}
              >
                {tags[0]}
              </span>
            </>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {relativeTime(createdAt)}
        </span>
      </div>

      {/* Facebook embed */}
      <div className="flex justify-center p-4 bg-white">
        <div
          className="fb-post"
          data-href={embedUrl}
          data-width={wide ? '680' : '480'}
          data-show-text="true"
        />
      </div>

      {/* Footer link */}
      <div className="px-5 py-3 flex justify-end border-t" style={{ borderColor: 'var(--border)' }}>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
        >
          View on Facebook ↗
        </a>
      </div>
    </article>
  );
}
