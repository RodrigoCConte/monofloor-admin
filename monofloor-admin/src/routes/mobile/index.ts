import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { mobileAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getGeofenceStatus, calculateDistance } from '../../services/geofencing.service';
import {
  emitLocationUpdate,
  emitCheckin,
  emitCheckout,
  emitOutOfArea,
  emitBackInArea,
  emitBatteryCritical,
  emitLunchLeavingPrompt,
} from '../../services/socket.service';
import { isLunchTime } from '../../services/lunch-scheduler.service';
import { sendRequestNotification } from '../../services/whatsapp.service';
import { whisperService } from '../../services/ai/whisper.service';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads/profile-photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for profile photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadProfilePhoto = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

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

// =============================================
// PROFILE
// =============================================

// GET /api/mobile/profile
router.get('/profile', mobileAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        photoUrl: true,
        role: true,
        xpTotal: true,
        level: true,
        totalHoursWorked: true,
        totalM2Applied: true,
        totalProjectsCount: true,
        createdAt: true,
        // Include badges
        badges: {
          select: {
            id: true,
            isPrimary: true,
            awardedAt: true,
            badge: {
              select: {
                id: true,
                name: true,
                description: true,
                iconUrl: true,
                color: true,
                category: true,
                rarity: true,
              },
            },
          },
          orderBy: [
            { isPrimary: 'desc' },
            { awardedAt: 'desc' },
          ],
        },
        // Include campaign wins
        campaignWins: {
          select: {
            id: true,
            position: true,
            xpAwarded: true,
            createdAt: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 wins
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Find primary badge (like Instagram verification)
    const primaryBadge = user.badges.find(b => b.isPrimary)?.badge || null;

    res.json({
      success: true,
      data: {
        ...user,
        totalHoursWorked: Number(user.totalHoursWorked),
        totalM2Applied: Number(user.totalM2Applied),
        primaryBadge,
        badges: user.badges.map(b => ({
          ...b.badge,
          awardedAt: b.awardedAt,
          isPrimary: b.isPrimary,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/mobile/profile
router.put(
  '/profile',
  mobileAuth,
  uploadProfilePhoto.single('profilePhoto'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const updateData: any = {};

      if (req.body.name) updateData.name = req.body.name;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;

      // Handle profile photo upload
      if (req.file) {
        const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
        updateData.photoUrl = photoUrl;

        // Delete old photo if exists
        const currentUser = await prisma.user.findUnique({
          where: { id: req.user!.sub },
          select: { photoUrl: true },
        });

        if (currentUser?.photoUrl && currentUser.photoUrl.startsWith('/uploads/')) {
          const oldPhotoPath = path.join(__dirname, '../../..', currentUser.photoUrl);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
      }

      const user = await prisma.user.update({
        where: { id: req.user!.sub },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          phone: true,
          photoUrl: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// PROJECTS (User's assigned projects)
// =============================================

// GET /api/mobile/projects
router.get('/projects', mobileAuth, async (req, res, next) => {
  try {
    const assignments = await prisma.projectAssignment.findMany({
      where: {
        userId: req.user!.sub,
        isActive: true,
      },
      include: {
        project: true,
      },
    });

    res.json({
      success: true,
      data: assignments.map((a) => ({
        ...a.project,
        m2Total: Number(a.project.m2Total),
        m2Piso: Number(a.project.m2Piso),
        m2Parede: Number(a.project.m2Parede),
        workedHours: Number(a.project.workedHours),
        projectRole: a.projectRole,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// NEARBY PROJECTS (must be before /projects/:id to avoid route conflict)
// =============================================

// GET /api/mobile/projects/nearby - Get nearby projects user is NOT assigned to
router.get(
  '/projects/nearby',
  mobileAuth,
  [
    query('lat').isFloat({ min: -90, max: 90 }),
    query('lng').isFloat({ min: -180, max: 180 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userLat = parseFloat(req.query.lat as string);
      const userLng = parseFloat(req.query.lng as string);
      const limit = parseInt(req.query.limit as string) || 5;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = req.user!.sub;

      // Get projects user is assigned to
      const userAssignments = await prisma.projectAssignment.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: { projectId: true },
      });
      const assignedProjectIds = userAssignments.map(a => a.projectId);

      // Get all active projects with coordinates that user is NOT assigned to
      const allProjects = await prisma.project.findMany({
        where: {
          status: 'EM_EXECUCAO',
          id: { notIn: assignedProjectIds },
          latitude: { not: null },
          longitude: { not: null },
        },
        include: {
          assignments: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      });

      // Calculate distance for each project and sort
      const projectsWithDistance = allProjects.map(project => {
        const projectLat = Number(project.latitude);
        const projectLng = Number(project.longitude);
        const distance = calculateDistance(userLat, userLng, projectLat, projectLng);

        // Format distance
        let distanceFormatted: string;
        if (distance < 1000) {
          distanceFormatted = `${distance} m`;
        } else {
          distanceFormatted = `${(distance / 1000).toFixed(1)} km`;
        }

        return {
          id: project.id,
          name: project.title,
          client: project.cliente,
          address: project.endereco,
          distance,
          distanceFormatted,
          m2Total: Number(project.m2Total),
          teamSize: project.assignments.length,
          latitude: projectLat,
          longitude: projectLng,
        };
      });

      // Sort by distance
      projectsWithDistance.sort((a, b) => a.distance - b.distance);

      // Paginate
      const total = projectsWithDistance.length;
      const paginatedProjects = projectsWithDistance.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      res.json({
        success: true,
        data: {
          projects: paginatedProjects,
          total,
          hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/projects/:id
router.get(
  '/projects/:id',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      // Check if user is assigned to this project
      const assignment = await prisma.projectAssignment.findFirst({
        where: {
          userId: req.user!.sub,
          projectId: req.params.id,
          isActive: true,
        },
        include: {
          project: {
            include: {
              assignments: {
                where: { isActive: true },
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
                },
              },
            },
          },
        },
      });

      if (!assignment) {
        throw new AppError(
          'Project not found or not assigned',
          404,
          'PROJECT_NOT_FOUND'
        );
      }

      const project = assignment.project;

      res.json({
        success: true,
        data: {
          ...project,
          m2Total: Number(project.m2Total),
          m2Piso: Number(project.m2Piso),
          m2Parede: Number(project.m2Parede),
          workedHours: Number(project.workedHours),
          projectRole: assignment.projectRole,
          team: project.assignments.map((a) => ({
            ...a.user,
            projectRole: a.projectRole,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/projects/:id/request-contribution - Request to contribute to a project
router.post(
  '/projects/:id/request-contribution',
  mobileAuth,
  [
    param('id').isUUID(),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.sub;
      const { description } = req.body;

      // Check if project exists and is active
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, status: true },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      if (project.status !== 'EM_EXECUCAO') {
        throw new AppError('Projeto nao esta ativo', 400, 'PROJECT_NOT_ACTIVE');
      }

      // Check if user is already assigned
      const existingAssignment = await prisma.projectAssignment.findFirst({
        where: {
          userId,
          projectId,
          isActive: true,
        },
      });

      if (existingAssignment) {
        throw new AppError('Voce ja esta atribuido a este projeto', 400, 'ALREADY_ASSIGNED');
      }

      // Check if there's already a pending request
      const existingRequest = await prisma.contributionRequest.findUnique({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      if (existingRequest) {
        if (existingRequest.status === 'PENDING') {
          throw new AppError('Ja existe uma solicitacao pendente', 400, 'REQUEST_PENDING');
        }
        if (existingRequest.status === 'REJECTED') {
          // Allow new request after rejection - update the existing one
          const updatedRequest = await prisma.contributionRequest.update({
            where: { id: existingRequest.id },
            data: {
              description,
              status: 'PENDING',
              reviewedAt: null,
              reviewedById: null,
              createdAt: new Date(),
            },
          });

          return res.status(201).json({
            success: true,
            data: {
              requestId: updatedRequest.id,
              message: 'Solicitacao enviada com sucesso!',
            },
          });
        }
      }

      // Create new contribution request
      const contributionRequest = await prisma.contributionRequest.create({
        data: {
          userId,
          projectId,
          description,
        },
      });

      // Get user info for notification
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, phone: true },
      });

      // Send WhatsApp notification for project transfer request
      sendRequestNotification({
        type: 'PROJECT_TRANSFER',
        userName: user?.name || 'Usuário',
        userPhone: user?.phone || undefined,
        projectName: project.title,
        description: description || undefined,
      }).catch((error) => {
        console.error('[WhatsApp] Failed to send notification:', error);
      });

      res.status(201).json({
        success: true,
        data: {
          requestId: contributionRequest.id,
          message: 'Solicitacao enviada com sucesso!',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/contribution-requests - Get user's contribution requests
router.get('/contribution-requests', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const requests = await prisma.contributionRequest.findMany({
      where: { userId },
      include: {
        project: {
          select: { id: true, title: true, cliente: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// CHECK-INS
// =============================================

// POST /api/mobile/checkins - Create check-in
router.post(
  '/checkins',
  mobileAuth,
  [
    body('projectId').isUUID(),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, latitude, longitude } = req.body;

      // Check if user is assigned to this project
      const assignment = await prisma.projectAssignment.findFirst({
        where: {
          userId: req.user!.sub,
          projectId,
          isActive: true,
        },
      });

      if (!assignment) {
        throw new AppError(
          'Not assigned to this project',
          403,
          'NOT_ASSIGNED'
        );
      }

      // Check if there's an active check-in
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          userId: req.user!.sub,
          checkoutAt: null,
        },
      });

      if (activeCheckin) {
        throw new AppError(
          'Already checked in to a project',
          400,
          'ALREADY_CHECKED_IN'
        );
      }

      // Check if this is an irregular check-in (no location provided)
      const isIrregular = !latitude || !longitude;

      const checkin = await prisma.checkin.create({
        data: {
          userId: req.user!.sub,
          projectId,
          checkinLatitude: latitude,
          checkinLongitude: longitude,
          isIrregular,
        },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
      });

      // Get user info for socket events
      const user = await prisma.user.findUnique({
        where: { id: req.user!.sub },
        select: { name: true, photoUrl: true },
      });

      // Update UserLocation to sync with checkin (for map)
      if (latitude && longitude) {
        await prisma.userLocation.upsert({
          where: { userId: req.user!.sub },
          update: {
            latitude,
            longitude,
            currentProjectId: projectId,
            isOnline: true,
            isOutOfArea: false,
            distanceFromProject: 0,
          },
          create: {
            userId: req.user!.sub,
            latitude,
            longitude,
            currentProjectId: projectId,
            isOnline: true,
            isOutOfArea: false,
            distanceFromProject: 0,
          },
        });
      }

      // Emit check-in event via Socket.io
      emitCheckin({
        userId: req.user!.sub,
        userName: user?.name || 'Aplicador',
        userPhoto: user?.photoUrl || null,
        projectId,
        projectName: checkin.project.title,
        isIrregular,
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        data: checkin,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/mobile/checkins/:id/checkout - Checkout
router.put(
  '/checkins/:id/checkout',
  mobileAuth,
  [
    param('id').isUUID(),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('reason').optional().isIn(['FIM_EXPEDIENTE', 'OUTRO_PROJETO', 'COMPRA_INSUMOS', 'ALMOCO_INTERVALO']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const checkin = await prisma.checkin.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.sub,
          checkoutAt: null,
        },
        include: {
          project: {
            select: { id: true, title: true },
          },
        },
      });

      if (!checkin) {
        throw new AppError('Check-in not found', 404, 'CHECKIN_NOT_FOUND');
      }

      // Get user info for socket events
      const user = await prisma.user.findUnique({
        where: { id: req.user!.sub },
        select: { name: true },
      });

      // Calculate hours worked
      const checkoutAt = new Date();
      const hoursWorked =
        (checkoutAt.getTime() - checkin.checkinAt.getTime()) / (1000 * 60 * 60);

      const updatedCheckin = await prisma.checkin.update({
        where: { id: checkin.id },
        data: {
          checkoutAt,
          checkoutLatitude: req.body.latitude,
          checkoutLongitude: req.body.longitude,
          checkoutReason: req.body.reason,
          hoursWorked,
        },
      });

      // Update user's total hours
      await prisma.user.update({
        where: { id: req.user!.sub },
        data: {
          totalHoursWorked: { increment: hoursWorked },
        },
      });

      // Update project's worked hours
      await prisma.project.update({
        where: { id: checkin.projectId },
        data: {
          workedHours: { increment: hoursWorked },
        },
      });

      // Update UserLocation to mark as offline/no project (for map)
      await prisma.userLocation.updateMany({
        where: { userId: req.user!.sub },
        data: {
          currentProjectId: null,
          isOnline: false,
          isOutOfArea: false,
          distanceFromProject: null,
          ...(req.body.latitude && req.body.longitude ? {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
          } : {}),
        },
      });

      // Emit checkout event via Socket.io
      emitCheckout({
        userId: req.user!.sub,
        userName: user?.name || 'Aplicador',
        projectId: checkin.projectId,
        projectName: checkin.project.title,
        hoursWorked,
        timestamp: checkoutAt,
      });

      res.json({
        success: true,
        data: {
          ...updatedCheckin,
          hoursWorked: Number(updatedCheckin.hoursWorked),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/checkins - Get user's checkins
router.get(
  '/checkins',
  mobileAuth,
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const checkins = await prisma.checkin.findMany({
        where: {
          userId: req.user!.sub,
          checkinAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { checkinAt: 'desc' },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
      });

      res.json({
        success: true,
        data: checkins.map((c) => ({
          ...c,
          hoursWorked: c.hoursWorked ? Number(c.hoursWorked) : null,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/checkins/active - Get active check-in
router.get('/checkins/active', mobileAuth, async (req, res, next) => {
  try {
    const activeCheckin = await prisma.checkin.findFirst({
      where: {
        userId: req.user!.sub,
        checkoutAt: null,
      },
      include: {
        project: {
          select: { id: true, title: true, cliente: true },
        },
      },
    });

    res.json({
      success: true,
      data: activeCheckin,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// HOURS
// =============================================

// GET /api/mobile/hours
router.get(
  '/hours',
  mobileAuth,
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Total hours this month
      const monthlyTotal = await prisma.checkin.aggregate({
        where: {
          userId: req.user!.sub,
          checkinAt: { gte: startDate, lte: endDate },
          checkoutAt: { not: null },
        },
        _sum: { hoursWorked: true },
        _count: true,
      });

      // Hours by project
      const byProject = await prisma.checkin.groupBy({
        by: ['projectId'],
        where: {
          userId: req.user!.sub,
          checkinAt: { gte: startDate, lte: endDate },
          checkoutAt: { not: null },
        },
        _sum: { hoursWorked: true },
        _count: true,
      });

      // Get project details
      const projectIds = byProject.map((p) => p.projectId);
      const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, title: true, cliente: true, status: true },
      });

      const projectsMap = new Map(projects.map((p) => [p.id, p]));

      res.json({
        success: true,
        data: {
          month,
          year,
          totalHours: Number(monthlyTotal._sum.hoursWorked) || 0,
          totalCheckins: monthlyTotal._count,
          byProject: byProject.map((p) => ({
            project: projectsMap.get(p.projectId),
            hours: Number(p._sum.hoursWorked) || 0,
            checkins: p._count,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// REPORTS
// =============================================

// POST /api/mobile/reports - Create report
router.post(
  '/reports',
  mobileAuth,
  [
    body('projectId').isUUID(),
    body('notes').optional().trim(),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, notes, tags } = req.body;

      // Check if user is assigned
      const assignment = await prisma.projectAssignment.findFirst({
        where: {
          userId: req.user!.sub,
          projectId,
          isActive: true,
        },
      });

      if (!assignment) {
        throw new AppError('Not assigned to this project', 403, 'NOT_ASSIGNED');
      }

      // Get active checkin
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          userId: req.user!.sub,
          projectId,
          checkoutAt: null,
        },
      });

      const report = await prisma.report.create({
        data: {
          userId: req.user!.sub,
          projectId,
          checkinId: activeCheckin?.id,
          notes,
          tags: tags || [],
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/reports - Get user's reports
router.get(
  '/reports',
  mobileAuth,
  [
    query('projectId').optional().isUUID(),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const where: any = { userId: req.user!.sub };

      if (req.query.projectId) {
        where.projectId = req.query.projectId;
      }

      if (req.query.month && req.query.year) {
        const month = parseInt(req.query.month as string);
        const year = parseInt(req.query.year as string);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        where.reportDate = { gte: startDate, lte: endDate };
      }

      const reports = await prisma.report.findMany({
        where,
        orderBy: { reportDate: 'desc' },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
          photos: true,
        },
      });

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// LOCATION
// =============================================

// POST /api/mobile/location - Update current location
router.post(
  '/location',
  mobileAuth,
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('accuracy').optional().isFloat({ min: 0 }),
    body('heading').optional().isFloat({ min: 0, max: 360 }),
    body('speed').optional().isFloat({ min: 0 }),
    body('batteryLevel').optional().isInt({ min: 0, max: 100 }),
    body('isCharging').optional().isBoolean(),
    body('isOnline').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { latitude, longitude, accuracy, heading, speed, batteryLevel, isCharging, isOnline } = req.body;
      const userId = req.user!.sub;

      // Get user info for socket events
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, photoUrl: true },
      });

      // Get active checkin to know current project
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          userId,
          checkoutAt: null,
        },
        include: {
          project: {
            select: { id: true, title: true, latitude: true, longitude: true },
          },
        },
      });

      // Get previous location to detect area changes
      const previousLocation = await prisma.userLocation.findUnique({
        where: { userId },
      });

      // Calculate geofencing status if there's an active project
      let geofenceStatus = {
        isOutOfArea: false,
        distance: null as number | null,
        radiusMeters: 200,
      };

      if (activeCheckin?.project) {
        geofenceStatus = getGeofenceStatus(
          latitude,
          longitude,
          activeCheckin.project.latitude ? Number(activeCheckin.project.latitude) : null,
          activeCheckin.project.longitude ? Number(activeCheckin.project.longitude) : null,
          200 // 200 meters radius
        );
      }

      // Upsert user location
      const location = await prisma.userLocation.upsert({
        where: { userId },
        update: {
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
          batteryLevel,
          isCharging,
          isOnline: isOnline !== false,
          currentProjectId: activeCheckin?.projectId || null,
          isOutOfArea: geofenceStatus.isOutOfArea,
          distanceFromProject: geofenceStatus.distance,
        },
        create: {
          userId,
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
          batteryLevel,
          isCharging,
          isOnline: isOnline !== false,
          currentProjectId: activeCheckin?.projectId || null,
          isOutOfArea: geofenceStatus.isOutOfArea,
          distanceFromProject: geofenceStatus.distance,
        },
      });

      // Emit location update via Socket.io
      emitLocationUpdate({
        userId,
        userName: user?.name || 'Aplicador',
        userPhoto: user?.photoUrl || null,
        latitude,
        longitude,
        batteryLevel: batteryLevel || null,
        isCharging: isCharging || null,
        isOutOfArea: geofenceStatus.isOutOfArea,
        distanceFromProject: geofenceStatus.distance,
        currentProjectId: activeCheckin?.projectId || null,
        currentProjectName: activeCheckin?.project?.title || null,
        timestamp: new Date(),
      });

      // Detect area changes and emit events
      if (activeCheckin?.project) {
        const wasOutOfArea = previousLocation?.isOutOfArea || false;

        // User just left the area
        if (geofenceStatus.isOutOfArea && !wasOutOfArea) {
          emitOutOfArea({
            userId,
            userName: user?.name || 'Aplicador',
            projectId: activeCheckin.project.id,
            projectName: activeCheckin.project.title,
            distance: geofenceStatus.distance || 0,
            timestamp: new Date(),
          });

          // If it's lunch time (12:00-13:00), ask what user is going to do
          if (isLunchTime()) {
            emitLunchLeavingPrompt({
              userId,
              userName: user?.name || 'Aplicador',
              projectId: activeCheckin.project.id,
              projectName: activeCheckin.project.title,
              distance: geofenceStatus.distance || 0,
              timestamp: new Date(),
            });
          }
        }

        // User just returned to the area
        if (!geofenceStatus.isOutOfArea && wasOutOfArea) {
          emitBackInArea({
            userId,
            userName: user?.name || 'Aplicador',
            projectId: activeCheckin.project.id,
            projectName: activeCheckin.project.title,
            timestamp: new Date(),
          });
        }
      }

      // Emit battery critical event if below 5%
      if (batteryLevel !== undefined && batteryLevel <= 5) {
        emitBatteryCritical({
          userId,
          userName: user?.name || 'Aplicador',
          batteryLevel,
          timestamp: new Date(),
        });
      }

      // Also save to history (every 5 minutes max)
      const lastHistory = await prisma.locationHistory.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      });

      const shouldSaveHistory =
        !lastHistory ||
        new Date().getTime() - lastHistory.recordedAt.getTime() > 5 * 60 * 1000;

      if (shouldSaveHistory) {
        await prisma.locationHistory.create({
          data: {
            userId,
            latitude,
            longitude,
            accuracy,
            projectId: activeCheckin?.projectId,
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...location,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          accuracy: location.accuracy ? Number(location.accuracy) : null,
          isOutOfArea: geofenceStatus.isOutOfArea,
          distanceFromProject: geofenceStatus.distance,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/mobile/location/offline - Mark as offline
router.put('/location/offline', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    await prisma.userLocation.updateMany({
      where: { userId },
      data: { isOnline: false },
    });

    res.json({
      success: true,
      message: 'Marked as offline',
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// HELP REQUESTS (Material ou Ajuda)
// =============================================

// Ensure uploads directory for help requests exists
const helpRequestsUploadsDir = path.join(__dirname, '../../../uploads/help-requests');
if (!fs.existsSync(helpRequestsUploadsDir)) {
  fs.mkdirSync(helpRequestsUploadsDir, { recursive: true });
}

// Multer configuration for help request files
const helpRequestStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, helpRequestsUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const prefix = file.fieldname === 'audio' ? 'audio-' : 'video-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadHelpRequest = multer({
  storage: helpRequestStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video
  fileFilter: (req, file, cb) => {
    const allowedAudioTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

    if (file.fieldname === 'audio' && allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === 'video' && allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// POST /api/mobile/help-requests - Create a help or material request
router.post(
  '/help-requests',
  mobileAuth,
  uploadHelpRequest.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const { type, materialName, quantity, description, audioTranscription, projectId } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validate type
      if (!type || !['MATERIAL', 'HELP'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Tipo invalido. Use MATERIAL ou HELP.' },
        });
      }

      // Validate required fields based on type
      if (type === 'MATERIAL' && !materialName) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_MATERIAL_NAME', message: 'Nome do material e obrigatorio.' },
        });
      }

      if (type === 'HELP' && !description) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_DESCRIPTION', message: 'Descricao e obrigatoria.' },
        });
      }

      // Get file URLs
      const audioFile = files?.audio?.[0];
      const videoFile = files?.video?.[0];
      const audioUrl = audioFile ? `/uploads/help-requests/${audioFile.filename}` : null;
      const videoUrl = videoFile ? `/uploads/help-requests/${videoFile.filename}` : null;

      // Transcribe audio automatically if no transcription provided
      let finalAudioTranscription = audioTranscription || null;
      if (audioFile && !audioTranscription) {
        try {
          console.log(`[Whisper] Transcribing audio: ${audioFile.path}`);
          const transcriptionResult = await whisperService.transcribeAudio(audioFile.path);
          finalAudioTranscription = transcriptionResult.text;
          console.log(`[Whisper] Transcription complete: "${finalAudioTranscription?.substring(0, 100)}..."`);
        } catch (transcriptionError) {
          console.error('[Whisper] Failed to transcribe audio:', transcriptionError);
          // Continue without transcription if it fails
        }
      }

      // Create help request
      const helpRequest = await prisma.helpRequest.create({
        data: {
          userId,
          projectId: projectId || null,
          type: type as 'MATERIAL' | 'HELP',
          materialName: materialName || null,
          quantity: quantity || null,
          description: description || null,
          audioUrl,
          audioTranscription: finalAudioTranscription,
          videoUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              cliente: true,
            },
          },
        },
      });

      // Send WhatsApp notification with media (Base64) and transcription
      sendRequestNotification({
        type: type as 'MATERIAL' | 'HELP',
        userName: helpRequest.user.name,
        userPhone: helpRequest.user.phone || helpRequest.user.email,
        projectName: helpRequest.project?.title || helpRequest.project?.cliente,
        materialName: materialName || undefined,
        quantity: quantity || undefined,
        description: description || undefined,
        audioTranscription: finalAudioTranscription || undefined,
        audioFilePath: audioFile?.path || undefined,  // Pass file path for Base64 conversion
        videoFilePath: videoFile?.path || undefined,  // Pass file path for Base64 conversion
      }).catch((error) => {
        console.error('[WhatsApp] Failed to send notification:', error);
      });

      res.status(201).json({
        success: true,
        data: helpRequest,
        message: type === 'MATERIAL' ? 'Solicitação de material enviada!' : 'Solicitação de ajuda enviada!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/projects/:id/request-entry - Request entry at building (1 hour cooldown)
router.post(
  '/projects/:id/request-entry',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.sub;

      // Check if user is assigned to this project
      const assignment = await prisma.projectAssignment.findFirst({
        where: {
          userId,
          projectId,
          isActive: true,
        },
      });

      if (!assignment) {
        throw new AppError('Voce nao esta atribuido a este projeto', 403, 'NOT_ASSIGNED');
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          cpf: true,
          phone: true,
        },
      });

      if (!user) {
        throw new AppError('Usuario nao encontrado', 404, 'USER_NOT_FOUND');
      }

      // Get project info with responsible phones
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          endereco: true,
          responsiblePhones: true,
        },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      // Check if there are responsible phones
      if (!project.responsiblePhones || project.responsiblePhones.length === 0) {
        throw new AppError('Nenhum telefone de responsavel cadastrado para este projeto', 400, 'NO_RESPONSIBLE_PHONES');
      }

      // Import and call sendEntryRequest
      const { sendEntryRequest } = await import('../../services/whatsapp.service');

      const result = await sendEntryRequest({
        projectName: project.title,
        projectAddress: project.endereco || 'Endereco nao informado',
        responsiblePhones: project.responsiblePhones,
        applicators: [{
          name: user.name,
          cpf: user.cpf || 'CPF nao informado',
          phone: user.phone || undefined,
          role: assignment.projectRole || 'APLICADOR',
        }],
      });

      if (!result.success) {
        throw new AppError('Falha ao enviar solicitacao', 500, 'SEND_FAILED');
      }

      res.json({
        success: true,
        data: {
          message: 'Solicitacao de liberacao enviada com sucesso!',
          sentTo: result.sentTo.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/help-requests - Get user's help requests
router.get('/help-requests', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { status, type, limit, offset } = req.query;

    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [requests, total] = await Promise.all([
      prisma.helpRequest.findMany({
        where,
        skip: offset ? parseInt(offset as string) : 0,
        take: limit ? parseInt(limit as string) : 20,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              cliente: true,
            },
          },
        },
      }),
      prisma.helpRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        requests,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/mobile/transcribe - Transcribe audio using Whisper
router.post(
  '/transcribe',
  mobileAuth,
  uploadHelpRequest.single('audio'),
  async (req, res, next) => {
    try {
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_AUDIO', message: 'Arquivo de audio nao fornecido.' },
        });
      }

      // Check if OpenAI API key is configured
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        // Clean up the file
        fs.unlinkSync(audioFile.path);
        return res.status(500).json({
          success: false,
          error: { code: 'NO_API_KEY', message: 'API de transcricao nao configurada.' },
        });
      }

      try {
        // Use fetch to call OpenAI Whisper API
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFile.path));
        formData.append('model', 'whisper-1');
        formData.append('language', 'pt');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            ...formData.getHeaders(),
          },
          body: formData,
        });

        // Clean up the temp file
        fs.unlinkSync(audioFile.path);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Whisper API error:', errorData);
          return res.status(500).json({
            success: false,
            error: { code: 'TRANSCRIPTION_ERROR', message: 'Erro ao transcrever audio.' },
          });
        }

        const data = await response.json() as { text: string };

        res.json({
          success: true,
          data: {
            transcription: data.text,
          },
        });
      } catch (apiError) {
        // Clean up the temp file on error
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
        }
        console.error('Transcription API error:', apiError);
        return res.status(500).json({
          success: false,
          error: { code: 'TRANSCRIPTION_ERROR', message: 'Erro ao transcrever audio.' },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// PUSH NOTIFICATIONS
// =============================================

// POST /api/mobile/push-subscription - Register push notification subscription
router.post('/push-subscription', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SUBSCRIPTION', message: 'Subscription data invalida' },
      });
    }

    const { savePushSubscription } = await import('../../services/push.service');
    const userAgent = req.headers['user-agent'] || undefined;

    const saved = await savePushSubscription(userId, subscription, userAgent);

    if (saved) {
      res.json({
        success: true,
        message: 'Push subscription registrada com sucesso',
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'SAVE_FAILED', message: 'Erro ao salvar subscription' },
      });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/mobile/push-subscription - Remove push notification subscription
router.delete('/push-subscription', mobileAuth, async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ENDPOINT', message: 'Endpoint e obrigatorio' },
      });
    }

    const { removePushSubscription } = await import('../../services/push.service');
    await removePushSubscription(endpoint);

    res.json({
      success: true,
      message: 'Push subscription removida com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/mobile/vapid-public-key - Get VAPID public key for push subscription
router.get('/vapid-public-key', async (req, res) => {
  const { getVapidPublicKey } = await import('../../services/push.service');
  res.json({
    success: true,
    publicKey: getVapidPublicKey(),
  });
});

// =============================================
// BADGES
// =============================================

// GET /api/mobile/badges - Get user's badges
router.get('/badges', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { awardedAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        iconUrl: ub.badge.iconUrl,
        color: ub.badge.color,
        category: ub.badge.category,
        rarity: ub.badge.rarity,
        isPrimary: ub.isPrimary,
        awardedAt: ub.awardedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/mobile/badges/:id/primary - Set a badge as primary (like Instagram verification badge)
router.put(
  '/badges/:id/primary',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const badgeId = req.params.id;

      // Check if user has this badge
      const userBadge = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: { userId, badgeId },
        },
      });

      if (!userBadge) {
        throw new AppError('Voce nao possui este badge', 404, 'BADGE_NOT_FOUND');
      }

      // Remove primary from all other badges
      await prisma.userBadge.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Set this badge as primary
      await prisma.userBadge.update({
        where: {
          userId_badgeId: { userId, badgeId },
        },
        data: { isPrimary: true },
      });

      res.json({
        success: true,
        message: 'Badge definido como principal!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/mobile/badges/:id/primary - Remove primary status from a badge
router.delete(
  '/badges/:id/primary',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const badgeId = req.params.id;

      await prisma.userBadge.updateMany({
        where: { userId, badgeId, isPrimary: true },
        data: { isPrimary: false },
      });

      res.json({
        success: true,
        message: 'Badge removido como principal!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// CAMPAIGNS
// =============================================

// GET /api/mobile/campaigns - Get active campaigns for user
router.get('/campaigns', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    // Get active campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        slides: {
          orderBy: { order: 'asc' },
        },
        participants: {
          where: { userId },
          select: { id: true, joinedAt: true },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { launchedAt: 'desc' },
    });

    // Get total applicators for counter
    const totalApplicators = await prisma.user.count({
      where: { status: 'APPROVED' },
    });

    res.json({
      success: true,
      data: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        bannerUrl: c.bannerUrl,
        bannerType: c.bannerType,
        startDate: c.startDate,
        endDate: c.endDate,
        xpBonus: c.xpBonus,
        xpMultiplier: c.xpMultiplier,
        participantCount: c._count.participants,
        totalApplicators,
        slides: c.slides,
        hasJoined: c.participants.length > 0,
        joinedAt: c.participants[0]?.joinedAt || null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/mobile/campaigns/:id - Get single campaign details
router.get(
  '/campaigns/:id',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;

      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          slides: {
            orderBy: { order: 'asc' },
          },
          participants: {
            where: { userId },
            select: { id: true, joinedAt: true },
          },
          _count: {
            select: { participants: true },
          },
        },
      });

      if (!campaign) {
        throw new AppError('Campanha nao encontrada', 404, 'CAMPAIGN_NOT_FOUND');
      }

      const totalApplicators = await prisma.user.count({
        where: { status: 'APPROVED' },
      });

      res.json({
        success: true,
        data: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          bannerUrl: campaign.bannerUrl,
          bannerType: campaign.bannerType,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          xpBonus: campaign.xpBonus,
          xpMultiplier: campaign.xpMultiplier,
          participantCount: campaign._count.participants,
          totalApplicators,
          slides: campaign.slides,
          hasJoined: campaign.participants.length > 0,
          joinedAt: campaign.participants[0]?.joinedAt || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/campaigns/:id/join - Join a campaign
router.post(
  '/campaigns/:id/join',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const campaignId = req.params.id;

      // Check if campaign exists and is active
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new AppError('Campanha nao encontrada', 404, 'CAMPAIGN_NOT_FOUND');
      }

      if (campaign.status !== 'ACTIVE') {
        throw new AppError('Campanha nao esta ativa', 400, 'CAMPAIGN_NOT_ACTIVE');
      }

      // Check if already joined
      const existing = await prisma.campaignParticipant.findUnique({
        where: {
          campaignId_userId: { campaignId, userId },
        },
      });

      if (existing) {
        return res.json({
          success: true,
          data: { alreadyJoined: true, joinedAt: existing.joinedAt },
          message: 'Voce ja esta participando desta campanha!',
        });
      }

      // Create participation
      const participant = await prisma.campaignParticipant.create({
        data: {
          campaignId,
          userId,
        },
      });

      // Update participant count
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          participantCount: { increment: 1 },
        },
      });

      // Award XP bonus if any
      if (campaign.xpBonus > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            xpTotal: { increment: campaign.xpBonus },
          },
        });
      }

      // Get updated count for response
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { participantCount: true },
      });

      const totalApplicators = await prisma.user.count({
        where: { status: 'APPROVED' },
      });

      res.status(201).json({
        success: true,
        data: {
          joinedAt: participant.joinedAt,
          participantCount: updatedCampaign?.participantCount || 0,
          totalApplicators,
          xpAwarded: campaign.xpBonus,
        },
        message: campaign.xpBonus > 0
          ? `Voce entrou na campanha e ganhou ${campaign.xpBonus} XP!`
          : 'Voce entrou na campanha!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// FEED POSTS (Social feed)
// =============================================

// Ensure uploads directory for feed images exists
const feedUploadsDir = path.join(__dirname, '../../../uploads/feed');
if (!fs.existsSync(feedUploadsDir)) {
  fs.mkdirSync(feedUploadsDir, { recursive: true });
}

// Multer configuration for feed images
const feedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, feedUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'feed-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadFeedImage = multer({
  storage: feedStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

// GET /api/mobile/feed - Get feed posts
router.get(
  '/feed',
  mobileAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
    query('projectId').optional().isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const projectId = req.query.projectId as string | undefined;

      const where: any = {};
      if (projectId) {
        where.projectId = projectId;
      }

      const [posts, total] = await Promise.all([
        prisma.feedPost.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                photoUrl: true,
                role: true,
                badges: {
                  where: { isPrimary: true },
                  select: {
                    badge: {
                      select: { iconUrl: true, color: true, name: true },
                    },
                  },
                  take: 1,
                },
              },
            },
            project: {
              select: { id: true, title: true, cliente: true },
            },
            likes: {
              where: { userId },
              select: { id: true },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        }),
        prisma.feedPost.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          posts: posts.map((post) => ({
            id: post.id,
            text: post.text,
            imageUrl: post.imageUrl,
            createdAt: post.createdAt,
            user: {
              ...post.user,
              primaryBadge: post.user.badges[0]?.badge || null,
            },
            project: post.project,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            hasLiked: post.likes.length > 0,
          })),
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/feed - Create a new post
router.post(
  '/feed',
  mobileAuth,
  uploadFeedImage.single('image'),
  [
    body('text').optional().trim().isLength({ max: 2000 }),
    body('projectId').optional().isUUID(),
    body('imageBase64').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const { text, projectId, imageBase64 } = req.body;

      // Require either text or image
      if (!text && !req.file && !imageBase64) {
        return res.status(400).json({
          success: false,
          error: { code: 'EMPTY_POST', message: 'Post precisa ter texto ou imagem' },
        });
      }

      // Handle image
      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = `/uploads/feed/${req.file.filename}`;
      } else if (imageBase64) {
        // Save base64 image to file
        const matches = imageBase64.match(/^data:image\/([a-z]+);base64,(.+)$/i);
        if (matches) {
          const ext = matches[1];
          const data = matches[2];
          const filename = `feed-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
          const filepath = path.join(feedUploadsDir, filename);
          fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
          imageUrl = `/uploads/feed/${filename}`;
        }
      }

      const post = await prisma.feedPost.create({
        data: {
          userId,
          text: text || null,
          imageUrl,
          projectId: projectId || null,
        },
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
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: post.id,
          text: post.text,
          imageUrl: post.imageUrl,
          createdAt: post.createdAt,
          user: post.user,
          project: post.project,
          likesCount: 0,
          commentsCount: 0,
          hasLiked: false,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/mobile/feed/:id - Delete own post
router.delete(
  '/feed/:id',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const postId = req.params.id;

      const post = await prisma.feedPost.findUnique({
        where: { id: postId },
        select: { userId: true, imageUrl: true },
      });

      if (!post) {
        throw new AppError('Post nao encontrado', 404, 'POST_NOT_FOUND');
      }

      if (post.userId !== userId) {
        throw new AppError('Voce nao pode deletar este post', 403, 'FORBIDDEN');
      }

      // Delete image file if exists
      if (post.imageUrl && post.imageUrl.startsWith('/uploads/feed/')) {
        const imagePath = path.join(__dirname, '../../..', post.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await prisma.feedPost.delete({
        where: { id: postId },
      });

      res.json({
        success: true,
        message: 'Post deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/feed/:id/like - Toggle like on a post
router.post(
  '/feed/:id/like',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const postId = req.params.id;

      // Check if post exists
      const post = await prisma.feedPost.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!post) {
        throw new AppError('Post nao encontrado', 404, 'POST_NOT_FOUND');
      }

      // Check if already liked
      const existingLike = await prisma.feedPostLike.findUnique({
        where: {
          postId_userId: { postId, userId },
        },
      });

      let liked: boolean;
      if (existingLike) {
        // Unlike
        await prisma.feedPostLike.delete({
          where: { id: existingLike.id },
        });
        await prisma.feedPost.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        });
        liked = false;
      } else {
        // Like
        await prisma.feedPostLike.create({
          data: { postId, userId },
        });
        await prisma.feedPost.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        });
        liked = true;
      }

      // Get updated count
      const updatedPost = await prisma.feedPost.findUnique({
        where: { id: postId },
        select: { likesCount: true },
      });

      res.json({
        success: true,
        data: {
          liked,
          likesCount: updatedPost?.likesCount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/feed/:id/comments - Get comments for a post
router.get(
  '/feed/:id/comments',
  mobileAuth,
  [
    param('id').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const postId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const [comments, total] = await Promise.all([
        prisma.feedPostComment.findMany({
          where: { postId },
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'asc' },
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
          },
        }),
        prisma.feedPostComment.count({ where: { postId } }),
      ]);

      res.json({
        success: true,
        data: {
          comments,
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/feed/:id/comments - Add comment to a post
router.post(
  '/feed/:id/comments',
  mobileAuth,
  [
    param('id').isUUID(),
    body('text').trim().isLength({ min: 1, max: 1000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const postId = req.params.id;
      const { text } = req.body;

      // Check if post exists
      const post = await prisma.feedPost.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!post) {
        throw new AppError('Post nao encontrado', 404, 'POST_NOT_FOUND');
      }

      // Create comment
      const comment = await prisma.feedPostComment.create({
        data: {
          postId,
          userId,
          text,
        },
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
        },
      });

      // Update comment count
      await prisma.feedPost.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      });

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/mobile/feed/:postId/comments/:commentId - Delete own comment
router.delete(
  '/feed/:postId/comments/:commentId',
  mobileAuth,
  [
    param('postId').isUUID(),
    param('commentId').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const { postId, commentId } = req.params;

      const comment = await prisma.feedPostComment.findUnique({
        where: { id: commentId },
        select: { userId: true, postId: true },
      });

      if (!comment) {
        throw new AppError('Comentario nao encontrado', 404, 'COMMENT_NOT_FOUND');
      }

      if (comment.postId !== postId) {
        throw new AppError('Comentario nao pertence a este post', 400, 'INVALID_POST');
      }

      if (comment.userId !== userId) {
        throw new AppError('Voce nao pode deletar este comentario', 403, 'FORBIDDEN');
      }

      await prisma.feedPostComment.delete({
        where: { id: commentId },
      });

      // Update comment count
      await prisma.feedPost.update({
        where: { id: postId },
        data: { commentsCount: { decrement: 1 } },
      });

      res.json({
        success: true,
        message: 'Comentario deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// NOTIFICATIONS (Notificacoes com video e XP)
// =============================================

// GET /api/mobile/notifications - Get pending notifications for user
router.get(
  '/notifications',
  mobileAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get active notifications that user hasn't viewed yet
      const viewedNotificationIds = await prisma.notificationView.findMany({
        where: { userId },
        select: { notificationId: true },
      });

      const viewedIds = viewedNotificationIds.map(v => v.notificationId);

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: {
            isActive: true,
            id: { notIn: viewedIds.length > 0 ? viewedIds : [''] }, // Exclude already viewed
          },
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({
          where: {
            isActive: true,
            id: { notIn: viewedIds.length > 0 ? viewedIds : [''] },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          notifications,
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/notifications/history - Get all notifications user has seen
router.get(
  '/notifications/history',
  mobileAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const [views, total] = await Promise.all([
        prisma.notificationView.findMany({
          where: { userId },
          skip: offset,
          take: limit,
          orderBy: { viewedAt: 'desc' },
          include: {
            notification: true,
          },
        }),
        prisma.notificationView.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: {
          notifications: views.map(v => ({
            ...v.notification,
            viewedAt: v.viewedAt,
            videoCompleted: v.videoCompleted,
            xpEarned: v.xpEarned,
          })),
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/notifications/:id/view - Mark notification as viewed
router.post(
  '/notifications/:id/view',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const notificationId = req.params.id;

      // Check if notification exists
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      // Create or update view record
      const view = await prisma.notificationView.upsert({
        where: {
          notificationId_userId: { notificationId, userId },
        },
        create: {
          notificationId,
          userId,
        },
        update: {
          viewedAt: new Date(),
        },
      });

      // Update notification view count
      await prisma.notification.update({
        where: { id: notificationId },
        data: { viewsCount: { increment: 1 } },
      });

      res.json({
        success: true,
        data: view,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/notifications/:id/video-progress - Update video progress
router.post(
  '/notifications/:id/video-progress',
  mobileAuth,
  [
    param('id').isUUID(),
    body('progress').isInt({ min: 0, max: 100 }),
    body('started').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const notificationId = req.params.id;
      const { progress, started } = req.body;

      // Check if notification exists
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      // Get or create view record
      let view = await prisma.notificationView.findUnique({
        where: {
          notificationId_userId: { notificationId, userId },
        },
      });

      if (!view) {
        view = await prisma.notificationView.create({
          data: {
            notificationId,
            userId,
            videoStarted: started || progress > 0,
            videoProgress: progress,
          },
        });
      } else {
        view = await prisma.notificationView.update({
          where: { id: view.id },
          data: {
            videoStarted: view.videoStarted || started || progress > 0,
            videoProgress: Math.max(view.videoProgress, progress),
          },
        });
      }

      res.json({
        success: true,
        data: view,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/notifications/:id/video-complete - Mark video as completed and award XP
router.post(
  '/notifications/:id/video-complete',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const notificationId = req.params.id;

      // Check if notification exists
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      // Get view record
      let view = await prisma.notificationView.findUnique({
        where: {
          notificationId_userId: { notificationId, userId },
        },
      });

      if (!view) {
        // Create view record
        view = await prisma.notificationView.create({
          data: {
            notificationId,
            userId,
            videoStarted: true,
            videoProgress: 100,
            videoCompleted: true,
            videoCompletedAt: new Date(),
            xpEarned: notification.xpReward,
          },
        });
      } else if (view.videoCompleted) {
        // Already completed, don't award XP again
        return res.json({
          success: true,
          data: {
            view,
            xpAwarded: 0,
            message: 'Video ja foi completado anteriormente',
          },
        });
      } else {
        // Update to completed
        view = await prisma.notificationView.update({
          where: { id: view.id },
          data: {
            videoProgress: 100,
            videoCompleted: true,
            videoCompletedAt: new Date(),
            xpEarned: notification.xpReward,
          },
        });
      }

      // Award XP to user
      if (notification.xpReward > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            xpTotal: { increment: notification.xpReward },
          },
        });

        // Emit XP gained event
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        const { emitXPGained } = await import('../../services/socket.service');
        emitXPGained({
          userId,
          userName: user?.name || 'Usuario',
          amount: notification.xpReward,
          reason: `Video assistido: ${notification.title}`,
          timestamp: new Date(),
        });
      }

      // Update notification completed count
      await prisma.notification.update({
        where: { id: notificationId },
        data: { completedCount: { increment: 1 } },
      });

      res.json({
        success: true,
        data: {
          view,
          xpAwarded: notification.xpReward,
          message: notification.xpReward > 0
            ? `Voce ganhou ${notification.xpReward} XP!`
            : 'Video completado!',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as mobileRoutes };
