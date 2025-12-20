/**
 * Report Reminder Service
 * Handles scheduled reminders for pending reports
 * - Initial reminder: 60 minutes after checkout
 * - Retry: every 30 minutes
 * - Max attempts: 3 (then expires)
 */

import { PrismaClient, ReminderStatus } from '@prisma/client';
import { sendReportReminderPush, sendXPPenaltyPush } from './push.service';

const prisma = new PrismaClient();

const MAX_REMINDER_ATTEMPTS = 3;
const RETRY_INTERVAL_MINUTES = 30;
const XP_PENALTY_AMOUNT = 7000; // XP penalty for not submitting report after all reminders

/**
 * Create a report reminder scheduled for 60 minutes from now
 */
export async function createReportReminder(
  userId: string,
  projectId: string,
  checkinId: string
): Promise<{ id: string; scheduledFor: Date }> {
  const scheduledFor = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes from now

  const reminder = await prisma.reportReminder.create({
    data: {
      userId,
      projectId,
      checkinId,
      scheduledFor,
      reminderCount: 0,
      status: ReminderStatus.PENDING,
    },
  });

  console.log(`[ReportReminder] Created reminder ${reminder.id} for user ${userId}, scheduled for ${scheduledFor}`);

  return {
    id: reminder.id,
    scheduledFor: reminder.scheduledFor,
  };
}

/**
 * Process all due reminders
 * Called by cron job every minute
 */
export async function processScheduledReminders(): Promise<{
  processed: number;
  sent: number;
  expired: number;
}> {
  const now = new Date();
  let processed = 0;
  let sent = 0;
  let expired = 0;

  try {
    // Find all pending reminders that are due
    const dueReminders = await prisma.reportReminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        scheduledFor: { lte: now },
      },
      include: {
        project: {
          select: {
            title: true,
            cliente: true,
          },
        },
      },
    });

    for (const reminder of dueReminders) {
      processed++;

      // Check if max attempts reached
      if (reminder.reminderCount >= MAX_REMINDER_ATTEMPTS) {
        await prisma.reportReminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.EXPIRED },
        });

        // Apply XP penalty to all team members on the project
        await applyGroupXPPenalty(reminder.projectId, reminder.id);

        expired++;
        console.log(`[ReportReminder] Expired reminder ${reminder.id} after ${MAX_REMINDER_ATTEMPTS} attempts - XP penalty applied`);
        continue;
      }

      // Send push notification
      const projectName = reminder.project.title || reminder.project.cliente || 'Projeto';
      const reminderNumber = reminder.reminderCount + 1;

      try {
        const result = await sendReportReminderPush(
          reminder.userId,
          projectName,
          reminderNumber,
          reminder.id
        );

        if (result.sent > 0) {
          sent++;
        }

        // Schedule next reminder (30 min) or mark as sent if this is the last one
        const nextScheduledFor = new Date(now.getTime() + RETRY_INTERVAL_MINUTES * 60 * 1000);

        await prisma.reportReminder.update({
          where: { id: reminder.id },
          data: {
            reminderCount: reminderNumber,
            sentAt: now,
            scheduledFor: reminderNumber >= MAX_REMINDER_ATTEMPTS ? reminder.scheduledFor : nextScheduledFor,
            status: reminderNumber >= MAX_REMINDER_ATTEMPTS ? ReminderStatus.EXPIRED : ReminderStatus.PENDING,
          },
        });

        console.log(
          `[ReportReminder] Sent reminder #${reminderNumber} for ${reminder.id}, ` +
          `next: ${reminderNumber >= MAX_REMINDER_ATTEMPTS ? 'expired' : nextScheduledFor.toISOString()}`
        );
      } catch (error) {
        console.error(`[ReportReminder] Failed to send reminder ${reminder.id}:`, error);
      }
    }

    if (processed > 0) {
      console.log(`[ReportReminder] Processed ${processed} reminders: ${sent} sent, ${expired} expired`);
    }
  } catch (error) {
    console.error('[ReportReminder] Error processing reminders:', error);
  }

  return { processed, sent, expired };
}

