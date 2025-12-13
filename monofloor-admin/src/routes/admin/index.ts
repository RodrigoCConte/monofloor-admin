import { Router } from 'express';
import { dashboardRoutes } from './dashboard.routes';
import { applicatorsRoutes } from './applicators.routes';
import { projectsRoutes } from './projects.routes';
import { reportsRoutes } from './reports.routes';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/applicators', applicatorsRoutes);
router.use('/projects', projectsRoutes);
router.use('/reports', reportsRoutes);

export { router as adminRoutes };
