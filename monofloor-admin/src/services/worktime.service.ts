/**
 * Worktime Service
 * Handles daily work time calculation, lunch break deductions, and payment calculation
 *
 * Rate Structure:
 * - Normal hours (até 8h): hourlyRate
 * - Overtime hours (>8h): overtimeRate (+20%)
 * - Travel mode hours (até 8h): travelRate (+20%)
 * - Travel mode overtime (>8h): travelOvertimeRate (+40%)
 */

import { CheckoutReason } from '@prisma/client';
import {
  getRoleRates,
  calculateLunchDeduction,
  calculatePayment,
  PENALTIES,
  WORKDAY,
} from '../config/payroll.config';
import { sendXPPenaltyPush } from './push.service';
import prisma from '../lib/prisma';

// Distance threshold for "distant" check-ins (meters)
const DISTANT_CHECKIN_THRESHOLD = 80;

interface DailyCheckinSummary {
  totalMinutesWorked: number;
  lunchBreakMinutes: number;
  hoursNormal: number;           // Normal hours (no travel mode)
  hoursOvertime: number;         // Overtime hours (no travel mode)
  hoursTravelNormal: number;     // Travel mode normal hours (+20%)
  hoursTravelOvertime: number;   // Travel mode overtime hours (+40%)
  hoursTravel: number;           // Hours traveling to another project
  hoursSupplies: number;         // Hours buying supplies
  distantCheckins: number;
  hasLunchCheckout: boolean;
}

/**
 * Process all checkins for a specific user on a specific date
 * Called by the daily cron job at 23:59
 */
export async function processDailyWorktime(
  userId: string,
  workDate: Date
): Promise<void> {
  const startOfDay = new Date(workDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(workDate);
  endOfDay.setHours(23, 59, 59, 999);

  console.log(`[Worktime] Processing daily worktime for user ${userId} on ${workDate.toISOString().split('T')[0]}`);

  // Get all checkins for the day
  const checkins = await prisma.checkin.findMany({
    where: {
      userId,
      checkinAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          isTravelMode: true,
        },
      },
    },
    orderBy: { checkinAt: 'asc' },
  });

  if (checkins.length === 0) {
    console.log(`[Worktime] No checkins found for user ${userId} on ${workDate.toISOString().split('T')[0]}`);
    return;
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true },
  });

  if (!user) {
    console.error(`[Worktime] User ${userId} not found`);
    return;
  }

  // Calculate daily summary
  const summary = calculateDailySummary(checkins);

  // Calculate lunch deduction
  const lunchResult = calculateLunchDeduction(
    summary.totalMinutesWorked / 60,
    summary.lunchBreakMinutes
  );

  // Apply lunch deduction to hours (deduct from normal hours first)
  let adjustedMinutesWorked = summary.totalMinutesWorked;
  if (lunchResult.deductionMinutes > 0) {
    adjustedMinutesWorked -= lunchResult.deductionMinutes;
  }

  // Get role rates
  const rates = getRoleRates(user.role);
  if (!rates) {
    console.error(`[Worktime] No rates found for role ${user.role}`);
    return;
  }

  // Calculate payment with the correct rate structure
  const payment = calculatePayment(
    user.role,
    summary.hoursNormal,
    summary.hoursOvertime,
    summary.hoursTravelNormal,
    summary.hoursTravelOvertime
  );

  // Add travel and supplies payment (at normal rate)
  const travelSuppliesPay = (summary.hoursTravel + summary.hoursSupplies) * rates.hourlyRate;
  const totalPayment = payment.totalPay + travelSuppliesPay;

  // Apply lunch penalty if needed
  let lunchPenaltyXP = 0;
  if (lunchResult.shouldPenalize && !summary.hasLunchCheckout) {
    lunchPenaltyXP = PENALTIES.LUNCH_NOT_REGISTERED;

    // Deduct XP
    await prisma.user.update({
      where: { id: userId },
      data: {
        xpTotal: {
          decrement: lunchPenaltyXP,
        },
      },
    });

    // Ensure XP doesn't go negative
    await prisma.user.updateMany({
      where: { id: userId, xpTotal: { lt: 0 } },
      data: { xpTotal: 0 },
    });

    // Create XP transaction
    await prisma.xpTransaction.create({
      data: {
        userId,
        amount: -lunchPenaltyXP,
        type: 'PENALTY',
        reason: 'Pausa de almoco nao registrada corretamente',
      },
    });

    // Send push notification
    await sendXPPenaltyPush(
      userId,
      lunchPenaltyXP,
      'Jornada de trabalho',
      'Pausa de almoco nao registrada'
    );

    console.log(`[Worktime] Applied -${lunchPenaltyXP} XP penalty for lunch not registered to user ${userId}`);
  }

  // Total hours worked for the summary
  const totalHoursWorked = summary.hoursNormal + summary.hoursOvertime +
    summary.hoursTravelNormal + summary.hoursTravelOvertime +
    summary.hoursTravel + summary.hoursSupplies;

  // Upsert daily work summary
  await prisma.dailyWorkSummary.upsert({
    where: {
      userId_workDate: {
        userId,
        workDate: startOfDay,
      },
    },
    create: {
      userId,
      workDate: startOfDay,
      hoursNormal: summary.hoursNormal,
      hoursOvertime: summary.hoursOvertime,
      hoursTravelMode: summary.hoursTravelNormal + summary.hoursTravelOvertime, // Combined travel mode
      hoursTravel: summary.hoursTravel,
      hoursSupplies: summary.hoursSupplies,
      totalHoursWorked: totalHoursWorked,
      lunchBreakMinutes: summary.lunchBreakMinutes,
      lunchDeduction: lunchResult.deductionMinutes,
      lunchPenaltyXP,
      userRole: user.role,
      dailyRate: rates.dailyRate,
      hourlyRate: rates.hourlyRate,
      overtimeRate: rates.overtimeRate,
      travelRate: rates.travelRate,
      totalPayment: totalPayment,
      hasDistantCheckins: summary.distantCheckins > 0,
      distantCheckinCount: summary.distantCheckins,
      processedAt: new Date(),
    },
    update: {
      hoursNormal: summary.hoursNormal,
      hoursOvertime: summary.hoursOvertime,
      hoursTravelMode: summary.hoursTravelNormal + summary.hoursTravelOvertime,
      hoursTravel: summary.hoursTravel,
      hoursSupplies: summary.hoursSupplies,
      totalHoursWorked: totalHoursWorked,
      lunchBreakMinutes: summary.lunchBreakMinutes,
      lunchDeduction: lunchResult.deductionMinutes,
      lunchPenaltyXP,
      userRole: user.role,
      dailyRate: rates.dailyRate,
      hourlyRate: rates.hourlyRate,
      overtimeRate: rates.overtimeRate,
      travelRate: rates.travelRate,
      totalPayment: totalPayment,
      hasDistantCheckins: summary.distantCheckins > 0,
      distantCheckinCount: summary.distantCheckins,
      processedAt: new Date(),
    },
  });

  console.log(`[Worktime] Processed daily summary for user ${userId}: ${totalHoursWorked.toFixed(2)}h worked, R$${totalPayment.toFixed(2)} payment`);
}

