import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';
import { getYouTubeMetadata, extractVideoId } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, folderId, title, thumbnail, videoId: directVideoId } = await req.json();

  // Accept either a full URL or direct videoId + metadata
  let videoId = directVideoId;
  let videoTitle = title;
  let videoThumbnail = thumbnail;

  if (!videoId && url) {
    videoId = extractVideoId(url);
  }

  if (!videoId) return NextResponse.json({ error: 'Invalid video' }, { status: 400 });

  if (!videoTitle || !videoThumbnail) {
    const meta = await getYouTubeMetadata(videoId);
    videoTitle = videoTitle ?? meta.title;
    videoThumbnail = videoThumbnail ?? meta.thumbnail;
  }

  const video = await prisma.video.create({
    data: {
      videoId,
      title: videoTitle,
      thumbnail: videoThumbnail,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      folderId: folderId ?? null,
      userId: user.id,
    },
  });

  return NextResponse.json(video);
}