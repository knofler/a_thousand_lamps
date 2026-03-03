'use client';

import { useState, useRef } from 'react';

const AVAILABLE_TAGS = ['ramadan', 'eid', 'limb-support', 'mega-eid', 'activity'];

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [program, setProgram] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus('uploading');
    const token = sessionStorage.getItem('atl_admin_token') ?? '';
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      const postRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'photo', imageUrl: url, caption, tags, program, isPublished: true }),
      });
      if (!postRes.ok) throw new Error('Post failed');

      setStatus('success');
      setMessage('Photo published!');
      setFile(null); setPreview(null); setCaption(''); setTags([]); setProgram('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors hover:border-amber-500/50"
        style={{ borderColor: 'var(--border)' }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="max-h-52 mx-auto rounded-xl object-contain" />
        ) : (
          <div style={{ color: 'var(--muted)' }}>
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm">Drag & drop or click to select</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Caption</label>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="input resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Program (optional)</label>
        <input type="text" value={program} onChange={(e) => setProgram(e.target.value)}
          placeholder="e.g. ramadan, eid-gifts" className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Tags</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                tags.includes(tag) ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'border-zinc-700'
              }`}
              style={tags.includes(tag) ? {} : { color: 'var(--muted)' }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}

      <button type="submit" disabled={!file || status === 'uploading'} className="btn-primary disabled:opacity-40">
        {status === 'uploading' ? 'Uploading…' : 'Publish Photo'}
      </button>
    </form>
  );
}