/**
 * Calculate summary from all checkins of the day
 *
 * Rules:
 * - Normal project: hours up to 8h = normal rate, >8h = overtime (+20%)
 * - Travel mode project: hours up to 8h = travel rate (+20%), >8h = travel overtime (+40%)
 * - OUTRO_PROJETO and COMPRA_INSUMOS checkouts = normal rate (deslocamento)
 */
function calculateDailySummary(checkins: any[]): DailyCheckinSummary {
  let totalMinutesWorked = 0;
  let lunchBreakMinutes = 0;
  let normalProjectMinutes = 0;      // Minutes in normal projects
  let travelModeProjectMinutes = 0;  // Minutes in travel mode projects
  let hoursTravel = 0;               // Hours traveling (OUTRO_PROJETO)
  let hoursSupplies = 0;             // Hours buying supplies (COMPRA_INSUMOS)
  let distantCheckins = 0;
  let hasLunchCheckout = false;

  let lastLunchCheckoutTime: Date | null = null;

  for (const checkin of checkins) {
    // Count distant checkins
    if (checkin.isDistantCheckin) {
      distantCheckins++;
    }

    // Skip if no checkout
    if (!checkin.checkoutAt) {
      continue;
    }

    const checkinTime = new Date(checkin.checkinAt);
    const checkoutTime = new Date(checkin.checkoutAt);
    const sessionMinutes = (checkoutTime.getTime() - checkinTime.getTime()) / 1000 / 60;

    // Handle lunch checkout
    if (checkin.checkoutReason === CheckoutReason.ALMOCO_INTERVALO) {
      hasLunchCheckout = true;
      lastLunchCheckoutTime = checkoutTime;
      // Don't count lunch time as worked
      continue;
    }

    // If this is a checkin after lunch, calculate lunch break
    if (lastLunchCheckoutTime) {
      const breakMinutes = (checkinTime.getTime() - lastLunchCheckoutTime.getTime()) / 1000 / 60;
      lunchBreakMinutes += breakMinutes;
      lastLunchCheckoutTime = null;
    }

    // Count worked time based on checkout reason
    switch (checkin.checkoutReason) {
      case CheckoutReason.OUTRO_PROJETO:
        // Paid at normal rate
        hoursTravel += sessionMinutes / 60;
        totalMinutesWorked += sessionMinutes;
        break;

      case CheckoutReason.COMPRA_INSUMOS:
        // Paid at normal rate
        hoursSupplies += sessionMinutes / 60;
        totalMinutesWorked += sessionMinutes;
        break;

      case CheckoutReason.FIM_EXPEDIENTE:
      default:
        // Separate normal project vs travel mode project
        if (checkin.project?.isTravelMode) {
          travelModeProjectMinutes += sessionMinutes;
        } else {
          normalProjectMinutes += sessionMinutes;
        }
        totalMinutesWorked += sessionMinutes;
        break;
    }
  }

  // Calculate hours breakdown for normal project work
  const normalProjectHours = normalProjectMinutes / 60;
  const hoursNormal = Math.min(normalProjectHours, WORKDAY.NORMAL_HOURS);
  const hoursOvertime = Math.max(0, normalProjectHours - WORKDAY.NORMAL_HOURS);

  // Calculate hours breakdown for travel mode project work
  // Travel mode: up to 8h = +20%, >8h = +40%
  const travelModeHours = travelModeProjectMinutes / 60;
  const hoursTravelNormal = Math.min(travelModeHours, WORKDAY.NORMAL_HOURS);
  const hoursTravelOvertime = Math.max(0, travelModeHours - WORKDAY.NORMAL_HOURS);

  return {
    totalMinutesWorked,
    lunchBreakMinutes,
    hoursNormal,
    hoursOvertime,
    hoursTravelNormal,
    hoursTravelOvertime,
    hoursTravel,
    hoursSupplies,
    distantCheckins,
    hasLunchCheckout,
  };
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a checkin is distant from project pin
 */
export function isDistantFromProject(
  checkinLat: number,
  checkinLon: number,
  projectLat: number,
  projectLon: number
): { isDistant: boolean; distance: number } {
  const distance = calculateDistance(checkinLat, checkinLon, projectLat, projectLon);
  return {
    isDistant: distance > DISTANT_CHECKIN_THRESHOLD,
    distance: Math.round(distance),
  };
}

/**
 * Process all users' daily worktime (called by cron)
 */
export async function processAllDailyWorktime(workDate: Date): Promise<{
  processed: number;
  errors: number;
}> {
  const startOfDay = new Date(workDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(workDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all unique users with checkins today
  const usersWithCheckins = await prisma.checkin.findMany({
    where: {
      checkinAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      userId: true,
    },
    distinct: ['userId'],
  });

  let processed = 0;
  let errors = 0;

  for (const { userId } of usersWithCheckins) {
    try {
      await processDailyWorktime(userId, workDate);
      processed++;
    } catch (error) {
      console.error(`[Worktime] Error processing user ${userId}:`, error);
      errors++;
    }
  }

  console.log(`[Worktime] Daily processing complete: ${processed} users processed, ${errors} errors`);
  return { processed, errors };
}

/**
 * Get distant checkins for reporting (anomaly detection)
 */
export async function getDistantCheckins(
  options: {
    userId?: string;
    projectId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  } = {}
): Promise<any[]> {
  const where: any = {
    isDistantCheckin: true,
  };

  if (options.userId) {
    where.userId = options.userId;
  }
  if (options.projectId) {
    where.projectId = options.projectId;
  }
  if (options.dateFrom || options.dateTo) {
    where.checkinAt = {};
    if (options.dateFrom) where.checkinAt.gte = options.dateFrom;
    if (options.dateTo) where.checkinAt.lte = options.dateTo;
  }

  return prisma.checkin.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, username: true },
      },
      project: {
        select: { id: true, title: true, cliente: true },
      },
    },
    orderBy: { checkinAt: 'desc' },
    take: options.limit || 100,
  });
}
