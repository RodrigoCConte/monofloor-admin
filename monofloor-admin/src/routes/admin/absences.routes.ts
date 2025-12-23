import { Router } from 'express';
import { adminAuth } from '../../middleware/auth';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/admin/absences - List all absences
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Fetch AbsenceNotice records
    const absenceNotices = await prisma.absenceNotice.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(Object.keys(dateFilter).length > 0 && { absenceDate: dateFilter }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            role: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    });

    // Fetch UnreportedAbsence records
    const unreportedAbsences = await prisma.unreportedAbsence.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(Object.keys(dateFilter).length > 0 && { absenceDate: dateFilter }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            role: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    });

    // For each absence, find scheduled tasks/projects
    const enrichedAbsenceNotices = await Promise.all(
      absenceNotices.map(async (absence) => {
        const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);
        return {
          ...absence,
          type: 'ABSENCE_NOTICE' as const,
          scheduledTasks,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
        };
      })
    );

    const enrichedUnreportedAbsences = await Promise.all(
      unreportedAbsences.map(async (absence) => {
        const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);
        return {
          ...absence,
          type: 'UNREPORTED_ABSENCE' as const,
          scheduledTasks,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
        };
      })
    );

    // Count totals
    const totalNotices = await prisma.absenceNotice.count({
      where: {
        ...(status && { status: status as any }),
        ...(Object.keys(dateFilter).length > 0 && { absenceDate: dateFilter }),
      },
    });

    const totalUnreported = await prisma.unreportedAbsence.count({
      where: {
        ...(status && { status: status as any }),
        ...(Object.keys(dateFilter).length > 0 && { absenceDate: dateFilter }),
      },
    });

    res.json({
      success: true,
      data: {
        absenceNotices: enrichedAbsenceNotices,
        unreportedAbsences: enrichedUnreportedAbsences,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalNotices,
          totalUnreported,
          total: totalNotices + totalUnreported,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/absences/pending-count - Count recent absences (last 7 days)
router.get('/pending-count', adminAuth, async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const noticesCount = await prisma.absenceNotice.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const unreportedCount = await prisma.unreportedAbsence.count({
      where: {
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      data: {
        recentNotices: noticesCount,
        pendingUnreported: unreportedCount,
        total: noticesCount + unreportedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/absences/pending - Get absences requiring admin action (not acknowledged)
router.get('/pending', adminAuth, async (req, res, next) => {
  try {
    // Get absence notices without acknowledgement
    const pendingNotices = await prisma.absenceNotice.findMany({
      where: {
        acknowledgedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get unreported absences without acknowledgement
    const pendingUnreported = await prisma.unreportedAbsence.findMany({
      where: {
        acknowledgedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with scheduled tasks
    const enrichedNotices = await Promise.all(
      pendingNotices.map(async (absence) => {
        const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);
        return {
          ...absence,
          type: 'ABSENCE_NOTICE' as const,
          scheduledTasks,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
        };
      })
    );

    const enrichedUnreported = await Promise.all(
      pendingUnreported.map(async (absence) => {
        const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);
        return {
          ...absence,
          type: 'UNREPORTED_ABSENCE' as const,
          scheduledTasks,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
        };
      })
    );

    res.json({
      success: true,
      data: {
        absenceNotices: enrichedNotices,
        unreportedAbsences: enrichedUnreported,
        total: enrichedNotices.length + enrichedUnreported.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/absences/:id - Get single absence details
router.get('/:id', adminAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to find in AbsenceNotice first
    let absence: any = await prisma.absenceNotice.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            role: true,
            phone: true,
          },
        },
      },
    });

    if (absence) {
      const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);
      return res.json({
        success: true,
        data: {
          ...absence,
          type: 'ABSENCE_NOTICE',
          scheduledTasks,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
        },
      });
    }

    // Try UnreportedAbsence
    absence = await prisma.unreportedAbsence.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            role: true,
            phone: true,
          },
        },
      },
    });

    if (absence) {
      const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);
      return res.json({
        success: true,
        data: {
          ...absence,
          type: 'UNREPORTED_ABSENCE',
          scheduledTasks,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
        },
      });
    }

    return res.status(404).json({
      success: false,
      error: { message: 'Absence not found' },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/absences/:id/acknowledge - Mark absence as acknowledged by admin
router.post('/:id/acknowledge', adminAuth, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.sub || req.user?.id;

    // Try to find in AbsenceNotice first
    let absence: any = await prisma.absenceNotice.findUnique({
      where: { id },
    });

    if (absence) {
      const updated = await prisma.absenceNotice.update({
        where: { id },
        data: {
          acknowledgedAt: new Date(),
          acknowledgedBy: adminId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.json({
        success: true,
        message: 'Falta marcada como ciente',
        data: { ...updated, type: 'ABSENCE_NOTICE' },
      });
    }

    // Try UnreportedAbsence
    absence = await prisma.unreportedAbsence.findUnique({
      where: { id },
    });

    if (absence) {
      const updated = await prisma.unreportedAbsence.update({
        where: { id },
        data: {
          acknowledgedAt: new Date(),
          acknowledgedBy: adminId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.json({
        success: true,
        message: 'Falta marcada como ciente',
        data: { ...updated, type: 'UNREPORTED_ABSENCE' },
      });
    }

    return res.status(404).json({
      success: false,
      error: { message: 'Falta não encontrada' },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get scheduled tasks for a user on a specific date
async function getScheduledTasksForDate(userId: string, date: Date) {
  const absenceDate = new Date(date);
  absenceDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(absenceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const taskAssignments = await prisma.taskAssignment.findMany({
    where: {
      userId,
      projectTask: {
        OR: [
          // Task starts on or before the absence date and ends on or after
          {
            startDate: { lte: absenceDate },
            endDate: { gte: absenceDate },
          },
          // Task starts on the absence date (no end date)
          {
            startDate: { gte: absenceDate, lt: nextDay },
            endDate: null,
          },
          // Task with no dates (fallback - show all assigned tasks)
          // This is commented out to avoid showing unscheduled tasks
          // { startDate: null, endDate: null },
        ],
      },
    },
    include: {
      projectTask: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
              cliente: true,
              endereco: true,
            },
          },
        },
      },
    },
  });

  return taskAssignments.map((ta) => ({
    id: ta.projectTask.id,
    title: ta.projectTask.title,
    startDate: ta.projectTask.startDate,
    endDate: ta.projectTask.endDate,
    project: ta.projectTask.project,
  }));
}

export default router;
