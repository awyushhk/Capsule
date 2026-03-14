import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, parentId } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const folder = await prisma.folder.create({
    data: {
      name,
      parentId: parentId ?? null,
      userId: user.id,
    },
  });

  return NextResponse.json(folder);
}