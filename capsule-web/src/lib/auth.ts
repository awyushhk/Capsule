import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export async function getOrCreateUser() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  let user = await prisma.user.findUnique({ where: { clerkUserId } });

  if (!user) {
    user = await prisma.user.create({ data: { clerkUserId } });
  }

  return user;
}