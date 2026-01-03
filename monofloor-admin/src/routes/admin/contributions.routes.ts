import { Router } from 'express';
import { ContributionStatus } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { adminAuth } from '../../middleware/auth';
import { getSocketServer } from '../../services/socket.service';
import { sendContributionResultPush } from '../../services/push.service';
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

// GET /api/admin/contributions - List all contribution requests
router.get(
  '/',
  adminAuth,
  [
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as ContributionStatus | undefined;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      const [requests, total] = await Promise.all([
        prisma.contributionRequest.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                photoUrl: true,
                role: true,
                checkins: {
                  where: {
                    checkoutAt: null, // Only active check-ins
                  },
                  select: {
                    id: true,
                    project: {
                      select: {
                        id: true,
                        title: true,
                        cliente: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
            project: {
              select: {
                id: true,
                title: true,
                cliente: true,
                endereco: true,
              },
            },
            reviewedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.contributionRequest.count({ where }),
      ]);

      // Format requests to include current project info
      const formattedRequests = requests.map((request: any) => {
        const activeCheckin = request.user?.checkins?.[0];
        const currentProject = activeCheckin?.project || null;

        return {
          ...request,
          user: {
            ...request.user,
            checkins: undefined, // Remove checkins array from response
            currentProject: currentProject ? {
              id: currentProject.id,
              title: currentProject.title,
              cliente: currentProject.cliente,
            } : null,
          },
        };
      });

      res.json({
        success: true,
        data: {
          requests: formattedRequests,
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

// GET /api/admin/contributions/pending-count - Get count of pending requests
router.get(
  '/pending-count',
  adminAuth,
  async (req, res, next) => {
    try {
      const count = await prisma.contributionRequest.count({
        where: { status: 'PENDING' },
      });

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/contributions/:id/approve - Approve a contribution request
router.post(
  '/:id/approve',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      // Get the request
      const request = await prisma.contributionRequest.findUnique({
        where: { id },
        include: {
          user: true,
          project: true,
        },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Solicitacao nao encontrada' },
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Solicitacao ja foi processada' },
        });
      }

      // Update request and add user to project
      await prisma.$transaction([
        // Update request status
        prisma.contributionRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: adminId,
          },
        }),
        // Add user to project
        prisma.projectAssignment.create({
          data: {
            userId: request.userId,
            projectId: request.projectId,
            projectRole: 'APLICADOR_I',
          },
        }),
      ]);

      // Notify the user via socket
      const io = getSocketServer();
      if (io) {
        io.to(`user:${request.userId}`).emit('contribution:approved', {
          projectId: request.projectId,
          projectName: request.project.title || request.project.cliente,
        });
      }

      // Also send push notification
      sendContributionResultPush(request.userId, 'approved', 'contribuicao').catch(console.error);

      res.json({
        success: true,
        message: 'Solicitacao aprovada. Usuario adicionado ao projeto.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/contributions/:id/reject - Reject a contribution request
router.post(
  '/:id/reject',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      // Get the request
      const request = await prisma.contributionRequest.findUnique({
        where: { id },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Solicitacao nao encontrada' },
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Solicitacao ja foi processada' },
        });
      }

      // Update request status
      await prisma.contributionRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: adminId,
        },
      });

      // Notify the user via socket
      const io = getSocketServer();
      if (io) {
        io.to(`user:${request.userId}`).emit('contribution:rejected', {
          projectId: request.projectId,
        });
      }

      // Also send push notification
      sendContributionResultPush(request.userId, 'rejected', 'contribuicao').catch(console.error);

      res.json({
        success: true,
        message: 'Solicitacao rejeitada.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as contributionsRoutes };
