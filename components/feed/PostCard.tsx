'use client';

import { useState } from 'react';
import { relativeTime } from '@/lib/utils';
import PhotoPost from './PhotoPost';
import EmbedPost from './EmbedPost';
import StoryPost from './StoryPost';

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

export default function PostCard({ post, wide = false }: { post: Post; wide?: boolean }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  function handleLike() {
    if (!liked) { setLikeCount((c) => c + 1); setLiked(true); }
  }

  const allTags = [...(post.program ? [post.program] : []), ...(post.tags ?? [])];

  return (
    <article className="post-card animate-fade-in">
      {/* Tags row */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {allTags.map((tag) => (
            <span key={tag} className="tag-badge">{tag}</span>
          ))}
        </div>
      )}

      {/* Content */}
      {post.type === 'photo' && post.imageUrl && (
        <PhotoPost imageUrl={post.imageUrl} caption={post.caption} title={post.title} />
      )}
      {post.type === 'embed' && post.embedUrl && post.embedType && (
        <EmbedPost embedUrl={post.embedUrl} embedType={post.embedType} caption={post.caption} wide={wide} />
      )}
      {(post.type === 'story' || post.type === 'program') && (
        <StoryPost title={post.title} caption={post.caption} imageUrl={post.imageUrl} tags={post.tags} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 text-xs border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        <span>{relativeTime(post.createdAt)}</span>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-400' : 'hover:text-red-400'}`}
        >
          {liked ? '❤️' : '🤍'} {likeCount > 0 && likeCount}
        </button>
      </div>
    </article>
  );
}
