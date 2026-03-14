import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();

  const video = await prisma.video.findFirst({ where: { id, userId: user.id } });
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ success: true });
}