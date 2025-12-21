import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { mobileAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import multer from 'multer';
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
import { saveFile, deleteFile, UploadType } from '../../services/db-storage.service';

const router = Router();
const prisma = new PrismaClient();

// Multer configuration with memory storage (files saved to PostgreSQL)
const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(),
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
        // Delete old photo from database if exists
        const currentUser = await prisma.user.findUnique({
          where: { id: req.user!.sub },
          select: { photoUrl: true },
        });

        if (currentUser?.photoUrl && currentUser.photoUrl.startsWith('/files/')) {
          const oldFileId = currentUser.photoUrl.replace('/files/', '');
          await deleteFile(oldFileId);
        }

        // Save new photo to PostgreSQL
        const saved = await saveFile({
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          data: req.file.buffer,
          type: 'PROFILE_PHOTO' as UploadType,
          userId: req.user!.sub,
        });
        updateData.photoUrl = saved.url;
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
        project: {
          include: {
            tasks: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                status: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: assignments.map((a) => {
        // Calculate current stage from tasks
        const tasks = a.project.tasks || [];
        const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
        const totalCount = tasks.length;
        const currentTask = tasks.find((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');

        const currentStage = totalCount > 0 ? {
          name: currentTask?.title || 'Concluido',
          completedCount,
          totalCount,
        } : null;

        return {
          ...a.project,
          m2Total: Number(a.project.m2Total),
          m2Piso: Number(a.project.m2Piso),
          m2Parede: Number(a.project.m2Parede),
          workedHours: Number(a.project.workedHours),
          projectRole: a.projectRole,
          currentStage,
          tasks: undefined, // Don't send full tasks array to client
        };
      }),
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

      // Get project info including workStartTime
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, cliente: true, latitude: true, longitude: true, workStartTime: true },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      // =============================================
      // CHECK-IN TIME VALIDATION
      // Only allow check-in 20 minutes before project start time
      // =============================================
      const CHECKIN_EARLY_MINUTES = 20;

      if (project.workStartTime) {
        const now = new Date();
        const [hours, minutes] = project.workStartTime.split(':').map(Number);

        // Create today's expected start time
        const expectedStart = new Date(now);
        expectedStart.setHours(hours, minutes, 0, 0);

        // Calculate earliest allowed check-in time (20 min before start)
        const earliestCheckin = new Date(expectedStart);
        earliestCheckin.setMinutes(earliestCheckin.getMinutes() - CHECKIN_EARLY_MINUTES);

        // If current time is before the earliest allowed time, reject
        if (now < earliestCheckin) {
          const earliestTimeStr = earliestCheckin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          throw new AppError(
            `Check-in permitido apenas a partir das ${earliestTimeStr} (20 minutos antes do inicio do expediente as ${project.workStartTime})`,
            400,
            'CHECKIN_TOO_EARLY'
          );
        }
      }

      // Check if this is an irregular check-in (no location provided)
      const isIrregular = !latitude || !longitude;

      // Calculate distance from project pin
      let checkinDistance: number | null = null;
      let isDistantCheckin = false;
      if (latitude && longitude && project?.latitude && project?.longitude) {
        const { isDistantFromProject } = await import('../../services/worktime.service');
        const distanceResult = isDistantFromProject(
          latitude,
          longitude,
          Number(project.latitude),
          Number(project.longitude)
        );
        checkinDistance = distanceResult.distance;
        isDistantCheckin = distanceResult.isDistant;
      }

      // Cancel any pending lunch break alerts (user is returning from lunch)
      const { cancelLunchBreakAlerts } = await import('../../services/lunch-alert.service');
      await cancelLunchBreakAlerts(req.user!.sub);

      // =============================================
      // PUNCTUALITY PROCESSING
      // =============================================
      const { processPunctuality } = await import('../../services/punctuality.service');
      const punctualityResult = await processPunctuality(req.user!.sub, projectId, new Date());

      const checkin = await prisma.checkin.create({
        data: {
          userId: req.user!.sub,
          projectId,
          checkinLatitude: latitude,
          checkinLongitude: longitude,
          checkinDistance,
          isDistantCheckin,
          isIrregular,
          // Punctuality tracking
          isFirstOfDay: punctualityResult.isFirstOfDay,
          isPunctual: punctualityResult.isPunctual,
          minutesLate: punctualityResult.minutesLate,
          expectedTime: punctualityResult.expectedTime,
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
        select: { name: true, photoUrl: true, xpTotal: true, punctualityStreak: true, punctualityMultiplier: true },
      });

      // =============================================
      // XP REWARD: 100 XP por check-in (com multiplicador de pontualidade)
      // =============================================
      const XP_CHECKIN_BASE = 100;

      // Apply punctuality multiplier to check-in XP
      const currentMultiplier = punctualityResult.newMultiplier;
      const XP_CHECKIN = Math.round(XP_CHECKIN_BASE * currentMultiplier);

      // Criar transação de XP
      await prisma.xpTransaction.create({
        data: {
          userId: req.user!.sub,
          amount: XP_CHECKIN,
          type: 'CHECKIN',
          reason: currentMultiplier > 1
            ? `Check-in na obra ${checkin.project.cliente || checkin.project.title} (${currentMultiplier}x)`
            : `Check-in na obra ${checkin.project.cliente || checkin.project.title}`,
          checkinId: checkin.id,
          projectId,
        },
      });

      // Atualizar XP total do usuário
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.sub },
        data: {
          xpTotal: { increment: XP_CHECKIN },
        },
        select: { xpTotal: true, level: true, punctualityStreak: true, punctualityMultiplier: true },
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
        xp: {
          earned: XP_CHECKIN + punctualityResult.xpAwarded,
          checkinXp: XP_CHECKIN,
          punctualityXp: punctualityResult.xpAwarded,
          reason: punctualityResult.xpAwarded > 0
            ? `Check-in na obra + Bônus pontualidade (${punctualityResult.newStreak} dias)`
            : 'Check-in na obra',
          total: updatedUser.xpTotal,
          level: updatedUser.level,
        },
        punctuality: {
          isFirstOfDay: punctualityResult.isFirstOfDay,
          isPunctual: punctualityResult.isPunctual,
          minutesLate: punctualityResult.minutesLate,
          expectedTime: punctualityResult.expectedTime,
          streak: punctualityResult.newStreak,
          multiplier: punctualityResult.newMultiplier,
          streakBroken: punctualityResult.streakBroken,
        },
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
    body('reason').optional().isIn(['FIM_EXPEDIENTE', 'OUTRO_PROJETO', 'COMPRA_INSUMOS', 'ALMOCO_INTERVALO', 'AUTO_DISTANTE']),
    body('isAutoCheckout').optional().isBoolean(),
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
            select: { id: true, title: true, latitude: true, longitude: true },
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

      // Calculate distance from project pin (if coordinates provided)
      let checkoutDistance: number | null = null;
      let isDistantCheckout = false;
      if (req.body.latitude && req.body.longitude && checkin.project.latitude && checkin.project.longitude) {
        const { isDistantFromProject } = await import('../../services/worktime.service');
        const distanceResult = isDistantFromProject(
          req.body.latitude,
          req.body.longitude,
          Number(checkin.project.latitude),
          Number(checkin.project.longitude)
        );
        checkoutDistance = distanceResult.distance;
        isDistantCheckout = distanceResult.isDistant;
      }

      const updatedCheckin = await prisma.checkin.update({
        where: { id: checkin.id },
        data: {
          checkoutAt,
          checkoutLatitude: req.body.latitude,
          checkoutLongitude: req.body.longitude,
          checkoutReason: req.body.reason,
          checkoutDistance,
          isDistantCheckout,
          hoursWorked,
          isAutoCheckout: req.body.isAutoCheckout || false,
        },
      });

      // Create lunch break alerts if this is a lunch checkout
      if (req.body.reason === 'ALMOCO_INTERVALO') {
        const { createLunchBreakAlerts } = await import('../../services/lunch-alert.service');
        await createLunchBreakAlerts(req.user!.sub, checkin.id, checkoutAt);
      }

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

      // =============================================
      // XP REWARD: Baseado nos minutos trabalhados
      // 1ª hora: 100 XP (~1.67 XP/min)
      // 2ª hora: 110 XP (~1.83 XP/min)
      // 3ª hora: 120 XP (~2.00 XP/min)
      // Mínimo: 10 XP por checkout
      // =============================================
      const calculateWorkXP = (hours: number): number => {
        if (hours <= 0) return 10; // Mínimo 10 XP

        const completeHours = Math.floor(hours);
        const partialHour = hours - completeHours;

        // XP para horas completas: sum(90 + 10*h) para h de 1 a N
        // = 90*N + 10*(N*(N+1)/2) = 90*N + 5*N*(N+1)
        let totalXP = 0;
        if (completeHours > 0) {
          totalXP = 90 * completeHours + 5 * completeHours * (completeHours + 1);
        }

        // XP proporcional para hora parcial
        // Próxima hora seria: 90 + 10*(completeHours + 1) = 100 + 10*completeHours
        if (partialHour > 0) {
          const nextHourXP = 100 + 10 * completeHours;
          totalXP += Math.round(nextHourXP * partialHour);
        }

        // Garantir mínimo de 10 XP
        return Math.max(totalXP, 10);
      };

      const workXP = calculateWorkXP(hoursWorked);
      const minutesWorked = Math.round(hoursWorked * 60);

      // Log para debug
      console.log(`[XP Checkout] User: ${req.user!.sub}, Hours: ${hoursWorked.toFixed(2)}, Minutes: ${minutesWorked}, XP: ${workXP}`);

      // Criar transação de XP
      await prisma.xpTransaction.create({
        data: {
          userId: req.user!.sub,
          amount: workXP,
          type: 'CHECKOUT',
          reason: minutesWorked >= 60
            ? `${hoursWorked.toFixed(1)}h trabalhadas em ${checkin.project.title}`
            : `${minutesWorked}min trabalhados em ${checkin.project.title}`,
          checkinId: checkin.id,
          projectId: checkin.projectId,
        },
      });

      // Atualizar XP total do usuário
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.sub },
        data: {
          xpTotal: { increment: workXP },
        },
        select: { xpTotal: true, level: true },
      });

      // Formatar tempo para exibição
      const timeDisplay = minutesWorked >= 60
        ? `${hoursWorked.toFixed(1)}h`
        : `${minutesWorked}min`;

      console.log(`[XP Checkout] Success! Total XP now: ${updatedUser.xpTotal}`);

      res.json({
        success: true,
        data: {
          ...updatedCheckin,
          hoursWorked: Number(updatedCheckin.hoursWorked),
        },
        xp: {
          earned: workXP,
          reason: `${timeDisplay} trabalhados`,
          total: updatedUser.xpTotal,
          level: updatedUser.level,
          breakdown: {
            minutes: minutesWorked,
            hours: hoursWorked,
            formula: '~1.67 XP/min (1ª hora) → ~1.83 XP/min (2ª hora) → +0.17 XP/min por hora',
          },
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

// GET /api/mobile/earnings - Get user's earnings with role-based calculation
router.get(
  '/earnings',
  mobileAuth,
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get user's current role and punctuality data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          xpTotal: true,
          punctualityStreak: true,
          punctualityMultiplier: true,
          lastPunctualDate: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }

      // Get daily work summaries (already processed with role snapshots)
      const dailySummaries = await prisma.dailyWorkSummary.findMany({
        where: {
          userId,
          workDate: { gte: startDate, lte: endDate },
        },
        orderBy: { workDate: 'desc' },
      });

      // Get all checkins for the month (including today's unprocessed)
      const checkins = await prisma.checkin.findMany({
        where: {
          userId,
          checkinAt: { gte: startDate, lte: endDate },
          checkoutAt: { not: null },
        },
        include: {
          project: {
            select: { id: true, title: true, cliente: true, isTravelMode: true },
          },
        },
        orderBy: { checkinAt: 'desc' },
      });

      // Get XP transactions for the month
      const xpTransactions = await prisma.xpTransaction.findMany({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          project: {
            select: { id: true, title: true },
          },
        },
      });

      // Import role rates for calculation
      const { getRoleRates, calculatePayment } = await import('../../config/payroll.config');

      // Calculate totals from daily summaries
      let totalEarnings = 0;
      let totalHoursNormal = 0;
      let totalHoursOvertime = 0;
      let totalHoursTravelMode = 0;
      let totalHoursTravel = 0;
      let totalHoursSupplies = 0;
      let totalLunchPenaltyXP = 0;

      for (const summary of dailySummaries) {
        totalEarnings += Number(summary.totalPayment) || 0;
        totalHoursNormal += Number(summary.hoursNormal) || 0;
        totalHoursOvertime += Number(summary.hoursOvertime) || 0;
        totalHoursTravelMode += Number(summary.hoursTravelMode) || 0;
        totalHoursTravel += Number(summary.hoursTravel) || 0;
        totalHoursSupplies += Number(summary.hoursSupplies) || 0;
        totalLunchPenaltyXP += summary.lunchPenaltyXP || 0;
      }

      // Calculate today's unprocessed earnings (if any)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todaysCheckins = checkins.filter((c) => {
        const checkinDate = new Date(c.checkinAt);
        return checkinDate >= today && checkinDate <= todayEnd;
      });

      // Check if today has already been processed
      const todayProcessed = dailySummaries.some((s) => {
        const summaryDate = new Date(s.workDate);
        return summaryDate >= today && summaryDate <= todayEnd;
      });

      let todayEarnings = 0;
      let todayHours = 0;

      if (!todayProcessed && todaysCheckins.length > 0) {
        const rates = getRoleRates(user.role);
        if (rates) {
          for (const checkin of todaysCheckins) {
            const hours = Number(checkin.hoursWorked) || 0;
            todayHours += hours;
            // Simple calculation for today (full breakdown happens at 23:59)
            todayEarnings += hours * rates.hourlyRate;
          }
        }
      }

      // Group checkins by project for breakdown
      const projectMap = new Map<string, {
        project: { id: string; title: string; cliente: string | null; isTravelMode: boolean };
        hours: number;
        hoursNormal: number;
        hoursOvertime: number;
        hoursTravel: number;
        hoursSupplies: number;
        earnings: number;
        checkins: number;
        xpEarned: number;
        xpPenalty: number;
      }>();

      // Calculate per-project earnings with proper rates
      const rates = getRoleRates(user.role);

      for (const checkin of checkins) {
        if (!checkin.project) continue;

        const projectId = checkin.project.id;
        let entry = projectMap.get(projectId);

        if (!entry) {
          entry = {
            project: checkin.project,
            hours: 0,
            hoursNormal: 0,
            hoursOvertime: 0,
            hoursTravel: 0,
            hoursSupplies: 0,
            earnings: 0,
            checkins: 0,
            xpEarned: 0,
            xpPenalty: 0,
          };
          projectMap.set(projectId, entry);
        }

        const hours = Number(checkin.hoursWorked) || 0;
        entry.hours += hours;
        entry.checkins += 1;

        // Calculate earnings based on checkout reason and project type
        const reason = (checkin as any).checkoutReason;

        if (rates && hours > 0) {
          if (reason === 'OUTRO_PROJETO') {
            // Deslocamento para outro projeto - taxa normal
            entry.hoursTravel += hours;
            entry.earnings += hours * rates.hourlyRate;
          } else if (reason === 'COMPRA_INSUMOS') {
            // Compra de insumos - taxa normal
            entry.hoursSupplies += hours;
            entry.earnings += hours * rates.hourlyRate;
          } else {
            // Trabalho normal - verificar se projeto é travel mode
            entry.hoursNormal += hours;
            if (checkin.project.isTravelMode) {
              // Travel mode: +20%
              entry.earnings += hours * rates.travelRate;
            } else {
              // Taxa normal
              entry.earnings += hours * rates.hourlyRate;
            }
          }
        }
      }

      // Calculate actual total earnings from DailyWorkSummary (correct historical values)
      const actualTotalEarnings = totalEarnings + todayEarnings;

      // Proportionally distribute total earnings across projects based on hours
      // This ensures project earnings sum equals total earnings (fixing role change discrepancy)
      let totalProjectHours = 0;
      for (const entry of projectMap.values()) {
        totalProjectHours += entry.hours;
      }

      if (totalProjectHours > 0) {
        for (const entry of projectMap.values()) {
          // Proportional earnings = total * (project hours / total hours)
          entry.earnings = actualTotalEarnings * (entry.hours / totalProjectHours);
        }
      }

      // No overtime bonus needed since we're using proportional distribution
      const overtimeBonus = 0;

      // Add XP data to projects
      for (const tx of xpTransactions) {
        if (tx.projectId) {
          const entry = projectMap.get(tx.projectId);
          if (entry) {
            if (tx.amount > 0) {
              entry.xpEarned += tx.amount;
            } else {
              entry.xpPenalty += Math.abs(tx.amount);
            }
          }
        }
      }

      // Calculate total XP earned and penalties
      const totalXpEarned = xpTransactions
        .filter((tx) => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalXpPenalty = xpTransactions
        .filter((tx) => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      // Convert project map to array
      const byProject = Array.from(projectMap.values()).map((entry) => ({
        project: {
          id: entry.project.id,
          title: entry.project.title,
          cliente: entry.project.cliente,
          isTravelMode: entry.project.isTravelMode,
        },
        hours: Math.round(entry.hours * 100) / 100,
        hoursNormal: Math.round(entry.hoursNormal * 100) / 100,
        hoursOvertime: Math.round(entry.hoursOvertime * 100) / 100,
        hoursTravel: Math.round(entry.hoursTravel * 100) / 100,
        hoursSupplies: Math.round(entry.hoursSupplies * 100) / 100,
        earnings: Math.round(entry.earnings * 100) / 100,
        checkins: entry.checkins,
        xpEarned: entry.xpEarned,
        xpPenalty: entry.xpPenalty,
      }));

      // Sort by earnings descending
      byProject.sort((a, b) => b.earnings - a.earnings);

      // Get current role rates for display
      const currentRates = getRoleRates(user.role);

      res.json({
        success: true,
        data: {
          month,
          year,
          currentRole: user.role,
          currentRates: currentRates ? {
            dailyRate: currentRates.dailyRate,
            hourlyRate: currentRates.hourlyRate,
            overtimeRate: currentRates.overtimeRate,
            travelRate: currentRates.travelRate,
            travelOvertimeRate: currentRates.travelOvertimeRate,
          } : null,
          summary: {
            totalEarnings: Math.round((totalEarnings + todayEarnings) * 100) / 100,
            totalHours: Math.round((totalHoursNormal + totalHoursOvertime + totalHoursTravelMode + totalHoursTravel + totalHoursSupplies + todayHours) * 100) / 100,
            hoursNormal: Math.round(totalHoursNormal * 100) / 100,
            hoursOvertime: Math.round(totalHoursOvertime * 100) / 100,
            hoursTravelMode: Math.round(totalHoursTravelMode * 100) / 100,
            hoursTravel: Math.round(totalHoursTravel * 100) / 100,
            hoursSupplies: Math.round(totalHoursSupplies * 100) / 100,
            overtimeBonus: Math.round(overtimeBonus * 100) / 100,
            todayEarnings: Math.round(todayEarnings * 100) / 100,
            todayHours: Math.round(todayHours * 100) / 100,
          },
          xp: {
            total: user.xpTotal,
            earnedThisMonth: totalXpEarned,
            penaltyThisMonth: totalXpPenalty,
            lunchPenalty: totalLunchPenaltyXP,
          },
          punctuality: {
            streak: user.punctualityStreak,
            multiplier: Number(user.punctualityMultiplier),
            lastPunctualDate: user.lastPunctualDate,
          },
          byProject,
          dailySummaries: dailySummaries.map((s) => ({
            date: s.workDate,
            role: s.userRole,
            hoursWorked: Number(s.totalHoursWorked) || 0,
            earnings: Number(s.totalPayment) || 0,
            lunchPenaltyXP: s.lunchPenaltyXP,
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

// POST /api/mobile/location/gps-off-logs - Receive GPS off period logs
router.post('/location/gps-off-logs', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_LOGS', message: 'Logs inválidos' },
      });
    }

    console.log(`[GPS Logs] Recebido ${logs.length} log(s) de GPS off do usuário ${userId}`);

    // Log GPS off periods to console for monitoring
    // Could be extended to store in a dedicated table in the future
    for (const log of logs) {
      const logEntry = {
        userId,
        durationMinutes: log.durationMinutes,
        startTime: log.startTime,
        endTime: log.endTime,
        hadActiveCheckin: log.hadActiveCheckin,
        checkinId: log.checkinId,
      };

      console.log(`[GPS Log] User ${userId}: GPS off for ${log.durationMinutes} min (${log.startTime} - ${log.endTime}), checkin: ${log.hadActiveCheckin}`);

      // If there was an active check-in, we might want to flag it
      if (log.hadActiveCheckin && log.checkinId) {
        console.warn(`[GPS Warning] User ${userId} had GPS off during active checkin ${log.checkinId}`);
      }
    }

    res.json({
      success: true,
      message: `${logs.length} log(s) recebido(s)`,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// HELP REQUESTS (Material ou Ajuda)
// =============================================

// Multer configuration for help request files (memory storage for PostgreSQL)
const uploadHelpRequest = multer({
  storage: multer.memoryStorage(),
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

      // Get files and save to PostgreSQL
      const audioFile = files?.audio?.[0];
      const videoFile = files?.video?.[0];

      let audioUrl: string | null = null;
      let videoUrl: string | null = null;

      if (audioFile) {
        const savedAudio = await saveFile({
          filename: audioFile.originalname,
          mimetype: audioFile.mimetype,
          data: audioFile.buffer,
          type: 'HELP_REQUEST' as UploadType,
          userId,
        });
        audioUrl = savedAudio.url;
      }

      if (videoFile) {
        const savedVideo = await saveFile({
          filename: videoFile.originalname,
          mimetype: videoFile.mimetype,
          data: videoFile.buffer,
          type: 'HELP_REQUEST' as UploadType,
          userId,
        });
        videoUrl = savedVideo.url;
      }

      // Transcribe audio automatically if no transcription provided
      let finalAudioTranscription = audioTranscription || null;
      if (audioFile && !audioTranscription) {
        try {
          console.log(`[Whisper] Transcribing audio from buffer`);
          const transcriptionResult = await whisperService.transcribeFromBuffer(audioFile.buffer, audioFile.originalname);
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
          role: assignment.projectRole || 'APLICADOR_I',
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
        return res.status(500).json({
          success: false,
          error: { code: 'NO_API_KEY', message: 'API de transcricao nao configurada.' },
        });
      }

      try {
        // Use whisper service with buffer (memoryStorage)
        const result = await whisperService.transcribeFromBuffer(audioFile.buffer, audioFile.originalname);

        res.json({
          success: true,
          data: {
            transcription: result.text,
          },
        });
      } catch (apiError) {
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

// Multer configuration for feed images (memory storage for PostgreSQL)
const uploadFeedImage = multer({
  storage: multer.memoryStorage(),
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

      // Handle image - save to PostgreSQL
      let imageUrl: string | null = null;
      if (req.file) {
        const savedImage = await saveFile({
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          data: req.file.buffer,
          type: 'FEED' as UploadType,
          userId,
        });
        imageUrl = savedImage.url;
      } else if (imageBase64) {
        // Save base64 image to PostgreSQL
        const matches = imageBase64.match(/^data:image\/([a-z]+);base64,(.+)$/i);
        if (matches) {
          const ext = matches[1];
          const data = matches[2];
          const filename = `feed-${Date.now()}.${ext}`;
          const mimeMap: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
          };
          const savedImage = await saveFile({
            filename,
            mimetype: mimeMap[ext.toLowerCase()] || `image/${ext}`,
            data: Buffer.from(data, 'base64'),
            type: 'FEED' as UploadType,
            userId,
          });
          imageUrl = savedImage.url;
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

      // Delete image file from database if exists
      if (post.imageUrl && post.imageUrl.startsWith('/files/')) {
        const fileId = post.imageUrl.replace('/files/', '');
        await deleteFile(fileId);
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

// =============================================
// PROJECT TASKS (Tarefas do projeto)
// =============================================

// GET /api/mobile/projects/:projectId/tasks - Get tasks for a project
router.get(
  '/projects/:projectId/tasks',
  mobileAuth,
  [param('projectId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const projectId = req.params.projectId;
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

      // Get all PUBLISHED tasks for the project, ordered by sortOrder
      const tasks = await prisma.projectTask.findMany({
        where: {
          projectId,
          publishedToApp: true,
        },
        orderBy: { sortOrder: 'asc' },
      });

      // Organize tasks by phase
      const tasksByPhase = {
        PREPARO: tasks.filter((t) => t.phase === 'PREPARO'),
        APLICACAO: tasks.filter((t) => t.phase === 'APLICACAO'),
        ACABAMENTO: tasks.filter((t) => t.phase === 'ACABAMENTO'),
      };

      // Helper function to calculate phase deadline and remaining days
      const calculatePhaseDeadline = (phaseTasks: typeof tasks) => {
        const tasksWithEndDate = phaseTasks.filter((t) => t.endDate !== null);
        if (tasksWithEndDate.length === 0) return { deadline: null, daysRemaining: null };

        // Get the latest endDate for this phase
        const maxEndDate = new Date(Math.max(...tasksWithEndDate.map((t) => t.endDate!.getTime())));

        // Calculate days remaining (considering only calendar days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        maxEndDate.setHours(0, 0, 0, 0);

        const diffTime = maxEndDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          deadline: maxEndDate.toISOString(),
          daysRemaining: daysRemaining,
        };
      };

      // Calculate deadlines for each phase
      const phaseDeadlines = {
        PREPARO: calculatePhaseDeadline(tasksByPhase.PREPARO),
        APLICACAO: calculatePhaseDeadline(tasksByPhase.APLICACAO),
        ACABAMENTO: calculatePhaseDeadline(tasksByPhase.ACABAMENTO),
      };

      // Calculate progress by phase
      const phaseProgress = {
        PREPARO: {
          completed: tasksByPhase.PREPARO.filter((t) => t.status === 'COMPLETED').length,
          total: tasksByPhase.PREPARO.length,
          percentage: tasksByPhase.PREPARO.length > 0
            ? Math.round((tasksByPhase.PREPARO.filter((t) => t.status === 'COMPLETED').length / tasksByPhase.PREPARO.length) * 100)
            : 0,
        },
        APLICACAO: {
          completed: tasksByPhase.APLICACAO.filter((t) => t.status === 'COMPLETED').length,
          total: tasksByPhase.APLICACAO.length,
          percentage: tasksByPhase.APLICACAO.length > 0
            ? Math.round((tasksByPhase.APLICACAO.filter((t) => t.status === 'COMPLETED').length / tasksByPhase.APLICACAO.length) * 100)
            : 0,
        },
        ACABAMENTO: {
          completed: tasksByPhase.ACABAMENTO.filter((t) => t.status === 'COMPLETED').length,
          total: tasksByPhase.ACABAMENTO.length,
          percentage: tasksByPhase.ACABAMENTO.length > 0
            ? Math.round((tasksByPhase.ACABAMENTO.filter((t) => t.status === 'COMPLETED').length / tasksByPhase.ACABAMENTO.length) * 100)
            : 0,
        },
      };

      // Determine current active phase
      // Rule: PREPARO must be 100% complete before APLICACAO is available
      //       APLICACAO must be 100% complete before ACABAMENTO is available
      let currentPhase: 'PREPARO' | 'APLICACAO' | 'ACABAMENTO' = 'PREPARO';
      const phaseUnlocked = {
        PREPARO: true,
        APLICACAO: phaseProgress.PREPARO.percentage === 100,
        ACABAMENTO: phaseProgress.PREPARO.percentage === 100 && phaseProgress.APLICACAO.percentage === 100,
      };

      if (phaseProgress.PREPARO.percentage === 100) {
        currentPhase = 'APLICACAO';
        if (phaseProgress.APLICACAO.percentage === 100) {
          currentPhase = 'ACABAMENTO';
        }
      }

      // Get tasks for the current phase (only pending/in_progress ones)
      const currentPhaseTasks = tasksByPhase[currentPhase].filter(
        (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
      );

      // Total progress
      const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
      const totalCount = tasks.length;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Map task for response
      const mapTask = (t: typeof tasks[0]) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        taskType: t.taskType,
        color: t.color,
        status: t.status,
        sortOrder: t.sortOrder,
        phase: t.phase,
        surface: t.surface,
        progress: t.progress,
        completionType: t.completionType,
        estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
      });

      res.json({
        success: true,
        data: {
          // Current phase info
          currentPhase,
          phaseUnlocked,

          // Tasks for current phase (what should be shown now)
          currentPhaseTasks: currentPhaseTasks.map(mapTask),

          // All tasks organized by phase
          tasksByPhase: {
            PREPARO: tasksByPhase.PREPARO.map(mapTask),
            APLICACAO: tasksByPhase.APLICACAO.map(mapTask),
            ACABAMENTO: tasksByPhase.ACABAMENTO.map(mapTask),
          },

          // Progress by phase
          phaseProgress,

          // Phase deadlines with days remaining
          phaseDeadlines,

          // Total project progress
          projectProgress: {
            completed: completedCount,
            total: totalCount,
            percentage,
          },

          // Legacy support - currentTaskBlock for backward compatibility
          currentTaskBlock: currentPhaseTasks.map(mapTask),
          allTasks: tasks.map(mapTask),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/tasks/:taskId/toggle-complete - Toggle task completion during active check-in
// Accepts optional body: { completionType: 'INTEGRAL' | 'PARTIAL', progress: number (0-100) }
router.post(
  '/tasks/:taskId/toggle-complete',
  mobileAuth,
  [param('taskId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.sub;
      const { completionType, progress: progressValue } = req.body;

      // Check if user has active check-in
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          userId,
          checkoutAt: null,
        },
        include: {
          project: { select: { id: true, title: true } },
        },
      });

      if (!activeCheckin) {
        throw new AppError('Voce precisa estar em check-in para marcar tarefas', 400, 'NO_ACTIVE_CHECKIN');
      }

      // Verify task exists and belongs to the project
      const task = await prisma.projectTask.findFirst({
        where: {
          id: taskId,
          projectId: activeCheckin.projectId,
          publishedToApp: true,
        },
      });

      if (!task) {
        throw new AppError('Tarefa nao encontrada', 404, 'TASK_NOT_FOUND');
      }

      // Check if task is already completed in this check-in
      const existingCompletion = await prisma.taskCompletion.findUnique({
        where: {
          projectTaskId_checkinId: {
            projectTaskId: taskId,
            checkinId: activeCheckin.id,
          },
        },
      });

      let isCompleted = false;
      let xpEarned = 0;
      let taskProgress = 0;
      let taskCompletionType: 'INTEGRAL' | 'PARTIAL' | null = null;

      if (existingCompletion && !completionType) {
        // Task is already completed and no new completion type specified - remove completion (toggle off)
        await prisma.taskCompletion.delete({
          where: { id: existingCompletion.id },
        });

        // Update task status back to PENDING if no other completions exist
        const otherCompletions = await prisma.taskCompletion.findFirst({
          where: { projectTaskId: taskId },
        });

        if (!otherCompletions) {
          await prisma.projectTask.update({
            where: { id: taskId },
            data: {
              status: 'PENDING',
              progress: 0,
              completionType: null,
            },
          });
        }

        isCompleted = false;
        taskProgress = 0;
      } else {
        // Determine completion type and progress
        const isPartial = completionType === 'PARTIAL';
        taskCompletionType = isPartial ? 'PARTIAL' : 'INTEGRAL';
        taskProgress = isPartial ? (progressValue || 50) : 100;

        // XP based on completion type
        const baseXP = 50;
        xpEarned = isPartial ? Math.round(baseXP * (taskProgress / 100)) : baseXP;

        if (existingCompletion) {
          // Update existing completion
          await prisma.taskCompletion.update({
            where: { id: existingCompletion.id },
            data: { completedAt: new Date() },
          });
        } else {
          // Create new completion
          await prisma.taskCompletion.create({
            data: {
              projectTaskId: taskId,
              userId,
              checkinId: activeCheckin.id,
            },
          });
        }

        // Update task status and progress
        await prisma.projectTask.update({
          where: { id: taskId },
          data: {
            status: isPartial ? 'IN_PROGRESS' : 'COMPLETED',
            progress: taskProgress,
            completionType: taskCompletionType,
          },
        });

        // Award XP for task completion (only if not previously completed or upgrading)
        if (!existingCompletion || taskProgress > task.progress) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xpTotal: true },
          });

          if (user) {
            await prisma.user.update({
              where: { id: userId },
              data: { xpTotal: user.xpTotal + xpEarned },
            });

            await prisma.xpTransaction.create({
              data: {
                userId,
                amount: xpEarned,
                type: 'TASK_COMPLETED',
                reason: `Tarefa "${task.title}" ${isPartial ? `${taskProgress}% concluida` : 'concluida'}`,
                projectId: activeCheckin.projectId,
              },
            });
          }
        } else {
          xpEarned = 0; // No XP if downgrading or re-completing
        }

        isCompleted = taskProgress === 100;
      }

      // Get updated progress including phase progress
      const allTasks = await prisma.projectTask.findMany({
        where: { projectId: activeCheckin.projectId, publishedToApp: true },
      });

      // Calculate phase progress
      const tasksByPhase = {
        PREPARO: allTasks.filter((t) => t.phase === 'PREPARO'),
        APLICACAO: allTasks.filter((t) => t.phase === 'APLICACAO'),
        ACABAMENTO: allTasks.filter((t) => t.phase === 'ACABAMENTO'),
      };

      const phaseProgress = {
        PREPARO: {
          completed: tasksByPhase.PREPARO.filter((t) => t.status === 'COMPLETED').length,
          total: tasksByPhase.PREPARO.length,
          percentage: tasksByPhase.PREPARO.length > 0
            ? Math.round((tasksByPhase.PREPARO.filter((t) => t.status === 'COMPLETED').length / tasksByPhase.PREPARO.length) * 100)
            : 0,
        },
        APLICACAO: {
          completed: tasksByPhase.APLICACAO.filter((t) => t.status === 'COMPLETED').length,
          total: tasksByPhase.APLICACAO.length,
          percentage: tasksByPhase.APLICACAO.length > 0
            ? Math.round((tasksByPhase.APLICACAO.filter((t) => t.status === 'COMPLETED').length / tasksByPhase.APLICACAO.length) * 100)
            : 0,
        },
        ACABAMENTO: {
          completed: tasksByPhase.ACABAMENTO.filter((t) => t.status === 'COMPLETED').length,
          total: tasksByPhase.ACABAMENTO.length,
          percentage: tasksByPhase.ACABAMENTO.length > 0
            ? Math.round((tasksByPhase.ACABAMENTO.filter((t) => t.status === 'COMPLETED').length / tasksByPhase.ACABAMENTO.length) * 100)
            : 0,
        },
      };

      // Determine unlocked phases
      const phaseUnlocked = {
        PREPARO: true,
        APLICACAO: phaseProgress.PREPARO.percentage === 100,
        ACABAMENTO: phaseProgress.PREPARO.percentage === 100 && phaseProgress.APLICACAO.percentage === 100,
      };

      // Determine current phase
      let currentPhase: 'PREPARO' | 'APLICACAO' | 'ACABAMENTO' = 'PREPARO';
      if (phaseProgress.PREPARO.percentage === 100) {
        currentPhase = 'APLICACAO';
        if (phaseProgress.APLICACAO.percentage === 100) {
          currentPhase = 'ACABAMENTO';
        }
      }

      const completedCount = allTasks.filter((t) => t.status === 'COMPLETED').length;

      res.json({
        success: true,
        data: {
          taskId,
          isCompleted,
          xpEarned,
          taskProgress,
          completionType: taskCompletionType,
          progress: {
            completed: completedCount,
            total: allTasks.length,
            percentage: Math.round((completedCount / allTasks.length) * 100),
          },
          phaseProgress,
          phaseUnlocked,
          currentPhase,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/checkins/:id/complete-tasks - Complete checkout with task completions
router.post(
  '/checkins/:id/complete-tasks',
  mobileAuth,
  [
    param('id').isUUID(),
    body('completedTaskIds').isArray(),
    body('completedTaskIds.*').isUUID(),
    body('taskCompletions').optional().isArray(),
    body('taskCompletions.*.taskId').optional().isUUID(),
    body('taskCompletions.*.completionType').optional().isIn(['INTEGRAL', 'PARTIAL']),
    body('taskCompletions.*.progress').optional().isInt({ min: 0, max: 100 }),
    body('checkoutReason').isIn(['OUTRO_PROJETO', 'FIM_EXPEDIENTE']),
    body('reportOption').isIn(['NOW', 'LATER_60MIN', 'SKIP']),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const checkinId = req.params.id;
      const userId = req.user!.sub;
      const { completedTaskIds, taskCompletions: taskCompletionsBody, checkoutReason, reportOption, latitude, longitude } = req.body;

      // Build a map of task completions for quick lookup
      const taskCompletionsMap: Record<string, { completionType: string; progress: number }> = {};
      if (taskCompletionsBody && Array.isArray(taskCompletionsBody)) {
        for (const tc of taskCompletionsBody) {
          if (tc.taskId) {
            taskCompletionsMap[tc.taskId] = {
              completionType: tc.completionType || 'INTEGRAL',
              progress: tc.progress || 100,
            };
          }
        }
      }

      // Get the checkin
      const checkin = await prisma.checkin.findFirst({
        where: {
          id: checkinId,
          userId,
          checkoutAt: null,
        },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
      });

      if (!checkin) {
        throw new AppError('Check-in nao encontrado', 404, 'CHECKIN_NOT_FOUND');
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Calculate hours worked
      const checkoutAt = new Date();
      const hoursWorked = (checkoutAt.getTime() - checkin.checkinAt.getTime()) / (1000 * 60 * 60);

      // Update checkin with checkout
      const updatedCheckin = await prisma.checkin.update({
        where: { id: checkinId },
        data: {
          checkoutAt,
          checkoutLatitude: latitude,
          checkoutLongitude: longitude,
          checkoutReason,
          hoursWorked,
        },
      });

      // Update user's total hours
      await prisma.user.update({
        where: { id: userId },
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

      // Update UserLocation
      await prisma.userLocation.updateMany({
        where: { userId },
        data: {
          currentProjectId: null,
          isOnline: false,
          isOutOfArea: false,
          distanceFromProject: null,
        },
      });

      // Record task completions
      let tasksCompleted = 0;
      let totalTaskXP = 0;
      const taskXpPerTask = 50; // 50 XP per 100% task

      if (completedTaskIds && completedTaskIds.length > 0) {
        // Verify all tasks belong to this project and are NOT already completed
        const validTasks = await prisma.projectTask.findMany({
          where: {
            id: { in: completedTaskIds },
            projectId: checkin.projectId,
            // Only process tasks that are not already COMPLETED
            status: { not: 'COMPLETED' },
          },
        });

        for (const task of validTasks) {
          // Get completion details from the map or use defaults
          const completion = taskCompletionsMap[task.id] || { completionType: 'INTEGRAL', progress: 100 };
          const isIntegral = completion.completionType === 'INTEGRAL';
          const oldProgress = task.progress || 0;

          // For INTEGRAL, always set to 100%
          // For PARTIAL, never decrease progress - use max of old and new
          const requestedProgress = isIntegral ? 100 : completion.progress;
          const newProgress = isIntegral ? 100 : Math.max(requestedProgress, oldProgress);
          const progressGain = Math.max(0, newProgress - oldProgress);

          // Skip if no progress gain (task already at this level or higher)
          if (progressGain === 0) {
            continue;
          }

          // COMPLETED only when 100%, otherwise IN_PROGRESS
          const newStatus = newProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';

          // Create task completion record (tracks who contributed)
          await prisma.taskCompletion.create({
            data: {
              projectTaskId: task.id,
              userId,
              checkinId,
            },
          }).catch(() => {
            // Ignore if already exists (unique constraint)
          });

          // Update task status and progress
          await prisma.projectTask.update({
            where: { id: task.id },
            data: {
              status: newStatus,
              progress: newProgress,
              completionType: isIntegral ? 'INTEGRAL' : 'PARTIAL',
            },
          });

          // Calculate XP based on progress gain (proportional to 50 XP for 100%)
          const xpForThisTask = Math.round((progressGain / 100) * taskXpPerTask);
          totalTaskXP += xpForThisTask;
          tasksCompleted++;
        }

        // Create XP transaction for tasks
        if (totalTaskXP > 0) {
          await prisma.xpTransaction.create({
            data: {
              userId,
              amount: totalTaskXP,
              type: 'TASK_COMPLETED',
              reason: `${tasksCompleted} tarefa(s) atualizada(s) em ${checkin.project.title}`,
              checkinId,
              projectId: checkin.projectId,
            },
          });

          await prisma.user.update({
            where: { id: userId },
            data: { xpTotal: { increment: totalTaskXP } },
          });
        }
      }

      // Calculate work XP (same formula as regular checkout)
      const calculateWorkXP = (hours: number): number => {
        if (hours <= 0) return 10;
        const completeHours = Math.floor(hours);
        const partialHour = hours - completeHours;
        let totalXP = 0;
        if (completeHours > 0) {
          totalXP = 90 * completeHours + 5 * completeHours * (completeHours + 1);
        }
        if (partialHour > 0) {
          const nextHourXP = 100 + 10 * completeHours;
          totalXP += Math.round(nextHourXP * partialHour);
        }
        return Math.max(totalXP, 10);
      };

      const workXP = calculateWorkXP(hoursWorked);
      const totalXP = workXP + totalTaskXP;

      // Create work XP transaction
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: workXP,
          type: 'CHECKOUT',
          reason: `${hoursWorked.toFixed(1)}h trabalhadas em ${checkin.project.title}`,
          checkinId,
          projectId: checkin.projectId,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { xpTotal: { increment: workXP } },
      });

      // Handle report reminder
      let reportReminder = null;
      let requiresReport = false;

      // Check if a report was already submitted today for this project
      const { wasReportSubmittedToday, createReportReminder } = await import('../../services/report-reminder.service');
      const reportAlreadySubmitted = await wasReportSubmittedToday(checkin.projectId);

      if (!reportAlreadySubmitted) {
        if (reportOption === 'NOW') {
          // Flag that report is required before completing checkout flow
          requiresReport = true;
        } else if (reportOption === 'LATER_60MIN') {
          // Create reminder for 60 minutes from now
          reportReminder = await createReportReminder(userId, checkin.projectId, checkinId);
        }
        // SKIP option - no reminder needed
      }

      // Emit checkout event
      emitCheckout({
        userId,
        userName: user?.name || 'Aplicador',
        projectId: checkin.projectId,
        projectName: checkin.project.title,
        hoursWorked,
        timestamp: checkoutAt,
      });

      // Get final user XP
      const finalUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { xpTotal: true, level: true },
      });

      res.json({
        success: true,
        data: {
          checkin: {
            ...updatedCheckin,
            hoursWorked: Number(updatedCheckin.hoursWorked),
          },
          tasksCompleted,
          reportReminder,
          requiresReport, // If true, frontend should navigate to report screen
          reportAlreadySubmitted, // If true, no report/reminder needed
        },
        xp: {
          workXP,
          taskXP: totalTaskXP,
          totalEarned: totalXP,
          total: finalUser?.xpTotal || 0,
          level: finalUser?.level || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// REPORT REMINDERS
// =============================================

// GET /api/mobile/report-reminders/pending - Get pending reminders
router.get('/report-reminders/pending', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { getPendingReminders } = await import('../../services/report-reminder.service');
    const reminders = await getPendingReminders(userId);

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/mobile/report-reminders/:id/dismiss - Dismiss a reminder
router.post(
  '/report-reminders/:id/dismiss',
  mobileAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const reminderId = req.params.id;
      const { dismissReminder } = await import('../../services/report-reminder.service');
      const dismissed = await dismissReminder(reminderId);

      res.json({
        success: true,
        data: { dismissed },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/reports - Create report (updated to cancel reminders)
// This hook cancels pending reminders when a report is submitted
router.post(
  '/reports/with-reminder-cancel',
  mobileAuth,
  [
    body('projectId').isUUID(),
    body('notes').optional().trim(),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const { projectId, notes, tags } = req.body;

      // Check if user is assigned
      const assignment = await prisma.projectAssignment.findFirst({
        where: {
          userId,
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
          userId,
          projectId,
          checkoutAt: null,
        },
      });

      const report = await prisma.report.create({
        data: {
          userId,
          projectId,
          checkinId: activeCheckin?.id,
          notes,
          tags: tags || [],
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      // Cancel any pending reminders for this user/project
      const { cancelRemindersForUser } = await import('../../services/report-reminder.service');
      await cancelRemindersForUser(userId, projectId);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// XP RANKING
// =============================================

/**
 * GET /api/mobile/ranking/top10
 * Get top 10 applicators by XP
 */
router.get('/ranking/top10', mobileAuth, async (req, res, next) => {
  try {
    const topUsers = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        xpTotal: true,
        level: true,
      },
      orderBy: {
        xpTotal: 'desc',
      },
      take: 10,
    });

    res.json({
      success: true,
      data: topUsers,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// AUTO-CHECKOUT JUSTIFICATION
// =============================================

// POST /api/mobile/checkins/:id/justify-auto-checkout - Justify an auto-checkout
router.post(
  '/checkins/:id/justify-auto-checkout',
  mobileAuth,
  [
    param('id').isUUID(),
    body('justification').isString().trim().isLength({ min: 10, max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      // Find the checkin
      const checkin = await prisma.checkin.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.sub,
          isAutoCheckout: true,
          autoCheckoutJustification: null, // Not yet justified
        },
        include: {
          project: {
            select: { id: true, title: true },
          },
        },
      });

      if (!checkin) {
        throw new AppError(
          'Check-in not found or already justified',
          404,
          'CHECKIN_NOT_FOUND'
        );
      }

      // Update with justification
      const updatedCheckin = await prisma.checkin.update({
        where: { id: checkin.id },
        data: {
          autoCheckoutJustification: req.body.justification,
          autoCheckoutJustifiedAt: new Date(),
        },
      });

      console.log(`[AutoCheckout] User ${req.user!.sub} justified auto-checkout ${checkin.id}: "${req.body.justification}"`);

      res.json({
        success: true,
        message: 'Justificativa registrada com sucesso',
        data: {
          id: updatedCheckin.id,
          projectName: checkin.project.title,
          justification: req.body.justification,
          justifiedAt: updatedCheckin.autoCheckoutJustifiedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/checkins/pending-justifications - Get auto-checkouts pending justification
router.get(
  '/checkins/pending-justifications',
  mobileAuth,
  async (req, res, next) => {
    try {
      const pendingJustifications = await prisma.checkin.findMany({
        where: {
          userId: req.user!.sub,
          isAutoCheckout: true,
          autoCheckoutJustification: null,
        },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
        orderBy: { checkoutAt: 'desc' },
        take: 10,
      });

      res.json({
        success: true,
        data: pendingJustifications.map((c) => ({
          id: c.id,
          projectId: c.projectId,
          projectName: c.project.title,
          projectCliente: c.project.cliente,
          checkinAt: c.checkinAt,
          checkoutAt: c.checkoutAt,
          checkoutDistance: c.checkoutDistance,
          hoursWorked: c.hoursWorked,
        })),
        count: pendingJustifications.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// ABSENCE NOTICE ENDPOINTS
// =============================================

// POST /api/mobile/absences - Register absence notice
router.post(
  '/absences',
  mobileAuth,
  [
    body('absenceDate').isISO8601().withMessage('Data inválida'),
    body('reason').isString().isLength({ min: 3 }).withMessage('Motivo deve ter pelo menos 3 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { absenceDate, reason } = req.body;
      const userId = req.user!.sub;

      const { registerAbsenceNotice } = await import('../../services/absence.service');
      const result = await registerAbsenceNotice(userId, new Date(absenceDate), reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { message: result.message },
        });
      }

      res.status(201).json({
        success: true,
        data: {
          wasAdvanceNotice: result.wasAdvanceNotice,
          xpPenalty: result.xpPenalty,
          multiplierReset: result.multiplierReset,
          message: result.message,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/absences - List user's absences
router.get('/absences', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const { getUserAbsences } = await import('../../services/absence.service');
    const absences = await getUserAbsences(userId);

    res.json({
      success: true,
      data: absences,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/mobile/absences/available-dates - Get available dates for absence notice
router.get('/absences/available-dates', mobileAuth, async (req, res, next) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const count = parseInt(req.query.count as string) || 5;

    const { getAvailableDates } = await import('../../services/absence.service');
    const dates = getAvailableDates(count, offset);

    // Format dates with day of week
    const formattedDates = dates.map((date) => {
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return {
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayNames[date.getDay()],
        dayOfMonth: date.getDate(),
        month: date.getMonth() + 1,
        formatted: `${dayNames[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`,
      };
    });

    res.json({
      success: true,
      data: formattedDates,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/mobile/absences/:date - Cancel absence notice
router.delete(
  '/absences/:date',
  mobileAuth,
  [param('date').isISO8601().withMessage('Data inválida')],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const absenceDate = new Date(req.params.date);

      const { cancelAbsenceNotice } = await import('../../services/absence.service');
      const result = await cancelAbsenceNotice(userId, absenceDate);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { message: result.message },
        });
      }

      res.json({
        success: true,
        data: { message: result.message },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/absences/respond - Respond to unreported absence inquiry
router.post(
  '/absences/respond',
  mobileAuth,
  [
    body('unreportedAbsenceId').isUUID().withMessage('ID inválido'),
    body('response').isIn(['SIM', 'NAO']).withMessage('Resposta deve ser SIM ou NAO'),
    body('reasonOrExplanation').isString().isLength({ min: 3 }).withMessage('Motivo/explicação deve ter pelo menos 3 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { unreportedAbsenceId, response, reasonOrExplanation } = req.body;

      const { handleAbsenceResponse } = await import('../../services/absence.service');
      const result = await handleAbsenceResponse(unreportedAbsenceId, response, reasonOrExplanation);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { message: result.message },
        });
      }

      res.json({
        success: true,
        data: { message: result.message },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/absences/pending-inquiry - Check if user has pending absence inquiry
router.get('/absences/pending-inquiry', mobileAuth, async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const pendingInquiry = await prisma.unreportedAbsence.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: pendingInquiry
        ? {
            id: pendingInquiry.id,
            absenceDate: pendingInquiry.absenceDate,
            detectedAt: pendingInquiry.detectedAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

export { router as mobileRoutes };
