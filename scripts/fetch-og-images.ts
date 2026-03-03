/**
 * Fetches og:image from each Facebook embed post and saves it as imageUrl.
 * Run inside Docker:
 *   docker-compose exec app npx tsx scripts/fetch-og-images.ts
 * Against Atlas:
 *   docker-compose run --rm -e MONGODB_URI="<atlas-uri>" app npx tsx scripts/fetch-og-images.ts
 */

import { connectDB } from '../lib/mongodb';
import Post from '../lib/models/Post';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Accept: 'text/html,application/xhtml+xml',
};

async function getOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/);
    if (match) return match[1].replace(/&amp;/g, '&');
    return null;
  } catch {
    return null;
  }
}

async function run() {
  console.log('🔗 Connecting…');
  await connectDB();

  const posts = await Post.find({
    type: 'embed',
    embedType: 'facebook',
    isPublished: true,
    $or: [{ imageUrl: { $exists: false } }, { imageUrl: null }, { imageUrl: '' }],
  })
    .select('_id embedUrl')
    .lean();

  console.log(`Found ${posts.length} embed posts without imageUrl`);

  let updated = 0;
  for (const post of posts) {
    if (!post.embedUrl) continue;
    process.stdout.write(`  Fetching ${post.embedUrl.slice(0, 60)}… `);
    const img = await getOgImage(post.embedUrl);
    if (img) {
      await Post.updateOne({ _id: post._id }, { $set: { imageUrl: img } });
      console.log('✓');
      updated++;
    } else {
      console.log('✗ (no og:image)');
    }
    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n✅ Updated ${updated} / ${posts.length} posts with real FB images.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
