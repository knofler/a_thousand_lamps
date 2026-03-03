/** Returns a human-readable relative date string (e.g. "3 days ago"). */
export function relativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Detect whether a URL is a Facebook or Instagram embed. */
export function detectEmbedType(url: string): 'facebook' | 'instagram' | null {
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('instagram.com')) return 'instagram';
  return null;
}

/** Tag colour map for badge rendering. */
export const TAG_COLORS: Record<string, string> = {
  ramadan: 'bg-green-100 text-green-800',
  eid: 'bg-yellow-100 text-yellow-800',
  'limb-support': 'bg-blue-100 text-blue-800',
  'mega-eid': 'bg-purple-100 text-purple-800',
  activity: 'bg-lamp-goldLight text-lamp-dark',
};

export function tagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
}
