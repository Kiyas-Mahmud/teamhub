import { Router } from 'express';
import * as actionItemController from '../controllers/actionItem.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { loadMembership } from '../middleware/loadMembership.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  actionItemParamsSchema,
  actionItemQuerySchema,
  createActionItemSchema,
  updateActionItemSchema,
} from '../validators/actionItem.schema.js';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, loadMembership, validate(actionItemQuerySchema), asyncHandler(actionItemController.listActionItems));
router.post('/', requireAuth, loadMembership, validate(createActionItemSchema), asyncHandler(actionItemController.createActionItem));
router.patch(
  '/:actionItemId',
  requireAuth,
  loadMembership,
  validate(updateActionItemSchema),
  asyncHandler(actionItemController.updateActionItem)
);
router.delete(
  '/:actionItemId',
  requireAuth,
  loadMembership,
  validate(actionItemParamsSchema),
  asyncHandler(actionItemController.deleteActionItem)
);

export default router;
