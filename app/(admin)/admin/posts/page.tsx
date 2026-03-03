'use client';

import { useState, useEffect } from 'react';
import { relativeTime } from '@/lib/utils';

interface Post {
  _id: string;
  type: string;
  caption?: string;
  title?: string;
  embedUrl?: string;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  async function fetchPosts(p = 1) {
    setLoading(true);
    const token = sessionStorage.getItem('atl_admin_token') ?? '';
    try {
      const res = await fetch(`/api/posts?page=${p}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (p === 1) setPosts(data.posts);
      else setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.pagination.hasMore);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPosts(1); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    const token = sessionStorage.getItem('atl_admin_token') ?? '';
    await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  async function togglePublished(post: Post) {
    const token = sessionStorage.getItem('atl_admin_token') ?? '';
    const res = await fetch(`/api/posts/${post._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isPublished: !post.isPublished }),
    });
    const updated = await res.json();
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>Manage Posts</h1>

      {loading && posts.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post._id}
            className="rounded-xl border p-4 flex items-start gap-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <span
              className="text-xs px-2 py-1 rounded-full border flex-shrink-0"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              {post.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {post.caption ?? post.title ?? post.embedUrl ?? '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {relativeTime(post.createdAt)} · {post.tags.join(', ')}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => togglePublished(post)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  post.isPublished ? 'border-green-500/30 text-green-400' : 'text-zinc-500 border-zinc-700'
                }`}
              >
                {post.isPublished ? 'Live' : 'Draft'}
              </button>
              <button
                onClick={() => handleDelete(post._id)}
                className="text-xs px-3 py-1 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => fetchPosts(page + 1)}
          disabled={loading}
          className="btn-ghost mt-6 w-full text-center"
        >
          {loading ? 'Loading…' : 'Load More'}
        </button>
      )}
    </div>
  );
}
