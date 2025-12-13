import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { adminAuth } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/admin/dashboard/stats
router.get('/stats', adminAuth, async (req, res, next) => {
  try {
    // Total projects in execution
    const activeProjects = await prisma.project.count({
      where: { status: 'EM_EXECUCAO' },
    });

    // Total projects
    const totalProjects = await prisma.project.count();

    // Total approved applicators
    const totalApplicators = await prisma.user.count({
      where: { status: 'APPROVED' },
    });

    // Total square meters (sum of all active projects)
    const m2Result = await prisma.project.aggregate({
      where: { status: 'EM_EXECUCAO' },
      _sum: { m2Total: true },
    });

    // Total square meters applied (sum from all users)
    const m2AppliedResult = await prisma.user.aggregate({
      _sum: { totalM2Applied: true },
    });

    // Online applicators (users with active check-in)
    const onlineApplicators = await prisma.checkin.count({
      where: {
        checkoutAt: null,
        checkinAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
      },
    });

    // Pending approvals
    const pendingApprovals = await prisma.user.count({
      where: { status: 'PENDING_APPROVAL' },
    });

    res.json({
      success: true,
      data: {
        // Names used by frontend
        activeProjects,
        totalApplicators,
        pendingApprovals,
        totalM2Applied: Number(m2AppliedResult._sum.totalM2Applied) || 0,
        // Additional data
        totalProjects,
        totalSquareMeters: Number(m2Result._sum.m2Total) || 0,
        onlineApplicators,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/dashboard/top-applicators
router.get('/top-applicators', adminAuth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topApplicators = await prisma.user.findMany({
      where: { status: 'APPROVED' },
      orderBy: { totalHoursWorked: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        photoUrl: true,
        totalHoursWorked: true,
        totalProjectsCount: true,
        totalM2Applied: true,
      },
    });

    res.json({
      success: true,
      data: topApplicators.map((u) => ({
        ...u,
        totalHoursWorked: Number(u.totalHoursWorked),
        totalM2Applied: Number(u.totalM2Applied),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/dashboard/bottom-applicators
router.get('/bottom-applicators', adminAuth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const bottomApplicators = await prisma.user.findMany({
      where: { status: 'APPROVED' },
      orderBy: { totalHoursWorked: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        photoUrl: true,
        totalHoursWorked: true,
        totalProjectsCount: true,
        totalM2Applied: true,
      },
    });

    res.json({
      success: true,
      data: bottomApplicators.map((u) => ({
        ...u,
        totalHoursWorked: Number(u.totalHoursWorked),
        totalM2Applied: Number(u.totalM2Applied),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/dashboard/online-applicators
router.get('/online-applicators', adminAuth, async (req, res, next) => {
  try {
    const activeCheckins = await prisma.checkin.findMany({
      where: {
        checkoutAt: null,
        checkinAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
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
        project: {
          select: {
            id: true,
            title: true,
            cliente: true,
          },
        },
      },
      orderBy: { checkinAt: 'desc' },
    });

    res.json({
      success: true,
      data: activeCheckins.map((c) => ({
        checkinId: c.id,
        checkinAt: c.checkinAt,
        user: c.user,
        project: c.project,
        durationMinutes: Math.floor(
          (Date.now() - c.checkinAt.getTime()) / (1000 * 60)
        ),
      })),
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRoutes };
