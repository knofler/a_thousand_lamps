/**
 * Seeds 3 sample story posts with images into MongoDB.
 * Run inside Docker:
 *   docker-compose exec app npx tsx scripts/seed-stories.ts
 * Against Atlas:
 *   docker-compose exec -e MONGODB_URI="<atlas-uri>" app npx tsx scripts/seed-stories.ts
 */

import { connectDB } from '../lib/mongodb';
import Post from '../lib/models/Post';

const STORIES = [
  {
    type: 'story' as const,
    title: 'Iftar for 200 Families in Sylhet',
    caption:
      'Every evening during Ramadan, our volunteers arrived before sunset. Hot rice, daal, and dates — enough for households that had nothing. The gratitude in their eyes said everything words could not.',
    imageUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
    embedUrl: 'https://www.facebook.com/566331855/posts/10162044664316856/',
    tags: ['ramadan'],
    isPublished: true,
    order: 100,
  },
  {
    type: 'story' as const,
    title: 'New Limbs, New Lives',
    caption:
      'Karim lost his leg in a factory accident three years ago. Last month, with your support, he received a prosthetic and walked out of the clinic on his own. He has not stopped walking since.',
    imageUrl:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80',
    embedUrl: 'https://www.facebook.com/566331855/posts/10162039903561856/',
    tags: ['limb-support'],
    isPublished: true,
    order: 101,
  },
  {
    type: 'story' as const,
    title: 'Eid Morning in Chittagong',
    caption:
      'Forty children woke up to new clothes for the first time this Eid. We watched them run to their parents holding the bags — small moments that remind us exactly why we do this work.',
    imageUrl:
      'https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?w=800&q=80',
    embedUrl: 'https://www.facebook.com/566331855/posts/10162035854171856/',
    tags: ['eid-gifts'],
    isPublished: true,
    order: 102,
  },
];

async function seed() {
  console.log('🌱 Connecting…');
  await connectDB();

  const existing = await Post.find({ type: 'story', title: { $exists: true } }).select('title').lean();
  const existingTitles = new Set(existing.map((p) => p.title));

  const toInsert = STORIES.filter((s) => !existingTitles.has(s.title));

  if (toInsert.length === 0) {
    console.log('✅ Sample stories already seeded.');
    process.exit(0);
  }

  await Post.insertMany(toInsert);
  console.log(`✅ Seeded ${toInsert.length} story posts.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
