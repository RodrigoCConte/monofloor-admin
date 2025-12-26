/**
 * Report Responsibility Routes (Mobile)
 * Endpoints for daily report responsibility management
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { mobileAuth } from '../../middleware/auth';
import {
  getTodayResponsibility,
  transferResponsibility,
  getTeamForTransfer,
} from '../../services/report-responsibility.service';

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

// =============================================
// GET /api/mobile/report-responsibility/today
// Get today's report responsibility for a project
// =============================================
router.get(
  '/today',
  mobileAuth,
  query('projectId').notEmpty().withMessage('Project ID is required'),
  validate,
  async (req, res, next) => {
    try {
      const projectId = req.query.projectId as string;
      const userId = req.user!.sub;

      const responsibility = await getTodayResponsibility(projectId);

      if (!responsibility) {
        return res.json({
          success: true,
          data: null,
          message: 'No responsibility assigned for today yet',
        });
      }

      res.json({
        success: true,
        data: {
          ...responsibility,
          isCurrentUserResponsible: responsibility.responsibleUserId === userId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/mobile/report-responsibility/transfer
// Transfer report responsibility to another team member
// =============================================
router.post(
  '/transfer',
  mobileAuth,
  body('responsibilityId').notEmpty().withMessage('Responsibility ID is required'),
  body('newResponsibleUserId').notEmpty().withMessage('New responsible user ID is required'),
  body('reason').optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const { responsibilityId, newResponsibleUserId, reason } = req.body;
      const currentUserId = req.user!.sub;

      const result = await transferResponsibility(
        responsibilityId,
        currentUserId,
        newResponsibleUserId,
        reason
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TRANSFER_FAILED',
            message: result.message,
          },
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/mobile/report-responsibility/team/:projectId
// Get team members available for transfer
// =============================================
router.get(
  '/team/:projectId',
  mobileAuth,
  param('projectId').notEmpty().withMessage('Project ID is required'),
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const currentUserId = req.user!.sub;

      const team = await getTeamForTransfer(projectId, currentUserId);

      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
