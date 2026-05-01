import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/user.schema.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(userController.getProfile));
router.patch('/me', requireAuth, validate(updateProfileSchema), asyncHandler(userController.updateProfile));

export default router;
