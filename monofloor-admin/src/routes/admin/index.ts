import { Router } from 'express';
import { dashboardRoutes } from './dashboard.routes';
import { applicatorsRoutes } from './applicators.routes';
import { projectsRoutes } from './projects.routes';
import { tasksRoutes } from './tasks.routes';
import { reportsRoutes } from './reports.routes';
import { locationsRoutes } from './locations.routes';
import { contributionsRoutes } from './contributions.routes';
import { campaignsRoutes } from './campaigns.routes';
import { badgesRoutes } from './badges.routes';
import { notificationsRoutes } from './notifications.routes';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/applicators', applicatorsRoutes);
router.use('/projects', projectsRoutes);
router.use('/projects', tasksRoutes);  // Tasks sub-routes (/projects/:projectId/tasks)
router.use('/reports', reportsRoutes);
router.use('/locations', locationsRoutes);
router.use('/contributions', contributionsRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/badges', badgesRoutes);
router.use('/notifications', notificationsRoutes);

export { router as adminRoutes };
