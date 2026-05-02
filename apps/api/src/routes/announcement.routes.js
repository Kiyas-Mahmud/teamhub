import { Router } from 'express';
import * as announcementController from '../controllers/announcement.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { loadMembership } from '../middleware/loadMembership.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { validate } from '../middleware/validate.js';
import {
  announcementParamsSchema,
  announcementQuerySchema,
  createAnnouncementSchema,
  createCommentSchema,
  deleteCommentSchema,
  pinAnnouncementSchema,
  toggleReactionSchema,
  updateAnnouncementSchema,
} from '../validators/announcement.schema.js';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, loadMembership, validate(announcementQuerySchema), asyncHandler(announcementController.listAnnouncements));
router.post(
  '/',
  requireAuth,
  loadMembership,
  requirePermission('announcement:create'),
  validate(createAnnouncementSchema),
  asyncHandler(announcementController.createAnnouncement)
);
router.patch(
  '/:announcementId',
  requireAuth,
  loadMembership,
  requirePermission('announcement:edit_any'),
  validate(updateAnnouncementSchema),
  asyncHandler(announcementController.updateAnnouncement)
);
router.delete(
  '/:announcementId',
  requireAuth,
  loadMembership,
  requirePermission('announcement:delete_any'),
  validate(announcementParamsSchema),
  asyncHandler(announcementController.deleteAnnouncement)
);
router.patch(
  '/:announcementId/pin',
  requireAuth,
  loadMembership,
  requirePermission('announcement:pin'),
  validate(pinAnnouncementSchema),
  asyncHandler(announcementController.pinAnnouncement)
);
router.post(
  '/:announcementId/reactions',
  requireAuth,
  loadMembership,
  requirePermission('reaction:toggle'),
  validate(toggleReactionSchema),
  asyncHandler(announcementController.toggleReaction)
);
router.post(
  '/:announcementId/comments',
  requireAuth,
  loadMembership,
  requirePermission('comment:create'),
  validate(createCommentSchema),
  asyncHandler(announcementController.createComment)
);
router.delete(
  '/:announcementId/comments/:commentId',
  requireAuth,
  loadMembership,
  validate(deleteCommentSchema),
  asyncHandler(announcementController.deleteComment)
);

export default router;
