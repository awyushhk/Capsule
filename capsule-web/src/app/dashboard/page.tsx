import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';


export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect('/sign-in');

  const [folders, rootVideos] = await Promise.all([
    prisma.folder.findMany({
      where: { userId: user.id },
      include: { videos: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.video.findMany({
      where: { userId: user.id, folderId: null },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return <DashboardClient folders={folders} rootVideos={rootVideos} />;
}