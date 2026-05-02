import { emitToWorkspace } from '../sockets/index.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const userSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
};

const milestoneSelect = {
  id: true,
  goalId: true,
  title: true,
  progress: true,
  createdAt: true,
  updatedAt: true,
};

const goalUpdateSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: {
    select: userSelect,
  },
};

export const goalSelect = {
  id: true,
  workspaceId: true,
  ownerId: true,
  title: true,
  description: true,
  dueDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: userSelect,
  },
  milestones: {
    select: milestoneSelect,
    orderBy: {
      createdAt: 'asc',
    },
  },
  updates: {
    select: goalUpdateSelect,
    orderBy: {
      createdAt: 'desc',
    },
  },
};

/**
 * Loose check: the goal exists in this workspace. The route already required
 * an authenticated workspace member, so this is enough for collaborative
 * actions like updating milestone progress or posting activity updates.
 */
async function assertGoalInWorkspace(goalId, workspaceId) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: {
      id: true,
      workspaceId: true,
      ownerId: true,
    },
  });

  if (!goal || goal.workspaceId !== workspaceId) {
    throw new NotFoundError('Goal not found');
  }

  return goal;
}

/**
 * Strict check: only the goal owner or a workspace admin may pass. Use for
 * governance actions — renaming/deleting goals, deleting milestones, renaming
 * a milestone — where one person needs final say.
 */
async function assertGoalOwnerOrAdmin(goalId, workspaceId, userId, role) {
  const goal = await assertGoalInWorkspace(goalId, workspaceId);
  if (role !== 'ADMIN' && goal.ownerId !== userId) {
    throw new ForbiddenError('Only the goal owner or an admin can do this');
  }
  return goal;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

export async function listGoals(workspaceId) {
  return prisma.goal.findMany({
    where: { workspaceId },
    select: goalSelect,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createGoal({ workspaceId, userId, role, input }) {
  const ownerId = role === 'ADMIN' && input.ownerId ? input.ownerId : userId;

  const ownerMembership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: ownerId,
        workspaceId,
      },
    },
    select: {
      userId: true,
    },
  });

  if (!ownerMembership) {
    throw new NotFoundError('Goal owner must be a member of this workspace');
  }

  const goal = await prisma.goal.create({
    data: {
      workspaceId,
      ownerId,
      title: input.title,
      description: input.description || null,
      dueDate: normalizeDate(input.dueDate),
      status: input.status || 'ACTIVE',
    },
    select: goalSelect,
  });

  emitToWorkspace(workspaceId, 'goal:created', goal);
  return goal;
}

export async function getGoal({ workspaceId, goalId }) {
  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      workspaceId,
    },
    select: goalSelect,
  });

  if (!goal) {
    throw new NotFoundError('Goal not found');
  }

  return goal;
}

export async function updateGoal({ workspaceId, goalId, userId, role, patch }) {
  await assertGoalOwnerOrAdmin(goalId, workspaceId, userId, role);

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description || null } : {}),
      ...(patch.dueDate !== undefined ? { dueDate: normalizeDate(patch.dueDate) } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.ownerId !== undefined && role === 'ADMIN' ? { ownerId: patch.ownerId } : {}),
    },
    select: goalSelect,
  });

  emitToWorkspace(workspaceId, 'goal:updated', updated);
  return updated;
}

export async function deleteGoal({ workspaceId, goalId, userId, role }) {
  await assertGoalOwnerOrAdmin(goalId, workspaceId, userId, role);

  await prisma.goal.delete({
    where: { id: goalId },
  });

  emitToWorkspace(workspaceId, 'goal:deleted', { id: goalId });
}

export async function createMilestone({ workspaceId, goalId, input }) {
  // Any workspace member can add milestones to any goal — `milestone:create`
  // is granted to MEMBER in the permission matrix.
  await assertGoalInWorkspace(goalId, workspaceId);

  const milestone = await prisma.milestone.create({
    data: {
      goalId,
      title: input.title,
      progress: input.progress ?? 0,
    },
    select: milestoneSelect,
  });

  emitToWorkspace(workspaceId, 'milestone:updated', milestone);
  return getGoal({ workspaceId, goalId });
}

export async function updateMilestone({ workspaceId, goalId, milestoneId, userId, role, patch }) {
  // Renaming a milestone is governance — owner/admin only.
  // Updating progress is collaborative tracking — any workspace member.
  if (patch.title !== undefined) {
    await assertGoalOwnerOrAdmin(goalId, workspaceId, userId, role);
  } else {
    await assertGoalInWorkspace(goalId, workspaceId);
  }

  const milestone = await prisma.milestone.findFirst({
    where: {
      id: milestoneId,
      goalId,
    },
    select: {
      id: true,
    },
  });

  if (!milestone) {
    throw new NotFoundError('Milestone not found');
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
    },
    select: milestoneSelect,
  });

  emitToWorkspace(workspaceId, 'milestone:updated', updated);
  return getGoal({ workspaceId, goalId });
}

export async function deleteMilestone({ workspaceId, goalId, milestoneId, userId, role }) {
  await assertGoalOwnerOrAdmin(goalId, workspaceId, userId, role);

  await prisma.milestone.deleteMany({
    where: {
      id: milestoneId,
      goalId,
    },
  });

  emitToWorkspace(workspaceId, 'goal:updated', await getGoal({ workspaceId, goalId }));
}

export async function createGoalUpdate({ workspaceId, goalId, authorId, content }) {
  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!goal) {
    throw new NotFoundError('Goal not found');
  }

  const update = await prisma.goalUpdate.create({
    data: {
      goalId,
      authorId,
      content,
    },
    select: goalUpdateSelect,
  });

  emitToWorkspace(workspaceId, 'goal:updated', await getGoal({ workspaceId, goalId }));
  return update;
}
