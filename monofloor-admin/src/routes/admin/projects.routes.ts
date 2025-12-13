import { Router } from 'express';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { pipefyService } from '../../services/pipefy.service';

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

// GET /api/admin/projects - List all projects
router.get(
  '/',
  adminAuth,
  [
    query('status').optional().isIn(['EM_EXECUCAO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as ProjectStatus | undefined;
      const search = req.query.search as string | undefined;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { cliente: { contains: search, mode: 'insensitive' } },
          { endereco: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                assignments: { where: { isActive: true } },
                reports: true,
                documents: true,
              },
            },
          },
        }),
        prisma.project.count({ where }),
      ]);

      res.json({
        success: true,
        data: projects.map((p) => ({
          ...p,
          m2Total: Number(p.m2Total),
          m2Piso: Number(p.m2Piso),
          m2Parede: Number(p.m2Parede),
          m2Teto: Number(p.m2Teto),
          mRodape: Number(p.mRodape),
          workedHours: Number(p.workedHours),
          estimatedHours: p.estimatedHours ? Number(p.estimatedHours) : null,
          teamCount: p._count.assignments,
          reportsCount: p._count.reports,
          documentsCount: p._count.documents,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/projects/:id - Get single project
router.get(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          assignments: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  role: true,
                  photoUrl: true,
                },
              },
            },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
          },
          reports: {
            orderBy: { reportDate: 'desc' },
            take: 10,
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      // Calculate hours per team member
      const teamHours = await prisma.checkin.groupBy({
        by: ['userId'],
        where: {
          projectId: req.params.id,
          checkoutAt: { not: null },
        },
        _sum: { hoursWorked: true },
      });

      const teamHoursMap = new Map(
        teamHours.map((t) => [t.userId, Number(t._sum.hoursWorked) || 0])
      );

      res.json({
        success: true,
        data: {
          ...project,
          m2Total: Number(project.m2Total),
          m2Piso: Number(project.m2Piso),
          m2Parede: Number(project.m2Parede),
          m2Teto: Number(project.m2Teto),
          mRodape: Number(project.mRodape),
          workedHours: Number(project.workedHours),
          estimatedHours: project.estimatedHours
            ? Number(project.estimatedHours)
            : null,
          team: project.assignments.map((a) => ({
            ...a.user,
            projectRole: a.projectRole,
            assignedAt: a.assignedAt,
            hoursOnProject: teamHoursMap.get(a.user.id) || 0,
          })),
          recentReports: project.reports.map((r) => ({
            ...r,
            user: r.user,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/projects/:id - Update project
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1 }),
    body('cliente').optional().trim(),
    body('endereco').optional().trim(),
    body('status').optional().isIn(['EM_EXECUCAO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO']),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('workflowDescription').optional().trim(),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('geofenceRadius').optional().isInt({ min: 50, max: 1000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const updateData: any = {};
      const allowedFields = [
        'title',
        'cliente',
        'endereco',
        'status',
        'estimatedHours',
        'workflowDescription',
        'latitude',
        'longitude',
        'geofenceRadius',
        'aiTasksPrompt',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Handle status changes
      if (updateData.status === 'CONCLUIDO' && project.status !== 'CONCLUIDO') {
        updateData.completedAt = new Date();
      }

      if (updateData.status === 'EM_EXECUCAO' && !project.startedAt) {
        updateData.startedAt = new Date();
      }

      const updatedProject = await prisma.project.update({
        where: { id: req.params.id },
        data: updateData,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'UPDATE_PROJECT',
          entityType: 'Project',
          entityId: project.id,
          oldValues: project,
          newValues: updateData,
          description: `Updated project ${project.title}`,
        },
      });

      res.json({
        success: true,
        data: {
          ...updatedProject,
          m2Total: Number(updatedProject.m2Total),
          workedHours: Number(updatedProject.workedHours),
          estimatedHours: updatedProject.estimatedHours
            ? Number(updatedProject.estimatedHours)
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/projects/:id/team - Get project team
router.get(
  '/:id/team',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const assignments = await prisma.projectAssignment.findMany({
        where: {
          projectId: req.params.id,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
              photoUrl: true,
              phone: true,
            },
          },
        },
      });

      // Get hours for each team member
      const hoursData = await prisma.checkin.groupBy({
        by: ['userId'],
        where: {
          projectId: req.params.id,
          checkoutAt: { not: null },
        },
        _sum: { hoursWorked: true },
        _count: true,
      });

      const hoursMap = new Map(
        hoursData.map((h) => [
          h.userId,
          {
            hours: Number(h._sum.hoursWorked) || 0,
            checkins: h._count,
          },
        ])
      );

      res.json({
        success: true,
        data: assignments.map((a) => ({
          ...a.user,
          projectRole: a.projectRole,
          assignedAt: a.assignedAt,
          hoursOnProject: hoursMap.get(a.user.id)?.hours || 0,
          checkinsCount: hoursMap.get(a.user.id)?.checkins || 0,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/projects/:id/team - Add team member
router.post(
  '/:id/team',
  adminAuth,
  [
    param('id').isUUID(),
    body('userId').isUUID(),
    body('projectRole').optional().isIn(['APLICADOR', 'LIDER']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { userId, projectRole } = req.body;

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check existing assignment
      const existing = await prisma.projectAssignment.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId: req.params.id,
          },
        },
      });

      if (existing && existing.isActive) {
        throw new AppError('User already in team', 400, 'ALREADY_ASSIGNED');
      }

      const assignment = existing
        ? await prisma.projectAssignment.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              removedAt: null,
              projectRole: projectRole || 'APLICADOR',
              assignedById: req.user!.sub,
              assignedAt: new Date(),
            },
          })
        : await prisma.projectAssignment.create({
            data: {
              userId,
              projectId: req.params.id,
              projectRole: projectRole || 'APLICADOR',
              assignedById: req.user!.sub,
            },
          });

      res.status(201).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/projects/:id/team/:userId - Remove team member
router.delete(
  '/:id/team/:userId',
  adminAuth,
  [param('id').isUUID(), param('userId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const assignment = await prisma.projectAssignment.findUnique({
        where: {
          userId_projectId: {
            userId: req.params.userId,
            projectId: req.params.id,
          },
        },
      });

      if (!assignment || !assignment.isActive) {
        throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
      }

      await prisma.projectAssignment.update({
        where: { id: assignment.id },
        data: {
          isActive: false,
          removedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: { message: 'Team member removed' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/projects/:id/reports - Get project reports
router.get(
  '/:id/reports',
  adminAuth,
  [
    param('id').isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const where: any = { projectId: req.params.id };

      if (req.query.dateFrom || req.query.dateTo) {
        where.reportDate = {};
        if (req.query.dateFrom) {
          where.reportDate.gte = new Date(req.query.dateFrom as string);
        }
        if (req.query.dateTo) {
          where.reportDate.lte = new Date(req.query.dateTo as string);
        }
      }

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { reportDate: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
            photos: true,
          },
        }),
        prisma.report.count({ where }),
      ]);

      res.json({
        success: true,
        data: reports,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/projects/:id/checkins - Get project checkins
router.get(
  '/:id/checkins',
  adminAuth,
  [
    param('id').isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const where: any = { projectId: req.params.id };

      if (req.query.dateFrom || req.query.dateTo) {
        where.checkinAt = {};
        if (req.query.dateFrom) {
          where.checkinAt.gte = new Date(req.query.dateFrom as string);
        }
        if (req.query.dateTo) {
          where.checkinAt.lte = new Date(req.query.dateTo as string);
        }
      }

      const [checkins, total] = await Promise.all([
        prisma.checkin.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { checkinAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
        }),
        prisma.checkin.count({ where }),
      ]);

      res.json({
        success: true,
        data: checkins.map((c) => ({
          ...c,
          hoursWorked: c.hoursWorked ? Number(c.hoursWorked) : null,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/projects/sync-pipefy - Sync projects from Pipefy
router.post('/sync-pipefy', adminAuth, async (req, res, next) => {
  try {
    const result = await pipefyService.syncProjects();

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: req.user!.sub,
        action: 'SYNC_PIPEFY',
        entityType: 'Project',
        description: `Synced ${result.total} projects from Pipefy (${result.created} created, ${result.updated} updated)`,
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Sync completed successfully',
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as projectsRoutes };
