import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'admin' | 'mobile';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware for admin routes
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.admin.secret) as JwtPayload;

    if (decoded.type !== 'admin') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
  }
};

// Middleware for mobile app routes
export const mobileAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.mobile.secret) as JwtPayload;

    if (decoded.type !== 'mobile') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
  }
};

// Generate tokens
export const generateAdminToken = (user: { id: string; email: string; role: string }): string => {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'admin',
  };

  return jwt.sign(payload, config.jwt.admin.secret, {
    expiresIn: config.jwt.admin.expiresIn as any,
  });
};

export const generateMobileToken = (user: { id: string; email: string; role: string }): string => {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'mobile',
  };

  return jwt.sign(payload, config.jwt.mobile.secret, {
    expiresIn: config.jwt.mobile.expiresIn as any,
  });
};
