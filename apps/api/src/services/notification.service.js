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
