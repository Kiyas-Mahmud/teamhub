import analyticsRoutes from './analytics.routes.js';
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import uploadRoutes from './upload.routes.js';
import userRoutes from './user.routes.js';
import workspaceRoutes from './workspace.routes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/uploads', uploadRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/analytics', analyticsRoutes);

export default router;
