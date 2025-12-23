import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { saveFile, deleteFile, UploadType } from '../../services/db-storage.service';
import prisma from '../../lib/prisma';

const router = Router();

// Multer configuration with memory storage
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
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
    const errorMessages = errors.array().map((e: any) => `${e.path}: ${e.msg}`).join(', ');
    console.error('[Academy] Validation errors:', errorMessages);
    console.error('[Academy] Request body:', JSON.stringify(req.body, null, 2));
    console.error('[Academy] Full errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Validacao falhou: ${errorMessages}`,
        details: errors.array(),
      },
    });
  }
  next();
};

// =============================================
// GET /api/admin/academy/videos - List all educational videos
// =============================================
router.get(
  '/videos',
  adminAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('category').optional().isIn(['TECNICA', 'SEGURANCA', 'PRODUTO', 'ATENDIMENTO', 'GERAL']),
    query('level').optional().isIn(['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']),
    query('isActive').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const where: any = {};
      if (req.query.category) where.category = req.query.category;
      if (req.query.level) where.level = req.query.level;
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === 'true';
      }

      const [videos, total] = await Promise.all([
        prisma.educationalVideo.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { sortOrder: 'asc' },
          include: {
            quiz: {
              select: {
                id: true,
                xpReward: true,
                passingScore: true,
                _count: { select: { questions: true, attempts: true } },
              },
            },
            _count: {
              select: { progress: true },
            },
          },
        }),
        prisma.educationalVideo.count({ where }),
      ]);

      // Calculate quiz pass rate for each video
      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          let quizPassRate = 0;
          if (video.quiz) {
            const passedCount = await prisma.quizAttempt.count({
              where: { quizId: video.quiz.id, passed: true },
            });
            const totalAttempts = video.quiz._count.attempts;
            quizPassRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
          }

          return {
            ...video,
            quizQuestionsCount: video.quiz?._count.questions || 0,
            quizAttemptsCount: video.quiz?._count.attempts || 0,
            quizPassRate,
            progressCount: video._count.progress,
          };
        })
      );

      res.json({
        success: true,
        data: {
          videos: videosWithStats,
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
// GET /api/admin/academy/videos/:id - Get video details
// =============================================
router.get(
  '/videos/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
        include: {
          quiz: {
            include: {
              questions: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  answers: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
          _count: {
            select: { progress: true },
          },
        },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/academy/videos - Create video
// =============================================
router.post(
  '/videos',
  adminAuth,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 5000 }),
    body('videoUrl').trim().isLength({ min: 1 }),
    body('thumbnailUrl').optional().trim(),
    body('durationSeconds').isInt({ min: 1 }),
    body('category').optional().isIn(['TECNICA', 'SEGURANCA', 'PRODUTO', 'ATENDIMENTO', 'GERAL']),
    body('level').optional().isIn(['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']),
    body('xpForWatching').optional().isInt({ min: 0, max: 100000 }),
    body('isRequired').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        durationSeconds,
        category,
        level,
        xpForWatching,
        isRequired,
      } = req.body;

      // Get max sortOrder
      const maxOrder = await prisma.educationalVideo.aggregate({
        _max: { sortOrder: true },
      });

      const video = await prisma.educationalVideo.create({
        data: {
          title,
          description: description || null,
          videoUrl,
          thumbnailUrl: thumbnailUrl || null,
          durationSeconds,
          category: category || 'TECNICA',
          level: level || 'INICIANTE',
          xpForWatching: xpForWatching || 0,
          isRequired: isRequired || false,
          sortOrder: (maxOrder._max.sortOrder || 0) + 1,
          isActive: false, // Start as draft
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'CREATE_EDUCATIONAL_VIDEO',
          entityType: 'EducationalVideo',
          entityId: video.id,
          newValues: { title },
        },
      });

      res.status(201).json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/academy/videos/upload - Upload video file
// =============================================
router.post(
  '/videos/upload',
  adminAuth,
  uploadVideo.single('video'),
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
        type: 'EDUCATIONAL_VIDEO' as UploadType,
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
// PUT /api/admin/academy/videos/:id - Update video
// =============================================
router.put(
  '/videos/:id',
  adminAuth,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }),
    body('videoUrl').optional().trim().isLength({ min: 1 }),
    body('thumbnailUrl').optional({ nullable: true }).trim(),
    body('durationSeconds').optional().isInt({ min: 1 }),
    body('category').optional().isIn(['TECNICA', 'SEGURANCA', 'PRODUTO', 'ATENDIMENTO', 'GERAL']),
    body('level').optional().isIn(['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']),
    body('xpForWatching').optional().isInt({ min: 0, max: 100000 }),
    body('isRequired').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      const updateData: any = {};
      const allowedFields = [
        'title',
        'description',
        'videoUrl',
        'thumbnailUrl',
        'durationSeconds',
        'category',
        'level',
        'xpForWatching',
        'isRequired',
        'isActive',
        'sortOrder',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const updated = await prisma.educationalVideo.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          quiz: {
            select: {
              id: true,
              xpReward: true,
              _count: { select: { questions: true } },
            },
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
// POST /api/admin/academy/videos/:id/publish - Publish video
// =============================================
router.post(
  '/videos/:id/publish',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      const updated = await prisma.educationalVideo.update({
        where: { id: req.params.id },
        data: {
          isActive: true,
          publishedAt: new Date(),
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'PUBLISH_EDUCATIONAL_VIDEO',
          entityType: 'EducationalVideo',
          entityId: video.id,
          description: `Published video "${video.title}"`,
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
// DELETE /api/admin/academy/videos/:id - Delete video
// =============================================
router.delete(
  '/videos/:id',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      // Delete video file from database if it's a local file
      if (video.videoUrl && video.videoUrl.startsWith('/files/')) {
        const fileId = video.videoUrl.replace('/files/', '');
        await deleteFile(fileId);
      }

      await prisma.educationalVideo.delete({
        where: { id: req.params.id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'DELETE_EDUCATIONAL_VIDEO',
          entityType: 'EducationalVideo',
          entityId: req.params.id,
          oldValues: { title: video.title },
        },
      });

      res.json({
        success: true,
        message: 'Video deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/academy/videos/:id/stats - Get video stats
// =============================================
router.get(
  '/videos/:id/stats',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
        include: {
          quiz: true,
        },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      // Get video progress stats
      const [
        totalStarted,
        totalCompleted,
        totalXpFromWatching,
      ] = await Promise.all([
        prisma.videoProgress.count({
          where: { videoId: req.params.id },
        }),
        prisma.videoProgress.count({
          where: { videoId: req.params.id, completed: true },
        }),
        prisma.videoProgress.aggregate({
          where: { videoId: req.params.id },
          _sum: { xpEarnedWatch: true },
        }),
      ]);

      // Get quiz stats if quiz exists
      let quizStats = null;
      if (video.quiz) {
        const [quizAttempts, quizPassed, totalXpFromQuiz] = await Promise.all([
          prisma.quizAttempt.count({
            where: { quizId: video.quiz.id },
          }),
          prisma.quizAttempt.count({
            where: { quizId: video.quiz.id, passed: true },
          }),
          prisma.quizAttempt.aggregate({
            where: { quizId: video.quiz.id },
            _sum: { xpEarned: true },
          }),
        ]);

        quizStats = {
          totalAttempts: quizAttempts,
          totalPassed: quizPassed,
          passRate: quizAttempts > 0 ? Math.round((quizPassed / quizAttempts) * 100) : 0,
          totalXpAwarded: totalXpFromQuiz._sum.xpEarned || 0,
        };
      }

      res.json({
        success: true,
        data: {
          totalStarted,
          totalCompleted,
          completionRate: totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0,
          totalXpFromWatching: totalXpFromWatching._sum.xpEarnedWatch || 0,
          quiz: quizStats,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/academy/videos/:id/quiz - Create or update quiz
// =============================================
router.post(
  '/videos/:id/quiz',
  adminAuth,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ max: 200 }),
    body('passingScore').optional().custom((value) => {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 100) throw new Error('Deve ser entre 1 e 100');
      return true;
    }),
    body('maxAttempts').optional().custom((value) => {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 10) throw new Error('Deve ser entre 0 e 10');
      return true;
    }),
    body('xpReward').optional().custom((value) => {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100000) throw new Error('Deve ser entre 0 e 100000');
      return true;
    }),
    body('questions').isArray({ min: 1 }),
    body('questions.*.questionText').trim().isLength({ min: 1, max: 1000 }),
    body('questions.*.questionType').optional().isIn(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']),
    body('questions.*.explanation').optional().trim().isLength({ max: 2000 }),
    body('questions.*.answers').isArray({ min: 2 }),
    body('questions.*.answers.*.answerText').trim().isLength({ min: 1, max: 500 }),
    body('questions.*.answers.*.isCorrect').custom((value) => {
      if (typeof value === 'boolean') return true;
      if (value === 'true' || value === 'false') return true;
      throw new Error('Deve ser um valor booleano');
    }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
        include: { quiz: true },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      const { title, passingScore, maxAttempts, xpReward, questions } = req.body;

      // Helper to convert string/boolean to boolean
      const toBool = (val: any): boolean => val === true || val === 'true';

      // Validate each question has at least one correct answer
      for (const q of questions) {
        const hasCorrect = q.answers.some((a: any) => toBool(a.isCorrect));
        if (!hasCorrect) {
          throw new AppError(
            `A pergunta "${q.questionText.substring(0, 50)}..." precisa ter pelo menos uma resposta correta`,
            400,
            'VALIDATION_ERROR'
          );
        }
      }

      // Delete existing quiz if exists
      if (video.quiz) {
        await prisma.videoQuiz.delete({
          where: { id: video.quiz.id },
        });
      }

      // Create new quiz with questions and answers
      const quiz = await prisma.videoQuiz.create({
        data: {
          videoId: req.params.id,
          title: title || null,
          passingScore: passingScore || 70,
          maxAttempts: maxAttempts ?? 3,
          xpReward: xpReward || 100,
          questions: {
            create: questions.map((q: any, qIndex: number) => ({
              questionText: q.questionText,
              questionType: q.questionType || 'SINGLE_CHOICE',
              explanation: q.explanation || null,
              imageUrl: q.imageUrl || null,
              sortOrder: qIndex,
              answers: {
                create: q.answers.map((a: any, aIndex: number) => ({
                  answerText: a.answerText,
                  isCorrect: toBool(a.isCorrect),
                  sortOrder: aIndex,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            orderBy: { sortOrder: 'asc' },
            include: {
              answers: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: video.quiz ? 'UPDATE_VIDEO_QUIZ' : 'CREATE_VIDEO_QUIZ',
          entityType: 'VideoQuiz',
          entityId: quiz.id,
          description: `${video.quiz ? 'Updated' : 'Created'} quiz for video "${video.title}"`,
        },
      });

      res.json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/academy/videos/:id/quiz - Get quiz with correct answers
// =============================================
router.get(
  '/videos/:id/quiz',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
        include: {
          quiz: {
            include: {
              questions: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  answers: { orderBy: { sortOrder: 'asc' } },
                },
              },
              _count: {
                select: { attempts: true },
              },
            },
          },
        },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      if (!video.quiz) {
        throw new AppError('Este video nao tem quiz', 404, 'NO_QUIZ');
      }

      res.json({
        success: true,
        data: video.quiz,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// DELETE /api/admin/academy/videos/:id/quiz - Delete quiz
// =============================================
router.delete(
  '/videos/:id/quiz',
  adminAuth,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const video = await prisma.educationalVideo.findUnique({
        where: { id: req.params.id },
        include: { quiz: true },
      });

      if (!video) {
        throw new AppError('Video nao encontrado', 404, 'NOT_FOUND');
      }

      if (!video.quiz) {
        throw new AppError('Este video nao tem quiz', 404, 'NO_QUIZ');
      }

      await prisma.videoQuiz.delete({
        where: { id: video.quiz.id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUser: { connect: { id: req.user!.sub } },
          action: 'DELETE_VIDEO_QUIZ',
          entityType: 'VideoQuiz',
          entityId: video.quiz.id,
          description: `Deleted quiz for video "${video.title}"`,
        },
      });

      res.json({
        success: true,
        message: 'Quiz deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as academyRoutes };
