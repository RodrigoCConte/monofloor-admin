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

    // Format for map markers
    const markers = locations.map((loc) => {
      const isRecentlyActive = loc.updatedAt >= onlineThreshold;
      const isOnline = loc.isOnline && isRecentlyActive;

      return {
        id: loc.userId,
        lat: Number(loc.latitude),
        lng: Number(loc.longitude),
        isOnline,
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

    res.json({
      success: true,
      data: {
        markers,
        center,
        onlineCount: markers.filter((m) => m.isOnline).length,
        offlineCount: markers.filter((m) => !m.isOnline).length,
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

export { router as locationsRoutes };
