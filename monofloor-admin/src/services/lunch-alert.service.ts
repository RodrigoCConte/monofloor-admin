/**
 * Lunch Break Alert Service
 * Handles alerts for prolonged lunch breaks (1h10, 1h20, 1h30)
 */

import { PrismaClient, CheckoutReason } from '@prisma/client';
import { sendPushToUser } from './push.service';
import { LUNCH_ALERT_TIMES } from '../config/payroll.config';

const prisma = new PrismaClient();

/**
 * Create lunch break alerts when user does lunch checkout
 * Schedules 3 alerts: 1h10, 1h20, 1h30 after checkout
 */
export async function createLunchBreakAlerts(
  userId: string,
  checkinId: string,
  checkoutTime: Date
): Promise<void> {
  // Create alerts for each time threshold
  for (let i = 0; i < LUNCH_ALERT_TIMES.length; i++) {
    const alertConfig = LUNCH_ALERT_TIMES[i];
    const scheduledFor = new Date(checkoutTime.getTime() + alertConfig.minutes * 60 * 1000);

    await prisma.lunchBreakAlert.create({
      data: {
        userId,
        checkinId,
        alertNumber: i + 1,
        alertTime: alertConfig.label,
        scheduledFor,
      },
    });
  }

  console.log(`[LunchAlert] Created 3 alerts for user ${userId} after lunch checkout`);
}

/**
 * Cancel lunch break alerts when user does checkin (returns from lunch)
 */
export async function cancelLunchBreakAlerts(
  userId: string,
  checkinId?: string
): Promise<number> {
  const where: any = {
    userId,
    sentAt: null, // Only cancel unsent alerts
  };

  if (checkinId) {
    where.checkinId = checkinId;
  }

  const result = await prisma.lunchBreakAlert.deleteMany({ where });

  if (result.count > 0) {
    console.log(`[LunchAlert] Cancelled ${result.count} alerts for user ${userId}`);
  }

  return result.count;
}

/**
 * Process scheduled lunch break alerts
 * Called by cron job every minute
 */
export async function processScheduledLunchAlerts(): Promise<{
  sent: number;
  cancelled: number;
}> {
  const now = new Date();
  let sent = 0;
  let cancelled = 0;

  // Find all due alerts that haven't been sent
  const dueAlerts = await prisma.lunchBreakAlert.findMany({
    where: {
      scheduledFor: { lte: now },
      sentAt: null,
    },
    orderBy: { scheduledFor: 'asc' },
  });

  for (const alert of dueAlerts) {
    // Check if user has already checked in (returned from lunch)
    const hasCheckedIn = await hasUserCheckedInAfterLunch(alert.userId, alert.checkinId);

    if (hasCheckedIn) {
      // User returned from lunch, cancel remaining alerts
      await prisma.lunchBreakAlert.delete({
        where: { id: alert.id },
      });
      cancelled++;
      continue;
    }

    // Send push notification
    try {
      const result = await sendPushToUser(alert.userId, {
        title: 'Almoço Prolongado',
        body: `Você já está há ${alert.alertTime} no checkout de almoço`,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: `lunch-alert-${alert.alertNumber}`,
        data: {
          type: 'lunch:alert',
          alertNumber: alert.alertNumber,
          alertTime: alert.alertTime,
        },
      });

      if (result.sent > 0) {
        sent++;
      }

      // Mark as sent
      await prisma.lunchBreakAlert.update({
        where: { id: alert.id },
        data: { sentAt: now },
      });

      console.log(`[LunchAlert] Sent alert #${alert.alertNumber} (${alert.alertTime}) to user ${alert.userId}`);
    } catch (error) {
      console.error(`[LunchAlert] Error sending alert ${alert.id}:`, error);
    }
  }

  if (sent > 0 || cancelled > 0) {
    console.log(`[LunchAlert] Processed alerts: ${sent} sent, ${cancelled} cancelled`);
  }

  return { sent, cancelled };
}

/**
 * Check if user has checked in after their lunch checkout
 */
async function hasUserCheckedInAfterLunch(
  userId: string,
  lunchCheckinId: string
): Promise<boolean> {
  // Get the lunch checkout time
  const lunchCheckin = await prisma.checkin.findUnique({
    where: { id: lunchCheckinId },
    select: { checkoutAt: true },
  });

  if (!lunchCheckin?.checkoutAt) {
    return false;
  }

  // Check if there's a newer checkin after the lunch checkout
  const newerCheckin = await prisma.checkin.findFirst({
    where: {
      userId,
      checkinAt: { gt: lunchCheckin.checkoutAt },
    },
  });

  return !!newerCheckin;
}

/**
 * Get active (pending) lunch alerts for a user
 */
export async function getActiveLunchAlerts(userId: string): Promise<any[]> {
  return prisma.lunchBreakAlert.findMany({
    where: {
      userId,
      sentAt: null,
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

/**
 * Clean up old lunch alerts (older than 24 hours)
 */
export async function cleanupOldLunchAlerts(): Promise<number> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.lunchBreakAlert.deleteMany({
    where: {
      createdAt: { lt: yesterday },
    },
  });

  if (result.count > 0) {
    console.log(`[LunchAlert] Cleaned up ${result.count} old alerts`);
  }

  return result.count;
}
