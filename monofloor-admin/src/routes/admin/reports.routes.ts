import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { gptService } from '../../services/ai/gpt.service';
import prisma from '../../lib/prisma';

const router = Router();

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

// GET /api/admin/reports - List all user-submitted reports (raw reports from mobile)
router.get(
  '/',
  adminAuth,
  [
    query('projectId').optional().isUUID(),
    query('userId').optional().isUUID(),
    query('status').optional().isIn(['DRAFT', 'SUBMITTED', 'PROCESSED']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;

      const where: any = {};

      if (req.query.projectId) {
        where.projectId = req.query.projectId;
      }

      if (req.query.userId) {
        where.userId = req.query.userId;
      }

      if (req.query.status) {
        where.status = req.query.status;
      }

      if (req.query.startDate || req.query.endDate) {
        where.reportDate = {};
        if (req.query.startDate) {
          where.reportDate.gte = new Date(req.query.startDate as string);
        }
        if (req.query.endDate) {
          where.reportDate.lte = new Date(req.query.endDate as string);
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
              select: { id: true, name: true, email: true, photoUrl: true, role: true, phone: true },
            },
            project: {
              select: { id: true, title: true, cliente: true, endereco: true },
            },
            checkin: {
              select: { id: true, checkinAt: true, checkoutAt: true, hoursWorked: true },
            },
            photos: true,
          },
        }),
        prisma.report.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/reports/stats - Get report statistics
// IMPORTANT: This route MUST be defined BEFORE /:id to avoid matching "stats" as an ID
router.get(
  '/stats/overview',
  adminAuth,
  async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [
        totalReports,
        todayReports,
        weekReports,
        pendingReports,
        reportsWithAudio,
        reportsWithPhotos,
      ] = await Promise.all([
        prisma.report.count(),
        prisma.report.count({ where: { reportDate: { gte: today } } }),
        prisma.report.count({ where: { reportDate: { gte: weekAgo } } }),
        prisma.report.count({ where: { status: 'SUBMITTED' } }),
        prisma.report.count({ where: { audioFileUrl: { not: null } } }),
        prisma.report.count({
          where: {
            photos: { some: {} },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalReports,
          todayReports,
          weekReports,
          pendingReports,
          reportsWithAudio,
          reportsWithPhotos,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/reports/:id - Get single report with all details
router.get(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
        include: {
          user: {
            select: { id: true, name: true, email: true, photoUrl: true, role: true, phone: true },
          },
          project: {
            select: { id: true, title: true, cliente: true, endereco: true, status: true },
          },
          checkin: {
            select: { id: true, checkinAt: true, checkoutAt: true, hoursWorked: true, checkinLatitude: true, checkinLongitude: true },
          },
          photos: true,
        },
      });

      if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/reports/:id - Update report status (mark as processed)
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isUUID(),
    body('status').optional().isIn(['DRAFT', 'SUBMITTED', 'PROCESSED']),
    body('adminNotes').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, adminNotes } = req.body;

      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
      });

      if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      const updated = await prisma.report.update({
        where: { id: req.params.id },
        data: {
          ...(status && { status }),
          ...(adminNotes !== undefined && { notes: adminNotes }),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, photoUrl: true },
          },
          project: {
            select: { id: true, title: true, cliente: true },
          },
          photos: true,
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/reports/generate-daily - Generate daily report
router.post(
  '/generate-daily',
  adminAuth,
  [
    body('projectId').isUUID(),
    body('date').isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, date } = req.body;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get reports for the day
      const reports = await prisma.report.findMany({
        where: {
          projectId,
          reportDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { reportDate: 'asc' },
      });

      // Get checkins for the day
      const checkins = await prisma.checkin.findMany({
        where: {
          projectId,
          checkinAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          checkoutAt: { not: null },
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      const totalHours = checkins.reduce(
        (sum, c) => sum + (Number(c.hoursWorked) || 0),
        0
      );

      const teamMembers = [...new Set(checkins.map((c) => c.user.name))];

      const reportData = {
        projectName: project.title,
        projectClient: project.cliente,
        date: startOfDay.toISOString().split('T')[0],
        reports: reports.map((r) => ({
          userName: r.user.name,
          notes: r.notes || '',
          transcription: r.audioTranscription || undefined,
          tags: r.tags as string[],
          time: r.reportDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
        totalHours,
        teamMembers,
      };

      const generatedReport = await gptService.generateDailyReport(reportData);

      // Save generated report
      const saved = await prisma.generatedReport.create({
        data: {
          projectId,
          generatedByAdminId: req.user!.sub,
          type: 'DAILY',
          title: generatedReport.title,
          content: JSON.parse(JSON.stringify(generatedReport)),
          periodStart: startOfDay,
          periodEnd: endOfDay,
          sourceReportIds: reports.map((r) => r.id),
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: saved.id,
          ...generatedReport,
          totalHours,
          teamMembers,
          reportsCount: reports.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/reports/generate-period - Generate period report
router.post(
  '/generate-period',
  adminAuth,
  [
    body('projectId').isUUID(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, startDate, endDate } = req.body;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get all reports for the period
      const reports = await prisma.report.findMany({
        where: {
          projectId,
          reportDate: {
            gte: start,
            lte: end,
          },
        },
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { reportDate: 'asc' },
      });

      // Get total hours for the period
      const hoursData = await prisma.checkin.aggregate({
        where: {
          projectId,
          checkinAt: {
            gte: start,
            lte: end,
          },
          checkoutAt: { not: null },
        },
        _sum: { hoursWorked: true },
      });

      const totalHours = Number(hoursData._sum.hoursWorked) || 0;

      // Group reports by day and create summaries
      const dailySummaries: string[] = [];
      const reportsByDay = new Map<string, typeof reports>();

      for (const report of reports) {
        const day = report.reportDate.toISOString().split('T')[0];
        if (!reportsByDay.has(day)) {
          reportsByDay.set(day, []);
        }
        reportsByDay.get(day)!.push(report);
      }

      for (const [day, dayReports] of reportsByDay) {
        const notes = dayReports
          .map((r) => `${r.user.name}: ${r.notes || r.audioTranscription || 'Sem notas'}`)
          .join('\n');
        dailySummaries.push(`[${day}]\n${notes}`);
      }

      const reportContent = await gptService.generatePeriodReport(
        project.title,
        project.cliente,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
        dailySummaries,
        totalHours,
        0 // m2Applied - would need additional tracking
      );

      // Save generated report
      const saved = await prisma.generatedReport.create({
        data: {
          projectId,
          generatedByAdminId: req.user!.sub,
          type: 'PERIOD',
          title: `Relatório ${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')} - ${project.cliente}`,
          content: { markdown: reportContent },
          periodStart: start,
          periodEnd: end,
          sourceReportIds: reports.map((r) => r.id),
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: saved.id,
          title: saved.title,
          content: reportContent,
          totalHours,
          reportsCount: reports.length,
          periodStart: start,
          periodEnd: end,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/reports/generated - List generated reports
router.get(
  '/generated',
  adminAuth,
  [
    query('projectId').optional().isUUID(),
    query('type').optional().isIn(['DAILY', 'PERIOD', 'CUSTOM']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const where: any = {};

      if (req.query.projectId) {
        where.projectId = req.query.projectId;
      }

      if (req.query.type) {
        where.type = req.query.type;
      }

      const [reports, total] = await Promise.all([
        prisma.generatedReport.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: { id: true, title: true, cliente: true },
            },
            generatedByAdmin: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.generatedReport.count({ where }),
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

// GET /api/admin/reports/generated/:id - Get single generated report
router.get(
  '/generated/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const report = await prisma.generatedReport.findUnique({
        where: { id: req.params.id },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
          generatedByAdmin: {
            select: { id: true, name: true },
          },
        },
      });

      if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/reports/generate-tasks - Generate tasks using AI
router.post(
  '/generate-tasks',
  adminAuth,
  [
    body('projectId').isUUID(),
    body('customPrompt').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, customPrompt } = req.body;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      if (!project.workflowDescription) {
        throw new AppError(
          'Project has no workflow description',
          400,
          'NO_WORKFLOW_DESCRIPTION'
        );
      }

      const tasks = await gptService.generateTasksFromDescription(
        project.title,
        project.workflowDescription,
        Number(project.m2Total),
        customPrompt || project.aiTasksPrompt || undefined
      );

      res.json({
        success: true,
        data: {
          projectId,
          projectName: project.title,
          tasks,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as reportsRoutes };
