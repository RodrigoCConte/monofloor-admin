/**
 * Comercial Follow-up Scheduler Service
 *
 * - Sends notifications for pending follow-ups
 * - Auto-escalates deals that haven't had follow-up activity
 * - Runs every 15 minutes
 */

import prisma from '../lib/prisma';
import { emitToUser } from './socket.service';
import { sendPushToUser } from './push.service';

// Auto-escalation rules (days without activity → next stage)
const FOLLOWUP_ESCALATION_RULES: Record<string, { nextStage: string; days: number }> = {
  FOLLOW_1: { nextStage: 'FOLLOW_2', days: 3 },
  FOLLOW_2: { nextStage: 'FOLLOW_3', days: 5 },
  FOLLOW_3: { nextStage: 'FOLLOW_4', days: 7 },
  FOLLOW_4: { nextStage: 'FOLLOW_5', days: 14 },
  FOLLOW_5: { nextStage: 'CONGELADO', days: 30 },
};

/**
 * Get current time in São Paulo timezone
 */
function getSaoPauloTime(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
}

/**
 * Check and notify about pending follow-ups
 */
async function checkPendingFollowUps(): Promise<void> {
  const now = getSaoPauloTime();

  try {
    // Find all follow-ups scheduled for today that haven't been notified yet
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const pendingFollowUps = await prisma.followUp.findMany({
      where: {
        status: 'AGENDADO',
        agendadoPara: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        comercial: {
          include: {
            project: {
              select: { id: true, cliente: true },
            },
          },
        },
      },
    });

    console.log(`📞 [Comercial] Found ${pendingFollowUps.length} pending follow-ups for today`);

    for (const followUp of pendingFollowUps) {
      // Get the owner/consultant for this deal
      const ownerUserId = followUp.comercial.ownerUserId;
      const clientName = followUp.comercial.project.cliente || 'Cliente';

      // Find admin user with matching Pipedrive ID (if any)
      // For now, notify all admins
      const admins = await prisma.adminUser.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: { id: true, name: true },
      });

      for (const admin of admins) {
        // Send socket notification
        emitToUser(admin.id, 'followup_reminder', {
          type: 'FOLLOWUP_REMINDER',
          dealId: followUp.comercialId,
          projectId: followUp.comercial.projectId,
          clientName,
          followUpType: followUp.tipo,
          scheduledFor: followUp.agendadoPara,
          message: `Follow-up agendado com ${clientName}`,
        });

        console.log(`📞 [Comercial] Notified ${admin.name} about follow-up with ${clientName}`);
      }
    }
  } catch (error) {
    console.error('[Comercial] Error checking pending follow-ups:', error);
  }
}

/**
 * Check for overdue follow-ups and notify
 */
async function checkOverdueFollowUps(): Promise<void> {
  const now = getSaoPauloTime();

  try {
    const overdueFollowUps = await prisma.followUp.findMany({
      where: {
        status: 'AGENDADO',
        agendadoPara: {
          lt: now,
        },
      },
      include: {
        comercial: {
          include: {
            project: {
              select: { id: true, cliente: true },
            },
          },
        },
      },
    });

    if (overdueFollowUps.length > 0) {
      console.log(`⚠️ [Comercial] Found ${overdueFollowUps.length} overdue follow-ups`);
    }

    // Group by day overdue and log
    const groupedByDelay: Record<number, typeof overdueFollowUps> = {};
    for (const followUp of overdueFollowUps) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(followUp.agendadoPara!).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!groupedByDelay[daysOverdue]) {
        groupedByDelay[daysOverdue] = [];
      }
      groupedByDelay[daysOverdue].push(followUp);
    }

    // Log summary
    for (const [days, followUps] of Object.entries(groupedByDelay)) {
      console.log(`⚠️ [Comercial] ${followUps.length} follow-ups atrasados há ${days} dia(s)`);
    }
  } catch (error) {
    console.error('[Comercial] Error checking overdue follow-ups:', error);
  }
}

/**
 * Auto-escalate deals that haven't had activity
 */
