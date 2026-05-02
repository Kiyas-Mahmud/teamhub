import { Router } from 'express';
import actionItemRoutes from './actionItem.routes.js';
import goalRoutes from './goal.routes.js';
import * as workspaceController from '../controllers/workspace.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { loadMembership } from '../middleware/loadMembership.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { validate } from '../middleware/validate.js';
import {
  acceptInviteSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  updateWorkspaceSchema,
  workspaceParamsSchema,
} from '../validators/workspace.schema.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(workspaceController.listWorkspaces));
router.post(
  '/',
  requireAuth,
  validate(createWorkspaceSchema),
  asyncHandler(workspaceController.createWorkspace)
);
router.get(
  '/:workspaceId',
  requireAuth,
  validate(workspaceParamsSchema),
  asyncHandler(workspaceController.getWorkspace)
);
router.patch(
  '/:workspaceId',
  requireAuth,
  loadMembership,
  requirePermission('workspace:edit'),
  validate(updateWorkspaceSchema),
  asyncHandler(workspaceController.updateWorkspace)
);
router.post(
  '/:workspaceId/invite',
  requireAuth,
  loadMembership,
  requirePermission('workspace:invite'),
  validate(inviteMemberSchema),
  asyncHandler(workspaceController.inviteToWorkspace)
);
router.post(
  '/:workspaceId/accept-invite',
  requireAuth,
  validate(acceptInviteSchema),
  asyncHandler(workspaceController.acceptInvite)
);
router.use('/:workspaceId/goals', goalRoutes);
router.use('/:workspaceId/action-items', actionItemRoutes);

export default router;
