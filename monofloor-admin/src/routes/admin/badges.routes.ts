import { Router } from 'express';
import { PrismaClient, BadgeCategory, BadgeRarity } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory for badges exists
const badgesUploadsDir = path.join(__dirname, '../../../uploads/badges');
if (!fs.existsSync(badgesUploadsDir)) {
  fs.mkdirSync(badgesUploadsDir, { recursive: true });
}

// Multer configuration for badge icons
const badgeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, badgesUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'badge-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadBadgeIcon = multer({
  storage: badgeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens (JPEG, PNG, GIF, WebP, SVG) sao permitidas'));
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

// GET /api/admin/badges - List all badges
router.get(
  '/',
  adminAuth,
  [
    query('category').optional().isIn(['CAMPAIGN', 'ACHIEVEMENT', 'SPECIAL', 'ROLE']),
    query('rarity').optional().isIn(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
    query('isActive').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const where: any = {};

      if (req.query.category) {
        where.category = req.query.category as BadgeCategory;
      }
      if (req.query.rarity) {
        where.rarity = req.query.rarity as BadgeRarity;
      }
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === 'true';
      }

      const badges = await prisma.badge.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { rarity: 'desc' },
          { name: 'asc' },
        ],
        include: {
          _count: {
            select: {
              userBadges: true,
              campaigns: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: badges.map((badge) => ({
          ...badge,
          usersCount: badge._count.userBadges,
          campaignsCount: badge._count.campaigns,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/badges/:id - Get badge details
router.get(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const badge = await prisma.badge.findUnique({
        where: { id: req.params.id },
        include: {
          userBadges: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  photoUrl: true,
                  role: true,
                },
              },
            },
            orderBy: { awardedAt: 'desc' },
            take: 50,
          },
          campaigns: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              userBadges: true,
            },
          },
        },
      });

      if (!badge) {
        throw new AppError('Badge not found', 404, 'BADGE_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          ...badge,
          totalUsers: badge._count.userBadges,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/badges - Create a new badge
router.post(
  '/',
  adminAuth,
  [
    body('name').trim().notEmpty().withMessage('Nome e obrigatorio'),
    body('description').optional().trim(),
    body('iconUrl').trim().notEmpty().withMessage('Icone e obrigatorio'),
    body('color').optional().isHexColor(),
    body('category').optional().isIn(['CAMPAIGN', 'ACHIEVEMENT', 'SPECIAL', 'ROLE']),
    body('rarity').optional().isIn(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, iconUrl, color, category, rarity } = req.body;

      const badge = await prisma.badge.create({
        data: {
          name,
          description,
          iconUrl,
          color: color || '#c9a962',
          category: category || 'CAMPAIGN',
          rarity: rarity || 'COMMON',
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'CREATE_BADGE',
          entityType: 'Badge',
          entityId: badge.id,
          newValues: { name, category, rarity },
          description: `Created badge: ${name}`,
        },
      });

      res.status(201).json({
        success: true,
        data: badge,
        message: 'Badge criado com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/badges/:id - Update a badge
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('iconUrl').optional().trim().notEmpty(),
    body('color').optional().isHexColor(),
    body('category').optional().isIn(['CAMPAIGN', 'ACHIEVEMENT', 'SPECIAL', 'ROLE']),
    body('rarity').optional().isIn(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const badge = await prisma.badge.findUnique({
        where: { id: req.params.id },
      });

      if (!badge) {
        throw new AppError('Badge not found', 404, 'BADGE_NOT_FOUND');
      }

      const { name, description, iconUrl, color, category, rarity, isActive } = req.body;

      const updatedBadge = await prisma.badge.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(iconUrl && { iconUrl }),
          ...(color && { color }),
          ...(category && { category }),
          ...(rarity && { rarity }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'UPDATE_BADGE',
          entityType: 'Badge',
          entityId: badge.id,
          oldValues: { name: badge.name },
          newValues: req.body,
          description: `Updated badge: ${updatedBadge.name}`,
        },
      });

      res.json({
        success: true,
        data: updatedBadge,
        message: 'Badge atualizado com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/badges/:id - Delete a badge
router.delete(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const badge = await prisma.badge.findUnique({
        where: { id: req.params.id },
        include: {
          _count: {
            select: {
              userBadges: true,
              campaigns: true,
            },
          },
        },
      });

      if (!badge) {
        throw new AppError('Badge not found', 404, 'BADGE_NOT_FOUND');
      }

      // Check if badge is in use
      if (badge._count.userBadges > 0) {
        throw new AppError(
          `Este badge foi concedido a ${badge._count.userBadges} usuarios e nao pode ser excluido`,
          400,
          'BADGE_IN_USE'
        );
      }

      await prisma.badge.delete({
        where: { id: req.params.id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'DELETE_BADGE',
          entityType: 'Badge',
          entityId: badge.id,
          oldValues: { name: badge.name },
          description: `Deleted badge: ${badge.name}`,
        },
      });

      res.json({
        success: true,
        message: 'Badge excluido com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/badges/upload - Upload badge icon
router.post(
  '/upload',
  adminAuth,
  uploadBadgeIcon.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('Nenhum arquivo enviado', 400, 'NO_FILE');
      }

      const fileUrl = `/uploads/badges/${req.file.filename}`;

      res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
        },
        message: 'Icone enviado com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/badges/:id/award - Award badge to users
router.post(
  '/:id/award',
  adminAuth,
  [
    param('id').isUUID(),
    body('userIds').isArray({ min: 1 }),
    body('userIds.*').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const badge = await prisma.badge.findUnique({
        where: { id: req.params.id },
      });

      if (!badge) {
        throw new AppError('Badge not found', 404, 'BADGE_NOT_FOUND');
      }

      const { userIds } = req.body;

      // Award badge to each user (skip if already has it)
      const results = await Promise.all(
        userIds.map(async (userId: string) => {
          const existing = await prisma.userBadge.findFirst({
            where: {
              userId,
              badgeId: req.params.id,
            },
          });

          if (existing) {
            return { userId, status: 'already_has' };
          }

          await prisma.userBadge.create({
            data: {
              userId,
              badgeId: req.params.id,
            },
          });

          return { userId, status: 'awarded' };
        })
      );

      const awarded = results.filter((r) => r.status === 'awarded').length;

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'AWARD_BADGE',
          entityType: 'Badge',
          entityId: badge.id,
          newValues: { userIds, awarded },
          description: `Awarded badge "${badge.name}" to ${awarded} users`,
        },
      });

      res.json({
        success: true,
        data: results,
        message: `Badge concedido a ${awarded} usuarios!`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/badges/:id/revoke/:userId - Revoke badge from user
router.delete(
  '/:id/revoke/:userId',
  adminAuth,
  [param('id').isUUID(), param('userId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const userBadge = await prisma.userBadge.findFirst({
        where: {
          badgeId: req.params.id,
          userId: req.params.userId,
        },
        include: {
          badge: true,
          user: { select: { name: true } },
        },
      });

      if (!userBadge) {
        throw new AppError('Usuario nao possui este badge', 404, 'USER_BADGE_NOT_FOUND');
      }

      await prisma.userBadge.delete({
        where: { id: userBadge.id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'REVOKE_BADGE',
          entityType: 'Badge',
          entityId: req.params.id,
          oldValues: { userId: req.params.userId },
          description: `Revoked badge "${userBadge.badge.name}" from user ${userBadge.user.name}`,
        },
      });

      res.json({
        success: true,
        message: 'Badge removido do usuario!',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as badgesRoutes };
