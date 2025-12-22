import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { adminAuth } from '../../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Unified request types
type RequestType = 'CONTRIBUTION' | 'ABSENCE' | 'HELP_REQUEST' | 'MATERIAL_REQUEST';

interface UnifiedRequest {
  id: string;
  type: RequestType;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
    role: string;
    phone: string | null;
  };
  project: {
    id: string;
    title: string;
    cliente: string | null;
    endereco: string | null;
  } | null;
  details: Record<string, any>;
  reviewedAt: Date | null;
  reviewedBy: { id: string; name: string } | null;
}

// GET /api/admin/requests - Get unified list of all request types
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const requests: UnifiedRequest[] = [];

    // Fetch Contributions (if no type filter or type is CONTRIBUTION)
    if (!type || type === 'CONTRIBUTION') {
      const contributions = await prisma.contributionRequest.findMany({
        where: {
          ...(status && { status: status as any }),
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
          project: {
            select: {
              id: true,
              title: true,
              cliente: true,
              endereco: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get current project for each user (from active checkin)
      for (const contribution of contributions) {
        const activeCheckin = await prisma.checkin.findFirst({
          where: {
            userId: contribution.userId,
            checkoutAt: null,
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                cliente: true,
              },
            },
          },
        });

        requests.push({
          id: contribution.id,
          type: 'CONTRIBUTION',
          status: contribution.status,
          createdAt: contribution.createdAt,
          user: contribution.user,
          project: contribution.project,
          details: {
            description: contribution.description,
            currentProject: activeCheckin?.project || null,
          },
          reviewedAt: contribution.reviewedAt,
          reviewedBy: contribution.reviewedBy,
        });
      }
    }

    // Fetch Help Requests (if no type filter or type is HELP_REQUEST/MATERIAL_REQUEST)
    if (!type || type === 'HELP_REQUEST' || type === 'MATERIAL_REQUEST') {
      const helpRequests = await prisma.helpRequest.findMany({
        where: {
          ...(status && { status: status as any }),
          ...(type === 'HELP_REQUEST' && { type: 'HELP' }),
          ...(type === 'MATERIAL_REQUEST' && { type: 'MATERIAL' }),
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
          project: {
            select: {
              id: true,
              title: true,
              cliente: true,
              endereco: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const helpRequest of helpRequests) {
        requests.push({
          id: helpRequest.id,
          type: helpRequest.type === 'MATERIAL' ? 'MATERIAL_REQUEST' : 'HELP_REQUEST',
          status: helpRequest.status,
          createdAt: helpRequest.createdAt,
          user: helpRequest.user,
          project: helpRequest.project,
          details: {
            materialName: helpRequest.materialName,
            quantity: helpRequest.quantity,
            description: helpRequest.description,
            audioUrl: helpRequest.audioUrl,
            audioTranscription: helpRequest.audioTranscription,
            videoUrl: helpRequest.videoUrl,
            adminNotes: helpRequest.adminNotes,
          },
          reviewedAt: helpRequest.resolvedAt,
          reviewedBy: helpRequest.resolvedBy,
        });
      }
    }

    // Fetch Absences (if no type filter or type is ABSENCE)
    if (!type || type === 'ABSENCE') {
      // Fetch AbsenceNotice records
      const absenceNotices = await prisma.absenceNotice.findMany({
        where: {
          ...(status && { status: status as any }),
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
      });

      for (const absence of absenceNotices) {
        const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);

        requests.push({
          id: absence.id,
          type: 'ABSENCE',
          status: absence.status,
          createdAt: absence.createdAt,
          user: absence.user,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
          details: {
            absenceDate: absence.absenceDate,
            reason: absence.reason,
            wasAdvanceNotice: absence.wasAdvanceNotice,
            xpPenalty: absence.xpPenalty,
            multiplierReset: absence.multiplierReset,
            noticeType: absence.noticeType,
            acknowledgedAt: absence.acknowledgedAt,
            acknowledgedBy: absence.acknowledgedBy,
            scheduledTasks: scheduledTasks.map((t) => ({
              title: t.title,
              project: t.project?.title || t.project?.cliente,
            })),
          },
          reviewedAt: absence.acknowledgedAt,
          reviewedBy: null,
        });
      }

      // Fetch UnreportedAbsence records (only pending ones for notifications)
      const unreportedAbsences = await prisma.unreportedAbsence.findMany({
        where: {
          ...(status ? { status: status as any } : { status: 'PENDING' }),
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
      });

      for (const absence of unreportedAbsences) {
        const scheduledTasks = await getScheduledTasksForDate(absence.userId, absence.absenceDate);

        requests.push({
          id: absence.id,
          type: 'ABSENCE',
          status: `UNREPORTED_${absence.status}`,
          createdAt: absence.createdAt,
          user: absence.user,
          project: scheduledTasks.length > 0 ? scheduledTasks[0].project : null,
          details: {
            absenceDate: absence.absenceDate,
            reason: absence.reason,
            explanation: absence.explanation,
            userResponse: absence.userResponse,
            isUnreported: true,
            detectedAt: absence.detectedAt,
            respondedAt: absence.respondedAt,
            xpPenalty: absence.xpPenalty,
            multiplierReset: absence.multiplierReset,
            acknowledgedAt: absence.acknowledgedAt,
            acknowledgedBy: absence.acknowledgedBy,
            scheduledTasks: scheduledTasks.map((t) => ({
              title: t.title,
              project: t.project?.title || t.project?.cliente,
            })),
          },
          reviewedAt: absence.acknowledgedAt,
          reviewedBy: null,
        });
      }
    }

    // Sort all by createdAt desc
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedRequests = requests.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: {
        requests: paginatedRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: requests.length,
          totalPages: Math.ceil(requests.length / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/requests/counts - Get counts by type
router.get('/counts', adminAuth, async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count pending contributions
    const contributionsPending = await prisma.contributionRequest.count({
      where: { status: 'PENDING' },
    });

    // Count pending help requests
    const helpRequestsPending = await prisma.helpRequest.count({
      where: { status: 'PENDING', type: 'HELP' },
    });

    // Count pending material requests
    const materialRequestsPending = await prisma.helpRequest.count({
      where: { status: 'PENDING', type: 'MATERIAL' },
    });

    // Count recent absences (last 7 days) that are NOT acknowledged
    const absencesRecent = await prisma.absenceNotice.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        acknowledgedAt: null,
      },
    });

    // Count unreported absences pending that are NOT acknowledged
    const unreportedPending = await prisma.unreportedAbsence.count({
      where: {
        status: 'PENDING',
        acknowledgedAt: null,
      },
    });

    res.json({
      success: true,
      data: {
        contributions: contributionsPending,
        helpRequests: helpRequestsPending,
        materialRequests: materialRequestsPending,
        absences: absencesRecent + unreportedPending,
        total: contributionsPending + helpRequestsPending + materialRequestsPending + absencesRecent + unreportedPending,
      },
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
