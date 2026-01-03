import { Router } from 'express';
import { HelpRequestStatus, HelpRequestType } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { adminAuth } from '../../middleware/auth';
import { getSocketServer } from '../../services/socket.service';
import { sendPushToUser } from '../../services/push.service';
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

// GET /api/admin/help-requests - List all help requests
router.get(
  '/',
  adminAuth,
  [
    query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    query('type').optional().isIn(['MATERIAL', 'HELP']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as HelpRequestStatus | undefined;
      const type = req.query.type as HelpRequestType | undefined;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      const [requests, total] = await Promise.all([
        prisma.helpRequest.findMany({
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
                phone: true,
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
            resolvedBy: {
              select: {
                id: true,
                name: true,
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

// GET /api/admin/help-requests/pending-count - Get count of pending requests
router.get(
  '/pending-count',
  adminAuth,
  async (req, res, next) => {
    try {
      const count = await prisma.helpRequest.count({
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

// GET /api/admin/help-requests/:id - Get a specific help request
router.get(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const request = await prisma.helpRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photoUrl: true,
              role: true,
              phone: true,
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
          resolvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Solicitacao nao encontrada' },
        });
      }

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/help-requests/:id - Update help request status
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isUUID(),
    body('status').isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    body('adminNotes').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const adminId = (req as any).user.id;

      const request = await prisma.helpRequest.findUnique({
        where: { id },
        include: { user: true, project: true },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Solicitacao nao encontrada' },
        });
      }

      const updateData: any = {
        status,
        adminNotes: adminNotes || request.adminNotes,
      };

      // If resolving, set resolved info
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = adminId;
      }

      const updated = await prisma.helpRequest.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photoUrl: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              cliente: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Notify user via socket
      const io = getSocketServer();
      if (io) {
        io.to(`user:${request.userId}`).emit('helpRequest:updated', {
          id: request.id,
          type: request.type,
          status,
          projectName: request.project?.title || request.project?.cliente,
        });
      }

      // Also send push notification
      const statusLabels: Record<string, string> = {
        IN_PROGRESS: 'em andamento',
        RESOLVED: 'resolvida',
        CANCELLED: 'cancelada',
      };
      sendPushToUser(request.userId, {
        title: 'Solicitacao Atualizada',
        body: `Sua solicitacao de ${request.type === 'MATERIAL' ? 'material' : 'ajuda'} esta ${statusLabels[status] || status}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: `help-request-${request.id}`,
        data: { type: 'helpRequest:updated', id: request.id, status },
      }).catch(console.error);

      res.json({
        success: true,
        data: updated,
        message: `Solicitacao atualizada para ${status}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/help-requests/:id/resolve - Resolve a help request
router.post(
  '/:id/resolve',
  adminAuth,
  [
    param('id').isUUID(),
    body('adminNotes').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const adminId = (req as any).user.id;

      const request = await prisma.helpRequest.findUnique({
        where: { id },
        include: { user: true, project: true },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Solicitacao nao encontrada' },
        });
      }

      if (request.status === 'RESOLVED') {
        return res.status(400).json({
          success: false,
          error: { code: 'ALREADY_RESOLVED', message: 'Solicitacao ja foi resolvida' },
        });
      }

      const updated = await prisma.helpRequest.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          adminNotes: adminNotes || request.adminNotes,
          resolvedAt: new Date(),
          resolvedById: adminId,
        },
      });

      // Notify user via socket
      const io = getSocketServer();
      if (io) {
        io.to(`user:${request.userId}`).emit('helpRequest:resolved', {
          id: request.id,
          type: request.type,
          projectName: request.project?.title || request.project?.cliente,
          adminNotes,
        });
      }

      // Also send push notification
      sendPushToUser(request.userId, {
        title: 'Solicitacao Resolvida!',
        body: `Sua solicitacao de ${request.type === 'MATERIAL' ? 'material' : 'ajuda'} foi resolvida.${adminNotes ? ` Obs: ${adminNotes}` : ''}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: `help-request-${request.id}`,
        data: { type: 'helpRequest:resolved', id: request.id },
        requireInteraction: true,
      }).catch(console.error);

      res.json({
        success: true,
        message: 'Solicitacao resolvida com sucesso',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/help-requests/:id/cancel - Cancel a help request
router.post(
  '/:id/cancel',
  adminAuth,
  [
    param('id').isUUID(),
    body('adminNotes').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const adminId = (req as any).user.id;

      const request = await prisma.helpRequest.findUnique({
        where: { id },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Solicitacao nao encontrada' },
        });
      }

      if (request.status === 'RESOLVED' || request.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Solicitacao ja foi finalizada' },
        });
      }

      const updated = await prisma.helpRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          adminNotes: adminNotes || request.adminNotes,
          resolvedAt: new Date(),
          resolvedById: adminId,
        },
      });

      // Notify user via socket
      const io = getSocketServer();
      if (io) {
        io.to(`user:${request.userId}`).emit('helpRequest:cancelled', {
          id: request.id,
          type: request.type,
        });
      }

      // Also send push notification
      sendPushToUser(request.userId, {
        title: 'Solicitacao Cancelada',
        body: `Sua solicitacao de ${request.type === 'MATERIAL' ? 'material' : 'ajuda'} foi cancelada.`,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: `help-request-${request.id}`,
        data: { type: 'helpRequest:cancelled', id: request.id },
      }).catch(console.error);

      res.json({
        success: true,
        message: 'Solicitacao cancelada',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as helpRequestsRoutes };
