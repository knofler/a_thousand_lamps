import { connectDB } from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import HeroSection from '@/components/sections/HeroSection';
import ProgramCard from '@/components/sections/ProgramCard';
import FeedContainer from '@/components/feed/FeedContainer';
import ComicStory from '@/components/sections/ComicStory';
import TransparencySection from '@/components/sections/TransparencySection';

const PROGRAMS = [
  { slug: 'ramadan',     emoji: '🌙', title: 'Ramadan Meals',  description: 'Hot iftar and sehri meals for families who go without.' },
  { slug: 'eid-gifts',   emoji: '🎁', title: 'Eid Gifts',      description: 'New clothes and gifts for children who deserve to celebrate.' },
  { slug: 'mega-eid',    emoji: '🌟', title: 'Mega Eid',       description: 'Large-scale Eid distributions across multiple villages.' },
  { slug: 'limb-support',emoji: '🦾', title: 'Limb Support',   description: 'Prosthetics and mobility aids for people with disabilities.' },
];

async function getInitialPosts() {
  try {
    await connectDB();
    const posts = await Post.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(10)
      .lean();
    return JSON.parse(JSON.stringify(posts));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const initialPosts = await getInitialPosts();

  return (
    <>
      <HeroSection />

      {/* Programs strip */}
      <section className="py-12 px-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2 text-center">
            What We Do
          </p>
          <h2 className="font-serif text-2xl font-bold text-center mb-8" style={{ color: 'var(--text)' }}>
            Our Programs
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {PROGRAMS.map((p) => (
              <div key={p.slug} className="snap-start">
                <ProgramCard {...p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feed heading */}
      <section className="pt-10 pb-4 px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">
          Live Updates
        </p>
        <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--text)' }}>
          From the Field
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Real moments. Real impact.
        </p>
      </section>

      <FeedContainer initialPosts={initialPosts} />
      <ComicStory />
      <TransparencySection />
    </>
  );
}