async function autoEscalateDeals(): Promise<void> {
  const now = getSaoPauloTime();

  try {
    // Get deals in FOLLOW stages that might need escalation
    const followStages = Object.keys(FOLLOWUP_ESCALATION_RULES);

    const dealsInFollowUp = await prisma.comercialData.findMany({
      where: {
        status: {
          in: followStages as any,
        },
      },
      include: {
        project: {
          select: { id: true, cliente: true },
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    for (const deal of dealsInFollowUp) {
      const rule = FOLLOWUP_ESCALATION_RULES[deal.status];
      if (!rule) continue;

      // Get last activity date (latest follow-up or update)
      const lastActivityDate = deal.followUps[0]?.createdAt || deal.updatedAt;
      const daysSinceActivity = Math.floor(
        (now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivity >= rule.days) {
        console.log(
          `🔄 [Comercial] Auto-escalating ${deal.project.cliente} from ${deal.status} to ${rule.nextStage} (${daysSinceActivity} days inactive)`
        );

        // Update deal status
        await prisma.comercialData.update({
          where: { id: deal.id },
          data: { status: rule.nextStage as any },
        });

        // Create timeline event
        await prisma.timelineEvent.create({
          data: {
            projectId: deal.projectId,
            modulo: 'COMERCIAL',
            tipo: 'AUTO_ESCALATION',
            titulo: `Auto-escalação: ${deal.status} → ${rule.nextStage}`,
            descricao: `Sem atividade por ${daysSinceActivity} dias`,
          },
        });
      }
    }
  } catch (error) {
    console.error('[Comercial] Error auto-escalating deals:', error);
  }
}

/**
 * Auto-create next follow-up when one is completed
 */
export async function autoScheduleNextFollowUp(
  comercialId: string,
  completedFollowUpTipo: string
): Promise<void> {
  try {
    const deal = await prisma.comercialData.findUnique({
      where: { id: comercialId },
      include: {
        project: { select: { cliente: true } },
      },
    });

    if (!deal) return;

    const rule = FOLLOWUP_ESCALATION_RULES[deal.status];
    if (!rule) return;

    // Calculate next follow-up date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + rule.days);

    // Create next follow-up
    await prisma.followUp.create({
      data: {
        comercialId,
        tipo: 'PRIMEIRO_CONTATO',
        canal: 'WHATSAPP',
        agendadoPara: nextDate,
        status: 'AGENDADO',
        mensagem: `Follow-up automático após ${completedFollowUpTipo}`,
      },
    });

    console.log(
      `📅 [Comercial] Auto-scheduled next follow-up for ${deal.project.cliente} on ${nextDate.toLocaleDateString('pt-BR')}`
    );
  } catch (error) {
    console.error('[Comercial] Error auto-scheduling next follow-up:', error);
  }
}

/**
 * Run all follow-up checks
 */
async function runFollowUpChecks(): Promise<void> {
  console.log('📞 [Comercial] Running follow-up checks...');

  await checkPendingFollowUps();
  await checkOverdueFollowUps();
  await autoEscalateDeals();
}

/**
 * Start the comercial follow-up scheduler
 * Runs every 15 minutes
 */
export function startComercialFollowUpScheduler(): void {
  console.log('📞 [Comercial] Follow-up scheduler started (every 15 min)');

  // Run immediately on startup
  runFollowUpChecks();

  // Then run every 15 minutes
  setInterval(() => {
    runFollowUpChecks();
  }, 15 * 60 * 1000); // Every 15 minutes
}

/**
 * Manual trigger for testing
 */
export async function triggerFollowUpCheckManually(): Promise<{
  pending: number;
  overdue: number;
}> {
  console.log('📞 [Comercial] Manual follow-up check triggered');

  const now = getSaoPauloTime();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [pending, overdue] = await Promise.all([
    prisma.followUp.count({
      where: {
        status: 'AGENDADO',
        agendadoPara: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.followUp.count({
      where: {
        status: 'AGENDADO',
        agendadoPara: { lt: now },
      },
    }),
  ]);

  return { pending, overdue };
}
