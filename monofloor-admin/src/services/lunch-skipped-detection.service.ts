/**
 * Lunch Skipped Detection Service
 * Detects when users skip their mandatory lunch break and applies penalties
 *
 * CLT Rules:
 * - > 6h worked: 60 min break required
 * - 4-6h worked: 15 min break required
 * - < 4h worked: no break required
 */

import { CheckoutReason, PendingNotificationType } from '@prisma/client';
import { getRequiredBreakMinutes, PENALTIES } from '../config/payroll.config';
import prisma from '../lib/prisma';

interface LunchSkipResult {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  date: string;
  totalHoursWorked: number;
  actualBreakMinutes: number;
  requiredBreakMinutes: number;
  deductionMinutes: number;
  notificationCreated: boolean;
}

/**
 * Get São Paulo timezone date for a given date
 */
function getSaoPauloDate(date: Date = new Date()): Date {
  return new Date(
    date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
}

/**
 * Get yesterday's date in São Paulo timezone
 */
function getYesterdayDate(): { start: Date; end: Date; dateStr: string } {
  const now = getSaoPauloDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const start = new Date(yesterday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(yesterday);
  end.setHours(23, 59, 59, 999);

  const dateStr = yesterday.toISOString().split('T')[0];

  return { start, end, dateStr };
}

/**
 * Calculate total lunch break minutes for a user on a given day
 * Looks for checkins with checkoutReason = 'ALMOCO_INTERVALO'
 */
async function calculateLunchBreakMinutes(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Find all lunch checkouts
  const lunchCheckouts = await prisma.checkin.findMany({
    where: {
      userId,
      checkinAt: { gte: startDate, lte: endDate },
      checkoutReason: CheckoutReason.ALMOCO_INTERVALO,
      checkoutAt: { not: null },
    },
    select: {
      id: true,
      checkoutAt: true,
    },
  });

  let totalBreakMinutes = 0;

  for (const lunchCheckout of lunchCheckouts) {
    if (!lunchCheckout.checkoutAt) continue;

    // Find the next checkin after this lunch checkout
    const returnCheckin = await prisma.checkin.findFirst({
      where: {
        userId,
        checkinAt: { gt: lunchCheckout.checkoutAt },
      },
      orderBy: { checkinAt: 'asc' },
      select: { checkinAt: true },
    });

    if (returnCheckin) {
      const breakDuration = (returnCheckin.checkinAt.getTime() - lunchCheckout.checkoutAt.getTime()) / (1000 * 60);
      // Cap at 2 hours to avoid counting next day's checkin
      totalBreakMinutes += Math.min(breakDuration, 120);
    }
  }

  return Math.round(totalBreakMinutes);
}

/**
 * Calculate total hours worked by a user on a given day
 */
async function calculateTotalHoursWorked(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ totalHours: number; projectId: string | null; projectName: string | null }> {
  const checkins = await prisma.checkin.findMany({
    where: {
      userId,
      checkinAt: { gte: startDate, lte: endDate },
      checkoutAt: { not: null },
    },
    include: {
      project: {
        select: { id: true, title: true },
      },
    },
  });

  let totalMinutes = 0;
  let mainProjectId: string | null = null;
  let mainProjectName: string | null = null;
  let maxProjectMinutes = 0;

  const projectMinutes: Record<string, { minutes: number; title: string }> = {};

  for (const checkin of checkins) {
    if (!checkin.checkoutAt) continue;

    const duration = (checkin.checkoutAt.getTime() - checkin.checkinAt.getTime()) / (1000 * 60);
    totalMinutes += duration;

    // Track which project has most hours
    if (checkin.project) {
      if (!projectMinutes[checkin.project.id]) {
        projectMinutes[checkin.project.id] = { minutes: 0, title: checkin.project.title };
      }
      projectMinutes[checkin.project.id].minutes += duration;

      if (projectMinutes[checkin.project.id].minutes > maxProjectMinutes) {
        maxProjectMinutes = projectMinutes[checkin.project.id].minutes;
        mainProjectId = checkin.project.id;
        mainProjectName = checkin.project.title;
      }
    }
  }

  return {
    totalHours: totalMinutes / 60,
    projectId: mainProjectId,
    projectName: mainProjectName,
  };
}

/**
 * Apply lunch deduction to a user's checkins
 * Reduces the hours worked by the required break time they didn't take
 */
async function applyLunchDeduction(
  userId: string,
  projectId: string,
  deductionMinutes: number,
  date: string
): Promise<void> {
  // Find the last checkin of the day for this project
  const { start, end } = getYesterdayDate();

  const lastCheckin = await prisma.checkin.findFirst({
    where: {
      userId,
      projectId,
      checkinAt: { gte: start, lte: end },
      checkoutAt: { not: null },
    },
    orderBy: { checkoutAt: 'desc' },
  });

  if (!lastCheckin || !lastCheckin.checkoutAt) {
    console.log(`[LunchSkip] No checkin found to apply deduction for user ${userId}`);
    return;
  }

  // Calculate new checkout time (earlier by deduction amount)
  const newCheckoutAt = new Date(lastCheckin.checkoutAt.getTime() - deductionMinutes * 60 * 1000);

  // Make sure new checkout is not before checkin
  if (newCheckoutAt <= lastCheckin.checkinAt) {
    console.log(`[LunchSkip] Deduction would result in negative hours, skipping for user ${userId}`);
    return;
  }

  // Update the checkin with reduced hours
  await prisma.checkin.update({
    where: { id: lastCheckin.id },
    data: {
      checkoutAt: newCheckoutAt,
    },
  });

  console.log(`[LunchSkip] Applied ${deductionMinutes} min deduction to checkin ${lastCheckin.id} for user ${userId}`);
}

/**
 * Create pending notification for lunch skip
 */
async function createLunchSkipNotification(
  userId: string,
  projectName: string,
  deductionMinutes: number,
  date: string
): Promise<void> {
  const hoursDeducted = Math.floor(deductionMinutes / 60);
  const minutesDeducted = deductionMinutes % 60;
  const timeStr = hoursDeducted > 0
    ? `${hoursDeducted}h${minutesDeducted > 0 ? minutesDeducted + 'min' : ''}`
    : `${minutesDeducted}min`;

  await prisma.pendingNotification.create({
    data: {
      userId,
      type: PendingNotificationType.LUNCH_SKIPPED,
      payload: {
        projectName,
        deductionMinutes,
        timeStr,
        date,
        message: `Você pulou seu almoço ontem (${date}). Foi descontado ${timeStr} do seu banco de horas do projeto ${projectName}.`,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    },
  });

  console.log(`[LunchSkip] Created LUNCH_SKIPPED notification for user ${userId}`);
}

/**
 * Apply XP penalty for skipping lunch
 */
async function applyLunchSkipPenalty(userId: string): Promise<void> {
  const penalty = PENALTIES.LUNCH_NOT_REGISTERED;

  await prisma.user.update({
    where: { id: userId },
    data: {
      xpTotal: { decrement: penalty },
    },
  });

  // Record XP transaction
  await prisma.xpTransaction.create({
    data: {
      userId,
      amount: -penalty,
      type: 'LUNCH_SKIPPED',
      reason: 'Almoço não registrado',
    },
  });

  console.log(`[LunchSkip] Applied ${penalty} XP penalty to user ${userId}`);
}

/**
 * Detect and process all lunch skips from yesterday
 * Should be called once daily (e.g., at 6:00 AM)
 */
export async function detectAndProcessLunchSkips(): Promise<LunchSkipResult[]> {
  console.log('[LunchSkip] Starting lunch skip detection...');

  const { start, end, dateStr } = getYesterdayDate();
  const results: LunchSkipResult[] = [];

  try {
    // Find all users who had checkins yesterday
    const usersWithCheckins = await prisma.checkin.findMany({
      where: {
        checkinAt: { gte: start, lte: end },
        checkoutAt: { not: null },
      },
      select: {
        userId: true,
        user: { select: { id: true, name: true } },
      },
      distinct: ['userId'],
    });

    console.log(`[LunchSkip] Found ${usersWithCheckins.length} users with checkins on ${dateStr}`);

    for (const { userId, user } of usersWithCheckins) {
      // Calculate total hours worked
      const { totalHours, projectId, projectName } = await calculateTotalHoursWorked(userId, start, end);

      // Get required break
      const requiredBreakMinutes = getRequiredBreakMinutes(totalHours);

      // If no break required, skip
      if (requiredBreakMinutes === 0) {
        continue;
      }

      // Calculate actual break taken
      const actualBreakMinutes = await calculateLunchBreakMinutes(userId, start, end);

      // Check if break was insufficient
      if (actualBreakMinutes < requiredBreakMinutes) {
        const deductionMinutes = requiredBreakMinutes - actualBreakMinutes;

        console.log(`[LunchSkip] User ${user.name} (${userId}):
          - Hours worked: ${totalHours.toFixed(2)}h
          - Required break: ${requiredBreakMinutes} min
          - Actual break: ${actualBreakMinutes} min
          - Deduction: ${deductionMinutes} min`);

        // Apply deduction to hours
        if (projectId) {
          await applyLunchDeduction(userId, projectId, deductionMinutes, dateStr);
        }

        // Create notification
        await createLunchSkipNotification(
          userId,
          projectName || 'Projeto',
          deductionMinutes,
          dateStr
        );

        // Apply XP penalty
        await applyLunchSkipPenalty(userId);

        results.push({
          userId,
          userName: user.name,
          projectId: projectId || '',
          projectName: projectName || '',
          date: dateStr,
          totalHoursWorked: totalHours,
          actualBreakMinutes,
          requiredBreakMinutes,
          deductionMinutes,
          notificationCreated: true,
        });
      }
    }

    console.log(`[LunchSkip] Detection complete. ${results.length} lunch skips found and processed.`);
    return results;

  } catch (error) {
    console.error('[LunchSkip] Error during detection:', error);
    throw error;
  }
}

/**
 * Manual trigger for testing (can be called via API)
 */
export async function triggerLunchSkipDetectionManually(): Promise<LunchSkipResult[]> {
  console.log('[LunchSkip] Manual detection triggered');
  return detectAndProcessLunchSkips();
}

/**
 * Check lunch skip for a specific user and date (for testing)
 */
export async function checkLunchSkipForUser(
  userId: string,
  date: Date
): Promise<{
  totalHours: number;
  requiredBreak: number;
  actualBreak: number;
  isSkipped: boolean;
}> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const { totalHours } = await calculateTotalHoursWorked(userId, start, end);
  const requiredBreak = getRequiredBreakMinutes(totalHours);
  const actualBreak = await calculateLunchBreakMinutes(userId, start, end);

  return {
    totalHours,
    requiredBreak,
    actualBreak,
    isSkipped: actualBreak < requiredBreak,
  };
}
