import { Router } from 'express';
import { CampaignStatus } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { emitToMobile, emitToUser, emitCampaignWinner } from '../../services/socket.service';
import { saveFile, UploadType } from '../../services/db-storage.service';
import prisma from '../../lib/prisma';

const router = Router();

// Multer configuration with memory storage (files saved to PostgreSQL)
const uploadCampaignMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens (JPEG, PNG, GIF, WebP) e videos (MP4, WebM) sao permitidos'));
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

// GET /api/admin/campaigns - List all campaigns
router.get(
  '/',
  adminAuth,
  [
    query('status').optional().isIn(['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as CampaignStatus | undefined;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                slides: true,
                participants: true,
              },
            },
          },
        }),
        prisma.campaign.count({ where }),
      ]);

      // Get total applicators count for participation rate
      const totalApplicators = await prisma.user.count({
        where: { status: 'APPROVED' },
      });

      res.json({
        success: true,
        data: campaigns.map((c) => ({
          ...c,
          slidesCount: c._count.slides,
          participantsCount: c._count.participants,
          totalApplicators,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          totalApplicators,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/campaigns/:id - Get single campaign with slides
router.get(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          slides: {
            orderBy: { order: 'asc' },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  photoUrl: true,
                  role: true,
                },
              },
            },
            orderBy: { joinedAt: 'desc' },
            take: 100,
          },
          winners: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  photoUrl: true,
                },
              },
              badge: true,
            },
            orderBy: { position: 'asc' },
          },
          badge: true,
          _count: {
            select: {
              participants: true,
              winners: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      const totalApplicators = await prisma.user.count({
        where: { status: 'APPROVED' },
      });

      res.json({
        success: true,
        data: {
          ...campaign,
          participantsCount: campaign._count.participants,
          winnersCount: campaign._count.winners,
          totalApplicators,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns - Create new campaign
router.post(
  '/',
  adminAuth,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Nome e obrigatorio'),
    body('description').optional().trim(),
    body('bannerUrl').optional().trim(),
    body('bannerType').optional().isIn(['video', 'image']),
    body('startDate').isISO8601().withMessage('Data de inicio invalida'),
    body('endDate').isISO8601().withMessage('Data de fim invalida'),
    body('xpBonus').optional().isInt({ min: 0 }),
    body('xpMultiplier').optional().isFloat({ min: 1 }),
    body('status').optional().isIn(['DRAFT', 'SCHEDULED', 'ACTIVE']),
    body('badgeId').optional({ nullable: true }).isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        name,
        description,
        bannerUrl,
        bannerType,
        startDate,
        endDate,
        xpBonus,
        xpMultiplier,
        status,
        badgeId,
      } = req.body;

      const campaign = await prisma.campaign.create({
        data: {
          name,
          description,
          bannerUrl: bannerUrl || '',
          bannerType: bannerType || 'video',
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          xpBonus: xpBonus || 0,
          xpMultiplier: xpMultiplier || 1.0,
          status: status || 'DRAFT',
          badgeId: badgeId || null,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'CREATE_CAMPAIGN',
          entityType: 'Campaign',
          entityId: campaign.id,
          newValues: campaign,
          description: `Created campaign ${campaign.name}`,
        },
      });

      res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/campaigns/:id - Update campaign
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('bannerUrl').optional().trim(),
    body('bannerType').optional().isIn(['video', 'image']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('xpBonus').optional().isInt({ min: 0 }),
    body('xpMultiplier').optional().isFloat({ min: 1 }),
    body('status').optional().isIn(['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED']),
    body('badgeId').optional({ nullable: true }).isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      const updateData: any = {};
      const allowedFields = [
        'name',
        'description',
        'bannerUrl',
        'bannerType',
        'startDate',
        'endDate',
        'xpBonus',
        'xpMultiplier',
        'status',
        'badgeId',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === 'startDate' || field === 'endDate') {
            updateData[field] = new Date(req.body[field]);
          } else {
            updateData[field] = req.body[field];
          }
        }
      }

      const updatedCampaign = await prisma.campaign.update({
        where: { id: req.params.id },
        data: updateData,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'UPDATE_CAMPAIGN',
          entityType: 'Campaign',
          entityId: campaign.id,
          oldValues: campaign,
          newValues: updateData,
          description: `Updated campaign ${campaign.name}`,
        },
      });

      res.json({
        success: true,
        data: updatedCampaign,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/campaigns/:id - Delete campaign
router.delete(
  '/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Delete campaign (slides and participants cascade)
      await prisma.campaign.delete({
        where: { id: req.params.id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'DELETE_CAMPAIGN',
          entityType: 'Campaign',
          entityId: campaign.id,
          oldValues: campaign,
          description: `Deleted campaign ${campaign.name}`,
        },
      });

      res.json({
        success: true,
        message: 'Campanha excluida com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/:id/launch - Launch campaign (send notifications)
router.post(
  '/:id/launch',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          slides: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      if (campaign.status === 'ACTIVE') {
        throw new AppError('Campaign is already active', 400, 'ALREADY_ACTIVE');
      }

      // Update campaign status to ACTIVE
      const updatedCampaign = await prisma.campaign.update({
        where: { id: req.params.id },
        data: {
          status: 'ACTIVE',
          launchedAt: new Date(),
        },
        include: {
          slides: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Get total applicators for counter
      const totalApplicators = await prisma.user.count({
        where: { status: 'APPROVED' },
      });

      // Emit campaign to all connected mobile users via Socket.io
      emitToMobile('campaign:new', {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        description: updatedCampaign.description,
        bannerUrl: updatedCampaign.bannerUrl,
        bannerType: updatedCampaign.bannerType,
        startDate: updatedCampaign.startDate,
        endDate: updatedCampaign.endDate,
        xpBonus: updatedCampaign.xpBonus,
        xpMultiplier: updatedCampaign.xpMultiplier,
        participantCount: updatedCampaign.participantCount,
        totalApplicators,
        slides: updatedCampaign.slides,
      });

      // Send push notifications to all active applicators
      try {
        const { sendPushToUser } = await import('../../services/push.service');
        const activeUsers = await prisma.user.findMany({
          where: { status: 'APPROVED' },
          select: { id: true },
        });

        const pushPromises = activeUsers.map((user) =>
          sendPushToUser(user.id, {
            title: 'Nova Campanha!',
            body: `${campaign.name} comecou! Confira os bonus.`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: 'campaign-new',
            data: {
              type: 'campaign:new',
              campaignId: campaign.id,
            },
          }).catch((err) => console.error(`Push failed for user ${user.id}:`, err))
        );

        await Promise.allSettled(pushPromises);
        console.log(`[Campaign] Sent push notifications to ${activeUsers.length} users`);
      } catch (pushError) {
        console.error('[Campaign] Failed to send push notifications:', pushError);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'LAUNCH_CAMPAIGN',
          entityType: 'Campaign',
          entityId: campaign.id,
          description: `Launched campaign ${campaign.name}`,
        },
      });

      res.json({
        success: true,
        data: updatedCampaign,
        message: 'Campanha lancada com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/:id/resend - Resend campaign banner to non-participants
router.post(
  '/:id/resend',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          slides: {
            orderBy: { order: 'asc' },
          },
          participants: {
            select: { userId: true },
          },
        },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Get IDs of users who are already participating
      const participantIds = campaign.participants.map(p => p.userId);

      // Get all approved users who are NOT participating
      const nonParticipants = await prisma.user.findMany({
        where: {
          status: 'APPROVED',
          id: { notIn: participantIds },
        },
        select: { id: true },
      });

      if (nonParticipants.length === 0) {
        return res.json({
          success: true,
          message: 'Todos os aplicadores ja estao participando!',
          sentCount: 0,
        });
      }

      // Get total applicators for counter
      const totalApplicators = await prisma.user.count({
        where: { status: 'APPROVED' },
      });

      // Emit campaign to non-participating users via Socket.io
      // forceShow: true tells the app to clear the "seen" cache and show the campaign again
      for (const user of nonParticipants) {
        emitToUser(user.id, 'campaign:new', {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          bannerUrl: campaign.bannerUrl,
          bannerType: campaign.bannerType,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          xpBonus: campaign.xpBonus,
          xpMultiplier: campaign.xpMultiplier,
          participantCount: campaign.participantCount,
          totalApplicators,
          slides: campaign.slides,
          forceShow: true, // Clear "seen" cache and show again
        });
      }

      // Send push notifications to non-participants
      try {
        const { sendPushToUser } = await import('../../services/push.service');

        const pushPromises = nonParticipants.map((user) =>
          sendPushToUser(user.id, {
            title: 'Campanha Ativa!',
            body: `${campaign.name} esta rolando! Participe e ganhe bonus.`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: 'campaign-resend',
            data: {
              type: 'campaign:new',
              campaignId: campaign.id,
              forceShow: true, // Clear "seen" cache and show again
            },
          }).catch((err) => console.error(`Push failed for user ${user.id}:`, err))
        );

        await Promise.allSettled(pushPromises);
        console.log(`[Campaign] Resent banner to ${nonParticipants.length} non-participants`);
      } catch (pushError) {
        console.error('[Campaign] Failed to send push notifications:', pushError);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'RESEND_CAMPAIGN_BANNER',
          entityType: 'Campaign',
          entityId: campaign.id,
          description: `Resent banner for campaign ${campaign.name} to ${nonParticipants.length} non-participants`,
        },
      });

      res.json({
        success: true,
        message: `Banner reenviado para ${nonParticipants.length} aplicadores que ainda nao participam!`,
        sentCount: nonParticipants.length,
        totalApplicators,
        participantsCount: participantIds.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/:id/slides - Add slide to campaign
router.post(
  '/:id/slides',
  adminAuth,
  [
    param('id').isUUID(),
    body('type').isIn(['text', 'image', 'video']),
    body('title').optional().trim(),
    body('content').optional().trim(),
    body('mediaUrl').optional().trim(),
    body('order').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          slides: {
            orderBy: { order: 'desc' },
            take: 1,
          },
        },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      const { type, title, content, mediaUrl, order } = req.body;

      // Calculate order if not provided
      const slideOrder = order ?? (campaign.slides[0]?.order ?? -1) + 1;

      const slide = await prisma.campaignSlide.create({
        data: {
          campaignId: req.params.id,
          type,
          title,
          content,
          mediaUrl,
          order: slideOrder,
        },
      });

      res.status(201).json({
        success: true,
        data: slide,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/campaigns/:id/slides/:slideId - Update slide
router.put(
  '/:id/slides/:slideId',
  adminAuth,
  [
    param('id').isUUID(),
    param('slideId').isUUID(),
    body('type').optional().isIn(['text', 'image', 'video']),
    body('title').optional().trim(),
    body('content').optional().trim(),
    body('mediaUrl').optional().trim(),
    body('order').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const slide = await prisma.campaignSlide.findFirst({
        where: {
          id: req.params.slideId,
          campaignId: req.params.id,
        },
      });

      if (!slide) {
        throw new AppError('Slide not found', 404, 'SLIDE_NOT_FOUND');
      }

      const updateData: any = {};
      const allowedFields = ['type', 'title', 'content', 'mediaUrl', 'order'];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const updatedSlide = await prisma.campaignSlide.update({
        where: { id: req.params.slideId },
        data: updateData,
      });

      res.json({
        success: true,
        data: updatedSlide,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/campaigns/:id/slides/:slideId - Delete slide
router.delete(
  '/:id/slides/:slideId',
  adminAuth,
  [param('id').isUUID(), param('slideId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const slide = await prisma.campaignSlide.findFirst({
        where: {
          id: req.params.slideId,
          campaignId: req.params.id,
        },
      });

      if (!slide) {
        throw new AppError('Slide not found', 404, 'SLIDE_NOT_FOUND');
      }

      await prisma.campaignSlide.delete({
        where: { id: req.params.slideId },
      });

      res.json({
        success: true,
        message: 'Slide excluido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/:id/slides/reorder - Reorder slides
router.post(
  '/:id/slides/reorder',
  adminAuth,
  [
    param('id').isUUID(),
    body('slideIds').isArray({ min: 1 }),
    body('slideIds.*').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { slideIds } = req.body;

      // Update order for each slide
      const updatePromises = slideIds.map((slideId: string, index: number) =>
        prisma.campaignSlide.updateMany({
          where: {
            id: slideId,
            campaignId: req.params.id,
          },
          data: { order: index },
        })
      );

      await Promise.all(updatePromises);

      // Get updated slides
      const slides = await prisma.campaignSlide.findMany({
        where: { campaignId: req.params.id },
        orderBy: { order: 'asc' },
      });

      res.json({
        success: true,
        data: slides,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/import - Import campaign from JSON
router.post(
  '/import',
  adminAuth,
  async (req, res, next) => {
    try {
      const campaignData = req.body;

      // Validate required fields
      if (!campaignData.name || !campaignData.startDate || !campaignData.endDate) {
        throw new AppError('Nome, data inicio e data fim sao obrigatorios', 400, 'MISSING_FIELDS');
      }

      // Create campaign
      const campaign = await prisma.campaign.create({
        data: {
          name: campaignData.name,
          description: campaignData.description || null,
          bannerUrl: campaignData.bannerUrl || '',
          bannerType: campaignData.bannerType || 'video',
          startDate: new Date(campaignData.startDate),
          endDate: new Date(campaignData.endDate),
          xpBonus: campaignData.xpBonus || 0,
          xpMultiplier: campaignData.xpMultiplier || 1.0,
          status: 'DRAFT',
        },
      });

      // Create slides if provided
      if (campaignData.slides && Array.isArray(campaignData.slides)) {
        const slidesData = campaignData.slides.map((slide: any, index: number) => ({
          campaignId: campaign.id,
          type: slide.type || 'text',
          title: slide.title || null,
          content: slide.content || null,
          mediaUrl: slide.mediaUrl || null,
          order: slide.order ?? index,
        }));

        await prisma.campaignSlide.createMany({
          data: slidesData,
        });
      }

      // Fetch complete campaign with slides
      const completeCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.id },
        include: {
          slides: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'IMPORT_CAMPAIGN',
          entityType: 'Campaign',
          entityId: campaign.id,
          description: `Imported campaign ${campaign.name} from JSON`,
        },
      });

      res.status(201).json({
        success: true,
        data: completeCampaign,
        message: 'Campanha importada com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/campaigns/export/:id - Export campaign as JSON
router.get(
  '/export/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          slides: {
            orderBy: { order: 'asc' },
            select: {
              type: true,
              title: true,
              content: true,
              mediaUrl: true,
              order: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      const exportData = {
        name: campaign.name,
        description: campaign.description,
        bannerUrl: campaign.bannerUrl,
        bannerType: campaign.bannerType,
        startDate: campaign.startDate.toISOString().split('T')[0],
        endDate: campaign.endDate.toISOString().split('T')[0],
        xpBonus: campaign.xpBonus,
        xpMultiplier: campaign.xpMultiplier,
        slides: campaign.slides,
      };

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/upload - Upload campaign media
router.post(
  '/upload',
  adminAuth,
  uploadCampaignMedia.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('Arquivo e obrigatorio', 400, 'FILE_REQUIRED');
      }

      // Save to PostgreSQL
      const saved = await saveFile({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        data: req.file.buffer,
        type: 'CAMPAIGN' as UploadType,
      });

      // Determine file type
      const isVideo = req.file.mimetype.startsWith('video/');

      res.json({
        success: true,
        data: {
          url: saved.url,
          type: isVideo ? 'video' : 'image',
          filename: saved.filename,
          originalName: req.file.originalname,
          size: saved.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/admin/campaigns/:id/participants/:userId - Remove participant from campaign
router.delete(
  '/:id/participants/:userId',
  adminAuth,
  [param('id').isUUID(), param('userId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id, userId } = req.params;

      // Check if campaign exists
      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Check if participant exists
      const participant = await prisma.campaignParticipant.findFirst({
        where: {
          campaignId: id,
          userId: userId,
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      if (!participant) {
        throw new AppError('Participant not found in this campaign', 404, 'PARTICIPANT_NOT_FOUND');
      }

      // Delete the participant
      await prisma.campaignParticipant.delete({
        where: { id: participant.id },
      });

      // Update participant count
      await prisma.campaign.update({
        where: { id },
        data: {
          participantCount: { decrement: 1 },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'REMOVE_CAMPAIGN_PARTICIPANT',
          entityType: 'CampaignParticipant',
          entityId: participant.id,
          oldValues: { campaignId: id, userId, userName: participant.user?.name },
          description: `Removed participant ${participant.user?.name || userId} from campaign ${campaign.name}`,
        },
      });

      // Send notification to the removed user
      try {
        // Send push notification
        const { sendPushToUser } = await import('../../services/push.service');
        await sendPushToUser(userId, {
          title: 'Campanha',
          body: `Voce foi removido(a) da campanha "${campaign.name}" :(`,
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
          tag: 'campaign-removed',
          data: {
            type: 'campaign:removed',
            campaignId: campaign.id,
            campaignName: campaign.name,
          },
        }).catch((err) => console.error(`Push failed for removed user ${userId}:`, err));

        // Send Socket.io notification
        emitToUser(userId, 'campaign:removed', {
          campaignId: campaign.id,
          campaignName: campaign.name,
          message: `Voce foi removido(a) da campanha "${campaign.name}" :(`,
        });

        console.log(`[Campaign] Notified user ${userId} about removal from campaign ${campaign.name}`);
      } catch (notifyError) {
        console.error('[Campaign] Failed to notify removed participant:', notifyError);
      }

      res.json({
        success: true,
        message: `Participante ${participant.user?.name || 'removido'} foi removido da campanha`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/:id/winners - Save campaign winners
router.post(
  '/:id/winners',
  adminAuth,
  [
    param('id').isUUID(),
    body('winners').isArray({ min: 1 }),
    body('winners.*.userId').isUUID(),
    body('winners.*.position').isInt({ min: 1 }),
    body('winners.*.xpAwarded').isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: { badge: true },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // DEBUG: Log badge info
      console.log('[Campaign Winners] Campaign:', campaign.name);
      console.log('[Campaign Winners] BadgeId:', campaign.badgeId);
      console.log('[Campaign Winners] Badge relation:', campaign.badge ? campaign.badge.name : 'null');

      const { winners } = req.body;

      // Delete existing winners
      await prisma.campaignWinner.deleteMany({
        where: { campaignId: req.params.id },
      });

      // Create new winners
      const winnerPromises = winners.map(async (winner: any) => {
        // Create winner record
        const campaignWinner = await prisma.campaignWinner.create({
          data: {
            campaignId: req.params.id,
            userId: winner.userId,
            position: winner.position,
            xpAwarded: winner.xpAwarded,
            badgeId: campaign.badgeId,
          },
        });

        // Award XP to user
        await prisma.user.update({
          where: { id: winner.userId },
          data: {
            xpTotal: { increment: winner.xpAwarded },
          },
        });

        // Award badge if campaign has one
        if (campaign.badgeId && campaign.badge) {
          // Check if user already has this badge
          const existingBadge = await prisma.userBadge.findFirst({
            where: {
              userId: winner.userId,
              badgeId: campaign.badgeId,
            },
          });

          if (!existingBadge) {
            await prisma.userBadge.create({
              data: {
                userId: winner.userId,
                badgeId: campaign.badgeId,
                campaignId: req.params.id,
              },
            });

            // Get user info for notification
            const user = await prisma.user.findUnique({
              where: { id: winner.userId },
              select: { name: true },
            });

            // Emit badge:earned socket event
            const { emitBadgeEarned } = await import('../../services/socket.service');
            emitBadgeEarned({
              userId: winner.userId,
              userName: user?.name || 'Aplicador',
              badgeId: campaign.badge.id,
              badgeName: campaign.badge.name,
              badgeIconUrl: campaign.badge.iconUrl,
              badgeColor: campaign.badge.color || '#c9a962',
              badgeRarity: campaign.badge.rarity,
              reason: `Vencedor da campanha "${campaign.name}"`,
              campaignId: campaign.id,
              campaignName: campaign.name,
              timestamp: new Date(),
            });

            // Send push notification for badge
            try {
              const { sendPushToUser } = await import('../../services/push.service');
              await sendPushToUser(winner.userId, {
                title: 'Nova Conquista Desbloqueada!',
                body: `Voce ganhou o badge "${campaign.badge.name}" por vencer a campanha ${campaign.name}!`,
                icon: campaign.badge.iconUrl || '/icons/icon-192.png',
                badge: '/icons/badge-72.png',
                tag: 'badge-earned',
                data: {
                  type: 'badge:earned',
                  badgeId: campaign.badge.id,
                  badgeName: campaign.badge.name,
                  campaignId: campaign.id,
                },
              });
            } catch (pushErr) {
              console.error(`Badge push failed for user ${winner.userId}:`, pushErr);
            }
          }
        }

        return campaignWinner;
      });

      const createdWinners = await Promise.all(winnerPromises);

      // Send notifications to winners
      try {
        const { sendPushToUser } = await import('../../services/push.service');

        const notifyPromises = winners.map(async (winner: any) => {
          // Update notification timestamp
          await prisma.campaignWinner.update({
            where: {
              campaignId_userId: {
                campaignId: req.params.id,
                userId: winner.userId,
              }
            },
            data: { notifiedAt: new Date() },
          });

          // Send push notification
          return sendPushToUser(winner.userId, {
            title: 'Parabens! Voce venceu!',
            body: `Voce foi selecionado como vencedor da campanha ${campaign.name}! +${winner.xpAwarded} XP`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: 'campaign-winner',
            data: {
              type: 'campaign:winner',
              campaignId: campaign.id,
              xpAwarded: winner.xpAwarded,
            },
          }).catch((err) => console.error(`Push failed for winner ${winner.userId}:`, err));
        });

        await Promise.allSettled(notifyPromises);
        console.log(`[Campaign] Notified ${winners.length} winners for campaign ${campaign.name}`);
      } catch (pushError) {
        console.error('[Campaign] Failed to send winner notifications:', pushError);
      }

      // Emit to mobile via Socket.io using the proper function
      for (const winner of winners) {
        // Get user name for the notification
        const user = await prisma.user.findUnique({
          where: { id: winner.userId },
          select: { name: true },
        });

        emitCampaignWinner({
          userId: winner.userId,
          userName: user?.name || 'Aplicador',
          campaignId: campaign.id,
          campaignName: campaign.name,
          position: winner.position,
          xpReward: winner.xpAwarded,
          prize: campaign.badge?.name,
          timestamp: new Date(),
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'SELECT_CAMPAIGN_WINNERS',
          entityType: 'Campaign',
          entityId: campaign.id,
          newValues: { winners },
          description: `Selected ${winners.length} winners for campaign ${campaign.name}`,
        },
      });

      res.json({
        success: true,
        data: createdWinners,
        message: `${winners.length} vencedores salvos com sucesso!`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/campaigns/:id/winners/notify - Notify winners again
router.post(
  '/:id/winners/notify',
  adminAuth,
  [
    param('id').isUUID(),
    body('winnerIds').isArray({ min: 1 }),
    body('winnerIds.*').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          winners: {
            where: {
              userId: { in: req.body.winnerIds },
            },
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Send notifications
      try {
        const { sendPushToUser } = await import('../../services/push.service');

        const notifyPromises = campaign.winners.map(async (winner) => {
          // Update notification timestamp
          await prisma.campaignWinner.update({
            where: { id: winner.id },
            data: { notifiedAt: new Date() },
          });

          // Send push notification
          return sendPushToUser(winner.userId, {
            title: 'Lembrete: Voce e um vencedor!',
            body: `Voce venceu a campanha ${campaign.name}! +${winner.xpAwarded} XP`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: 'campaign-winner-reminder',
            data: {
              type: 'campaign:winner',
              campaignId: campaign.id,
              xpAwarded: winner.xpAwarded,
            },
          }).catch((err) => console.error(`Push failed for winner ${winner.userId}:`, err));
        });

        await Promise.allSettled(notifyPromises);
      } catch (pushError) {
        console.error('[Campaign] Failed to send winner notifications:', pushError);
      }

      // Emit via Socket.io
      for (const winner of campaign.winners) {
        emitCampaignWinner({
          userId: winner.userId,
          userName: winner.user?.name || 'Aplicador',
          campaignId: campaign.id,
          campaignName: campaign.name,
          position: winner.position,
          xpReward: winner.xpAwarded,
          timestamp: new Date(),
        });
      }

      res.json({
        success: true,
        message: `Notificacoes enviadas para ${campaign.winners.length} vencedores`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as campaignsRoutes };
