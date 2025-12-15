import { Router } from 'express';
import { PrismaClient, UserStatus, UserRole } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { emitRoleEvolution } from '../../services/socket.service';

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

// GET /api/admin/applicators - List all applicators
router.get(
  '/',
  adminAuth,
  [
    query('status').optional().isIn(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as UserStatus | undefined;
      const search = req.query.search as string | undefined;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            phone: true,
            photoUrl: true,
            status: true,
            role: true,
            totalHoursWorked: true,
            totalM2Applied: true,
            totalProjectsCount: true,
            xpTotal: true,
            level: true,
            createdAt: true,
            approvedAt: true,
            location: {
              select: {
                isOnline: true,
                currentProjectId: true,
                updatedAt: true,
              },
            },
            checkins: {
              where: {
                checkoutAt: null,
              },
              take: 1,
              orderBy: { checkinAt: 'desc' },
              include: {
                project: {
                  select: {
                    id: true,
                    title: true,
                    cliente: true,
                  },
                },
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users.map((u) => {
          const activeCheckin = u.checkins?.[0];
          return {
            ...u,
            totalHoursWorked: Number(u.totalHoursWorked),
            totalM2Applied: Number(u.totalM2Applied),
            isOnline: u.location?.isOnline || false,
            currentProject: activeCheckin?.project || null,
            checkins: undefined, // Remove from response
            location: undefined, // Remove raw location from response
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

// GET /api/admin/applicators/:id - Get single applicator
router.get(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          projectAssignments: {
            where: { isActive: true },
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                  cliente: true,
                  status: true,
                },
              },
            },
          },
          approvedBy: {
            select: { id: true, name: true },
          },
          promotedBy: {
            select: { id: true, name: true },
          },
          // Include user badges
          badges: {
            include: {
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
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Get recent check-ins
      const recentCheckins = await prisma.checkin.findMany({
        where: { userId: user.id },
        orderBy: { checkinAt: 'desc' },
        take: 10,
        include: {
          project: {
            select: { id: true, title: true },
          },
        },
      });

      // Format badges for response
      const primaryBadge = user.badges.find(b => b.isPrimary)?.badge || null;
      const formattedBadges = user.badges.map(b => ({
        ...b.badge,
        isPrimary: b.isPrimary,
        awardedAt: b.awardedAt,
      }));

      res.json({
        success: true,
        data: {
          ...user,
          totalHoursWorked: Number(user.totalHoursWorked),
          totalM2Applied: Number(user.totalM2Applied),
          primaryBadge,
          badges: formattedBadges,
          recentCheckins: recentCheckins.map((c) => ({
            ...c,
            hoursWorked: c.hoursWorked ? Number(c.hoursWorked) : null,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/applicators/:id/approve - Approve applicator
router.post(
  '/:id/approve',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.status !== 'PENDING_APPROVAL') {
        throw new AppError(
          'User is not pending approval',
          400,
          'INVALID_STATUS'
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: req.user!.sub,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          userId: user.id,
          action: 'APPROVE_USER',
          entityType: 'User',
          entityId: user.id,
          description: `Approved user ${user.name}`,
        },
      });

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          status: updatedUser.status,
          approvedAt: updatedUser.approvedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/applicators/:id/reject - Reject applicator
router.post(
  '/:id/reject',
  adminAuth,
  [param('id').isUUID(), body('reason').optional().trim()],
  validate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          status: 'REJECTED',
          rejectionReason: req.body.reason,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          userId: user.id,
          action: 'REJECT_USER',
          entityType: 'User',
          entityId: user.id,
          description: `Rejected user ${user.name}. Reason: ${req.body.reason || 'Not specified'}`,
        },
      });

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          status: updatedUser.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/applicators/:id/role - Update role (promotion)
router.put(
  '/:id/role',
  adminAuth,
  [
    param('id').isUUID(),
    body('role').isIn(['LIDER', 'APLICADOR', 'APLICADOR_AUX', 'LIDER_PREPARACAO', 'PREPARADOR', 'AUXILIAR']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const oldRole = user.role;
      const newRole = req.body.role as UserRole;

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          role: newRole,
          promotedAt: new Date(),
          promotedById: req.user!.sub,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          userId: user.id,
          action: 'UPDATE_USER_ROLE',
          entityType: 'User',
          entityId: user.id,
          oldValues: { role: oldRole },
          newValues: { role: newRole },
          description: `Changed role from ${oldRole} to ${newRole}`,
        },
      });

      // Emit role evolution event via Socket.io for real-time notification
      emitRoleEvolution({
        userId: user.id,
        userName: user.name,
        oldRole: oldRole,
        newRole: newRole,
        timestamp: new Date(),
      });

      // Also send push notification (for when app is in background or closed)
      try {
        const { sendRoleEvolutionPush } = await import('../../services/push.service');
        sendRoleEvolutionPush(user.id, oldRole, newRole).catch((err) => {
          console.error('[Push] Error sending role evolution push:', err);
        });
      } catch (pushError) {
        console.error('[Push] Error importing push service:', pushError);
      }

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          role: updatedUser.role,
          promotedAt: updatedUser.promotedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/applicators/:id/status - Update status
router.put(
  '/:id/status',
  adminAuth,
  [
    param('id').isUUID(),
    body('status').isIn(['APPROVED', 'SUSPENDED']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          status: req.body.status,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          userId: user.id,
          action: 'UPDATE_USER_STATUS',
          entityType: 'User',
          entityId: user.id,
          description: `Changed status to ${req.body.status}`,
        },
      });

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          status: updatedUser.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/applicators/:id/projects - Get assigned projects
router.get(
  '/:id/projects',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const assignments = await prisma.projectAssignment.findMany({
        where: {
          userId: req.params.id,
          isActive: true,
        },
        include: {
          project: true,
        },
      });

      res.json({
        success: true,
        data: assignments.map((a) => ({
          assignmentId: a.id,
          projectRole: a.projectRole,
          assignedAt: a.assignedAt,
          project: {
            ...a.project,
            m2Total: Number(a.project.m2Total),
            workedHours: Number(a.project.workedHours),
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/applicators/:id/projects - Assign project
router.post(
  '/:id/projects',
  adminAuth,
  [
    param('id').isUUID(),
    body('projectId').isUUID(),
    body('projectRole').optional().isIn(['APLICADOR', 'LIDER']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, projectRole } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      // Check if already assigned
      const existingAssignment = await prisma.projectAssignment.findUnique({
        where: {
          userId_projectId: {
            userId: req.params.id,
            projectId,
          },
        },
      });

      if (existingAssignment && existingAssignment.isActive) {
        throw new AppError(
          'User already assigned to this project',
          400,
          'ALREADY_ASSIGNED'
        );
      }

      // Create or reactivate assignment
      const assignment = existingAssignment
        ? await prisma.projectAssignment.update({
            where: { id: existingAssignment.id },
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
              userId: req.params.id,
              projectId,
              projectRole: projectRole || 'APLICADOR',
              assignedById: req.user!.sub,
            },
          });

      // Update user's project count
      await prisma.user.update({
        where: { id: req.params.id },
        data: {
          totalProjectsCount: { increment: 1 },
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

// DELETE /api/admin/applicators/:id/projects/:projectId - Remove from project
router.delete(
  '/:id/projects/:projectId',
  adminAuth,
  [param('id').isUUID(), param('projectId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const assignment = await prisma.projectAssignment.findUnique({
        where: {
          userId_projectId: {
            userId: req.params.id,
            projectId: req.params.projectId,
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

      // Update user's project count
      await prisma.user.update({
        where: { id: req.params.id },
        data: {
          totalProjectsCount: { decrement: 1 },
        },
      });

      res.json({
        success: true,
        data: { message: 'User removed from project' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/applicators/:id - Delete applicator permanently
router.delete(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        throw new AppError('Applicator not found', 404, 'USER_NOT_FOUND');
      }

      // Delete all related data in order
      // 1. Delete location history
      await prisma.locationHistory.deleteMany({
        where: { userId: req.params.id },
      });

      // 2. Delete user location
      await prisma.userLocation.deleteMany({
        where: { userId: req.params.id },
      });

      // 3. Delete report photos first, then reports
      const reports = await prisma.report.findMany({
        where: { userId: req.params.id },
        select: { id: true },
      });
      const reportIds = reports.map((r) => r.id);

      await prisma.reportPhoto.deleteMany({
        where: { reportId: { in: reportIds } },
      });

      await prisma.report.deleteMany({
        where: { userId: req.params.id },
      });

      // 4. Delete checkins
      await prisma.checkin.deleteMany({
        where: { userId: req.params.id },
      });

      // 5. Delete project assignments
      await prisma.projectAssignment.deleteMany({
        where: { userId: req.params.id },
      });

      // 6. Finally delete the user
      await prisma.user.delete({
        where: { id: req.params.id },
      });

      res.json({
        success: true,
        data: { message: 'Applicator deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as applicatorsRoutes };
