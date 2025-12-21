/**
 * GPS Auto-Checkout Service
 * Monitors users who stop sending location updates and auto-checkouts after confirmations
 *
 * NEW APPROACH:
 * - Instead of relying on frontend GPS status, check if user is sending location updates
 * - Require 3 consecutive confirmations (90 seconds total) before auto-checkout
 * - Only applies to users with active check-ins
 */

import { PrismaClient } from '@prisma/client';
import { sendGPSAutoCheckoutPush } from './push.service';
import { emitGPSAutoCheckout } from './socket.service';

const prisma = new PrismaClient();

// Configuration
const LOCATION_STALE_THRESHOLD_MS = 30 * 1000; // 30 seconds without location update = stale
const REQUIRED_CONFIRMATIONS = 3; // Need 3 confirmations (90 seconds total)
const CHECK_INTERVAL_SECONDS = 30; // Cron runs every 30 seconds

/**
 * Update GPS status for a user
 * Called when the app reports GPS status change
 * Now also resets confirmations if GPS is back on
 */
export async function updateGPSStatus(
  userId: string,
  gpsStatus: 'granted' | 'denied' | 'prompt'
): Promise<{ updated: boolean; gpsOffAt: Date | null; confirmations: number }> {
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
          gpsOffConfirmations: 0,
        },
      });

      console.log(`[GPS] Created location record for user ${userId} with GPS status: ${gpsStatus}`);

      return {
        updated: true,
        gpsOffAt: isGPSOff ? now : null,
        confirmations: 0,
      };
    }

    // If GPS is back on, reset everything
    if (!isGPSOff) {
      await prisma.userLocation.update({
        where: { userId },
        data: {
          gpsStatus: 'granted',
          gpsOffAt: null,
          gpsOffConfirmations: 0,
        },
      });

      console.log(`[GPS] GPS restored for user ${userId}, reset confirmations`);

      return {
        updated: true,
        gpsOffAt: null,
        confirmations: 0,
      };
    }

    // GPS is off - update status but don't set timestamp yet (let cron handle it)
    await prisma.userLocation.update({
      where: { userId },
      data: {
        gpsStatus,
      },
    });

    console.log(`[GPS] Updated GPS status for user ${userId}: ${gpsStatus}`);

    return {
      updated: true,
      gpsOffAt: currentLocation.gpsOffAt,
      confirmations: currentLocation.gpsOffConfirmations,
    };
  } catch (error) {
    console.error(`[GPS] Error updating GPS status for user ${userId}:`, error);
    return {
      updated: false,
      gpsOffAt: null,
      confirmations: 0,
    };
  }
}

/**
 * Process GPS auto-checkouts with confirmation system
 * Called by cron job every 30 seconds
 *
 * Logic:
 * 1. Find users with active check-ins
 * 2. Check if their location hasn't been updated in 30+ seconds
 * 3. Increment confirmations counter
 * 4. After 3 confirmations, perform auto-checkout
 */
