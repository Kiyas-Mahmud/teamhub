import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import { mailer } from '../lib/mailer.js';

const workspaceSelect = {
  id: true,
  name: true,
  description: true,
  accentColor: true,
  createdAt: true,
  updatedAt: true,
};

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
};

function buildInviteLink(workspaceId, token) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  return `${clientUrl}/${workspaceId}/members?invite=${token}`;
}

export async function createWorkspace({ userId, name, description, accentColor }) {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name,
        description,
        accentColor: accentColor || '#6366f1',
      },
      select: workspaceSelect,
    });

    await tx.membership.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: 'ADMIN',
      },
    });

    return workspace;
  });
}

export async function listWorkspaces(userId) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: {
      role: true,
      workspace: {
        select: workspaceSelect,
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  return memberships.map((membership) => ({
    ...membership.workspace,
    role: membership.role,
  }));
}

export async function getWorkspace({ userId, workspaceId }) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: {
      role: true,
      workspace: {
        select: {
          ...workspaceSelect,
          memberships: {
            select: memberSelect,
            orderBy: {
              joinedAt: 'asc',
            },
          },
        },
      },
    },
  });

  if (!membership) {
    throw new NotFoundError('Workspace not found');
  }

  return {
    ...membership.workspace,
    role: membership.role,
  };
}

export async function updateWorkspace({ workspaceId, userId, patch }) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw new NotFoundError('Workspace not found');
  }

  if (membership.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can update the workspace');
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: patch,
    select: workspaceSelect,
  });
}

export async function inviteToWorkspace({ workspaceId, inviterUserId, email, role }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ForbiddenError('Email is required');
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: inviterUserId,
        workspaceId,
      },
    },
    select: {
      role: true,
      workspace: {
        select: workspaceSelect,
      },
      user: {
        select: { displayName: true },
      },
    },
  });

  if (!membership) {
    throw new NotFoundError('Workspace not found');
  }

  if (membership.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can invite members');
  }

  // If the invitee is already a workspace member, surface a clear error
  // instead of silently creating an unusable invite.
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    const alreadyMember = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: existingUser.id,
          workspaceId,
        },
      },
      select: { id: true },
    });
    if (alreadyMember) {
      throw new ForbiddenError(`${normalizedEmail} is already a member of this workspace`);
    }
  }

  const token = crypto.randomBytes(24).toString('hex');

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      email: normalizedEmail,
      role: role || 'MEMBER',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    select: {
      id: true,
      email: true,
      role: true,
      token: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // Fire-and-forget — the request must not fail if SMTP is misconfigured.
  mailer.sendWorkspaceInvite({
    to: normalizedEmail,
    workspaceName: membership.workspace.name,
    inviterName: membership.user?.displayName || 'A teammate',
    inviteLink: buildInviteLink(workspaceId, token),
  });

  return invite;
}

export async function acceptInvite({ workspaceId, userId, token }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
    },
  });

  if (!invite || invite.workspaceId !== workspaceId) {
    throw new NotFoundError('Invite not found');
  }

  if (invite.expiresAt <= new Date()) {
    throw new ForbiddenError('This invite has expired. Ask an admin to resend it.');
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new ForbiddenError(
      `This invite was sent to ${invite.email}. Sign in with that email to accept.`
    );
  }

  // Idempotent accept: if the invite was already used, but the user is also a member,
  // treat as success and just return the workspace.
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
    select: { id: true },
  });

  if (invite.acceptedAt && existingMembership) {
    return getWorkspace({ userId, workspaceId });
  }

  if (invite.acceptedAt && !existingMembership) {
    throw new ForbiddenError('This invite has already been used.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.upsert({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      update: {
        role: invite.role,
      },
      create: {
        userId,
        workspaceId,
        role: invite.role,
      },
    });

    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
      },
    });
  });

  return getWorkspace({ userId, workspaceId });
}
