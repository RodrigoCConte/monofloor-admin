/**
 * Report Responsibility Service
 * Handles daily report responsibility assignment and transfer
 * - Assigns responsibility at 6:00 AM to highest-ranked team member
 * - If tie, randomly selects among tied members
 * - Allows unlimited transfers between team members
 */

import { ProjectRole, ReportResponsibilityStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { sendPushToUser } from './push.service';
import { emitToUser } from './socket.service';

// Role hierarchy (lowest to highest)
const ROLE_HIERARCHY: ProjectRole[] = [
  'AUXILIAR',
  'PREPARADOR',
  'LIDER_PREPARACAO',
  'APLICADOR_I',
  'APLICADOR_II',
  'APLICADOR_III',
  'LIDER',
];

function getRoleIndex(role: ProjectRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Get today's date at midnight (for DB queries)
 */
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get the highest-ranked team member(s) for a project
 * Returns array in case of ties
 */
async function getHighestRankedMembers(projectId: string): Promise<{ userId: string; projectRole: ProjectRole }[]> {
  const assignments = await prisma.projectAssignment.findMany({
    where: {
      projectId,
      isActive: true,
    },
    select: {
      userId: true,
      projectRole: true,
    },
  });

  if (assignments.length === 0) {
    return [];
  }

  // Find the highest rank
  let maxRankIndex = -1;
  for (const assignment of assignments) {
    const rankIndex = getRoleIndex(assignment.projectRole);
    if (rankIndex > maxRankIndex) {
      maxRankIndex = rankIndex;
    }
  }

  // Return all members with the highest rank
  return assignments.filter(a => getRoleIndex(a.projectRole) === maxRankIndex);
}

/**
 * Send notification about report responsibility
 */
async function notifyResponsibility(
  userId: string,
  projectName: string,
  type: 'ASSIGNED' | 'RECEIVED',
  transferredFromName?: string
): Promise<void> {
  const title = type === 'ASSIGNED'
    ? 'Responsavel pelo Relatorio'
    : 'Transferencia de Responsabilidade';

  const message = type === 'ASSIGNED'
    ? `Voce e o responsavel pelo relatorio de hoje no projeto ${projectName}`
    : `${transferredFromName} transferiu a responsabilidade do relatorio para voce no projeto ${projectName}`;

  // Create pending notification for offline users
  await prisma.pendingNotification.create({
    data: {
      userId,
      type: type === 'ASSIGNED' ? 'REPORT_RESPONSIBILITY_ASSIGNED' : 'REPORT_RESPONSIBILITY_RECEIVED',
      payload: {
        projectName,
        message,
        transferredFrom: transferredFromName,
        timestamp: new Date().toISOString(),
      },
    },
  });

  // Emit socket notification
  emitToUser(userId, 'report:responsibility', {
    type,
    projectName,
    message,
    transferredFrom: transferredFromName,
    timestamp: new Date(),
  });

  // Send push notification
  await sendPushToUser(userId, {
    title,
    body: message,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'report-responsibility',
    data: {
      type: `report:responsibility:${type.toLowerCase()}`,
      projectName,
    },
  });

  console.log(`[ReportResponsibility] Notified user ${userId} - ${type} for ${projectName}`);
}

/**
 * Assign report responsibility for a project for today
 * Called by scheduler at 6:00 AM
 */
export async function assignDailyResponsibility(projectId: string): Promise<{
  success: boolean;
  responsibleUserId?: string;
  message: string;
}> {
  const today = getToday();

  try {
    // Check if already assigned for today
    const existing = await prisma.dailyReportResponsibility.findUnique({
      where: {
        projectId_reportDate: {
          projectId,
          reportDate: today,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        responsibleUserId: existing.responsibleUserId,
        message: 'Responsibility already assigned for today',
      };
    }

    // Get project info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true, cliente: true },
    });

    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const projectName = project.title || project.cliente || 'Projeto';

    // Get highest-ranked members
    const topMembers = await getHighestRankedMembers(projectId);

    if (topMembers.length === 0) {
      return { success: false, message: 'No active team members' };
    }

    // If tie, randomly select one
    let selectedMember;
    if (topMembers.length === 1) {
      selectedMember = topMembers[0];
    } else {
      // Random selection among tied members
      const randomIndex = Math.floor(Math.random() * topMembers.length);
      selectedMember = topMembers[randomIndex];
      console.log(`[ReportResponsibility] Tie between ${topMembers.length} members, randomly selected user ${selectedMember.userId}`);
    }

    // Create responsibility record
    const responsibility = await prisma.dailyReportResponsibility.create({
      data: {
        projectId,
        responsibleUserId: selectedMember.userId,
        reportDate: today,
        status: ReportResponsibilityStatus.PENDING,
        notifiedAt: new Date(),
      },
    });

    // Notify the responsible user
    await notifyResponsibility(selectedMember.userId, projectName, 'ASSIGNED');

    console.log(`[ReportResponsibility] Assigned ${selectedMember.userId} as responsible for project ${projectId}`);

    return {
      success: true,
      responsibleUserId: selectedMember.userId,
      message: 'Responsibility assigned successfully',
    };
  } catch (error) {
    console.error(`[ReportResponsibility] Error assigning responsibility for project ${projectId}:`, error);
    return { success: false, message: 'Error assigning responsibility' };
  }
}

/**
 * Process all projects and assign responsibilities
 * Called by scheduler at 6:00 AM daily
 */
export async function processAllProjectResponsibilities(): Promise<{
  processed: number;
  assigned: number;
  skipped: number;
  errors: number;
}> {
  console.log('[ReportResponsibility] Starting daily responsibility assignment...');

  let processed = 0;
  let assigned = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all active projects with at least one active team member
    const projects = await prisma.project.findMany({
      where: {
        status: 'EM_EXECUCAO',
        assignments: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    console.log(`[ReportResponsibility] Found ${projects.length} active projects to process`);

    for (const project of projects) {
      processed++;
      const result = await assignDailyResponsibility(project.id);

      if (result.success) {
        if (result.message === 'Responsibility already assigned for today') {
          skipped++;
        } else {
          assigned++;
        }
      } else {
        errors++;
        console.error(`[ReportResponsibility] Failed for project ${project.id}: ${result.message}`);
      }
    }

    console.log(`[ReportResponsibility] Completed: processed=${processed}, assigned=${assigned}, skipped=${skipped}, errors=${errors}`);
  } catch (error) {
    console.error('[ReportResponsibility] Error in processAllProjectResponsibilities:', error);
  }

  return { processed, assigned, skipped, errors };
}

/**
 * Transfer report responsibility to another team member
 */
export async function transferResponsibility(
  responsibilityId: string,
  currentUserId: string,
  newResponsibleUserId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get current responsibility
    const responsibility = await prisma.dailyReportResponsibility.findUnique({
      where: { id: responsibilityId },
      include: {
        project: {
          select: { id: true, title: true, cliente: true },
        },
        responsibleUser: {
          select: { name: true },
        },
      },
    });

    if (!responsibility) {
      return { success: false, message: 'Responsibility not found' };
    }

    // Verify current user is the responsible one
    if (responsibility.responsibleUserId !== currentUserId) {
      return { success: false, message: 'Only the current responsible can transfer' };
    }

    // Verify status allows transfer
    if (responsibility.status === ReportResponsibilityStatus.COMPLETED) {
      return { success: false, message: 'Cannot transfer after report is submitted' };
    }

    // Verify new user is on the team
    const newAssignment = await prisma.projectAssignment.findFirst({
      where: {
        projectId: responsibility.projectId,
        userId: newResponsibleUserId,
        isActive: true,
      },
    });

    if (!newAssignment) {
      return { success: false, message: 'New responsible must be an active team member' };
    }

    const projectName = responsibility.project.title || responsibility.project.cliente || 'Projeto';
    const currentUserName = responsibility.responsibleUser.name;

    // Update responsibility
    await prisma.dailyReportResponsibility.update({
      where: { id: responsibilityId },
      data: {
        responsibleUserId: newResponsibleUserId,
        originalUserId: responsibility.originalUserId || currentUserId,
        transferredAt: new Date(),
        transferReason: reason,
        status: ReportResponsibilityStatus.TRANSFERRED,
      },
    });

    // Then create a new record with PENDING status for tracking
    // Or we can just update the existing one and keep TRANSFERRED as a valid status
    // For simplicity, let's just update it to indicate it was transferred but still pending
    await prisma.dailyReportResponsibility.update({
      where: { id: responsibilityId },
      data: {
        status: ReportResponsibilityStatus.PENDING, // Back to pending for the new responsible
      },
    });

    // Notify new responsible
    await notifyResponsibility(newResponsibleUserId, projectName, 'RECEIVED', currentUserName);

    console.log(`[ReportResponsibility] Transferred from ${currentUserId} to ${newResponsibleUserId} for project ${responsibility.projectId}`);

    return { success: true, message: 'Responsibility transferred successfully' };
  } catch (error) {
    console.error('[ReportResponsibility] Error transferring responsibility:', error);
    return { success: false, message: 'Error transferring responsibility' };
  }
}

/**
 * Get today's responsibility for a project
 */
export async function getTodayResponsibility(projectId: string): Promise<{
  id: string;
  responsibleUserId: string;
  responsibleUserName: string;
  status: ReportResponsibilityStatus;
  wasTransferred: boolean;
  originalUserName?: string;
  transferReason?: string;
} | null> {
  const today = getToday();

  const responsibility = await prisma.dailyReportResponsibility.findUnique({
    where: {
      projectId_reportDate: {
        projectId,
        reportDate: today,
      },
    },
    include: {
      responsibleUser: {
        select: { name: true },
      },
      originalUser: {
        select: { name: true },
      },
    },
  });

  if (!responsibility) {
    return null;
  }

  return {
    id: responsibility.id,
    responsibleUserId: responsibility.responsibleUserId,
    responsibleUserName: responsibility.responsibleUser.name,
    status: responsibility.status,
    wasTransferred: !!responsibility.originalUserId,
    originalUserName: responsibility.originalUser?.name,
    transferReason: responsibility.transferReason || undefined,
  };
}

/**
 * Mark responsibility as completed when report is submitted
 */
export async function markResponsibilityCompleted(
  projectId: string,
  reportId: string
): Promise<boolean> {
  const today = getToday();

  try {
    await prisma.dailyReportResponsibility.update({
      where: {
        projectId_reportDate: {
          projectId,
          reportDate: today,
        },
      },
      data: {
        status: ReportResponsibilityStatus.COMPLETED,
        reportId,
      },
    });

    console.log(`[ReportResponsibility] Marked as completed for project ${projectId}`);
    return true;
  } catch (error) {
    // Record might not exist (report submitted before 6AM assignment)
    console.log(`[ReportResponsibility] No responsibility record to mark as completed for project ${projectId}`);
    return false;
  }
}

/**
 * Get team members available for transfer
 */
export async function getTeamForTransfer(
  projectId: string,
  excludeUserId: string
): Promise<{ id: string; name: string; role: ProjectRole; photoUrl: string | null }[]> {
  const assignments = await prisma.projectAssignment.findMany({
    where: {
      projectId,
      isActive: true,
      userId: { not: excludeUserId },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
        },
      },
    },
  });

  return assignments.map(a => ({
    id: a.user.id,
    name: a.user.name,
    role: a.projectRole,
    photoUrl: a.user.photoUrl,
  }));
}
