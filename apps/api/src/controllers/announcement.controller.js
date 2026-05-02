import * as announcementService from '../services/announcement.service.js';

export async function listAnnouncements(req, res) {
  const items = await announcementService.listAnnouncements(req.params.workspaceId);
  res.json({ items, nextCursor: null });
}

export async function createAnnouncement(req, res) {
  const announcement = await announcementService.createAnnouncement({
    workspaceId: req.params.workspaceId,
    authorId: req.userId,
    input: req.body,
  });

  res.status(201).json(announcement);
}

export async function updateAnnouncement(req, res) {
  const announcement = await announcementService.updateAnnouncement({
    workspaceId: req.params.workspaceId,
    announcementId: req.params.announcementId,
    patch: req.body,
  });

  res.json(announcement);
}

export async function deleteAnnouncement(req, res) {
  await announcementService.deleteAnnouncement({
    workspaceId: req.params.workspaceId,
    announcementId: req.params.announcementId,
  });

  res.status(204).send();
}

export async function pinAnnouncement(req, res) {
  const announcement = await announcementService.pinAnnouncement({
    workspaceId: req.params.workspaceId,
    announcementId: req.params.announcementId,
    pinned: req.body.pinned,
  });

  res.json(announcement);
}

export async function toggleReaction(req, res) {
  const result = await announcementService.toggleReaction({
    workspaceId: req.params.workspaceId,
    announcementId: req.params.announcementId,
    userId: req.userId,
    emoji: req.body.emoji,
  });

  res.json(result);
}

export async function createComment(req, res) {
  const comment = await announcementService.createComment({
    workspaceId: req.params.workspaceId,
    announcementId: req.params.announcementId,
    authorId: req.userId,
    content: req.body.content,
  });

  res.status(201).json(comment);
}

export async function deleteComment(req, res) {
  await announcementService.deleteComment({
    workspaceId: req.params.workspaceId,
    announcementId: req.params.announcementId,
    commentId: req.params.commentId,
    userId: req.userId,
    role: req.role,
  });

  res.status(204).send();
}
