import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { uploadSignatureSchema } from '../validators/upload.schema.js';

const router = Router();

router.post('/signature', requireAuth, validate(uploadSignatureSchema), asyncHandler(uploadController.createUploadSignature));

export default router;
