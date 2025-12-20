import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { query, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }
  next();
};

// Time threshold for considering a user "online" (5 minutes)
const ONLINE_THRESHOLD_MINUTES = 5;

// =============================================
// GET /api/admin/locations - Get all applicator locations
// =============================================
router.get(
  '/',
  [
    query('projectId').optional().isUUID(),
    query('onlineOnly').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, onlineOnly } = req.query;
      const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

      // Build where clause
      const where: any = {};

      if (projectId) {
        where.currentProjectId = projectId;
      }

      if (onlineOnly === 'true') {
        where.updatedAt = { gte: onlineThreshold };
        where.isOnline = true;
      }

      const locations = await prisma.userLocation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              photoUrl: true,
              role: true,
              status: true,
            },
          },
          currentProject: {
            select: {
              id: true,
              title: true,
              cliente: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Calculate online status based on last update time
      const locationsWithStatus = locations.map((loc) => {
        const isRecentlyActive = loc.updatedAt >= onlineThreshold;
        return {
          ...loc,
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          accuracy: loc.accuracy ? Number(loc.accuracy) : null,
          heading: loc.heading ? Number(loc.heading) : null,
          speed: loc.speed ? Number(loc.speed) : null,
          isOnline: loc.isOnline && isRecentlyActive,
          lastSeen: loc.updatedAt,
        };
      });

      // Summary statistics
      const onlineCount = locationsWithStatus.filter((l) => l.isOnline).length;
      const offlineCount = locationsWithStatus.filter((l) => !l.isOnline).length;

      res.json({
        success: true,
        data: {
          locations: locationsWithStatus,
          summary: {
            total: locationsWithStatus.length,
            online: onlineCount,
            offline: offlineCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/locations/map - Get locations formatted for map
// =============================================
router.get('/map', async (req, res, next) => {
  try {
    const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

    // Get all active check-ins to determine who is "em campo"
    const activeCheckins = await prisma.checkin.findMany({
      where: { checkoutAt: null },
      select: { userId: true },
    });
    const usersWithCheckin = new Set(activeCheckins.map((c) => c.userId));

    // Get all locations with user data
    const locations = await prisma.userLocation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            photoUrl: true,
            role: true,
          },
        },
        currentProject: {
          select: {
            id: true,
            title: true,
            cliente: true,
            endereco: true,
          },
        },
      },
    });

    // Format for map markers with 3-state status:
    // - hasActiveCheckin: true = 🟢 Em Campo (green)
    // - isOnline && !hasActiveCheckin = 🟡 Online (yellow)
    // - !isOnline = 🔴 Offline (red)
    const markers = locations.map((loc) => {
      const isRecentlyActive = loc.updatedAt >= onlineThreshold;
      const isOnline = loc.isOnline && isRecentlyActive;
      const hasActiveCheckin = usersWithCheckin.has(loc.userId);

      return {
        id: loc.userId,
        lat: Number(loc.latitude),
        lng: Number(loc.longitude),
        isOnline,
        hasActiveCheckin,
        user: {
          id: loc.user.id,
          name: loc.user.name,
          username: loc.user.username,
          photoUrl: loc.user.photoUrl,
          role: loc.user.role,
        },
        project: loc.currentProject
          ? {
              id: loc.currentProject.id,
              title: loc.currentProject.title,
              cliente: loc.currentProject.cliente,
              endereco: loc.currentProject.endereco,
            }
          : null,
        lastSeen: loc.updatedAt,
        batteryLevel: loc.batteryLevel,
      };
    });

    // Calculate center point (average of all locations)
    let center = { lat: -23.5505, lng: -46.6333 }; // Default: Sao Paulo
    if (markers.length > 0) {
      const sumLat = markers.reduce((sum, m) => sum + m.lat, 0);
      const sumLng = markers.reduce((sum, m) => sum + m.lng, 0);
      center = {
        lat: sumLat / markers.length,
        lng: sumLng / markers.length,
      };
    }

    // Count by status: emCampo (green), online (yellow), offline (red)
    const emCampoCount = markers.filter((m) => m.hasActiveCheckin).length;
    const onlineCount = markers.filter((m) => m.isOnline && !m.hasActiveCheckin).length;
    const offlineCount = markers.filter((m) => !m.isOnline && !m.hasActiveCheckin).length;

    res.json({
      success: true,
      data: {
        markers,
        center,
        emCampoCount,
        onlineCount,
        offlineCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// GET /api/admin/locations/projects - Get all projects with coordinates for map
// IMPORTANT: This route MUST be defined BEFORE /:userId routes!
// =============================================
router.get('/projects', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        status: 'EM_EXECUCAO',
      },
      select: {
        id: true,
        title: true,
        cliente: true,
        endereco: true,
        latitude: true,
        longitude: true,
        status: true,
        checkins: {
          where: {
            checkoutAt: null,
          },
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      cliente: p.cliente,
      endereco: p.endereco,
      lat: p.latitude ? Number(p.latitude) : null,
      lng: p.longitude ? Number(p.longitude) : null,
      status: p.status,
      hasActiveCheckin: p.checkins.length > 0,
      activeUsers: p.checkins.map((c) => ({
        id: c.user.id,
        name: c.user.name,
        photoUrl: c.user.photoUrl,
      })),
    })).filter((p) => p.lat && p.lng);

    res.json({
      success: true,
      data: {
        projects: formattedProjects,
        total: formattedProjects.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// GET /api/admin/locations/applicators/list - Get all applicators with location status
// IMPORTANT: This route MUST be defined BEFORE /:userId routes!
// =============================================
router.get('/applicators/list', async (req, res, next) => {
  try {
    const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

    // Get all approved applicators with their locations
    const applicators = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        username: true,
        photoUrl: true,
        role: true,
        location: {
          select: {
            latitude: true,
            longitude: true,
            isOnline: true,
            updatedAt: true,
            currentProjectId: true,
            batteryLevel: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Format with online status
    const formattedApplicators = applicators.map((app) => {
      const isRecentlyActive = app.location?.updatedAt
        ? app.location.updatedAt >= onlineThreshold
        : false;
      const isOnline = app.location?.isOnline && isRecentlyActive;

      return {
        id: app.id,
        name: app.name,
        username: app.username,
        photoUrl: app.photoUrl,
        role: app.role,
        isOnline,
        hasLocation: !!app.location,
        lastSeen: app.location?.updatedAt || null,
        batteryLevel: app.location?.batteryLevel || null,
        currentProjectId: app.location?.currentProjectId || null,
      };
    });

    // Sort: online first, then by name
    formattedApplicators.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      data: {
        applicators: formattedApplicators,
        summary: {
          total: formattedApplicators.length,
          online: formattedApplicators.filter((a) => a.isOnline).length,
          withLocation: formattedApplicators.filter((a) => a.hasLocation).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// GET /api/admin/locations/:userId - Get specific user location
// =============================================
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

    const location = await prisma.userLocation.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            photoUrl: true,
            role: true,
            phone: true,
          },
        },
        currentProject: {
          select: {
            id: true,
            title: true,
            cliente: true,
            endereco: true,
          },
        },
      },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Location not found for this user',
        },
      });
    }

    const isRecentlyActive = location.updatedAt >= onlineThreshold;

    res.json({
      success: true,
      data: {
        ...location,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        accuracy: location.accuracy ? Number(location.accuracy) : null,
        heading: location.heading ? Number(location.heading) : null,
        speed: location.speed ? Number(location.speed) : null,
        isOnline: location.isOnline && isRecentlyActive,
        lastSeen: location.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// GET /api/admin/locations/:userId/history - Get user location history
// =============================================
router.get(
  '/:userId/history',
  [
    query('hours').optional().isInt({ min: 1, max: 48 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const hours = parseInt(req.query.hours as string) || 8;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const history = await prisma.locationHistory.findMany({
        where: {
          userId,
          recordedAt: { gte: since },
        },
        orderBy: { recordedAt: 'asc' },
      });

      res.json({
        success: true,
        data: {
          userId,
          period: { hours, since },
          points: history.map((h) => ({
            lat: Number(h.latitude),
            lng: Number(h.longitude),
            accuracy: h.accuracy ? Number(h.accuracy) : null,
            timestamp: h.recordedAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/locations/:userId/timeline - Get timeline data for playback
// =============================================
router.get(
  '/:userId/timeline',
  [
    query('date').optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const dateParam = req.query.date as string;

      // Default to today
      const targetDate = dateParam ? new Date(dateParam) : new Date();

      // Window: 6 AM of selected day to 6 AM of next day (24h)
      const startOfWindow = new Date(targetDate);
      startOfWindow.setHours(6, 0, 0, 0);

      const endOfWindow = new Date(targetDate);
      endOfWindow.setDate(endOfWindow.getDate() + 1);
      endOfWindow.setHours(5, 59, 59, 999);

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          photoUrl: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      // Get all location history for the 24h window (6 AM to 6 AM)
      const history = await prisma.locationHistory.findMany({
        where: {
          userId,
          recordedAt: {
            gte: startOfWindow,
            lte: endOfWindow,
          },
        },
        orderBy: { recordedAt: 'asc' },
      });

      // Get checkins for the window to show work periods
      const checkins = await prisma.checkin.findMany({
        where: {
          userId,
          checkinAt: {
            gte: startOfWindow,
            lte: endOfWindow,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              cliente: true,
            },
          },
        },
        orderBy: { checkinAt: 'asc' },
      });

      // Format timeline points
      const timelinePoints = history.map((h) => ({
        lat: Number(h.latitude),
        lng: Number(h.longitude),
        accuracy: h.accuracy ? Number(h.accuracy) : null,
        timestamp: h.recordedAt,
        timestampMs: h.recordedAt.getTime(),
        projectId: h.projectId || null,
      }));

      // Format work periods (checkins)
      const workPeriods = checkins.map((c) => ({
        id: c.id,
        startTime: c.checkinAt,
        endTime: c.checkoutAt,
        startMs: c.checkinAt.getTime(),
        endMs: c.checkoutAt ? c.checkoutAt.getTime() : Date.now(),
        project: {
          id: c.project.id,
          title: c.project.title,
          cliente: c.project.cliente,
        },
        hoursWorked: c.hoursWorked ? Number(c.hoursWorked) : null,
      }));

      // Calculate window bounds for the slider (6 AM to 6 AM)
      const windowStart = startOfWindow.getTime();
      const windowEnd = endOfWindow.getTime();
      const now = Date.now();

      // Check if we're currently within this window
      const isCurrentWindow = now >= windowStart && now <= windowEnd;

      res.json({
        success: true,
        data: {
          user,
          date: targetDate.toISOString().split('T')[0],
          bounds: {
            startMs: windowStart,
            endMs: Math.min(windowEnd, now), // Don't go past current time for current window
            isCurrentWindow,
          },
          points: timelinePoints,
          workPeriods,
          summary: {
            totalPoints: timelinePoints.length,
            firstPoint: timelinePoints[0]?.timestamp || null,
            lastPoint: timelinePoints[timelinePoints.length - 1]?.timestamp || null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as locationsRoutes };
