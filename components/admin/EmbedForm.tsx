'use client';

import { useState } from 'react';
import { detectEmbedType } from '@/lib/utils';

const AVAILABLE_TAGS = ['ramadan', 'eid', 'limb-support', 'mega-eid', 'activity'];

export default function EmbedForm() {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const detectedType = url ? detectEmbedType(url) : null;

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !detectedType) return;
    setStatus('loading');
    const token = sessionStorage.getItem('atl_admin_token') ?? '';
    try {
      const res = await fetch('/api/embeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ embedUrl: url, caption, tags: selectedTags }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setMessage('Embed saved!');
      setUrl(''); setCaption(''); setSelectedTags([]);
    } catch {
      setStatus('error');
      setMessage('Failed. Check your token.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
          Facebook or Instagram URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.facebook.com/..."
          className="input"
          required
        />
        {url && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
            Detected: {detectedType ?? '⚠️ Not a recognised URL'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Caption</label>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="input resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Tags</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'border-zinc-700 hover:border-amber-500/30'
              }`}
              style={selectedTags.includes(tag) ? {} : { color: 'var(--muted)' }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !detectedType}
        className="btn-primary disabled:opacity-40"
      >
        {status === 'loading' ? 'Saving…' : 'Save Embed'}
      </button>
    </form>
  );
}
