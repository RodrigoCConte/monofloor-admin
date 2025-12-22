/**
 * CURA (Curing) Scheduler Service
 * Auto-completes CURA tasks after 24 hours and moves to next task
 */

import { PrismaClient, TaskType, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Constants
const CURA_DURATION_HOURS = 24; // 24 hours for curing
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes

/**
 * Get current time in São Paulo timezone
 */
function getSaoPauloTime(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
}

/**
 * Check for CURA tasks that need to be auto-completed
 */
async function checkAndCompleteCuraTasks(): Promise<void> {
  try {
    const now = new Date();
    const curaCutoff = new Date(now.getTime() - CURA_DURATION_HOURS * 60 * 60 * 1000);

    // Find CURA tasks that:
    // 1. Are IN_PROGRESS
    // 2. Have curaStartedAt set
    // 3. curaStartedAt is older than 24 hours
    // 4. Have not been auto-completed yet
    const curaTasks = await prisma.projectTask.findMany({
      where: {
        taskType: 'CURA',
        status: 'IN_PROGRESS',
        curaStartedAt: {
          not: null,
          lte: curaCutoff,
        },
        curaAutoCompletedAt: null,
      },
      include: {
        project: {
          select: { id: true, title: true },
        },
      },
    });

    if (curaTasks.length === 0) {
      return;
    }

    console.log(`⏳ Found ${curaTasks.length} CURA tasks to auto-complete`);

    for (const task of curaTasks) {
      await autoCompleteCuraTask(task.id, task.project.title);
    }
  } catch (error) {
    console.error('Error checking CURA tasks:', error);
  }
}

/**
 * Auto-complete a CURA task and start the next task
 */
async function autoCompleteCuraTask(taskId: string, projectTitle: string): Promise<void> {
  try {
    // Get the task with its dependencies
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            tasks: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, status: true, sortOrder: true, title: true, taskType: true },
            },
          },
        },
      },
    });

    if (!task) return;

    // Mark CURA task as completed
    await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        curaAutoCompletedAt: new Date(),
      },
    });

    console.log(`✅ CURA task "${task.title}" auto-completed for project "${projectTitle}"`);

    // Find the next task in sequence
    const nextTask = task.project.tasks.find(
      (t) => t.sortOrder > task.sortOrder && t.status === 'PENDING'
    );

    if (nextTask) {
      // Start the next task
      const updateData: any = {
        status: 'IN_PROGRESS' as TaskStatus,
      };

      // If next task is also CURA, set curaStartedAt
      if (nextTask.taskType === 'CURA') {
        updateData.curaStartedAt = new Date();
      }

      await prisma.projectTask.update({
        where: { id: nextTask.id },
        data: updateData,
      });

      console.log(`▶️  Started next task "${nextTask.title}" for project "${projectTitle}"`);
    }
  } catch (error) {
    console.error(`Error auto-completing CURA task ${taskId}:`, error);
  }
}

/**
 * Start a CURA task (sets curaStartedAt)
 * Called when a task status changes to IN_PROGRESS
 */
export async function startCuraTask(taskId: string): Promise<void> {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    select: { taskType: true, curaStartedAt: true },
  });

  if (task?.taskType === 'CURA' && !task.curaStartedAt) {
    await prisma.projectTask.update({
      where: { id: taskId },
      data: { curaStartedAt: new Date() },
    });
    console.log(`⏱️  CURA task ${taskId} started - will auto-complete in 24h`);
  }
}

/**
 * Complete CURA task early (for hot days when curing is faster)
 * Can be called by applicators via mobile API
 */
export async function completeCuraEarly(taskId: string, userId: string): Promise<{
  success: boolean;
  message: string;
  nextTask?: { id: string; title: string } | null;
}> {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          tasks: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, status: true, sortOrder: true, title: true, taskType: true },
          },
        },
      },
    },
  });

  if (!task) {
    return { success: false, message: 'Tarefa não encontrada' };
  }

  if (task.taskType !== 'CURA') {
    return { success: false, message: 'Esta tarefa não é uma tarefa de CURA' };
  }

  if (task.status !== 'IN_PROGRESS') {
    return { success: false, message: 'Tarefa de CURA não está em andamento' };
  }

  // Complete the CURA task
  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      progress: 100,
      // Note: curaAutoCompletedAt is NOT set because this is a manual early completion
    },
  });

  console.log(`⚡ CURA task ${taskId} completed early by user ${userId}`);

  // Find and start the next task
  const nextTask = task.project.tasks.find(
    (t) => t.sortOrder > task.sortOrder && t.status === 'PENDING'
  );

  if (nextTask) {
    const updateData: any = {
      status: 'IN_PROGRESS' as TaskStatus,
    };

    if (nextTask.taskType === 'CURA') {
      updateData.curaStartedAt = new Date();
    }

    await prisma.projectTask.update({
      where: { id: nextTask.id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Tarefa de CURA concluída! Próxima tarefa iniciada.',
      nextTask: { id: nextTask.id, title: nextTask.title },
    };
  }

  return {
    success: true,
    message: 'Tarefa de CURA concluída!',
    nextTask: null,
  };
}

/**
 * Get CURA task progress info for display
 */
export async function getCuraProgress(taskId: string): Promise<{
  isCura: boolean;
  startedAt: Date | null;
  hoursElapsed: number;
  hoursRemaining: number;
  percentComplete: number;
  canCompleteEarly: boolean;
} | null> {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    select: { taskType: true, curaStartedAt: true, status: true },
  });

  if (!task) return null;

  const isCura = task.taskType === 'CURA';
  if (!isCura) {
    return {
      isCura: false,
      startedAt: null,
      hoursElapsed: 0,
      hoursRemaining: 0,
      percentComplete: 0,
      canCompleteEarly: false,
    };
  }

  const startedAt = task.curaStartedAt;
  const now = new Date();

  if (!startedAt) {
    return {
      isCura: true,
      startedAt: null,
      hoursElapsed: 0,
      hoursRemaining: CURA_DURATION_HOURS,
      percentComplete: 0,
      canCompleteEarly: false,
    };
  }

  const hoursElapsed = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, CURA_DURATION_HOURS - hoursElapsed);
  const percentComplete = Math.min(100, (hoursElapsed / CURA_DURATION_HOURS) * 100);

  return {
    isCura: true,
    startedAt,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    percentComplete: Math.round(percentComplete),
    canCompleteEarly: task.status === 'IN_PROGRESS',
  };
}

/**
 * Start the CURA scheduler
 * Runs every 15 minutes to check for tasks that need auto-completion
 */
export function startCuraScheduler(): void {
  console.log('⏳ CURA auto-completion scheduler started (checks every 15 min)');

  // Check immediately on startup
  checkAndCompleteCuraTasks();

  // Then check every 15 minutes
  setInterval(() => {
    checkAndCompleteCuraTasks();
  }, CHECK_INTERVAL_MS);
}

/**
 * Manual trigger for testing (can be called via API)
 */
export async function triggerCuraCheckManually(): Promise<number> {
  console.log('⏳ Manual CURA check triggered');
  await checkAndCompleteCuraTasks();
  return 0; // Return count of completed tasks
}
