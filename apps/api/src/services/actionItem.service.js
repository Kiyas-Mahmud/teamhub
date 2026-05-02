import { emitToUser, emitToWorkspace } from '../sockets/index.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { createNotification } from './notification.service.js';

const actionItemSelect = {
  id: true,
  workspaceId: true,
  goalId: true,
  assigneeId: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  goal: {
    select: {
      id: true,
      title: true,
    },
  },
};

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

async function getItemForEdit(actionItemId) {
  const item = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    select: {
      id: true,
      workspaceId: true,
      assigneeId: true,
      status: true,
    },
  });

  if (!item) {
    throw new NotFoundError('Action item not found');
  }

  return item;
}

function assertActionItemPermission(item, userId, role) {
  if (role === 'ADMIN') {
    return;
  }

  if (item.assigneeId !== userId) {
    throw new ForbiddenError('You can only edit action items assigned to you');
  }
}

export async function listActionItems({ workspaceId, filters }) {
  return prisma.actionItem.findMany({
    where: {
      workspaceId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.goalId ? { goalId: filters.goalId } : {}),
    },
    select: actionItemSelect,
    orderBy: [
      {
        status: 'asc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });
}

export async function createActionItem({ workspaceId, userId, input }) {
  const assigneeId = input.assigneeId || null;
  const goalId = input.goalId || null;

  if (assigneeId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: assigneeId,
          workspaceId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!membership) {
      throw new NotFoundError('Assignee must belong to this workspace');
    }
  }

  const item = await prisma.actionItem.create({
    data: {
      workspaceId,
      assigneeId,
      goalId,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'MEDIUM',
      status: input.status || 'TODO',
      dueDate: normalizeDate(input.dueDate),
    },
    select: actionItemSelect,
  });

  emitToWorkspace(workspaceId, 'actionItem:created', item);

  if (item.assigneeId && item.assigneeId !== userId) {
    const notification = await createNotification({
      userId: item.assigneeId,
      type: 'ASSIGNED_ACTION_ITEM',
      title: 'You were assigned an action item',
      body: item.title,
      link: `/${workspaceId}/action-items`,
    });

    emitToUser(item.assigneeId, 'notification:new', notification);
  }

  return item;
}

export async function updateActionItem({ workspaceId, actionItemId, userId, role, patch }) {
  const existing = await getItemForEdit(actionItemId);

  if (existing.workspaceId !== workspaceId) {
    throw new NotFoundError('Action item not found');
  }

  assertActionItemPermission(existing, userId, role);

  const updated = await prisma.actionItem.update({
    where: { id: actionItemId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description || null } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.goalId !== undefined ? { goalId: patch.goalId || null } : {}),
      ...(patch.assigneeId !== undefined ? { assigneeId: patch.assigneeId || null } : {}),
      ...(patch.dueDate !== undefined ? { dueDate: normalizeDate(patch.dueDate) } : {}),
    },
    select: actionItemSelect,
  });

  emitToWorkspace(
    workspaceId,
    patch.status && patch.status !== existing.status ? 'actionItem:statusChanged' : 'actionItem:updated',
    updated
  );

  return updated;
}

export async function deleteActionItem({ workspaceId, actionItemId, userId, role }) {
  const existing = await getItemForEdit(actionItemId);

  if (existing.workspaceId !== workspaceId) {
    throw new NotFoundError('Action item not found');
  }

  assertActionItemPermission(existing, userId, role);

  await prisma.actionItem.delete({
    where: {
      id: actionItemId,
    },
  });

  emitToWorkspace(workspaceId, 'actionItem:deleted', { id: actionItemId });
}
