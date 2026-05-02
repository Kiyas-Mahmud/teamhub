import { prisma } from '../lib/prisma.js';

export async function getAnalytics(workspaceId) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const [totalGoals, completedGoals, totalActionItems, completedActionItems, overdueItems, recentDone] =
    await Promise.all([
      prisma.goal.count({
        where: { workspaceId },
      }),
      prisma.goal.count({
        where: { workspaceId, status: 'COMPLETED' },
      }),
      prisma.actionItem.count({
        where: { workspaceId },
      }),
      prisma.actionItem.count({
        where: { workspaceId, status: 'DONE' },
      }),
      prisma.actionItem.count({
        where: {
          workspaceId,
          status: {
            not: 'DONE',
          },
          dueDate: {
            lt: now,
          },
        },
      }),
      prisma.actionItem.findMany({
        where: {
          workspaceId,
          status: 'DONE',
          updatedAt: {
            gte: weekStart,
          },
        },
        select: {
          updatedAt: true,
        },
      }),
    ]);

  const dayBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      completed: 0,
    };
  });

  for (const item of recentDone) {
    const key = item.updatedAt.toISOString().slice(0, 10);
    const bucket = dayBuckets.find((entry) => entry.date === key);
    if (bucket) {
      bucket.completed += 1;
    }
  }

  return {
    totals: {
      totalGoals,
      completedGoals,
      totalActionItems,
      completedActionItems,
      overdueItems,
    },
    weeklyCompleted: dayBuckets,
  };
}

export async function exportAnalyticsCsv(workspaceId) {
  const analytics = await getAnalytics(workspaceId);
  const lines = [
    'metric,value',
    `totalGoals,${analytics.totals.totalGoals}`,
    `completedGoals,${analytics.totals.completedGoals}`,
    `totalActionItems,${analytics.totals.totalActionItems}`,
    `completedActionItems,${analytics.totals.completedActionItems}`,
    `overdueItems,${analytics.totals.overdueItems}`,
    '',
    'date,completedItems',
    ...analytics.weeklyCompleted.map((item) => `${item.date},${item.completed}`),
  ];

  return lines.join('\n');
}
