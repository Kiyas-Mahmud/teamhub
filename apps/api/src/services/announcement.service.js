import sanitizeHtml from 'sanitize-html';
import { emitToUser, emitToWorkspace } from '../sockets/index.js';
import { deleteFile } from '../lib/cloudinary.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/errors.js';
import { mailer } from '../lib/mailer.js';
import { prisma } from '../lib/prisma.js';
import { createNotification } from './notification.service.js';

function normalizeAttachment(att) {
  if (!att || typeof att !== 'object') return null;
  if (!att.url || !att.publicId) return null;
  return {
    url: String(att.url),
    publicId: String(att.publicId),
    name: att.name ? String(att.name) : null,
    size: typeof att.size === 'number' ? att.size : null,
    type: att.type ? String(att.type) : null,
  };
}

function normalizeAttachments(input) {
  if (!Array.isArray(input)) return [];
  return input.map(normalizeAttachment).filter(Boolean).slice(0, 10);
}

const reactionSelect = {
  id: true,
  emoji: true,
  userId: true,
  createdAt: true,
};

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  reactions: {
    select: reactionSelect,
    orderBy: {
      createdAt: 'asc',
    },
  },
};

export const announcementSelect = {
  id: true,
  workspaceId: true,
  authorId: true,
  title: true,
  contentHtml: true,
  attachments: true,
  pinned: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  reactions: {
    select: reactionSelect,
    orderBy: {
      createdAt: 'asc',
    },
  },
  comments: {
    select: commentSelect,
    orderBy: {
      createdAt: 'asc',
    },
  },
};

const reactionKeyMap = new Map([
  ['👍', 'THUMBS_UP'],
  ['THUMBS_UP', 'THUMBS_UP'],
  ['thumbs_up', 'THUMBS_UP'],
  ['🎯', 'TARGET'],
  ['TARGET', 'TARGET'],
  ['target', 'TARGET'],
  ['🔥', 'FIRE'],
  ['FIRE', 'FIRE'],
  ['fire', 'FIRE'],
]);

function cleanHtml(input) {
  return sanitizeHtml(input, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
      '*': ['class'],
    },
  });
}

function parseMentionUserIds(content) {
  const ids = [];
  const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
  let match = regex.exec(content);

  while (match) {
    ids.push(match[1]);
    match = regex.exec(content);
  }

  return Array.from(new Set(ids));
}

/**
 * Strip the canonical `@[Display Name](userId)` markup down to a human-readable
 * `@Display Name` so users see clean text in notifications and emails.
 */
function humanizeMentions(content) {
  if (!content) return content;
  return String(content).replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
}

function normalizeReactionKey(value) {
  return reactionKeyMap.get(String(value || '').trim()) || null;
}

function normalizeReactionRecord(reaction) {
  if (!reaction) {
    return reaction;
  }

  return {
    ...reaction,
    emoji: normalizeReactionKey(reaction.emoji) || reaction.emoji,
  };
}

function normalizeAnnouncementRecord(announcement) {
  if (!announcement) {
    return announcement;
  }

  return {
    ...announcement,
    reactions: (announcement.reactions || []).map(normalizeReactionRecord),
    comments: (announcement.comments || []).map((comment) => ({
      ...comment,
      reactions: (comment.reactions || []).map(normalizeReactionRecord),
    })),
  };
}

export async function listAnnouncements(workspaceId) {
  const announcements = await prisma.announcement.findMany({
    where: { workspaceId },
    select: announcementSelect,
    orderBy: [
      {
        pinned: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });

  return announcements.map(normalizeAnnouncementRecord);
}

export async function createAnnouncement({ workspaceId, authorId, input }) {
  const announcement = await prisma.announcement.create({
    data: {
      workspaceId,
      authorId,
      title: input.title,
      contentHtml: cleanHtml(input.contentHtml),
      attachments: normalizeAttachments(input.attachments),
      pinned: Boolean(input.pinned),
    },
    select: announcementSelect,
  });

  const normalized = normalizeAnnouncementRecord(announcement);
  emitToWorkspace(workspaceId, 'announcement:created', normalized);
  return normalized;
}

export async function updateAnnouncement({ workspaceId, announcementId, patch }) {
  const existing = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new NotFoundError('Announcement not found');
  }

  const updated = await prisma.announcement.update({
    where: {
      id: announcementId,
    },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.contentHtml !== undefined ? { contentHtml: cleanHtml(patch.contentHtml) } : {}),
      ...(patch.attachments !== undefined
        ? { attachments: normalizeAttachments(patch.attachments) }
        : {}),
      ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}),
    },
    select: announcementSelect,
  });

  const normalized = normalizeAnnouncementRecord(updated);
  emitToWorkspace(workspaceId, 'announcement:updated', normalized);
  return normalized;
}

