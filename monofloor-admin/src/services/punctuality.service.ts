/**
 * Punctuality Service
 * Handles punctuality tracking, streak management, and XP multiplier calculation
 *
 * Rules:
 * - Tolerance: 10 minutes after project workStartTime
 * - Punctual bonus: +50 XP
 * - Streak multiplier: starts at 1.1x, increases by 0.1x per consecutive day, max 5.0x
 * - Late: resets streak to 0, multiplier to 1.0x
 * - Campaign multipliers are added on top of punctuality multiplier
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const PUNCTUALITY_TOLERANCE_MINUTES = 10;
const PUNCTUALITY_BONUS_XP = 50;
const INITIAL_MULTIPLIER = 1.0;
const MULTIPLIER_INCREMENT = 0.1;
const MAX_MULTIPLIER = 5.0;

interface PunctualityResult {
  isFirstOfDay: boolean;
  isPunctual: boolean | null;
  minutesLate: number | null;
  expectedTime: string | null;
  xpAwarded: number;
  newStreak: number;
  newMultiplier: number;
  streakBroken: boolean;
}

/**
 * Check if this is the first check-in of the day for a user
 */
async function isFirstCheckinOfDay(userId: string, date: Date): Promise<boolean> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingCheckin = await prisma.checkin.findFirst({
    where: {
      userId,
      checkinAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      isFirstOfDay: true,
    },
  });

  return existingCheckin === null;
}

/**
 * Parse time string (e.g., "08:00") to hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;

  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  return {
    hours: parseInt(match[1], 10),
    minutes: parseInt(match[2], 10),
  };
}

/**
 * Calculate minutes late from expected start time
 */
function calculateMinutesLate(checkinTime: Date, expectedTimeStr: string): number {
  const expected = parseTimeString(expectedTimeStr);
  if (!expected) return 0;

  const expectedDate = new Date(checkinTime);
  expectedDate.setHours(expected.hours, expected.minutes, 0, 0);

  const diffMs = checkinTime.getTime() - expectedDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return Math.max(0, diffMinutes); // Can't be negative (early is 0 late)
}

/**
 * Check if check-in is punctual (within tolerance)
 */
function isPunctualCheckin(minutesLate: number): boolean {
  return minutesLate <= PUNCTUALITY_TOLERANCE_MINUTES;
}

/**
 * Calculate new multiplier based on streak
 * Streak 0 = 1.0x, Streak 1 = 1.1x, ..., Streak 40+ = 5.0x
 */
function calculateMultiplier(streak: number): number {
  if (streak <= 0) return INITIAL_MULTIPLIER;

  const multiplier = INITIAL_MULTIPLIER + (streak * MULTIPLIER_INCREMENT);
  return Math.min(multiplier, MAX_MULTIPLIER);
}

/**
 * Check if two dates are consecutive days
 */
function areConsecutiveDays(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);

  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);

  const diffDays = Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Check if date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return today.getTime() === checkDate.getTime();
}

/**
 * Process punctuality for a check-in
 * Call this when a user does a check-in
 */
