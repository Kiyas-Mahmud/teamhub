import { NotFoundError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  avatarPublicId: true,
  createdAt: true,
  updatedAt: true,
};

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateProfile(userId, patch) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl || null } : {}),
      ...(patch.avatarPublicId !== undefined
        ? { avatarPublicId: patch.avatarPublicId || null }
        : {}),
    },
    select: userSelect,
  });
}
