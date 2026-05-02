import { Router } from 'express';
import * as goalController from '../controllers/goal.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { loadMembership } from '../middleware/loadMembership.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  createGoalSchema,
  createGoalUpdateSchema,
  createMilestoneSchema,
  goalParamsSchema,
  milestoneParamsSchema,
  updateGoalSchema,
  updateMilestoneSchema,
} from '../validators/goal.schema.js';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, loadMembership, asyncHandler(goalController.listGoals));
router.post('/', requireAuth, loadMembership, validate(createGoalSchema), asyncHandler(goalController.createGoal));
router.get('/:goalId', requireAuth, loadMembership, validate(goalParamsSchema), asyncHandler(goalController.getGoal));
router.patch('/:goalId', requireAuth, loadMembership, validate(updateGoalSchema), asyncHandler(goalController.updateGoal));
router.delete('/:goalId', requireAuth, loadMembership, validate(goalParamsSchema), asyncHandler(goalController.deleteGoal));
router.post(
  '/:goalId/milestones',
  requireAuth,
  loadMembership,
  validate(createMilestoneSchema),
  asyncHandler(goalController.createMilestone)
);
router.patch(
  '/:goalId/milestones/:milestoneId',
  requireAuth,
  loadMembership,
  validate(updateMilestoneSchema),
  asyncHandler(goalController.updateMilestone)
);
router.delete(
  '/:goalId/milestones/:milestoneId',
  requireAuth,
  loadMembership,
  validate(milestoneParamsSchema),
  asyncHandler(goalController.deleteMilestone)
);
router.post(
  '/:goalId/updates',
  requireAuth,
  loadMembership,
  validate(createGoalUpdateSchema),
  asyncHandler(goalController.createGoalUpdate)
);

export default router;
