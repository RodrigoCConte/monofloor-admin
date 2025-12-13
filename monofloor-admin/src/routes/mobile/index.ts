import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { mobileAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

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
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        ...user,
        totalHoursWorked: Number(user.totalHoursWorked),
        totalM2Applied: Number(user.totalM2Applied),
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

      const checkin = await prisma.checkin.create({
        data: {
          userId: req.user!.sub,
          projectId,
          checkinLatitude: latitude,
          checkinLongitude: longitude,
        },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
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
    body('reason').optional().isIn(['FIM_EXPEDIENTE', 'OUTRO_PROJETO', 'COMPRA_INSUMOS']),
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
      });

      if (!checkin) {
        throw new AppError('Check-in not found', 404, 'CHECKIN_NOT_FOUND');
      }

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

export { router as mobileRoutes };
