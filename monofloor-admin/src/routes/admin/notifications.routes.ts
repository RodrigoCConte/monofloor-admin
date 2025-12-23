import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { saveFile, deleteFile, UploadType } from '../../services/db-storage.service';
import prisma from '../../lib/prisma';

const router = Router();

// Multer configuration with memory storage (videos saved to PostgreSQL)
const uploadNotificationVideo = multer({
  storage: multer.memoryStorage(),
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

      // Save to PostgreSQL
      const saved = await saveFile({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        data: req.file.buffer,
        type: 'NOTIFICATION' as UploadType,
      });

      res.json({
        success: true,
        data: {
          url: saved.url,
          filename: saved.filename,
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

      // Delete video file from database if exists
      if (notification.videoUrl && notification.videoUrl.startsWith('/files/')) {
        const fileId = notification.videoUrl.replace('/files/', '');
        await deleteFile(fileId);
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

      // Get all approved users
      const users = await prisma.user.findMany({
        where: { status: 'APPROVED' },
        select: { id: true },
      });

      // Create pending notifications for ALL users (so offline users get it later)
      const pendingNotifications = users.map((user) => ({
        userId: user.id,
        type: 'ADMIN_NOTIFICATION' as const,
        payload: {
          notificationId: notification.id,
          title: notification.title,
          message: notification.message,
          videoUrl: notification.videoUrl,
          videoDuration: notification.videoDuration,
          xpReward: notification.xpReward,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      }));

      await prisma.pendingNotification.createMany({
        data: pendingNotifications,
      });

      // Emit socket event to all connected users (real-time)
      const { emitNotification } = await import('../../services/socket.service');
      emitNotification({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        videoUrl: notification.videoUrl,
        videoDuration: notification.videoDuration,
        xpReward: notification.xpReward,
      });

      // Send push notifications to all users
      try {
        const { sendPushToUser } = await import('../../services/push.service');
        const pushPromises = users.map((user) =>
          sendPushToUser(user.id, {
            title: notification.title,
            body: notification.message,
            data: {
              type: 'admin_notification',
              notificationId: notification.id,
              hasVideo: !!notification.videoUrl,
              xpReward: notification.xpReward,
            },
          }).catch((err) => console.error(`[Notification] Push failed for ${user.id}:`, err.message))
        );
        await Promise.allSettled(pushPromises);
        console.log(`[Notification] Push sent to ${users.length} users`);
      } catch (pushError) {
        console.error('[Notification] Failed to send push notifications:', pushError);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'SEND_NOTIFICATION',
          entityType: 'Notification',
          entityId: notification.id,
          description: `Sent notification "${notification.title}" to ${users.length} users`,
        },
      });

      res.json({
        success: true,
        message: `Notificacao enviada para ${users.length} usuarios`,
        data: {
          recipientCount: users.length,
        },
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
