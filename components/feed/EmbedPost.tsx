'use client';

import { useEffect, useRef } from 'react';

interface Props {
  embedUrl: string;
  embedType: 'facebook' | 'instagram';
  caption?: string;
  wide?: boolean;
}

// Extend window for FB and Instagram SDK globals
declare global {
  interface Window {
    FB?: { XFBML?: { parse: (el?: HTMLElement) => void } };
    fbAsyncInit?: () => void;
    instgrm?: { Embeds?: { process: () => void } };
  }
}

export default function EmbedPost({ embedUrl, embedType, caption, wide = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedType === 'facebook') {
      if (window.FB?.XFBML) {
        // SDK already loaded — parse immediately
        window.FB.XFBML.parse(containerRef.current ?? undefined);
      } else {
        // SDK not yet loaded — hook into fbAsyncInit so we parse once it arrives
        const prev = window.fbAsyncInit;
        window.fbAsyncInit = () => {
          prev?.();
          window.FB?.XFBML?.parse(containerRef.current ?? undefined);
        };
      }
    } else {
      if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
    }
  }, [embedUrl, embedType]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      {embedType === 'facebook' ? (
        <div className="flex justify-center py-2">
          {/* Facebook JS SDK embed — parsed by FB.XFBML.parse() above */}
          <div
            className="fb-post"
            data-href={embedUrl}
            data-width={wide ? '750' : '400'}
            data-show-text="true"
          />
        </div>
      ) : (
        <div className="flex justify-center py-2">
          {/* Instagram oEmbed — processed by instgrm.Embeds.process() above */}
          <blockquote
            className="instagram-media"
            data-instgrm-captioned
            data-instgrm-permalink={embedUrl}
            data-instgrm-version="14"
            style={{ maxWidth: '540px', width: '100%', margin: '0 auto' }}
          />
        </div>
      )}
      {caption && (
        <p className="px-4 pt-2 pb-1 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{caption}</p>
      )}
    </div>
  );
}
