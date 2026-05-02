import { deleteFile } from '../lib/cloudinary.js';
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
  // If the avatar is being replaced or cleared, capture the previous publicId
  // so we can delete the old asset on Cloudinary after the DB write succeeds.
  let previousPublicId = null;
  if (patch.avatarPublicId !== undefined || patch.avatarUrl !== undefined) {
    const previous = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });
    previousPublicId = previous?.avatarPublicId || null;
  }

  const user = await prisma.user.update({
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

  if (previousPublicId && previousPublicId !== user.avatarPublicId) {
    deleteFile(previousPublicId, { resourceType: 'image' }).catch(() => {});
  }

  return user;
}
