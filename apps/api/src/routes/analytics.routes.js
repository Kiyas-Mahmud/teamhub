import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { loadMembership } from '../middleware/loadMembership.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { validate } from '../middleware/validate.js';
import { analyticsParamsSchema } from '../validators/analytics.schema.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  loadMembership,
  requirePermission('analytics:view'),
  validate(analyticsParamsSchema),
  asyncHandler(analyticsController.getAnalytics)
);

router.get(
  '/export',
  requireAuth,
  loadMembership,
  requirePermission('analytics:export'),
  validate(analyticsParamsSchema),
  asyncHandler(analyticsController.exportAnalyticsCsv)
);

export default router;
