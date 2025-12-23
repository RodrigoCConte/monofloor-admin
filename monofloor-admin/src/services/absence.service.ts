/**
 * Absence Service
 * Handles absence notices and detection of unreported absences
 *
 * Rules:
 * - Advance notice (day before or earlier): No penalty
 * - Same day notice (morning): -7000 XP + reset multiplier to 1.0x
 * - Unreported absence: Detected at end of day, notification sent to ask user
 */

import prisma from '../lib/prisma';

// Configuration
const SAME_DAY_XP_PENALTY = 15000; // Penalidade por falta sem aviso antecipado
const MORNING_CUTOFF_HOUR = 12; // Before noon = morning notice

interface AbsenceNoticeResult {
  success: boolean;
  wasAdvanceNotice: boolean;
  xpPenalty: number;
  multiplierReset: boolean;
  message: string;
}

/**
 * Check if the notice is an advance notice (no penalty)
 * Advance notice = notified before the absence day
 */
function isAdvanceNotice(absenceDate: Date, noticeTime: Date): boolean {
  const absenceDateOnly = new Date(absenceDate);
  absenceDateOnly.setHours(0, 0, 0, 0);

  const noticeDateOnly = new Date(noticeTime);
  noticeDateOnly.setHours(0, 0, 0, 0);

  // If notice is before the absence date, it's advance notice
  return noticeDateOnly < absenceDateOnly;
}

/**
 * Check if same-day notice is in the morning (penalty applies)
 */
function isMorningNotice(noticeTime: Date): boolean {
  const hour = noticeTime.getHours();
  return hour < MORNING_CUTOFF_HOUR;
}

/**
 * Register an absence notice
 */
export async function registerAbsenceNotice(
  userId: string,
  absenceDate: Date,
  reason: string
): Promise<AbsenceNoticeResult> {
  const now = new Date();

  // Check if already registered
  const existing = await prisma.absenceNotice.findUnique({
    where: {
      userId_absenceDate: {
        userId,
        absenceDate,
      },
    },
  });

  if (existing) {
    return {
      success: false,
      wasAdvanceNotice: existing.wasAdvanceNotice,
      xpPenalty: 0,
      multiplierReset: false,
      message: 'Você já registrou uma falta para esta data',
    };
  }

  const advanceNotice = isAdvanceNotice(absenceDate, now);
  let xpPenalty = 0;
  let multiplierReset = false;
  let noticeType: 'ADVANCE' | 'SAME_DAY' = 'ADVANCE';

  if (!advanceNotice) {
    // Same day notice
    noticeType = 'SAME_DAY';

    // Check if it's morning (before noon) - penalty applies
    if (isMorningNotice(now)) {
      xpPenalty = SAME_DAY_XP_PENALTY;
      multiplierReset = true;

      // Apply penalty
      await prisma.user.update({
        where: { id: userId },
        data: {
          xpTotal: { decrement: xpPenalty },
          punctualityStreak: 0,
          punctualityMultiplier: 1.1,
        },
      });

      // Create XP transaction for penalty
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: -xpPenalty,
          type: 'PENALTY',
          reason: `Aviso de falta no mesmo dia (${absenceDate.toLocaleDateString('pt-BR')})`,
        },
      });

      console.log(`[Absence] User ${userId} notified same day absence, penalty applied: -${xpPenalty} XP`);
    } else {
      // Same day but afternoon - no penalty (they might have worked in the morning)
      console.log(`[Absence] User ${userId} notified same day absence in afternoon, no penalty`);
    }
  } else {
    console.log(`[Absence] User ${userId} advance notice for ${absenceDate.toISOString()}, no penalty`);
  }

  // Create absence notice
  await prisma.absenceNotice.create({
    data: {
      userId,
      absenceDate,
      reason,
      noticeType,
      wasAdvanceNotice: advanceNotice,
      xpPenalty,
      multiplierReset,
    },
  });

  return {
    success: true,
    wasAdvanceNotice: advanceNotice,
    xpPenalty,
    multiplierReset,
    message: advanceNotice
      ? 'Falta registrada com antecedência. Sem penalidade.'
      : multiplierReset
        ? `Falta registrada. Penalidade aplicada: -${xpPenalty} XP e multiplicador zerado.`
        : 'Falta registrada.',
  };
}

/**
 * Cancel an absence notice
 */
export async function cancelAbsenceNotice(
  userId: string,
  absenceDate: Date
): Promise<{ success: boolean; message: string }> {
  const existing = await prisma.absenceNotice.findUnique({
    where: {
      userId_absenceDate: {
        userId,
        absenceDate,
      },
    },
  });

  if (!existing) {
    return {
      success: false,
      message: 'Aviso de falta não encontrado',
    };
  }

  // If penalty was applied, we don't refund (they still missed part of the day)
  await prisma.absenceNotice.update({
    where: { id: existing.id },
    data: { status: 'CANCELLED' },
  });

  return {
    success: true,
    message: 'Aviso de falta cancelado',
  };
}

/**
 * Get upcoming absences for a user
 */
export async function getUserAbsences(userId: string): Promise<any[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.absenceNotice.findMany({
    where: {
      userId,
      absenceDate: { gte: today },
      status: 'CONFIRMED',
    },
    orderBy: { absenceDate: 'asc' },
  });
}

/**
 * Get upcoming available dates for absence notice
 * Includes today and all days (including weekends)
 */
export function getAvailableDates(count: number = 5, offset: number = 0): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = offset; i < offset + count; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i); // Start from today (includes weekends)
    dates.push(date);
  }

  return dates;
}

/**
 * Detect users who had no check-in activity on a given date
 * and no advance absence notice
 */
