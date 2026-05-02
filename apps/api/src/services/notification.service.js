import { prisma } from '../lib/prisma.js';

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  link: true,
  read: true,
  createdAt: true,
};

export async function createNotification(input) {
  return prisma.notification.create({
    data: input,
    select: notificationSelect,
  });
}

export async function listNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    select: notificationSelect,
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });
}

export async function markRead(userId, notificationId) {
  // Scope by userId so a user can never mark someone else's notification.
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
  return { updated: result.count };
}

export async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { updated: result.count };
}
