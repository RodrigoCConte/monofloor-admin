import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAdminToken, generateMobileToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure upload directories
const uploadsDir = path.join(__dirname, '../../uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const documentsDir = path.join(uploadsDir, 'documents');

// Create directories if they don't exist
[uploadsDir, profilePhotosDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
      cb(null, profilePhotosDir);
    } else if (file.fieldname === 'document') {
      cb(null, documentsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and PDF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  }
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
// ADMIN AUTH
// =============================================

// POST /api/auth/admin/setup - One-time admin creation (only works if no admin exists)
router.post(
  '/admin/setup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
    body('setupKey').equals('MONOFLOOR_SETUP_2024'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      // Check if any admin already exists
      const existingAdmin = await prisma.adminUser.findFirst();
      if (existingAdmin) {
        throw new AppError('Admin already exists', 400, 'ADMIN_EXISTS');
      }

      const passwordHash = await hashPassword(password);

      const admin = await prisma.adminUser.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Admin created successfully',
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/admin/login
router.post(
  '/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const admin = await prisma.adminUser.findUnique({
        where: { email },
      });

      if (!admin) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      if (!admin.isActive) {
        throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED');
      }

      const isValidPassword = await comparePassword(password, admin.passwordHash);

      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      // Update last login
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      const token = generateAdminToken({
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// MOBILE AUTH
// =============================================

// POST /api/auth/mobile/register (with file uploads)
router.post(
  '/mobile/register',
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const { email, password, name, username, phone, cpf } = req.body;

      // Manual validation since we're using multer
      if (!email || !password || !name || !username) {
        throw new AppError('Missing required fields: email, password, name, username', 400, 'VALIDATION_ERROR');
      }

      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
      }

      if (name.length < 2) {
        throw new AppError('Name must be at least 2 characters', 400, 'VALIDATION_ERROR');
      }

      if (username.length < 3) {
        throw new AppError('Username must be at least 3 characters', 400, 'VALIDATION_ERROR');
      }

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingEmail) {
        throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
      }

      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new AppError('Username already taken', 400, 'USERNAME_EXISTS');
      }

      // Check if CPF already exists (if provided)
      if (cpf) {
        const cleanCpf = cpf.replace(/\D/g, '');
        const existingCpf = await prisma.user.findUnique({
          where: { cpf: cleanCpf },
        });

        if (existingCpf) {
          throw new AppError('CPF already registered', 400, 'CPF_EXISTS');
        }
      }

      const passwordHash = await hashPassword(password);

      // Get uploaded file paths
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profilePhotoFile = files?.profilePhoto?.[0];
      const documentFile = files?.document?.[0];

      // Generate URLs for files
      const photoUrl = profilePhotoFile
        ? `/uploads/profile-photos/${profilePhotoFile.filename}`
        : null;
      const documentUrl = documentFile
        ? `/uploads/documents/${documentFile.filename}`
        : null;

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          username,
          phone: phone || null,
          cpf: cpf ? cpf.replace(/\D/g, '') : null,
          photoUrl,
          documentUrl,
          status: 'PENDING_APPROVAL', // Needs admin approval
        },
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Registration successful. Waiting for admin approval.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            status: user.status,
            photoUrl: user.photoUrl,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/mobile/login
router.post(
  '/mobile/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      // Check approval status
      if (user.status === 'PENDING_APPROVAL') {
        throw new AppError(
          'Your account is pending approval',
          403,
          'PENDING_APPROVAL'
        );
      }

      if (user.status === 'REJECTED') {
        throw new AppError(
          'Your account was not approved',
          403,
          'ACCOUNT_REJECTED'
        );
      }

      if (user.status === 'SUSPENDED') {
        throw new AppError('Your account is suspended', 403, 'ACCOUNT_SUSPENDED');
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);

      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      const token = generateMobileToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            role: user.role,
            photoUrl: user.photoUrl,
            xpTotal: user.xpTotal,
            level: user.level,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as authRoutes };