export async function processPunctuality(
  userId: string,
  projectId: string,
  checkinTime: Date
): Promise<PunctualityResult> {
  // Get project work start time
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workStartTime: true, title: true },
  });

  // Get user's current punctuality data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      punctualityStreak: true,
      punctualityMultiplier: true,
      lastPunctualDate: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if this is the first check-in of the day
  const firstOfDay = await isFirstCheckinOfDay(userId, checkinTime);

  // If not first of day, return without changes
  if (!firstOfDay) {
    return {
      isFirstOfDay: false,
      isPunctual: null,
      minutesLate: null,
      expectedTime: null,
      xpAwarded: 0,
      newStreak: user.punctualityStreak,
      newMultiplier: Number(user.punctualityMultiplier),
      streakBroken: false,
    };
  }

  // If project has no work start time, consider punctual by default
  if (!project?.workStartTime) {
    console.log(`[Punctuality] Project ${projectId} has no workStartTime, considering punctual`);
    return {
      isFirstOfDay: true,
      isPunctual: true,
      minutesLate: 0,
      expectedTime: null,
      xpAwarded: PUNCTUALITY_BONUS_XP,
      newStreak: user.punctualityStreak + 1,
      newMultiplier: calculateMultiplier(user.punctualityStreak + 1),
      streakBroken: false,
    };
  }

  const expectedTime = project.workStartTime;
  const minutesLate = calculateMinutesLate(checkinTime, expectedTime);
  const punctual = isPunctualCheckin(minutesLate);

  let newStreak = user.punctualityStreak;
  let newMultiplier = Number(user.punctualityMultiplier);
  let xpAwarded = 0;
  let streakBroken = false;

  if (punctual) {
    // Check if last punctual date was yesterday (to continue streak) or today (already counted)
    if (user.lastPunctualDate) {
      if (isToday(user.lastPunctualDate)) {
        // Already counted today, don't increment
        console.log(`[Punctuality] User ${userId} already had punctual check-in today`);
      } else if (areConsecutiveDays(user.lastPunctualDate, checkinTime)) {
        // Continue streak
        newStreak = user.punctualityStreak + 1;
        newMultiplier = calculateMultiplier(newStreak);
        xpAwarded = PUNCTUALITY_BONUS_XP;
        console.log(`[Punctuality] User ${userId} continues streak: ${newStreak} days, ${newMultiplier}x`);
      } else {
        // Streak broken (gap in days), but today is punctual so start new streak
        newStreak = 1;
        newMultiplier = calculateMultiplier(1);
        xpAwarded = PUNCTUALITY_BONUS_XP;
        streakBroken = true;
        console.log(`[Punctuality] User ${userId} broke streak (gap), starting new: 1 day, ${newMultiplier}x`);
      }
    } else {
      // First time being punctual
      newStreak = 1;
      newMultiplier = calculateMultiplier(1);
      xpAwarded = PUNCTUALITY_BONUS_XP;
      console.log(`[Punctuality] User ${userId} first punctual day: 1 day, ${newMultiplier}x`);
    }

    // Update user punctuality data
    await prisma.user.update({
      where: { id: userId },
      data: {
        punctualityStreak: newStreak,
        punctualityMultiplier: newMultiplier,
        lastPunctualDate: new Date(),
        xpTotal: { increment: xpAwarded },
      },
    });

    // Create XP transaction for punctuality bonus
    if (xpAwarded > 0) {
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: xpAwarded,
          type: 'BONUS',
          reason: `Pontualidade (+${newStreak} dias consecutivos)`,
          projectId,
        },
      });
    }
  } else {
    // Late - break streak
    if (user.punctualityStreak > 0) {
      streakBroken = true;
      console.log(`[Punctuality] User ${userId} was late (${minutesLate} min), streak broken from ${user.punctualityStreak}`);
    }

    newStreak = 0;
    newMultiplier = INITIAL_MULTIPLIER;

    // Update user to reset streak
    await prisma.user.update({
      where: { id: userId },
      data: {
        punctualityStreak: 0,
        punctualityMultiplier: INITIAL_MULTIPLIER,
      },
    });

    // Log streak broken (only console log, no transaction since 0 XP)
    if (streakBroken) {
      console.log(`[Punctuality] User ${userId} streak broken: ${minutesLate} min late`);
    }
  }

  return {
    isFirstOfDay: true,
    isPunctual: punctual,
    minutesLate,
    expectedTime,
    xpAwarded,
    newStreak,
    newMultiplier,
    streakBroken,
  };
}

/**
 * Get user's current punctuality stats
 */
export async function getPunctualityStats(userId: string): Promise<{
  streak: number;
  multiplier: number;
  lastPunctualDate: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      punctualityStreak: true,
      punctualityMultiplier: true,
      lastPunctualDate: true,
    },
  });

  if (!user) {
    return { streak: 0, multiplier: 1.0, lastPunctualDate: null };
  }

  return {
    streak: user.punctualityStreak,
    multiplier: Number(user.punctualityMultiplier),
    lastPunctualDate: user.lastPunctualDate,
  };
}

/**
 * Get total XP multiplier including campaign bonuses
 */
export async function getTotalXpMultiplier(userId: string): Promise<{
  punctualityMultiplier: number;
  campaignMultiplier: number;
  totalMultiplier: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { punctualityMultiplier: true },
  });

  // Get active campaign multipliers for this user
  const activeCampaignParticipations = await prisma.campaignParticipant.findMany({
    where: {
      userId,
      campaign: {
        status: 'ACTIVE',
        xpMultiplier: { gt: 1 },
      },
    },
    include: {
      campaign: {
        select: { xpMultiplier: true },
      },
    },
  });

  const punctualityMultiplier = Number(user?.punctualityMultiplier) || 1.0;

  // Sum all campaign multipliers (subtracting 1 because 2x means +1x bonus)
  const campaignBonus = activeCampaignParticipations.reduce((sum, p) => {
    const campMult = Number(p.campaign.xpMultiplier) || 1;
    return sum + (campMult - 1); // 2x campaign = +1x bonus
  }, 0);

  const campaignMultiplier = 1 + campaignBonus;

  // Total = punctuality + campaign bonus
  // Ex: 5.0x punctuality + 2.0x campaign (which is +1x bonus) = 6.0x
  const totalMultiplier = punctualityMultiplier + campaignBonus;

  return {
    punctualityMultiplier,
    campaignMultiplier,
    totalMultiplier,
  };
}

export {
  PUNCTUALITY_TOLERANCE_MINUTES,
  PUNCTUALITY_BONUS_XP,
  MAX_MULTIPLIER,
};
