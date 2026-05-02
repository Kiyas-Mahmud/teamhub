import { z } from 'zod';

const workspaceId = z.string().min(1);
const announcementId = z.string().min(1);
const commentId = z.string().min(1);

const attachmentSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  name: z.string().min(1).max(200).optional().nullable(),
  size: z.number().int().nonnegative().optional().nullable(),
  type: z.string().min(1).max(100).optional().nullable(),
});

export const announcementQuerySchema = z.object({
  params: z.object({
    workspaceId,
  }),
});

export const createAnnouncementSchema = z.object({
  params: z.object({
    workspaceId,
  }),
  body: z.object({
    title: z.string().min(1).max(200),
    contentHtml: z.string().min(1),
    attachments: z.array(attachmentSchema).max(5).optional(),
    pinned: z.boolean().optional(),
  }),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({
    workspaceId,
    announcementId,
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    contentHtml: z.string().min(1).optional(),
    attachments: z.array(attachmentSchema).max(5).optional(),
    pinned: z.boolean().optional(),
  }),
});

export const announcementParamsSchema = z.object({
  params: z.object({
    workspaceId,
    announcementId,
  }),
});

export const pinAnnouncementSchema = z.object({
  params: z.object({
    workspaceId,
    announcementId,
  }),
  body: z.object({
    pinned: z.boolean(),
  }),
});

export const createCommentSchema = z.object({
  params: z.object({
    workspaceId,
    announcementId,
  }),
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
});

export const toggleReactionSchema = z.object({
  params: z.object({
    workspaceId,
    announcementId,
  }),
  body: z.object({
    emoji: z.string().min(1).max(32),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    workspaceId,
    announcementId,
    commentId,
  }),
});
