import * as actionItemService from '../services/actionItem.service.js';

export async function listActionItems(req, res) {
  const items = await actionItemService.listActionItems({
    workspaceId: req.params.workspaceId,
    filters: req.query,
  });

  res.json({ items, nextCursor: null });
}

export async function createActionItem(req, res) {
  const item = await actionItemService.createActionItem({
    workspaceId: req.params.workspaceId,
    userId: req.userId,
    input: req.body,
  });

  res.status(201).json(item);
}

export async function updateActionItem(req, res) {
  const item = await actionItemService.updateActionItem({
    workspaceId: req.params.workspaceId,
    actionItemId: req.params.actionItemId,
    userId: req.userId,
    role: req.role,
    patch: req.body,
  });

  res.json(item);
}

export async function deleteActionItem(req, res) {
  await actionItemService.deleteActionItem({
    workspaceId: req.params.workspaceId,
    actionItemId: req.params.actionItemId,
    userId: req.userId,
    role: req.role,
  });

  res.status(204).send();
}
