import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory for notification videos exists
const notificationUploadsDir = path.join(__dirname, '../../../uploads/notifications');
if (!fs.existsSync(notificationUploadsDir)) {
  fs.mkdirSync(notificationUploadsDir, { recursive: true });
}

// Multer configuration for notification videos
const notificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, notificationUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'notification-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadNotificationVideo = multer({
  storage: notificationStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas videos MP4, WebM, MOV e AVI sao permitidos'));
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
// GET /api/admin/notifications - List all notifications
// =============================================
router.get(
  '/',
  adminAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('isActive').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const where: any = {};
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { views: true },
            },
          },
        }),
        prisma.notification.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          notifications: notifications.map(n => ({
            ...n,
            viewsCount: n._count.views,
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

// =============================================
// GET /api/admin/notifications/:id - Get notification details
// =============================================
router.get(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          views: {
            take: 50,
            orderBy: { viewedAt: 'desc' },
            include: {
              user: {
                select: { id: true, name: true, photoUrl: true },
              },
            },
          },
          _count: {
            select: { views: true },
          },
        },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/notifications - Create notification
// =============================================
router.post(
  '/',
  adminAuth,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('message').trim().isLength({ min: 1, max: 5000 }),
    body('videoUrl').optional().trim(),
    body('videoDuration').optional().isInt({ min: 0 }),
    body('xpReward').optional().isInt({ min: 0, max: 10000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, message, videoUrl, videoDuration, xpReward } = req.body;

      const notification = await prisma.notification.create({
        data: {
          title,
          message,
          videoUrl: videoUrl || null,
          videoDuration: videoDuration || null,
          xpReward: xpReward || 0,
          createdById: req.user!.sub,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'CREATE_NOTIFICATION',
          entityType: 'Notification',
          entityId: notification.id,
          newValues: { title },
        },
      });

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/notifications/upload - Upload video
// =============================================
router.post(
  '/upload',
  adminAuth,
  uploadNotificationVideo.single('video'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('Nenhum video enviado', 400, 'NO_FILE');
      }

      const videoUrl = `/uploads/notifications/${req.file.filename}`;

      res.json({
        success: true,
        data: {
          url: videoUrl,
          filename: req.file.filename,
          size: req.file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// PUT /api/admin/notifications/:id - Update notification
// =============================================
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('message').optional().trim().isLength({ min: 1, max: 5000 }),
    body('videoUrl').optional({ nullable: true }).trim(),
    body('videoDuration').optional({ nullable: true }).isInt({ min: 0 }),
    body('xpReward').optional().isInt({ min: 0, max: 10000 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      const updateData: any = {};
      const allowedFields = ['title', 'message', 'videoUrl', 'videoDuration', 'xpReward', 'isActive'];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const updated = await prisma.notification.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
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

// =============================================
// DELETE /api/admin/notifications/:id - Delete notification
// =============================================
router.delete(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      // Delete video file if exists
      if (notification.videoUrl && notification.videoUrl.startsWith('/uploads/notifications/')) {
        const videoPath = path.join(__dirname, '../../..', notification.videoUrl);
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }

      await prisma.notification.delete({
        where: { id: req.params.id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'DELETE_NOTIFICATION',
          entityType: 'Notification',
          entityId: req.params.id,
          oldValues: { title: notification.title },
        },
      });

      res.json({
        success: true,
        message: 'Notificacao deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/notifications/:id/send - Send notification to all users
// =============================================
router.post(
  '/:id/send',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      // Emit socket event to all connected users
      const { emitNotification } = await import('../../services/socket.service');
      emitNotification({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        videoUrl: notification.videoUrl,
        videoDuration: notification.videoDuration,
        xpReward: notification.xpReward,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'SEND_NOTIFICATION',
          entityType: 'Notification',
          entityId: notification.id,
          description: `Sent notification "${notification.title}" to all users`,
        },
      });

      res.json({
        success: true,
        message: 'Notificacao enviada para todos os usuarios conectados',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/notifications/:id/stats - Get notification stats
// =============================================
router.get(
  '/:id/stats',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
        include: {
          _count: {
            select: { views: true },
          },
        },
      });

      if (!notification) {
        throw new AppError('Notificacao nao encontrada', 404, 'NOT_FOUND');
      }

      // Get detailed stats
      const [totalViews, videoStarted, videoCompleted, totalXpGiven] = await Promise.all([
        prisma.notificationView.count({
          where: { notificationId: req.params.id },
        }),
        prisma.notificationView.count({
          where: { notificationId: req.params.id, videoStarted: true },
        }),
        prisma.notificationView.count({
          where: { notificationId: req.params.id, videoCompleted: true },
        }),
        prisma.notificationView.aggregate({
          where: { notificationId: req.params.id },
          _sum: { xpEarned: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalViews,
          videoStarted,
          videoCompleted,
          completionRate: totalViews > 0 ? Math.round((videoCompleted / totalViews) * 100) : 0,
          totalXpGiven: totalXpGiven._sum.xpEarned || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as notificationsRoutes };
