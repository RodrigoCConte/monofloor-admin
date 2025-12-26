import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { adminAuth } from '../../middleware/auth';

const router = Router();

// GET /api/admin/dashboard/stats (OPTIMIZED with parallel queries)
router.get('/stats', adminAuth, async (req, res, next) => {
  try {
    // OPTIMIZATION: Run all queries in parallel
    const [
      activeProjects,
      totalProjects,
      totalApplicators,
      m2Result,
      m2AppliedResult,
      onlineApplicators,
      pendingApprovals,
    ] = await Promise.all([
      // Total projects in execution (only EXECUCAO module)
      prisma.project.count({
        where: {
          status: { in: ['EM_EXECUCAO', 'PAUSADO'] },
          currentModule: 'EXECUCAO'
        },
      }),
      // Total projects
      prisma.project.count(),
      // Total approved applicators
      prisma.user.count({
        where: { status: 'APPROVED' },
      }),
      // Total square meters (sum of EXECUCAO module projects)
      prisma.project.aggregate({
        where: {
          status: { in: ['EM_EXECUCAO', 'PAUSADO'] },
          currentModule: 'EXECUCAO'
        },
        _sum: { m2Total: true },
      }),
      // Total square meters applied (sum from all users)
      prisma.user.aggregate({
        _sum: { totalM2Applied: true },
      }),
      // Online applicators (users with active check-in)
      prisma.checkin.count({
        where: {
          checkoutAt: null,
          checkinAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
        },
      }),
      // Pending approvals
      prisma.user.count({
        where: { status: 'PENDING_APPROVAL' },
      }),
    ]);

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
