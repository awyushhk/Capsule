import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, folderId } = await req.json();

  const video = await prisma.video.findFirst({ where: { id, userId: user.id } });
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.video.update({
    where: { id },
    data: { folderId: folderId ?? null },
  });

  return NextResponse.json(updated);
}