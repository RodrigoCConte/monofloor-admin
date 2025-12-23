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
import { detectAndProcessLunchSkips, checkLunchSkipForUser } from '../../services/lunch-skipped-detection.service';

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

// Test endpoint for lunch skip detection (development only)
router.post('/test/lunch-skip-detection', async (req, res) => {
  try {
    console.log('[Admin] Manual lunch skip detection triggered');
    const results = await detectAndProcessLunchSkips();
    res.json({
      success: true,
      message: `Lunch skip detection complete`,
      resultsCount: results.length,
      results
    });
  } catch (error: any) {
    console.error('[Admin] Lunch skip detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check lunch skip for specific user (development only)
router.get('/test/lunch-skip/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const dateParam = req.query.date as string;
    const date = dateParam ? new Date(dateParam) : new Date();

    const result = await checkLunchSkipForUser(userId, date);
    res.json({
      success: true,
      userId,
      date: date.toISOString().split('T')[0],
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as adminRoutes };
