/**
 * Lunch Break Scheduler Service
 * Sends reminders at 12:00, 12:30, and 13:00 (São Paulo timezone)
 */

import { PrismaClient } from '@prisma/client';
import { emitLunchReminder } from './socket.service';

const prisma = new PrismaClient();

// Lunch reminder times (in minutes from midnight, São Paulo timezone)
const LUNCH_TIMES = [
  { hour: 12, minute: 0, reminderNumber: 1 },
  { hour: 12, minute: 30, reminderNumber: 2 },
  { hour: 13, minute: 0, reminderNumber: 3 },
];

// Track which reminders were sent today to avoid duplicates
let lastSentDate: string | null = null;
let sentReminders: Set<number> = new Set();

/**
 * Get current time in São Paulo timezone
 */
function getSaoPauloTime(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
}

/**
 * Check if it's lunch time and send reminders
 */
async function checkAndSendLunchReminders(): Promise<void> {
  const now = getSaoPauloTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const today = now.toDateString();

  // Reset sent reminders at midnight
  if (lastSentDate !== today) {
    lastSentDate = today;
    sentReminders = new Set();
  }

  // Check each lunch time
  for (const lunchTime of LUNCH_TIMES) {
    // Skip if already sent this reminder today
    if (sentReminders.has(lunchTime.reminderNumber)) {
      continue;
    }

    // Check if we're within 2 minutes of the lunch time (to account for interval timing)
    const isLunchTime =
      currentHour === lunchTime.hour &&
      currentMinute >= lunchTime.minute &&
      currentMinute < lunchTime.minute + 2;

    if (isLunchTime) {
      console.log(
        `🍽️  Lunch reminder ${lunchTime.reminderNumber} triggered at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`
      );

      await sendLunchRemindersToActiveUsers(lunchTime.reminderNumber);
      sentReminders.add(lunchTime.reminderNumber);
    }
  }
}

/**
 * Send lunch reminders to all users with active check-ins
 */
async function sendLunchRemindersToActiveUsers(
  reminderNumber: number
): Promise<void> {
  try {
    // Find all users with active check-ins (not checked out)
    const activeCheckins = await prisma.checkin.findMany({
      where: {
        checkoutAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(
      `🍽️  Sending lunch reminder to ${activeCheckins.length} active users`
    );

    for (const checkin of activeCheckins) {
      emitLunchReminder({
        userId: checkin.user.id,
        userName: checkin.user.name,
        reminderNumber,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('Error sending lunch reminders:', error);
  }
}

/**
 * Check if current time is within lunch period (12:00 - 13:00)
 */
export function isLunchTime(): boolean {
  const now = getSaoPauloTime();
  const currentHour = now.getHours();
  return currentHour >= 12 && currentHour < 13;
}

/**
 * Start the lunch reminder scheduler
 * Runs every minute to check if it's time for a reminder
 */
export function startLunchScheduler(): void {
  console.log('🍽️  Lunch reminder scheduler started');

  // Check immediately on startup
  checkAndSendLunchReminders();

  // Then check every minute
  setInterval(() => {
    checkAndSendLunchReminders();
  }, 60 * 1000); // Every 1 minute
}

/**
 * Manual trigger for testing (can be called via API)
 */
export async function triggerLunchReminderManually(
  reminderNumber: number = 1
): Promise<void> {
  console.log(`🍽️  Manual lunch reminder triggered (${reminderNumber})`);
  await sendLunchRemindersToActiveUsers(reminderNumber);
}