export async function deleteAnnouncement({ workspaceId, announcementId }) {
  const existing = await prisma.announcement.findFirst({
    where: { id: announcementId, workspaceId },
    select: { attachments: true },
  });

  await prisma.announcement.deleteMany({
    where: {
      id: announcementId,
      workspaceId,
    },
  });

  // Best-effort cleanup of attachments on Cloudinary.
  if (existing?.attachments && Array.isArray(existing.attachments)) {
    for (const att of existing.attachments) {
      const publicId = att?.publicId;
      const type = att?.type || '';
      const resourceType = type.startsWith('video/')
        ? 'video'
        : type.startsWith('image/')
          ? 'image'
          : 'raw';
      deleteFile(publicId, { resourceType }).catch(() => {});
    }
  }

  emitToWorkspace(workspaceId, 'announcement:updated', { id: announcementId, deleted: true });
}

export async function pinAnnouncement({ workspaceId, announcementId, pinned }) {
  const existing = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new NotFoundError('Announcement not found');
  }

  const updated = await prisma.announcement.update({
    where: {
      id: announcementId,
    },
    data: {
      pinned,
    },
    select: announcementSelect,
  });

  const normalized = normalizeAnnouncementRecord(updated);
  emitToWorkspace(workspaceId, 'announcement:pinned', { id: announcementId, pinned });
  return normalized;
}

export async function toggleReaction({ workspaceId, announcementId, userId, emoji }) {
  const reactionKey = normalizeReactionKey(emoji);

  if (!reactionKey) {
    throw new BadRequestError('Unsupported reaction');
  }

  const existing = await prisma.reaction.findFirst({
    where: {
      announcementId,
      userId,
      emoji: reactionKey,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.reaction.delete({
      where: {
        id: existing.id,
      },
    });

    emitToWorkspace(workspaceId, 'announcement:reacted', {
      announcementId,
      emoji: reactionKey,
      userId,
      op: 'remove',
    });

    return { removed: true };
  }

  await prisma.reaction.create({
    data: {
      announcementId,
      userId,
      emoji: reactionKey,
    },
    select: reactionSelect,
  });

  emitToWorkspace(workspaceId, 'announcement:reacted', {
    announcementId,
    emoji: reactionKey,
    userId,
    op: 'add',
  });

  return { removed: false };
}

export async function createComment({ workspaceId, announcementId, authorId, content }) {
  const announcement = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      workspaceId,
    },
    select: {
      id: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      author: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement not found');
  }

  const comment = await prisma.comment.create({
    data: {
      announcementId,
      authorId,
      content,
    },
    select: commentSelect,
  });

  const mentionUserIds = parseMentionUserIds(content).filter((id) => id !== authorId);

  if (mentionUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: mentionUserIds,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const readableContent = humanizeMentions(content);

    for (const user of users) {
      await prisma.mention.create({
        data: {
          commentId: comment.id,
          userId: user.id,
        },
      });

      const notification = await createNotification({
        userId: user.id,
        type: 'MENTION',
        title: `${comment.author.displayName} mentioned you`,
        body: readableContent,
        link: `/${workspaceId}/announcements`,
      });

      emitToUser(user.id, 'notification:new', notification);
      mailer.sendMentionEmail({
        to: user.email,
        authorName: comment.author.displayName,
        workspaceName: announcement.workspace.name,
        snippet: readableContent,
        link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/${workspaceId}/announcements`,
      });
    }
  }

  emitToWorkspace(workspaceId, 'announcement:commented', comment);
  return comment;
}

export async function deleteComment({ workspaceId, announcementId, commentId, userId, role }) {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      announcementId,
      announcement: {
        workspaceId,
      },
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (role !== 'ADMIN' && comment.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });

  emitToWorkspace(workspaceId, 'announcement:updated', normalizeAnnouncementRecord(await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: announcementSelect,
  })));
}
