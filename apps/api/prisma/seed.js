import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoPasswordHash = await bcrypt.hash('Demo1234!', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@teamhub.app' },
    update: {
      displayName: 'Demo Admin',
      passwordHash: demoPasswordHash,
    },
    create: {
      email: 'demo@teamhub.app',
      displayName: 'Demo Admin',
      passwordHash: demoPasswordHash,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@teamhub.app' },
    update: {
      displayName: 'Teammate Member',
      passwordHash: demoPasswordHash,
    },
    create: {
      email: 'member@teamhub.app',
      displayName: 'Teammate Member',
      passwordHash: demoPasswordHash,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace-id' },
    update: {
      name: 'Product Launch',
      description: 'Demo workspace for the Fredo Cloud assessment.',
      accentColor: '#0f766e',
    },
    create: {
      id: 'demo-workspace-id',
      name: 'Product Launch',
      description: 'Demo workspace for the Fredo Cloud assessment.',
      accentColor: '#0f766e',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: demoUser.id,
        workspaceId: workspace.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      userId: demoUser.id,
      workspaceId: workspace.id,
      role: 'ADMIN',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: memberUser.id,
        workspaceId: workspace.id,
      },
    },
    update: { role: 'MEMBER' },
    create: {
      userId: memberUser.id,
      workspaceId: workspace.id,
      role: 'MEMBER',
    },
  });

  const goal = await prisma.goal.upsert({
    where: { id: 'demo-goal-id' },
    update: {
      title: 'Launch the collaboration workspace MVP',
      description: 'Ship the first production-ready release with auth, RBAC, and live updates.',
      workspaceId: workspace.id,
      ownerId: demoUser.id,
    },
    create: {
      id: 'demo-goal-id',
      title: 'Launch the collaboration workspace MVP',
      description: 'Ship the first production-ready release with auth, RBAC, and live updates.',
      workspaceId: workspace.id,
      ownerId: demoUser.id,
    },
  });

  await prisma.milestone.upsert({
    where: { id: 'demo-milestone-id' },
    update: {
      goalId: goal.id,
      title: 'Finish Day 1 foundation',
      progress: 70,
    },
    create: {
      id: 'demo-milestone-id',
      goalId: goal.id,
      title: 'Finish Day 1 foundation',
      progress: 70,
    },
  });

  await prisma.actionItem.upsert({
    where: { id: 'demo-action-item-id' },
    update: {
      workspaceId: workspace.id,
      goalId: goal.id,
      assigneeId: memberUser.id,
      title: 'Wire optimistic store patterns',
      description: 'Prepare shared client stores for goals and action items.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
    create: {
      id: 'demo-action-item-id',
      workspaceId: workspace.id,
      goalId: goal.id,
      assigneeId: memberUser.id,
      title: 'Wire optimistic store patterns',
      description: 'Prepare shared client stores for goals and action items.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
  });

  await prisma.goalUpdate.upsert({
    where: { id: 'demo-goal-update-id' },
    update: {
      goalId: goal.id,
      authorId: demoUser.id,
      content: 'Initial monorepo foundation is in place and ready for feature work.',
    },
    create: {
      id: 'demo-goal-update-id',
      goalId: goal.id,
      authorId: demoUser.id,
      content: 'Initial monorepo foundation is in place and ready for feature work.',
    },
  });

  const announcement = await prisma.announcement.upsert({
    where: { id: 'demo-announcement-id' },
    update: {
      workspaceId: workspace.id,
      authorId: demoUser.id,
      title: 'Kickoff',
      contentHtml: '<p>Welcome to Team Hub. This workspace is preloaded with sample data.</p>',
      pinned: true,
    },
    create: {
      id: 'demo-announcement-id',
      workspaceId: workspace.id,
      authorId: demoUser.id,
      title: 'Kickoff',
      contentHtml: '<p>Welcome to Team Hub. This workspace is preloaded with sample data.</p>',
      pinned: true,
    },
  });

  const comment = await prisma.comment.upsert({
    where: { id: 'demo-comment-id' },
    update: {
      announcementId: announcement.id,
      authorId: memberUser.id,
      content: `Great start, @[${demoUser.displayName}](${demoUser.id})`,
    },
    create: {
      id: 'demo-comment-id',
      announcementId: announcement.id,
      authorId: memberUser.id,
      content: `Great start, @[${demoUser.displayName}](${demoUser.id})`,
    },
  });

  await prisma.mention.upsert({
    where: { id: 'demo-mention-id' },
    update: {
      commentId: comment.id,
      userId: demoUser.id,
    },
    create: {
      id: 'demo-mention-id',
      commentId: comment.id,
      userId: demoUser.id,
    },
  });

  await prisma.notification.upsert({
    where: { id: 'demo-notification-id' },
    update: {
      userId: demoUser.id,
      type: 'MENTION',
      title: `${memberUser.displayName} mentioned you`,
      body: 'Great start on the workspace foundation.',
      link: `/demo-workspace-id/announcements`,
    },
    create: {
      id: 'demo-notification-id',
      userId: demoUser.id,
      type: 'MENTION',
      title: `${memberUser.displayName} mentioned you`,
      body: 'Great start on the workspace foundation.',
      link: `/demo-workspace-id/announcements`,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
