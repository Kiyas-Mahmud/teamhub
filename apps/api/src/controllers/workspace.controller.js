import * as workspaceService from '../services/workspace.service.js';

export async function createWorkspace(req, res) {
  const workspace = await workspaceService.createWorkspace({
    userId: req.userId,
    ...req.body,
  });

  res.status(201).json(workspace);
}

export async function listWorkspaces(req, res) {
  const items = await workspaceService.listWorkspaces(req.userId);
  res.json({ items, nextCursor: null });
}

export async function getWorkspace(req, res) {
  const workspace = await workspaceService.getWorkspace({
    userId: req.userId,
    workspaceId: req.params.workspaceId,
  });

  res.json(workspace);
}

export async function updateWorkspace(req, res) {
  const workspace = await workspaceService.updateWorkspace({
    workspaceId: req.params.workspaceId,
    userId: req.userId,
    patch: req.body,
  });

  res.json(workspace);
}

export async function inviteToWorkspace(req, res) {
  const invite = await workspaceService.inviteToWorkspace({
    workspaceId: req.params.workspaceId,
    inviterUserId: req.userId,
    email: req.body.email,
    role: req.body.role,
  });

  res.status(201).json(invite);
}

export async function acceptInvite(req, res) {
  const workspace = await workspaceService.acceptInvite({
    workspaceId: req.params.workspaceId,
    userId: req.userId,
    token: req.body.token,
  });

  res.json(workspace);
}
