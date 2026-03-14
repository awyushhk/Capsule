import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name } = await req.json();

  const folder = await prisma.folder.findFirst({ where: { id, userId: user.id } });
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.folder.update({ where: { id }, data: { name } });
  return NextResponse.json(updated);
}