export async function detectUnreportedAbsences(targetDate: Date): Promise<void> {
  const dateOnly = new Date(targetDate);
  dateOnly.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateOnly);
  endOfDay.setHours(23, 59, 59, 999);

  console.log(`[Absence Detection] Checking for unreported absences on ${dateOnly.toISOString()}`);

  // Get all active approved users
  const activeUsers = await prisma.user.findMany({
    where: {
      status: 'APPROVED',
    },
    select: { id: true, name: true, email: true },
  });

  for (const user of activeUsers) {
    // Check if user has an absence notice for this date
    const hasAbsenceNotice = await prisma.absenceNotice.findUnique({
      where: {
        userId_absenceDate: {
          userId: user.id,
          absenceDate: dateOnly,
        },
      },
    });

    if (hasAbsenceNotice) {
      console.log(`[Absence Detection] User ${user.name} has absence notice for ${dateOnly.toISOString()}`);
      continue;
    }

    // Check if user has any check-in activity on this date
    const hasActivity = await prisma.checkin.findFirst({
      where: {
        userId: user.id,
        checkinAt: {
          gte: dateOnly,
          lte: endOfDay,
        },
      },
    });

    if (hasActivity) {
      console.log(`[Absence Detection] User ${user.name} has activity on ${dateOnly.toISOString()}`);
      continue;
    }

    // Check if already detected this absence
    const alreadyDetected = await prisma.unreportedAbsence.findUnique({
      where: {
        userId_absenceDate: {
          userId: user.id,
          absenceDate: dateOnly,
        },
      },
    });

    if (alreadyDetected) {
      console.log(`[Absence Detection] Already detected absence for ${user.name} on ${dateOnly.toISOString()}`);
      continue;
    }

    // Create unreported absence record
    const unreportedAbsence = await prisma.unreportedAbsence.create({
      data: {
        userId: user.id,
        absenceDate: dateOnly,
      },
    });

    console.log(`[Absence Detection] Created unreported absence for ${user.name} on ${dateOnly.toISOString()}`);

    // Send push notification asking if they were absent
    try {
      const { sendPushToUser } = await import('./push.service');
      await sendPushToUser(user.id, {
        title: 'Você faltou hoje?',
        body: 'Não detectamos atividade sua no aplicativo hoje. Você faltou?',
        tag: 'absence-inquiry',
        requireInteraction: true,
        data: {
          type: 'ABSENCE_INQUIRY',
          unreportedAbsenceId: unreportedAbsence.id,
          absenceDate: dateOnly.toISOString(),
        },
        actions: [
          { action: 'confirm_absence', title: 'Sim, faltei' },
          { action: 'deny_absence', title: 'Não faltei' },
        ],
      });

      await prisma.unreportedAbsence.update({
        where: { id: unreportedAbsence.id },
        data: { notificationSentAt: new Date() },
      });

      console.log(`[Absence Detection] Push notification sent to ${user.name}`);
    } catch (error) {
      console.error(`[Absence Detection] Failed to send push to ${user.name}:`, error);
    }
  }
}

/**
 * Handle user response to unreported absence inquiry
 */
export async function handleAbsenceResponse(
  unreportedAbsenceId: string,
  response: 'SIM' | 'NAO',
  reasonOrExplanation: string
): Promise<{ success: boolean; message: string }> {
  const unreportedAbsence = await prisma.unreportedAbsence.findUnique({
    where: { id: unreportedAbsenceId },
    include: { user: true },
  });

  if (!unreportedAbsence) {
    return { success: false, message: 'Registro de falta não encontrado' };
  }

  if (unreportedAbsence.status !== 'PENDING') {
    return { success: false, message: 'Esta consulta já foi respondida' };
  }

  let xpPenalty = 0;
  let multiplierReset = false;

  if (response === 'SIM') {
    // User confirmed absence - apply penalty (same as same-day notice)
    xpPenalty = SAME_DAY_XP_PENALTY;
    multiplierReset = true;

    await prisma.user.update({
      where: { id: unreportedAbsence.userId },
      data: {
        xpTotal: { decrement: xpPenalty },
        punctualityStreak: 0,
        punctualityMultiplier: 1.1,
      },
    });

    await prisma.xpTransaction.create({
      data: {
        userId: unreportedAbsence.userId,
        amount: -xpPenalty,
        type: 'PENALTY',
        reason: `Falta não avisada (${unreportedAbsence.absenceDate.toLocaleDateString('pt-BR')})`,
      },
    });

    await prisma.unreportedAbsence.update({
      where: { id: unreportedAbsenceId },
      data: {
        status: 'CONFIRMED',
        userResponse: response,
        reason: reasonOrExplanation,
        respondedAt: new Date(),
        xpPenalty,
        multiplierReset,
      },
    });

    console.log(`[Absence] User ${unreportedAbsence.user.name} confirmed absence, penalty: -${xpPenalty} XP`);

    return {
      success: true,
      message: `Falta registrada. Penalidade: -${xpPenalty} XP e multiplicador zerado.`,
    };
  } else {
    // User denied absence - log explanation for admin review
    await prisma.unreportedAbsence.update({
      where: { id: unreportedAbsenceId },
      data: {
        status: 'DENIED',
        userResponse: response,
        explanation: reasonOrExplanation,
        respondedAt: new Date(),
      },
    });

    console.log(`[Absence] User ${unreportedAbsence.user.name} denied absence: ${reasonOrExplanation}`);

    return {
      success: true,
      message: 'Resposta registrada. A administração revisará seu caso.',
    };
  }
}

export { SAME_DAY_XP_PENALTY, MORNING_CUTOFF_HOUR };
