import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAdminToken, generateMobileToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

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

// =============================================
// ADMIN AUTH
// =============================================

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

// POST /api/auth/mobile/register
router.post(
  '/mobile/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 2 }),
    body('username').trim().isLength({ min: 3 }).isAlphanumeric(),
    body('phone').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, username, phone } = req.body;

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email },
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

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          username,
          phone,
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
