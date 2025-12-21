/**
 * GPS Auto-Checkout Service
 * Monitors users with GPS turned off and auto-checkouts after 60 seconds
 *
 * Rule: GPS off for 60 seconds = automatic checkout + push notification
 */

import { PrismaClient } from '@prisma/client';
import { sendGPSAutoCheckoutPush } from './push.service';
import { emitGPSAutoCheckout } from './socket.service';

const prisma = new PrismaClient();

const GPS_OFF_THRESHOLD_MS = 60 * 1000; // 60 seconds

/**
 * Update GPS status for a user
 * Called when the app reports GPS status change
 */
export async function updateGPSStatus(
  userId: string,
  gpsStatus: 'granted' | 'denied' | 'prompt'
): Promise<{ updated: boolean; gpsOffAt: Date | null }> {
  try {
    const now = new Date();
    const isGPSOff = gpsStatus !== 'granted';

    // Get current location record
    const currentLocation = await prisma.userLocation.findUnique({
      where: { userId },
    });

    // If no location record exists, create one with minimal data
    if (!currentLocation) {
      await prisma.userLocation.create({
        data: {
          userId,
          latitude: 0,
          longitude: 0,
          gpsStatus,
          gpsOffAt: isGPSOff ? now : null,
        },
      });

      console.log(`[GPS] Created location record for user ${userId} with GPS status: ${gpsStatus}`);

      return {
        updated: true,
        gpsOffAt: isGPSOff ? now : null,
      };
    }

    // Update GPS status
    // If GPS was on and now is off, set gpsOffAt to now
    // If GPS was off and now is on, clear gpsOffAt
    const newGpsOffAt = isGPSOff
      ? currentLocation.gpsOffAt || now // Keep existing timestamp or set new
      : null; // GPS is on, clear the timestamp

    await prisma.userLocation.update({
      where: { userId },
      data: {
        gpsStatus,
        gpsOffAt: newGpsOffAt,
      },
    });

    console.log(
      `[GPS] Updated GPS status for user ${userId}: ${gpsStatus}, gpsOffAt: ${newGpsOffAt?.toISOString() || 'null'}`
    );

    return {
      updated: true,
      gpsOffAt: newGpsOffAt,
    };
  } catch (error) {
    console.error(`[GPS] Error updating GPS status for user ${userId}:`, error);
    return {
      updated: false,
      gpsOffAt: null,
    };
  }
}

/**
 * Process all users with GPS off for more than 60 seconds
 * Called by cron job every 30 seconds
 */
export async function processGPSAutoCheckouts(): Promise<{
  processed: number;
  checkedOut: number;
}> {
  let processed = 0;
  let checkedOut = 0;

  try {
    const now = new Date();
    const threshold = new Date(now.getTime() - GPS_OFF_THRESHOLD_MS);

    // Find all users with GPS off for more than 60 seconds who have active checkins
    const usersWithGPSOff = await prisma.userLocation.findMany({
      where: {
        gpsStatus: { not: 'granted' },
        gpsOffAt: { lte: threshold },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    for (const location of usersWithGPSOff) {
      processed++;

      // Check if user has an active checkin
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          userId: location.userId,
          checkoutAt: null,
        },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
      });

      if (!activeCheckin) {
        // No active checkin, just clear the GPS off timestamp
        await prisma.userLocation.update({
          where: { userId: location.userId },
          data: { gpsOffAt: null },
        });
        console.log(`[GPS Auto-Checkout] User ${location.userId} has no active checkin, cleared gpsOffAt`);
        continue;
      }

      // Calculate hours worked
      const checkoutAt = now;
      const hoursWorked =
        (checkoutAt.getTime() - activeCheckin.checkinAt.getTime()) / (1000 * 60 * 60);

      // Perform auto-checkout
      await prisma.checkin.update({
        where: { id: activeCheckin.id },
        data: {
          checkoutAt,
          hoursWorked,
          checkoutReason: 'GPS_DESATIVADO',
          isAutoCheckout: true,
        },
      });

      // Clear GPS off timestamp
      await prisma.userLocation.update({
        where: { userId: location.userId },
        data: {
          gpsOffAt: null,
          currentProjectId: null,
        },
      });

      // Send push notification
      const projectName =
        activeCheckin.project.title || activeCheckin.project.cliente || 'Projeto';
      await sendGPSAutoCheckoutPush(location.userId, projectName);

      // Emit socket event for real-time update
      emitGPSAutoCheckout({
        userId: location.userId,
        userName: location.user?.name || 'Usuário',
        projectId: activeCheckin.projectId,
        projectName,
        hoursWorked,
        reason: 'GPS desativado por mais de 60 segundos',
        timestamp: checkoutAt,
      });

      checkedOut++;
      console.log(
        `[GPS Auto-Checkout] User ${location.user?.name || location.userId} auto-checked-out from project "${projectName}" after GPS off for 60+ seconds`
      );
    }

    if (processed > 0) {
      console.log(`[GPS Auto-Checkout] Processed ${processed} users, ${checkedOut} auto-checked-out`);
    }
  } catch (error) {
    console.error('[GPS Auto-Checkout] Error processing auto-checkouts:', error);
  }

  return { processed, checkedOut };
}

/**
 * Get GPS status for a user
 */
export async function getGPSStatus(userId: string): Promise<{
  gpsStatus: string | null;
  gpsOffAt: Date | null;
  isGPSOff: boolean;
  secondsOff: number;
}> {
  const location = await prisma.userLocation.findUnique({
    where: { userId },
    select: { gpsStatus: true, gpsOffAt: true },
  });

  if (!location) {
    return {
      gpsStatus: null,
      gpsOffAt: null,
      isGPSOff: false,
      secondsOff: 0,
    };
  }

  const isGPSOff = location.gpsStatus !== 'granted';
  const secondsOff = location.gpsOffAt
    ? Math.floor((Date.now() - location.gpsOffAt.getTime()) / 1000)
    : 0;

  return {
    gpsStatus: location.gpsStatus,
    gpsOffAt: location.gpsOffAt,
    isGPSOff,
    secondsOff,
  };
}
