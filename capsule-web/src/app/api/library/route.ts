import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
    include: { videos: true },
    orderBy: { createdAt: 'asc' },
  });

  const videos = await prisma.video.findMany({
    where: { userId: user.id, folderId: null },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ folders, videos });
}