'use client';

import { useState, useEffect } from 'react';
import { relativeTime } from '@/lib/utils';

const AVAILABLE_TAGS = ['ramadan', 'eid', 'limb-support', 'mega-eid', 'activity'];

interface Story {
  _id: string;
  title?: string;
  caption?: string;
  embedUrl?: string;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
}

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  function token() { return sessionStorage.getItem('atl_admin_token') ?? ''; }

  async function fetchStories() {
    setLoading(true);
    try {
      const res = await fetch('/api/posts?type=story&limit=50', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setStories(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStories(); }, []);

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption && !title) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ type: 'story', title, caption, embedUrl: embedUrl || undefined, tags, isPublished: true }),
      });
      if (!res.ok) throw new Error();
      setMsgType('success');
      setMessage('Story published!');
      setTitle(''); setCaption(''); setEmbedUrl(''); setTags([]);
      fetchStories();
    } catch {
      setMsgType('error');
      setMessage('Failed to publish story.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this story?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    setStories((prev) => prev.filter((s) => s._id !== id));
  }

  async function togglePublished(story: Story) {
    const res = await fetch(`/api/posts/${story._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isPublished: !story.isPublished }),
    });
    const updated = await res.json();
    setStories((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>
        Field Dispatches
      </h1>

      {/* ── Add story form ── */}
      <div
        className="rounded-2xl border p-6 mb-10 max-w-2xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-5">
          New Dispatch
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
              Title <span style={{ color: 'var(--muted)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="He didn't walk back. He flew."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
              Story / Caption <span className="text-red-400">*</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              placeholder="Write the story here — or paste the Facebook post caption..."
              className="input resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
              Facebook Link <span style={{ color: 'var(--muted)' }}>(story or post URL)</span>
            </label>
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://www.facebook.com/..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Tags</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    tags.includes(tag)
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'border-zinc-700'
                  }`}
                  style={tags.includes(tag) ? {} : { color: 'var(--muted)' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <p className={`text-sm ${msgType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          <button type="submit" disabled={submitting || (!caption && !title)} className="btn-primary disabled:opacity-40">
            {submitting ? 'Publishing…' : 'Publish Dispatch'}
          </button>
        </form>
      </div>

      {/* ── Story list ── */}
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
        Published Dispatches
      </p>

      {loading && <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>}

      <div className="space-y-2 max-w-2xl">
        {stories.map((story) => (
          <div
            key={story._id}
            className="rounded-xl border p-4 flex items-start gap-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {story.title ?? story.caption?.slice(0, 80) ?? '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {relativeTime(story.createdAt)} · {story.tags.join(', ') || 'no tags'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => togglePublished(story)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  story.isPublished ? 'border-green-500/30 text-green-400' : 'text-zinc-500 border-zinc-700'
                }`}
              >
                {story.isPublished ? 'Live' : 'Draft'}
              </button>
              <button
                onClick={() => handleDelete(story._id)}
                className="text-xs px-3 py-1 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && stories.length === 0 && (
          <p className="text-sm py-4" style={{ color: 'var(--muted)' }}>
            No dispatches yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}
