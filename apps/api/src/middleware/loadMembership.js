import { ForbiddenError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

export async function loadMembership(req, res, next) {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return next(new ForbiddenError('Workspace context is required'));
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.userId,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return next(new ForbiddenError('Not a member of this workspace'));
    }

    req.role = membership.role;
    return next();
  } catch (error) {
    return next(error);
  }
}