/**
 * Cancel reminders when user submits a report
 */
export async function cancelRemindersForUser(
  userId: string,
  projectId?: string
): Promise<number> {
  const where: any = {
    userId,
    status: ReminderStatus.PENDING,
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const result = await prisma.reportReminder.updateMany({
    where,
    data: {
      status: ReminderStatus.COMPLETED,
      reportSubmitted: true,
    },
  });

  if (result.count > 0) {
    console.log(`[ReportReminder] Cancelled ${result.count} reminders for user ${userId}`);
  }

  return result.count;
}

/**
 * Dismiss a specific reminder
 */
export async function dismissReminder(reminderId: string): Promise<boolean> {
  try {
    await prisma.reportReminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.EXPIRED },
    });
    console.log(`[ReportReminder] Dismissed reminder ${reminderId}`);
    return true;
  } catch (error) {
    console.error(`[ReportReminder] Failed to dismiss reminder ${reminderId}:`, error);
    return false;
  }
}

/**
 * Get pending reminders for a user
 */
export async function getPendingReminders(userId: string) {
  return await prisma.reportReminder.findMany({
    where: {
      userId,
      status: ReminderStatus.PENDING,
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
    orderBy: { scheduledFor: 'asc' },
  });
}

/**
 * Apply XP penalty to all team members on a project
 * Called when a report reminder expires after 3 attempts
 */
async function applyGroupXPPenalty(projectId: string, reminderId: string): Promise<void> {
  try {
    // Get all team members assigned to this project
    const assignments = await prisma.projectAssignment.findMany({
      where: { projectId },
      select: { userId: true },
    });

    if (assignments.length === 0) {
      console.log(`[ReportReminder] No team members found for project ${projectId}`);
      return;
    }

    const userIds = assignments.map((a) => a.userId);

    // Get project info for the log
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true, cliente: true },
    });
    const projectName = project?.title || project?.cliente || 'Projeto';

    // Apply penalty to each team member
    for (const userId of userIds) {
      // Deduct XP (ensure it doesn't go below 0)
      await prisma.user.update({
        where: { id: userId },
        data: {
          xpTotal: {
            decrement: XP_PENALTY_AMOUNT,
          },
        },
      });

      // Ensure XP doesn't go negative
      await prisma.user.updateMany({
        where: { id: userId, xpTotal: { lt: 0 } },
        data: { xpTotal: 0 },
      });

      // Create XP transaction record
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: -XP_PENALTY_AMOUNT,
          type: 'PENALTY',
          reason: `Relatorio nao enviado em ${projectName} (lembrete ${reminderId})`,
          projectId,
        },
      });

      // Send push notification about XP loss
      await sendXPPenaltyPush(
        userId,
        XP_PENALTY_AMOUNT,
        projectName,
        'Relatorio nao enviado apos 3 lembretes'
      );
    }

    console.log(
      `[ReportReminder] Applied -${XP_PENALTY_AMOUNT} XP penalty to ${userIds.length} team members on project ${projectId}`
    );
  } catch (error) {
    console.error(`[ReportReminder] Failed to apply XP penalty for project ${projectId}:`, error);
  }
}

/**
 * Check if a report was already submitted for a project today
 * Used to avoid duplicate reminders/penalties when multiple users are on the project
 */
export async function wasReportSubmittedToday(projectId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const report = await prisma.report.findFirst({
    where: {
      projectId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return !!report;
}

/**
 * Check if a task was already completed by any team member
 * Used to avoid counting the same task completion twice
 */
export async function wasTaskCompletedByOthers(
  taskId: string,
  excludeUserId: string
): Promise<boolean> {
  const completion = await prisma.taskCompletion.findFirst({
    where: {
      projectTaskId: taskId,
      userId: { not: excludeUserId },
    },
  });

  return !!completion;
}
