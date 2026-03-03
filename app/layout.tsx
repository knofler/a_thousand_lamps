import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'A Thousand Lamps',
    template: '%s — A Thousand Lamps',
  },
  description: 'A Bangladesh-based charitable initiative bringing light to lives in need.',
  openGraph: {
    title: 'A Thousand Lamps',
    description: 'A Bangladesh-based charitable initiative.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'A Thousand Lamps',
  },
};

// Inline script runs before React hydration — prevents flash of wrong theme
const themeScript = `
  (function() {
    var stored = localStorage.getItem('theme');
    var dark = stored !== 'light';
    if (dark) document.documentElement.classList.add('dark');
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div id="fb-root" />
        {children}

        {/* Facebook JS SDK — lazy, won't block render */}
        <Script
          src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />

        {/* Instagram oEmbed script — lazy */}
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
