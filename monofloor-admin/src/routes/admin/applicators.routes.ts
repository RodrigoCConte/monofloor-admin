import { Router } from 'express';
import { UserStatus, UserRole, PendingNotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { body, param, query, validationResult } from 'express-validator';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { emitRoleEvolution, emitXPGained, emitXPLost } from '../../services/socket.service';

const router = Router();

// Role hierarchy for determining promotion vs demotion
const ROLE_HIERARCHY: UserRole[] = ['AUXILIAR', 'PREPARADOR', 'LIDER_PREPARACAO', 'APLICADOR_I', 'APLICADOR_II', 'APLICADOR_III', 'LIDER'];

function isPromotion(oldRole: UserRole, newRole: UserRole): boolean {
  const oldIndex = ROLE_HIERARCHY.indexOf(oldRole);
  const newIndex = ROLE_HIERARCHY.indexOf(newRole);
  return newIndex > oldIndex;
}

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
    body('role').isIn(['AUXILIAR', 'PREPARADOR', 'LIDER_PREPARACAO', 'APLICADOR_I', 'APLICADOR_II', 'APLICADOR_III', 'LIDER']),
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

      // Only create notification if role actually changed
      if (oldRole !== newRole) {
        // Determine if it's a promotion or demotion
        const promotion = isPromotion(oldRole, newRole);
        const notificationType = promotion ? PendingNotificationType.ROLE_PROMOTION : PendingNotificationType.ROLE_DEMOTION;

        // Create pending notification (will be fetched when user opens app)
        await prisma.pendingNotification.create({
          data: {
            userId: user.id,
            type: notificationType,
            payload: {
              oldRole: oldRole,
              newRole: newRole,
              timestamp: new Date().toISOString(),
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
          },
        });
        console.log(`[PendingNotification] Created ${notificationType} for user ${user.id}`);
      }

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
    body('projectRole').optional().isIn(['AUXILIAR', 'PREPARADOR', 'LIDER_PREPARACAO', 'APLICADOR_I', 'APLICADOR_II', 'APLICADOR_III', 'LIDER']),
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
              projectRole: projectRole || 'APLICADOR_I',
              assignedById: req.user!.sub,
              assignedAt: new Date(),
            },
          })
        : await prisma.projectAssignment.create({
            data: {
              userId: req.params.id,
              projectId,
              projectRole: projectRole || 'APLICADOR_I',
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

// POST /api/admin/applicators/:id/xp - Adjust XP (praise or penalty)
router.post(
  '/:id/xp',
  adminAuth,
  [
    param('id').isUUID(),
    body('amount').isInt(),
    body('reason').trim().isLength({ min: 1, max: 500 }),
    body('type').isIn(['PRAISE', 'PENALTY']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { amount, reason, type } = req.body;
      const userId = req.params.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Ensure amount sign matches type
      const finalAmount = type === 'PENALTY' ? -Math.abs(amount) : Math.abs(amount);

      // Update user XP
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          xpTotal: { increment: finalAmount },
        },
      });

      // Create XP transaction
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: finalAmount,
          type: type === 'PRAISE' ? 'BONUS' : 'PENALTY',
          reason: `[Admin] ${reason}`,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          userId,
          action: type === 'PRAISE' ? 'PRAISE_USER' : 'PENALIZE_USER',
          entityType: 'User',
          entityId: userId,
          description: `${type === 'PRAISE' ? 'Praise' : 'Penalty'}: ${reason} (${finalAmount > 0 ? '+' : ''}${finalAmount} XP)`,
          newValues: { amount: finalAmount, reason },
        },
      });

      // Emit Socket.io event for real-time notification in-app
      if (type === 'PRAISE') {
        emitXPGained({
          userId,
          userName: updatedUser.name || 'Aplicador',
          amount: Math.abs(finalAmount),
          reason: `Elogio: ${reason}`,
          timestamp: new Date(),
        });
      } else {
        emitXPLost({
          userId,
          userName: updatedUser.name || 'Aplicador',
          amount: Math.abs(finalAmount),
          reason: `Penalidade: ${reason}`,
          timestamp: new Date(),
        });
      }

      // Send push notification with updated XP total (for when app is closed)
      try {
        const { sendXPAdjustmentPush } = await import('../../services/push.service');
        sendXPAdjustmentPush(userId, Math.abs(finalAmount), reason, type, updatedUser.xpTotal).catch((err) => {
          console.error('[Push] Error sending XP adjustment push:', err);
        });
      } catch (pushError) {
        console.error('[Push] Error importing push service:', pushError);
      }

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          xpTotal: updatedUser.xpTotal,
          adjustment: finalAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/applicators/:id/earnings - Get applicator earnings for a month
router.get(
  '/:id/earnings',
  adminAuth,
  [
    param('id').isUUID(),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Get daily work summaries
      const dailySummaries = await prisma.dailyWorkSummary.findMany({
        where: {
          userId,
          workDate: { gte: startDate, lte: endDate },
        },
        orderBy: { workDate: 'desc' },
      });

      // Get checkins for calculation
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

      // Import role rates for calculation
      const { getRoleRates, calculatePayment } = await import('../../config/payroll.config');

      // Calculate totals from daily summaries
      let totalEarnings = 0;
      let totalHoursNormal = 0;
      let totalHoursOvertime = 0;
      let totalHoursTravelMode = 0;

      for (const summary of dailySummaries) {
        totalEarnings += Number(summary.totalPayment || 0);
        totalHoursNormal += Number(summary.hoursNormal || 0);
        totalHoursOvertime += Number(summary.hoursOvertime || 0);
        totalHoursTravelMode += Number(summary.hoursTravelMode || 0);
      }

      // If no summaries, calculate from checkins
      if (dailySummaries.length === 0 && checkins.length > 0) {
        const rates = getRoleRates(user.role);
        for (const checkin of checkins) {
          const hours = Number(checkin.hoursWorked || 0);
          const normalHours = Math.min(hours, 8);
          const overtime = Math.max(0, hours - 8);
          const isTravelMode = checkin.project?.isTravelMode || false;

          totalHoursNormal += normalHours;
          totalHoursOvertime += overtime;
          if (isTravelMode) {
            totalHoursTravelMode += hours;
          }

          if (rates) {
            if (isTravelMode) {
              totalEarnings += normalHours * rates.travelRate;
              totalEarnings += overtime * rates.travelOvertimeRate;
            } else {
              totalEarnings += normalHours * rates.hourlyRate;
              totalEarnings += overtime * rates.overtimeRate;
            }
          }
        }
      }

      const rates = getRoleRates(user.role);

      res.json({
        success: true,
        data: {
          month,
          year,
          role: user.role,
          rates: rates ? {
            hourlyRate: rates.hourlyRate,
            overtimeRate: rates.overtimeRate,
            travelRate: rates.travelRate,
            dailyRate: rates.dailyRate,
          } : null,
          totals: {
            earnings: Math.round(totalEarnings * 100) / 100,
            hoursNormal: Math.round(totalHoursNormal * 100) / 100,
            hoursOvertime: Math.round(totalHoursOvertime * 100) / 100,
            hoursTravelMode: Math.round(totalHoursTravelMode * 100) / 100,
            totalHours: Math.round((totalHoursNormal + totalHoursOvertime) * 100) / 100,
          },
          daysWorked: dailySummaries.length || new Set(checkins.map(c => c.checkinAt.toISOString().split('T')[0])).size,
          checkinCount: checkins.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as applicatorsRoutes };
