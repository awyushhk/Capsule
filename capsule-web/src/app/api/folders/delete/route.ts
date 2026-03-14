import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();

  const folder = await prisma.folder.findFirst({ where: { id, userId: user.id } });
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}