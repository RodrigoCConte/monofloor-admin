import { Router } from 'express';
import { dashboardRoutes } from './dashboard.routes';
import { applicatorsRoutes } from './applicators.routes';
import { projectsRoutes } from './projects.routes';
import { tasksRoutes } from './tasks.routes';
import { reportsRoutes } from './reports.routes';
import simpleVideoReportsRoutes from './simple-video-reports.routes';
import { locationsRoutes } from './locations.routes';
import { contributionsRoutes } from './contributions.routes';
import { helpRequestsRoutes } from './help-requests.routes';
import { campaignsRoutes } from './campaigns.routes';
import { badgesRoutes } from './badges.routes';
import { notificationsRoutes } from './notifications.routes';
import { academyRoutes } from './academy.routes';
import absencesRoutes from './absences.routes';
import requestsRoutes from './requests.routes';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/applicators', applicatorsRoutes);
router.use('/projects', projectsRoutes);
router.use('/projects', tasksRoutes);  // Tasks sub-routes (/projects/:projectId/tasks)
router.use('/reports', reportsRoutes);
router.use('/reports', simpleVideoReportsRoutes);  // Simple video reports (new!)
router.use('/locations', locationsRoutes);
router.use('/contributions', contributionsRoutes);
router.use('/help-requests', helpRequestsRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/badges', badgesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/academy', academyRoutes);
router.use('/absences', absencesRoutes);
router.use('/requests', requestsRoutes);

export { router as adminRoutes };
