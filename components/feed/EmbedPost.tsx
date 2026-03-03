'use client';

import { useEffect, useRef } from 'react';

interface Props {
  embedUrl: string;
  embedType: 'facebook' | 'instagram';
  caption?: string;
}

// Extend window for FB and Instagram SDK globals
declare global {
  interface Window {
    FB?: { XFBML?: { parse: (el?: HTMLElement) => void } };
    instgrm?: { Embeds?: { process: () => void } };
  }
}

export default function EmbedPost({ embedUrl, embedType, caption }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // After the embed markup is mounted, trigger the SDK to parse it.
    // The SDKs are loaded globally in app/layout.tsx.
    if (embedType === 'facebook') {
      window.FB?.XFBML?.parse(containerRef.current ?? undefined);
    } else {
      window.instgrm?.Embeds?.process();
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
            data-width="500"
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
        <p className="px-4 pt-2 pb-1 text-sm text-lamp-dark leading-relaxed">{caption}</p>
      )}
    </div>
  );
}