export async function processGPSAutoCheckouts(): Promise<{
  processed: number;
  checkedOut: number;
  warned: number;
}> {
  let processed = 0;
  let checkedOut = 0;
  let warned = 0;

  try {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - LOCATION_STALE_THRESHOLD_MS);

    // Find all users with active check-ins
    const activeCheckins = await prisma.checkin.findMany({
      where: {
        checkoutAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, title: true, cliente: true },
        },
      },
    });

    for (const checkin of activeCheckins) {
      processed++;

      // Get user's location record
      const location = await prisma.userLocation.findUnique({
        where: { userId: checkin.userId },
      });

      if (!location) {
        // No location record, skip for now
        continue;
      }

      // Check if location is stale (not updated in 30+ seconds)
      const isLocationStale = location.updatedAt < staleThreshold;

      if (!isLocationStale) {
        // Location is fresh - reset confirmations if any
        if (location.gpsOffConfirmations > 0) {
          await prisma.userLocation.update({
            where: { userId: checkin.userId },
            data: {
              gpsOffAt: null,
              gpsOffConfirmations: 0,
            },
          });
          console.log(`[GPS] User ${checkin.user?.name} is sending locations, reset confirmations`);
        }
        continue;
      }

      // Location is stale - increment confirmations
      const newConfirmations = location.gpsOffConfirmations + 1;
      const gpsOffAt = location.gpsOffAt || now;

      console.log(
        `[GPS] User ${checkin.user?.name} stale location. Confirmation ${newConfirmations}/${REQUIRED_CONFIRMATIONS}`
      );

      // Check if we have enough confirmations
      if (newConfirmations >= REQUIRED_CONFIRMATIONS) {
        // Perform auto-checkout
        const checkoutAt = now;
        const hoursWorked =
          (checkoutAt.getTime() - checkin.checkinAt.getTime()) / (1000 * 60 * 60);

        await prisma.checkin.update({
          where: { id: checkin.id },
          data: {
            checkoutAt,
            hoursWorked,
            checkoutReason: 'GPS_DESATIVADO',
            isAutoCheckout: true,
          },
        });

        // Clear GPS tracking data
        await prisma.userLocation.update({
          where: { userId: checkin.userId },
          data: {
            gpsOffAt: null,
            gpsOffConfirmations: 0,
            currentProjectId: null,
          },
        });

        // Send notifications
        const projectName = checkin.project.title || checkin.project.cliente || 'Projeto';
        await sendGPSAutoCheckoutPush(checkin.userId, projectName);

        emitGPSAutoCheckout({
          userId: checkin.userId,
          userName: checkin.user?.name || 'Usuário',
          projectId: checkin.projectId,
          projectName,
          hoursWorked,
          reason: 'GPS desativado por mais de 90 segundos',
          timestamp: checkoutAt,
        });

        checkedOut++;
        console.log(
          `[GPS Auto-Checkout] User ${checkin.user?.name} auto-checked-out from "${projectName}" after ${REQUIRED_CONFIRMATIONS} confirmations`
        );
      } else {
        // Increment confirmation counter
        await prisma.userLocation.update({
          where: { userId: checkin.userId },
          data: {
            gpsOffAt,
            gpsOffConfirmations: newConfirmations,
          },
        });
        warned++;
      }
    }

    if (processed > 0 && (checkedOut > 0 || warned > 0)) {
      console.log(
        `[GPS Auto-Checkout] Processed ${processed} users, ${warned} warned, ${checkedOut} auto-checked-out`
      );
    }
  } catch (error) {
    console.error('[GPS Auto-Checkout] Error processing auto-checkouts:', error);
  }

  return { processed, checkedOut, warned };
}

/**
 * Get GPS status for a user
 */
export async function getGPSStatus(userId: string): Promise<{
  gpsStatus: string | null;
  gpsOffAt: Date | null;
  isGPSOff: boolean;
  secondsOff: number;
  confirmations: number;
  confirmationsRequired: number;
}> {
  const location = await prisma.userLocation.findUnique({
    where: { userId },
    select: { gpsStatus: true, gpsOffAt: true, gpsOffConfirmations: true, updatedAt: true },
  });

  if (!location) {
    return {
      gpsStatus: null,
      gpsOffAt: null,
      isGPSOff: false,
      secondsOff: 0,
      confirmations: 0,
      confirmationsRequired: REQUIRED_CONFIRMATIONS,
    };
  }

  const isGPSOff = location.gpsOffConfirmations > 0;
  const secondsOff = location.gpsOffAt
    ? Math.floor((Date.now() - location.gpsOffAt.getTime()) / 1000)
    : 0;

  return {
    gpsStatus: location.gpsStatus,
    gpsOffAt: location.gpsOffAt,
    isGPSOff,
    secondsOff,
    confirmations: location.gpsOffConfirmations,
    confirmationsRequired: REQUIRED_CONFIRMATIONS,
  };
}

/**
 * Reset GPS confirmations for a user
 * Called when user sends a location update
 */
export async function resetGPSConfirmations(userId: string): Promise<void> {
  try {
    const location = await prisma.userLocation.findUnique({
      where: { userId },
      select: { gpsOffConfirmations: true },
    });

    if (location && location.gpsOffConfirmations > 0) {
      await prisma.userLocation.update({
        where: { userId },
        data: {
          gpsOffAt: null,
          gpsOffConfirmations: 0,
        },
      });
      console.log(`[GPS] Reset confirmations for user ${userId}`);
    }
  } catch (error) {
    console.error(`[GPS] Error resetting confirmations for user ${userId}:`, error);
  }
}
