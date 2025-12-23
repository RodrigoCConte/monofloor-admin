import { Router } from 'express';
import { adminAuth } from '../../middleware/auth';
import prisma from '../../lib/prisma';

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

// GET /api/admin/requests - Get unified list of all request types (OPTIMIZED V2)
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // OPTIMIZATION V2: Run ALL main queries in parallel
    const shouldFetchContributions = !type || type === 'CONTRIBUTION';
    const shouldFetchHelpRequests = !type || type === 'HELP_REQUEST' || type === 'MATERIAL_REQUEST';
    const shouldFetchAbsences = !type || type === 'ABSENCE';

    const [contributions, helpRequests, absenceNotices, unreportedAbsences] = await Promise.all([
      // Contributions
      shouldFetchContributions
        ? prisma.contributionRequest.findMany({
            where: { ...(status && { status: status as any }) },
            include: {
              user: { select: { id: true, name: true, email: true, photoUrl: true, role: true, phone: true } },
              project: { select: { id: true, title: true, cliente: true, endereco: true } },
              reviewedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      // Help Requests
      shouldFetchHelpRequests
        ? prisma.helpRequest.findMany({
            where: {
              ...(status && { status: status as any }),
              ...(type === 'HELP_REQUEST' && { type: 'HELP' }),
              ...(type === 'MATERIAL_REQUEST' && { type: 'MATERIAL' }),
            },
            include: {
              user: { select: { id: true, name: true, email: true, photoUrl: true, role: true, phone: true } },
              project: { select: { id: true, title: true, cliente: true, endereco: true } },
              resolvedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      // Absence Notices
      shouldFetchAbsences
        ? prisma.absenceNotice.findMany({
            where: { ...(status && { status: status as any }) },
            include: {
              user: { select: { id: true, name: true, email: true, photoUrl: true, role: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      // Unreported Absences
      shouldFetchAbsences
        ? prisma.unreportedAbsence.findMany({
            where: { ...(status ? { status: status as any } : { status: 'PENDING' }) },
            include: {
              user: { select: { id: true, name: true, email: true, photoUrl: true, role: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Get user IDs for secondary queries
    const contributionUserIds = [...new Set(contributions.map(c => c.userId))];
    const allAbsenceData = [
      ...absenceNotices.map(a => ({ userId: a.userId, absenceDate: a.absenceDate })),
      ...unreportedAbsences.map(a => ({ userId: a.userId, absenceDate: a.absenceDate })),
    ];
    const absenceUserIds = [...new Set(allAbsenceData.map(a => a.userId))];

    // Calculate date range for task assignments
    const absenceDates = allAbsenceData.map(a => new Date(a.absenceDate));
    const minDate = absenceDates.length > 0 ? new Date(Math.min(...absenceDates.map(d => d.getTime()))) : new Date();
    const maxDate = absenceDates.length > 0 ? new Date(Math.max(...absenceDates.map(d => d.getTime()))) : new Date();
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);

    // OPTIMIZATION V2: Run secondary queries in parallel
    const [activeCheckins, allTaskAssignments] = await Promise.all([
      // Active checkins for contributions
      contributionUserIds.length > 0
        ? prisma.checkin.findMany({
            where: { userId: { in: contributionUserIds }, checkoutAt: null },
            include: { project: { select: { id: true, title: true, cliente: true } } },
          })
        : Promise.resolve([]),
      // Task assignments for absences (simplified query - only if we have absences)
      absenceUserIds.length > 0
        ? prisma.taskAssignment.findMany({
            where: {
              userId: { in: absenceUserIds },
              projectTask: {
                OR: [
                  { startDate: { lte: maxDate }, endDate: { gte: minDate } },
                  { startDate: { gte: minDate, lte: maxDate }, endDate: null },
                ],
              },
            },
            include: {
              projectTask: {
                include: { project: { select: { id: true, title: true, cliente: true, endereco: true } } },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    // Build lookup maps
    const checkinByUser = new Map(activeCheckins.map(c => [c.userId, c]));

    // Build task map more efficiently - group by userId first
    const tasksByUserId = new Map<string, typeof allTaskAssignments>();
    for (const ta of allTaskAssignments) {
      if (!tasksByUserId.has(ta.userId)) {
        tasksByUserId.set(ta.userId, []);
      }
      tasksByUserId.get(ta.userId)!.push(ta);
    }

    // Helper to get tasks for a specific absence
    const getTasksForAbsence = (userId: string, absenceDate: Date) => {
      const userTasks = tasksByUserId.get(userId) || [];
      const targetDate = new Date(absenceDate);
      targetDate.setHours(0, 0, 0, 0);

      return userTasks
        .filter(ta => {
          const startDate = ta.projectTask.startDate ? new Date(ta.projectTask.startDate) : null;
          const endDate = ta.projectTask.endDate ? new Date(ta.projectTask.endDate) : null;
          if (!startDate) return false;
          startDate.setHours(0, 0, 0, 0);
          if (endDate) endDate.setHours(23, 59, 59, 999);
          return (endDate && startDate <= targetDate && endDate >= targetDate) ||
                 (!endDate && startDate.getTime() === targetDate.getTime());
        })
        .map(ta => ({
          id: ta.projectTask.id,
          title: ta.projectTask.title,
          project: ta.projectTask.project,
        }));
    };

    // Build unified requests array
    const requests: UnifiedRequest[] = [];

    // Add contributions
    for (const c of contributions) {
      requests.push({
        id: c.id,
        type: 'CONTRIBUTION',
        status: c.status,
        createdAt: c.createdAt,
        user: c.user,
        project: c.project,
        details: {
          description: c.description,
          currentProject: checkinByUser.get(c.userId)?.project || null,
        },
        reviewedAt: c.reviewedAt,
        reviewedBy: c.reviewedBy,
      });
    }

    // Add help requests
    for (const hr of helpRequests) {
      requests.push({
        id: hr.id,
        type: hr.type === 'MATERIAL' ? 'MATERIAL_REQUEST' : 'HELP_REQUEST',
        status: hr.status,
        createdAt: hr.createdAt,
        user: hr.user,
        project: hr.project,
        details: {
          materialName: hr.materialName,
          quantity: hr.quantity,
          description: hr.description,
          audioUrl: hr.audioUrl,
          audioTranscription: hr.audioTranscription,
          videoUrl: hr.videoUrl,
          adminNotes: hr.adminNotes,
        },
        reviewedAt: hr.resolvedAt,
        reviewedBy: hr.resolvedBy,
      });
    }

    // Add absence notices
    for (const a of absenceNotices) {
      const scheduledTasks = getTasksForAbsence(a.userId, a.absenceDate);
      requests.push({
        id: a.id,
        type: 'ABSENCE',
        status: a.status,
        createdAt: a.createdAt,
        user: a.user,
        project: scheduledTasks[0]?.project || null,
        details: {
          absenceDate: a.absenceDate,
          reason: a.reason,
          wasAdvanceNotice: a.wasAdvanceNotice,
          xpPenalty: a.xpPenalty,
          multiplierReset: a.multiplierReset,
          noticeType: a.noticeType,
          acknowledgedAt: a.acknowledgedAt,
          acknowledgedBy: a.acknowledgedBy,
          scheduledTasks: scheduledTasks.map(t => ({ title: t.title, project: t.project?.title || t.project?.cliente })),
        },
        reviewedAt: a.acknowledgedAt,
        reviewedBy: null,
      });
    }

    // Add unreported absences
    for (const a of unreportedAbsences) {
      const scheduledTasks = getTasksForAbsence(a.userId, a.absenceDate);
      requests.push({
        id: a.id,
        type: 'ABSENCE',
        status: `UNREPORTED_${a.status}`,
        createdAt: a.createdAt,
        user: a.user,
        project: scheduledTasks[0]?.project || null,
        details: {
          absenceDate: a.absenceDate,
          reason: a.reason,
          explanation: a.explanation,
          userResponse: a.userResponse,
          isUnreported: true,
          detectedAt: a.detectedAt,
          respondedAt: a.respondedAt,
          xpPenalty: a.xpPenalty,
          multiplierReset: a.multiplierReset,
          acknowledgedAt: a.acknowledgedAt,
          acknowledgedBy: a.acknowledgedBy,
          scheduledTasks: scheduledTasks.map(t => ({ title: t.title, project: t.project?.title || t.project?.cliente })),
        },
        reviewedAt: a.acknowledgedAt,
        reviewedBy: null,
      });
    }

    // Sort and paginate
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

// GET /api/admin/requests/counts - Get counts by type (OPTIMIZED with parallel queries)
router.get('/counts', adminAuth, async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // OPTIMIZATION: Run all counts in parallel
    const [
      contributionsPending,
      helpRequestsPending,
      materialRequestsPending,
      absencesRecent,
      unreportedPending,
    ] = await Promise.all([
      prisma.contributionRequest.count({
        where: { status: 'PENDING' },
      }),
      prisma.helpRequest.count({
        where: { status: 'PENDING', type: 'HELP' },
      }),
      prisma.helpRequest.count({
        where: { status: 'PENDING', type: 'MATERIAL' },
      }),
      prisma.absenceNotice.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          acknowledgedAt: null,
        },
      }),
      prisma.unreportedAbsence.count({
        where: {
          status: 'PENDING',
          acknowledgedAt: null,
        },
      }),
    ]);

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

export default router;
