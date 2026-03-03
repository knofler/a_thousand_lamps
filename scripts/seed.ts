/**
 * Seed script — populates MongoDB with the 14 pre-known Facebook posts.
 * Run inside the Docker container:
 *   docker-compose exec app npx tsx scripts/seed.ts
 * Or from host if MongoDB is port-forwarded:
 *   MONGODB_URI=mongodb://localhost:27017/athousandlamps npx tsx scripts/seed.ts
 */

import { connectDB } from '../lib/mongodb';
import Post from '../lib/models/Post';

const FACEBOOK_POSTS = [
  'https://www.facebook.com/566331855/posts/10162044664316856/',
  'https://www.facebook.com/566331855/posts/10162039903561856/',
  'https://www.facebook.com/566331855/posts/10162035854171856/',
  'https://www.facebook.com/566331855/posts/10162035632001856/',
  'https://www.facebook.com/566331855/posts/10162028874891856/',
  'https://www.facebook.com/566331855/posts/10162024289666856/',
  'https://www.facebook.com/ruhan78/videos/932883306344048/',
  'https://www.facebook.com/566331855/posts/10162012927771856/',
  'https://www.facebook.com/566331855/posts/10162011143416856/',
  'https://www.facebook.com/566331855/posts/10162004948141856/',
  'https://www.facebook.com/566331855/posts/10162003527351856/',
  'https://www.facebook.com/share/v/1aaYSi2og9/',
  'https://www.facebook.com/566331855/posts/10161955658831856/',
  'https://www.facebook.com/share/1DZoDEs1jx/',
];

async function seed() {
  console.log('🌱 Connecting to MongoDB…');
  await connectDB();

  // Avoid duplicate seeds — only insert URLs not already in the DB
  const existing = await Post.find({ type: 'embed', embedType: 'facebook' }).select('embedUrl').lean();
  const existingUrls = new Set(existing.map((p) => p.embedUrl));

  const toInsert = FACEBOOK_POSTS.filter((url) => !existingUrls.has(url));

  if (toInsert.length === 0) {
    console.log('✅ All posts already seeded — nothing to do.');
    process.exit(0);
  }

  const docs = toInsert.map((url, i) => ({
    type: 'embed' as const,
    embedType: 'facebook' as const,
    embedUrl: url,
    isPublished: true,
    tags: ['activity'],
    // Order so they appear newest-first in the feed (lower = higher priority)
    order: i,
  }));

  await Post.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} Facebook posts.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
