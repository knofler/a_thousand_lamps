import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { isAdminAuthorized } from '@/lib/auth';
import { detectEmbedType } from '@/lib/utils';

// POST /api/embeds — saves a Facebook or Instagram URL as a new Post
export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { embedUrl, caption, tags, program } = await request.json();

    if (!embedUrl) {
      return NextResponse.json({ error: 'embedUrl is required' }, { status: 400 });
    }

    const embedType = detectEmbedType(embedUrl);
    if (!embedType) {
      return NextResponse.json(
        { error: 'URL must be from facebook.com or instagram.com' },
        { status: 400 }
      );
    }

    const post = await Post.create({
      type: 'embed',
      embedUrl,
      embedType,
      caption,
      tags: tags ?? [],
      program,
      isPublished: true,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('POST /api/embeds error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
