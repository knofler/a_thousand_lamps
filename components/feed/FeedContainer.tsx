'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import PostCard from './PostCard';

interface Post {
  _id: string;
  type: 'photo' | 'embed' | 'story' | 'program';
  title?: string;
  caption?: string;
  imageUrl?: string;
  embedUrl?: string;
  embedType?: 'facebook' | 'instagram';
  tags?: string[];
  program?: string;
  likes: number;
  createdAt: string;
}

function SkeletonCard() {
  return (
    <div className="post-card p-4 space-y-3">
      <div className="skeleton h-3 w-1/4 rounded" />
      <div className="skeleton h-52 w-full rounded-xl" />
      <div className="skeleton h-3 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}

export default function FeedContainer({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/posts?page=${nextPage}&limit=10`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  useEffect(() => { if (inView) loadMore(); }, [inView, loadMore]);

  return (
    <section className="px-4 pb-20">
      <div className="flex flex-col items-center">
        {posts.map((post) => <PostCard key={post._id} post={post} />)}
      </div>

      {loading && (
        <div className="flex flex-col items-center">
          {[1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-10" />}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-sm py-10" style={{ color: 'var(--muted)' }}>
          🪔 You've seen all the light. Thank you for being here.
        </p>
      )}
    </section>
  );
}
