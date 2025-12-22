import { Router } from 'express';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { excelService } from '../../services/excel.service';
import { sendEntryRequest } from '../../services/whatsapp.service';

// Configure multer for Excel file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xlsx, .xls) ou CSV são permitidos'));
    }
  },
});

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
                checkins: {
                  where: {
                    checkoutAt: null,
                    checkinAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                  },
                },
              },
            },
            // Include tasks for current stage calculation
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
        }),
        prisma.project.count({ where }),
      ]);

      res.json({
        success: true,
        data: projects.map((p) => {
          // Calculate current stage from tasks
          const tasks = p.tasks || [];
          const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
          const totalCount = tasks.length;
          const currentTask = tasks.find((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');

          const currentStage = totalCount > 0 ? {
            name: currentTask?.title || 'Concluido',
            completedCount,
            totalCount,
          } : null;

          return {
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
            activeCheckinsCount: p._count.checkins,
            currentStage,
            tasks: undefined, // Don't send full tasks array to client
          };
        }),
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
    body('isNightShift').optional().isBoolean(),
    body('nightShiftSlots').optional().isInt({ min: 1 }),
    body('nightShiftStart').optional().isISO8601(),
    body('nightShiftEnd').optional().isISO8601(),
    body('consultor').optional().trim(),
    body('material').optional().trim(),
    body('cor').optional().trim(),
    // Metragens
    body('m2Total').optional().isFloat({ min: 0 }),
    body('m2Piso').optional().isFloat({ min: 0 }),
    body('m2Parede').optional().isFloat({ min: 0 }),
    body('m2Teto').optional().isFloat({ min: 0 }),
    body('mRodape').optional().isFloat({ min: 0 }),
    body('responsiblePhones').optional().isArray(),
    body('responsiblePhones.*').optional().isString().trim(),
    body('isTravelMode').optional().isBoolean(),
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
        'isNightShift',
        'nightShiftSlots',
        'nightShiftStart',
        'nightShiftEnd',
        'consultor',
        'material',
        'cor',
        // Metragens
        'm2Total',
        'm2Piso',
        'm2Parede',
        'm2Teto',
        'mRodape',
        // Responsible phones
        'responsiblePhones',
        // Cronograma / Horarios
        'workStartTime',
        'workEndTime',
        'deadlineDate',
        'estimatedDays',
        'teamSize',
        'allowSaturday',
        'allowSunday',
        'allowNightWork',
        'isTravelMode',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Convert date fields to Date objects
      const dateFields = ['deadlineDate', 'nightShiftStart', 'nightShiftEnd'];
      for (const field of dateFields) {
        if (updateData[field] && typeof updateData[field] === 'string') {
          updateData[field] = new Date(updateData[field]);
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
      // Get optional date filter (default: today)
      const targetDate = req.query.date ? new Date(req.query.date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);

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

      // Get absences for target date
      const userIds = assignments.map((a) => a.user.id);
      const absences = await prisma.absenceNotice.findMany({
        where: {
          userId: { in: userIds },
          absenceDate: targetDate,
          status: 'CONFIRMED',
        },
        select: {
          userId: true,
          reason: true,
          wasAdvanceNotice: true,
        },
      });

      const absenceMap = new Map(
        absences.map((a) => [a.userId, { reason: a.reason, wasAdvanceNotice: a.wasAdvanceNotice }])
      );

      res.json({
        success: true,
        data: assignments.map((a) => {
          const absence = absenceMap.get(a.user.id);
          return {
            ...a.user,
            projectRole: a.projectRole,
            assignedAt: a.assignedAt,
            hoursOnProject: hoursMap.get(a.user.id)?.hours || 0,
            checkinsCount: hoursMap.get(a.user.id)?.checkins || 0,
            hasAbsenceToday: !!absence,
            absenceReason: absence?.reason || null,
            absenceWasAdvanceNotice: absence?.wasAdvanceNotice || null,
          };
        }),
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
    body('projectRole').optional().isIn(['AUXILIAR', 'PREPARADOR', 'LIDER_PREPARACAO', 'APLICADOR_I', 'APLICADOR_II', 'APLICADOR_III', 'LIDER']),
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
              projectRole: projectRole || 'APLICADOR_I',
              assignedById: req.user!.sub,
              assignedAt: new Date(),
            },
          })
        : await prisma.projectAssignment.create({
            data: {
              userId,
              projectId: req.params.id,
              projectRole: projectRole || 'APLICADOR_I',
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

// POST /api/admin/projects/import - Import projects from Excel
router.post('/import', adminAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Arquivo Excel é obrigatório', 400, 'FILE_REQUIRED');
    }

    // Parse Excel file
    const data = excelService.parseExcel(req.file.buffer);

    if (data.length === 0) {
      throw new AppError('Arquivo Excel está vazio', 400, 'EMPTY_FILE');
    }

    // Import projects
    const result = await excelService.importProjects(data);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: req.user!.sub,
        action: 'IMPORT_PROJECTS',
        entityType: 'Project',
        description: `Imported ${result.total} projects from Excel (${result.created} created, ${result.updated} updated, ${result.errors.length} errors)`,
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Importação concluída',
        total: result.total,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/projects/template - Download Excel template
router.get('/template', adminAuth, async (req, res, next) => {
  try {
    const buffer = excelService.generateTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=modelo_projetos.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/projects/export - Export all projects to Excel
router.get('/export', adminAuth, async (req, res, next) => {
  try {
    const buffer = await excelService.exportProjects();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=projetos_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/projects - Create single project manually
router.post(
  '/',
  adminAuth,
  [
    body('title').trim().isLength({ min: 1 }).withMessage('Título é obrigatório'),
    body('cliente').optional().trim(),
    body('endereco').optional().trim(),
    body('m2Total').optional().isFloat({ min: 0 }),
    body('m2Piso').optional().isFloat({ min: 0 }),
    body('m2Parede').optional().isFloat({ min: 0 }),
    body('m2Teto').optional().isFloat({ min: 0 }),
    body('mRodape').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['EM_EXECUCAO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO']),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const project = await prisma.project.create({
        data: {
          title: req.body.title,
          cliente: req.body.cliente || null,
          endereco: req.body.endereco || null,
          m2Total: req.body.m2Total || 0,
          m2Piso: req.body.m2Piso || 0,
          m2Parede: req.body.m2Parede || 0,
          m2Teto: req.body.m2Teto || 0,
          mRodape: req.body.mRodape || 0,
          status: req.body.status || 'EM_EXECUCAO',
          estimatedHours: req.body.estimatedHours || null,
          consultor: req.body.consultor || null,
          material: req.body.material || null,
          cor: req.body.cor || null,
          latitude: req.body.latitude || null,
          longitude: req.body.longitude || null,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'CREATE_PROJECT',
          entityType: 'Project',
          entityId: project.id,
          newValues: project,
          description: `Created project ${project.title}`,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...project,
          m2Total: Number(project.m2Total),
          m2Piso: Number(project.m2Piso),
          m2Parede: Number(project.m2Parede),
          m2Teto: Number(project.m2Teto),
          mRodape: Number(project.mRodape),
          workedHours: Number(project.workedHours),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/projects - Delete ALL projects (TESTING ONLY)
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.delete('/', adminAuth, async (req, res, next) => {
  try {
    // Delete all related records first
    await prisma.$transaction(async (tx) => {
      // Delete all checkins
      await tx.checkin.deleteMany({});

      // Delete all report photos and reports
      await tx.reportPhoto.deleteMany({});
      await tx.report.deleteMany({});

      // Delete all project assignments
      await tx.projectAssignment.deleteMany({});

      // Delete all project documents
      await tx.projectDocument.deleteMany({});

      // Delete all generated reports
      await tx.generatedReport.deleteMany({});

      // Finally delete all projects
      const deleted = await tx.project.deleteMany({});

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'DELETE_ALL_PROJECTS',
          entityType: 'Project',
          entityId: 'all',
          description: `Deleted all ${deleted.count} projects`,
        },
      });
    });

    res.json({
      success: true,
      message: 'Todos os projetos foram deletados',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/projects/:id - Delete project
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            checkins: true,
            reports: true,
            assignments: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
      });
    }

    // Delete related records first (cascade)
    await prisma.$transaction(async (tx) => {
      // Delete checkins
      await tx.checkin.deleteMany({
        where: { projectId: id },
      });

      // Delete report photos and reports
      const reports = await tx.report.findMany({
        where: { projectId: id },
        select: { id: true },
      });

      if (reports.length > 0) {
        await tx.reportPhoto.deleteMany({
          where: { reportId: { in: reports.map(r => r.id) } },
        });
        await tx.report.deleteMany({
          where: { projectId: id },
        });
      }

      // Delete project assignments
      await tx.projectAssignment.deleteMany({
        where: { projectId: id },
      });

      // Delete project documents
      await tx.projectDocument.deleteMany({
        where: { projectId: id },
      });

      // Delete generated reports
      await tx.generatedReport.deleteMany({
        where: { projectId: id },
      });

      // Finally delete the project
      await tx.project.delete({
        where: { id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'DELETE_PROJECT',
          entityType: 'Project',
          entityId: id,
          oldValues: project,
          description: `Deleted project ${project.title}`,
        },
      });
    });

    res.json({
      success: true,
      message: 'Projeto deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// NIGHT SHIFT INVITE ENDPOINTS
// =============================================

// PUT /api/admin/projects/:id/night-shift - Configure night shift
router.put(
  '/:id/night-shift',
  adminAuth,
  [
    param('id').isUUID(),
    body('slots').optional().isInt({ min: 1 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
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

      const updatedProject = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          isNightShift: true,
          nightShiftSlots: req.body.slots,
          nightShiftStart: req.body.startDate ? new Date(req.body.startDate) : null,
          nightShiftEnd: req.body.endDate ? new Date(req.body.endDate) : null,
        },
      });

      res.json({
        success: true,
        data: updatedProject,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/projects/:id/night-shift/invites - List invites for a project
router.get(
  '/:id/night-shift/invites',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const invites = await prisma.nightShiftInvite.findMany({
        where: { projectId: req.params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              photoUrl: true,
              phone: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { invitedAt: 'desc' },
      });

      // Count by status
      const statusCounts = {
        pending: invites.filter((i) => i.status === 'PENDING').length,
        accepted: invites.filter((i) => i.status === 'ACCEPTED').length,
        declined: invites.filter((i) => i.status === 'DECLINED').length,
        expired: invites.filter((i) => i.status === 'EXPIRED').length,
      };

      res.json({
        success: true,
        data: invites,
        meta: {
          total: invites.length,
          ...statusCounts,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/projects/:id/night-shift/invites - Send invites
router.post(
  '/:id/night-shift/invites',
  adminAuth,
  [
    param('id').isUUID(),
    body('userIds').isArray({ min: 1 }).withMessage('At least one user required'),
    body('userIds.*').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { userIds } = req.body;

      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      if (!project.isNightShift) {
        throw new AppError('Project is not configured as night shift', 400, 'NOT_NIGHT_SHIFT');
      }

      // Check for existing invites
      const existingInvites = await prisma.nightShiftInvite.findMany({
        where: {
          projectId: req.params.id,
          userId: { in: userIds },
        },
        select: { userId: true },
      });

      const existingUserIds = new Set(existingInvites.map((i) => i.userId));
      const newUserIds = userIds.filter((id: string) => !existingUserIds.has(id));

      if (newUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'All selected users already have invites',
        });
      }

      // Create invites
      const invites = await prisma.nightShiftInvite.createMany({
        data: newUserIds.map((userId: string) => ({
          projectId: req.params.id,
          userId,
          invitedById: req.user!.sub,
          status: 'PENDING',
        })),
      });

      // Fetch created invites with user info
      const createdInvites = await prisma.nightShiftInvite.findMany({
        where: {
          projectId: req.params.id,
          userId: { in: newUserIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          created: invites.count,
          skipped: userIds.length - newUserIds.length,
          invites: createdInvites,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/projects/:id/night-shift/invites/:inviteId - Cancel invite
router.delete(
  '/:id/night-shift/invites/:inviteId',
  adminAuth,
  [param('id').isUUID(), param('inviteId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const invite = await prisma.nightShiftInvite.findFirst({
        where: {
          id: req.params.inviteId,
          projectId: req.params.id,
        },
      });

      if (!invite) {
        throw new AppError('Invite not found', 404, 'INVITE_NOT_FOUND');
      }

      await prisma.nightShiftInvite.delete({
        where: { id: req.params.inviteId },
      });

      res.json({
        success: true,
        message: 'Invite cancelled',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// ENTRY REQUEST (Solicitar liberação na portaria)
// =============================================

// POST /api/admin/projects/:id/request-entry - Request entry for team members
router.post(
  '/:id/request-entry',
  adminAuth,
  [
    param('id').isUUID(),
    body('userIds').isArray({ min: 1 }).withMessage('Selecione pelo menos um aplicador'),
    body('userIds.*').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { userIds } = req.body;

      // Get project with responsible phones
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          title: true,
          cliente: true,
          endereco: true,
          responsiblePhones: true,
        },
      });

      if (!project) {
        throw new AppError('Projeto não encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      if (!project.responsiblePhones || project.responsiblePhones.length === 0) {
        throw new AppError(
          'Nenhum telefone de responsável cadastrado para este projeto',
          400,
          'NO_RESPONSIBLE_PHONES'
        );
      }

      // Get selected users with their documents
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          name: true,
          cpf: true,
          phone: true,
          role: true,
        },
      });

      if (users.length === 0) {
        throw new AppError('Nenhum aplicador encontrado', 404, 'USERS_NOT_FOUND');
      }

      // Send WhatsApp messages to responsible phones
      const results = await sendEntryRequest({
        projectName: project.title || project.cliente || 'Projeto',
        projectAddress: project.endereco || 'Endereço não informado',
        responsiblePhones: project.responsiblePhones,
        applicators: users.map((u) => ({
          name: u.name,
          cpf: u.cpf || 'Não informado',
          phone: u.phone || undefined,
          role: u.role,
        })),
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'REQUEST_ENTRY',
          entityType: 'Project',
          entityId: project.id,
          newValues: {
            userIds,
            responsiblePhones: project.responsiblePhones,
          },
          description: `Requested entry for ${users.length} applicator(s) at ${project.title}`,
        },
      });

      res.json({
        success: true,
        data: {
          message: `Solicitação de liberação enviada para ${project.responsiblePhones.length} telefone(s)`,
          applicatorsCount: users.length,
          phonesNotified: project.responsiblePhones,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// FINALIZE PROJECT
// =============================================

/**
 * POST /api/admin/projects/:id/finalize
 * Mark a project as CONCLUIDO (finalized)
 * - Checks if all tasks are COMPLETED
 * - Updates project status to CONCLUIDO
 * - Sets completedAt timestamp
 */
router.post(
  '/:id/finalize',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          tasks: {
            select: { id: true, title: true, status: true },
          },
        },
      });

      if (!project) {
        throw new AppError('Projeto não encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      // Check if already finalized
      if (project.status === 'CONCLUIDO') {
        return res.json({
          success: true,
          data: {
            message: 'Projeto já está finalizado',
            project,
          },
        });
      }

      // Check if all tasks are completed
      const pendingTasks = project.tasks.filter(t => t.status !== 'COMPLETED');

      if (pendingTasks.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TASKS_NOT_COMPLETED',
            message: `Ainda existem ${pendingTasks.length} tarefa(s) não concluída(s)`,
            pendingTasks: pendingTasks.map(t => ({ id: t.id, title: t.title, status: t.status })),
          },
        });
      }

      // Finalize the project
      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          status: 'CONCLUIDO',
          completedAt: new Date(),
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'FINALIZE_PROJECT',
          entityType: 'Project',
          entityId: id,
          oldValues: { status: project.status },
          newValues: { status: 'CONCLUIDO', completedAt: updatedProject.completedAt },
          description: `Finalized project "${project.title}"`,
        },
      });

      console.log(`[Admin] Project ${id} finalized by admin ${req.user!.sub}`);

      res.json({
        success: true,
        data: {
          message: 'Projeto finalizado com sucesso!',
          project: updatedProject,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as projectsRoutes };
