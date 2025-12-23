import { Router } from 'express';
import { TaskType, TaskStatus, TaskPhase, TaskSurface } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { adminAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import {
  getTaskSequence,
  determineProjectScope,
  distributeTasks,
  calculateDeadlineFromTasks,
  calculateEstimatedDays,
  convertDaysToHours,
  ProjectScope,
} from '../../services/task-scheduler.service';
import prisma from '../../lib/prisma';

const router = Router();

/**
 * Calculate grouping pattern to fit tasks within available work days
 * Never groups "Cura" tasks as they need rest time
 * @param tasks Array of tasks to be grouped
 * @param availableDays Number of work days available
 * @returns Array of booleans indicating if each task should groupWithNext
 */
function calculateGroupingPattern(tasks: any[], availableDays: number): boolean[] {
  const pattern = new Array(tasks.length).fill(false);

  // If we have enough days, no grouping needed
  if (tasks.length <= availableDays) {
    return pattern;
  }

  // Calculate how many tasks need to be grouped (reduce total blocks)
  const blocksNeeded = tasks.length - availableDays;
  let groupedCount = 0;

  // Try to group tasks uniformly, avoiding Cura tasks
  for (let i = 0; i < tasks.length - 1 && groupedCount < blocksNeeded; i++) {
    const currentTask = tasks[i];
    const nextTask = tasks[i + 1];

    // Never group Cura tasks or group with Cura tasks
    if (currentTask.isCura || nextTask.isCura) {
      continue;
    }

    // Skip if next task is already grouped
    if (i > 0 && pattern[i - 1]) {
      continue;
    }

    // Group this task with next
    pattern[i] = true;
    groupedCount++;
  }

  return pattern;
}

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }
  next();
};

// Task type labels in Portuguese
const TASK_TYPE_LABELS: Record<TaskType, string> = {
  PREPARACAO: 'Preparacao',
  LIMPEZA_INICIAL: 'Limpeza Inicial',
  NIVELAMENTO: 'Nivelamento',
  APLICACAO_PISO: 'Aplicacao de Piso',
  APLICACAO_PAREDE: 'Aplicacao de Parede',
  APLICACAO_TETO: 'Aplicacao de Teto',
  RODAPE: 'Rodape',
  LIXAMENTO: 'Lixamento',
  SELADOR: 'Selador',
  CURA: 'Cura',
  ACABAMENTO_FINAL: 'Acabamento Final',
  INSPECAO: 'Inspecao',
  RETRABALHO: 'Retrabalho',
  CUSTOM: 'Personalizada',
};

// Default colors for task types
const TASK_TYPE_COLORS: Record<TaskType, string> = {
  PREPARACAO: '#64748b',        // Slate
  LIMPEZA_INICIAL: '#64748b',
  NIVELAMENTO: '#64748b',
  APLICACAO_PISO: '#c9a962',    // Gold (primary)
  APLICACAO_PAREDE: '#d4af37',
  APLICACAO_TETO: '#b8860b',
  RODAPE: '#daa520',
  LIXAMENTO: '#3b82f6',         // Blue
  SELADOR: '#8b5cf6',           // Purple
  CURA: '#22c55e',              // Green
  ACABAMENTO_FINAL: '#22c55e',
  INSPECAO: '#f97316',          // Orange
  RETRABALHO: '#ef4444',        // Red
  CUSTOM: '#6b7280',            // Gray
};

// Estimated hours per m2/m for each task type
const TASK_ESTIMATES = {
  PREPARACAO: { baseHours: 8 },              // Fixed 8h
  LIMPEZA_INICIAL: { baseHours: 4 },         // Fixed 4h
  NIVELAMENTO: { hoursPerM2: 0.3 },          // 0.3h per m2
  APLICACAO_PISO: { hoursPerM2: 0.5 },       // 0.5h per m2
  APLICACAO_PAREDE: { hoursPerM2: 0.4 },     // 0.4h per m2
  APLICACAO_TETO: { hoursPerM2: 0.6 },       // 0.6h per m2
  RODAPE: { hoursPerM: 0.2 },                // 0.2h per linear meter
  LIXAMENTO: { hoursPerM2: 0.2 },            // 0.2h per m2
  SELADOR: { hoursPerM2: 0.1 },              // 0.1h per m2
  CURA: { baseHours: 48 },                   // Fixed 48h (2 days)
  ACABAMENTO_FINAL: { baseHours: 4 },        // Fixed 4h
};

// =============================================
// GET /api/admin/projects/task-types - Get available task types
// IMPORTANT: This route must be defined BEFORE /:projectId routes
// =============================================
router.get('/task-types', adminAuth, async (req, res) => {
  const types = Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
    color: TASK_TYPE_COLORS[value as TaskType],
  }));

  res.json({
    success: true,
    data: types,
  });
});

// =============================================
// GET /api/admin/projects/:projectId/tasks - List project tasks
// =============================================
router.get(
  '/:projectId/tasks',
  adminAuth,
  [
    param('projectId').isUUID(),
    query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const status = req.query.status as TaskStatus | undefined;

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      const where: any = { projectId };
      if (status) {
        where.status = status;
      }

      const tasks = await prisma.projectTask.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: {
          dependsOn: {
            select: { id: true, title: true, status: true },
          },
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  photoUrl: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: tasks.map(t => ({
          ...t,
          durationHours: Number(t.durationHours),
          estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
          taskTypeLabel: TASK_TYPE_LABELS[t.taskType],
          assignedUsers: t.assignedUsers.map(a => ({
            id: a.user.id,
            name: a.user.name,
            photoUrl: a.user.photoUrl,
            role: a.user.role,
            assignedAt: a.assignedAt,
          })),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/projects/:projectId/tasks/generate - Auto-generate tasks
// IMPORTANT: This route must be defined BEFORE /:projectId/tasks/:id
// =============================================
router.post(
  '/:projectId/tasks/generate',
  adminAuth,
  [
    param('projectId').isUUID(),
    body('scope').optional().isIn(['PISO', 'PAREDE_TETO', 'COMBINADO']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const requestedScope = req.body.scope as ProjectScope | undefined;

      // Get project with measurements and schedule settings
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          m2Total: true,
          m2Piso: true,
          m2Parede: true,
          m2Teto: true,
          mRodape: true,
          startedAt: true,
          deadlineDate: true,
          estimatedDays: true,
          teamSize: true,
          allowSaturday: true,
          allowSunday: true,
        },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      // Determine scope from measurements or use requested scope
      const scope: ProjectScope = requestedScope || determineProjectScope(
        Number(project.m2Piso) || null,
        Number(project.m2Parede) || null,
        Number(project.m2Teto) || null
      );

      // Get task sequence for this scope
      const sequence = getTaskSequence(scope);

      // Determine start and deadline dates
      const startDate = project.startedAt || new Date();
      let deadlineDate: Date;

      if (project.deadlineDate) {
        deadlineDate = new Date(project.deadlineDate);
      } else if (project.estimatedDays) {
        // Calculate deadline from estimatedDays
        deadlineDate = new Date(startDate);
        let daysAdded = 0;
        while (daysAdded < project.estimatedDays) {
          deadlineDate.setDate(deadlineDate.getDate() + 1);
          const dayOfWeek = deadlineDate.getDay();
          const isSaturday = dayOfWeek === 6;
          const isSunday = dayOfWeek === 0;

          // Count only work days
          if (
            (!isSaturday && !isSunday) ||
            (isSaturday && project.allowSaturday) ||
            (isSunday && project.allowSunday)
          ) {
            daysAdded++;
          }
        }
      } else {
        // Default: 14 days from start
        deadlineDate = new Date(startDate);
        deadlineDate.setDate(deadlineDate.getDate() + 14);
      }

      // Delete existing tasks
      await prisma.projectTask.deleteMany({
        where: { projectId },
      });

      // Distribute tasks across available days
      const generatedTasks = distributeTasks(
        sequence,
        startDate,
        deadlineDate,
        project.allowSaturday,
        project.allowSunday
      );

      // Create tasks in database with initial values
      const defaultTeamSize = project.teamSize || 4; // Default to 4 people
      const defaultDays = 1; // Default to 1 day per task

      // Calculate available work days
      const workDays = calculateEstimatedDays(
        startDate,
        deadlineDate,
        project.allowSaturday || false,
        project.allowSunday || false
      );

      // Auto-group tasks if needed to fit deadline (never group "Cura" tasks)
      const shouldAutoGroup = generatedTasks.length > workDays;
      const groupingPattern = calculateGroupingPattern(generatedTasks, workDays);

      const tasksToCreate = generatedTasks.map((task, index) => {
        const inputDays = defaultDays;
        const inputPeople = task.isCura ? 0 : defaultTeamSize; // Cura doesn't consume resources
        const consumesResources = !task.isCura;
        const estimatedHours = consumesResources ? convertDaysToHours(inputDays, inputPeople) : 0;

        // Determine if this task should group with next
        const groupWithNext = shouldAutoGroup && groupingPattern[index];

        return {
          projectId,
          title: task.title,
          taskType: (task.isCura ? 'CURA' : 'CUSTOM') as TaskType,
          startDate: task.startDate,
          endDate: task.endDate,
          color: task.color,
          sortOrder: task.sortOrder,
          status: 'PENDING' as TaskStatus,
          progress: 0,
          durationHours: 0,
          estimatedHours,
          inputDays,
          inputPeople,
          groupWithNext,
          consumesResources,
          // Phase and surface from task-scheduler
          phase: (task.phase || 'PREPARO') as TaskPhase,
          surface: (task.surface || 'GERAL') as TaskSurface,
        };
      });

      await prisma.projectTask.createMany({
        data: tasksToCreate,
      });

      // Set up dependencies (each task depends on the previous one)
      const allTasks = await prisma.projectTask.findMany({
        where: { projectId },
        orderBy: { sortOrder: 'asc' },
      });

      for (let i = 1; i < allTasks.length; i++) {
        await prisma.projectTask.update({
          where: { id: allTasks[i].id },
          data: { dependsOnId: allTasks[i - 1].id },
        });
      }

      // Update project with deadline if it was calculated
      if (!project.deadlineDate && deadlineDate) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            deadlineDate,
            estimatedDays: calculateEstimatedDays(
              startDate,
              deadlineDate,
              project.allowSaturday,
              project.allowSunday
            ),
          },
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'GENERATE_TASKS',
          entityType: 'Project',
          entityId: projectId,
          description: `Generated ${generatedTasks.length} tasks for scope ${scope}`,
        },
      });

      // Fetch tasks with dependencies
      const finalTasks = await prisma.projectTask.findMany({
        where: { projectId },
        orderBy: { sortOrder: 'asc' },
        include: {
          dependsOn: {
            select: { id: true, title: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          count: finalTasks.length,
          scope,
          deadlineDate,
          tasks: finalTasks.map(t => ({
            ...t,
            durationHours: Number(t.durationHours),
            estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
            taskTypeLabel: TASK_TYPE_LABELS[t.taskType],
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/projects/:projectId/tasks/sync-deadline - Sync deadline and estimated days
// IMPORTANT: This route must be defined BEFORE /:projectId/tasks/:id
// Syncs deadlineDate <-> estimatedDays using work days only
// =============================================
router.post(
  '/:projectId/tasks/sync-deadline',
  adminAuth,
  [
    param('projectId').isUUID(),
    body('deadlineDate').optional().isISO8601(),
    body('estimatedDays').optional().isInt({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { deadlineDate: newDeadlineStr, estimatedDays: newEstimatedDays } = req.body;

      // Get project with current settings
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          startedAt: true,
          deadlineDate: true,
          estimatedDays: true,
          allowSaturday: true,
          allowSunday: true,
        },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      const startDate = project.startedAt || new Date();
      let deadlineDate: Date | null = null;
      let calculatedEstimatedDays: number | null = null;

      // Calculate deadline based on input
      if (newDeadlineStr) {
        // User changed deadline -> calculate estimatedDays
        deadlineDate = new Date(newDeadlineStr);
        calculatedEstimatedDays = calculateEstimatedDays(
          startDate,
          deadlineDate,
          project.allowSaturday || false,
          project.allowSunday || false
        );
      } else if (newEstimatedDays) {
        // User changed estimatedDays -> calculate deadline
        calculatedEstimatedDays = newEstimatedDays;
        deadlineDate = new Date(startDate);
        let daysAdded = 0;
        while (daysAdded < newEstimatedDays) {
          deadlineDate.setDate(deadlineDate.getDate() + 1);
          const dayOfWeek = deadlineDate.getDay();
          const isSaturday = dayOfWeek === 6;
          const isSunday = dayOfWeek === 0;

          // Only count work days
          if (
            (!isSaturday && !isSunday) ||
            (isSaturday && project.allowSaturday) ||
            (isSunday && project.allowSunday)
          ) {
            daysAdded++;
          }
        }
      } else {
        throw new AppError('Informe deadlineDate ou estimatedDays', 400, 'MISSING_DEADLINE');
      }

      // Update project deadline and estimated days
      await prisma.project.update({
        where: { id: projectId },
        data: {
          deadlineDate,
          estimatedDays: calculatedEstimatedDays,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'SYNC_DEADLINE',
          entityType: 'Project',
          entityId: projectId,
          description: `Updated deadline to ${deadlineDate?.toISOString().split('T')[0]} (${calculatedEstimatedDays} work days)`,
        },
      });

      res.json({
        success: true,
        data: {
          deadlineDate: deadlineDate?.toISOString(),
          estimatedDays: calculatedEstimatedDays,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/projects/:projectId/tasks/scope - Get project scope
// IMPORTANT: This route must be defined BEFORE /:projectId/tasks/:id
// =============================================
router.get(
  '/:projectId/tasks/scope',
  adminAuth,
  [param('projectId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          m2Piso: true,
          m2Parede: true,
          m2Teto: true,
        },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      const scope = determineProjectScope(
        Number(project.m2Piso) || null,
        Number(project.m2Parede) || null,
        Number(project.m2Teto) || null
      );

      const sequence = getTaskSequence(scope);

      res.json({
        success: true,
        data: {
          scope,
          taskCount: sequence.length,
          tasks: sequence.map((t, i) => ({
            order: i + 1,
            title: t.title,
            color: t.color,
            isCura: t.isCura || false,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// PUT /api/admin/projects/:projectId/tasks/reorder - Reorder tasks
// IMPORTANT: This route must be defined BEFORE /:projectId/tasks/:id
// =============================================
router.put(
  '/:projectId/tasks/reorder',
  adminAuth,
  [
    param('projectId').isUUID(),
    body('taskIds').isArray({ min: 1 }),
    body('taskIds.*').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { taskIds } = req.body;

      // Update sortOrder for each task
      const updates = taskIds.map((id: string, index: number) =>
        prisma.projectTask.updateMany({
          where: { id, projectId },
          data: { sortOrder: index },
        })
      );

      await Promise.all(updates);

      // Fetch updated tasks
      const tasks = await prisma.projectTask.findMany({
        where: { projectId },
        orderBy: { sortOrder: 'asc' },
      });

      res.json({
        success: true,
        data: tasks.map(t => ({
          ...t,
          durationHours: Number(t.durationHours),
          estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
          taskTypeLabel: TASK_TYPE_LABELS[t.taskType],
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/projects/:projectId/tasks/publish - Publish tasks to app
// IMPORTANT: This route must be defined BEFORE /:projectId/tasks/:id
// =============================================
router.post(
  '/:projectId/tasks/publish',
  adminAuth,
  [param('projectId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, cliente: true },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      // Get all tasks for this project
      const tasks = await prisma.projectTask.findMany({
        where: { projectId },
        orderBy: { sortOrder: 'asc' },
      });

      if (tasks.length === 0) {
        throw new AppError('Nenhuma tarefa para publicar', 400, 'NO_TASKS');
      }

      const now = new Date();

      // Publish all tasks (mark them as published)
      await prisma.projectTask.updateMany({
        where: { projectId },
        data: {
          publishedToApp: true,
          publishedAt: now,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'PUBLISH_TASKS',
          entityType: 'Project',
          entityId: projectId,
          description: `Published ${tasks.length} tasks to app agenda`,
        },
      });

      res.json({
        success: true,
        data: {
          publishedCount: tasks.length,
          publishedAt: now,
          projectId,
          projectName: project.title || project.cliente,
        },
        message: `${tasks.length} tarefas publicadas para a agenda do app`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/projects/:projectId/tasks/stats - Get task statistics
// IMPORTANT: This route must be defined BEFORE /:projectId/tasks/:id
// =============================================
router.get(
  '/:projectId/tasks/stats',
  adminAuth,
  [param('projectId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;

      // Get project with tasks
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          checkins: {
            where: { checkoutAt: { not: null } },
            select: { checkinAt: true },
          },
        },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      // Count tasks by status
      const statusCounts = {
        pending: project.tasks.filter(t => t.status === 'PENDING').length,
        inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: project.tasks.filter(t => t.status === 'COMPLETED').length,
        blocked: project.tasks.filter(t => t.status === 'BLOCKED').length,
        cancelled: project.tasks.filter(t => t.status === 'CANCELLED').length,
      };

      // Calculate hours
      const totalEstimatedHours = project.tasks.reduce(
        (sum, t) => sum + Number(t.estimatedHours || 0), 0
      );
      const totalDurationHours = project.tasks.reduce(
        (sum, t) => sum + Number(t.durationHours), 0
      );

      // Calculate progress
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
      const totalTasks = project.tasks.length;
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Count unique days with check-ins
      const uniqueDays = new Set(
        project.checkins.map(c => c.checkinAt.toISOString().split('T')[0])
      );
      const daysWorked = uniqueDays.size;

      res.json({
        success: true,
        data: {
          totalTasks,
          statusCounts,
          totalEstimatedHours,
          totalDurationHours,
          overallProgress,
          daysWorked,
          deadlineDate: project.deadlineDate,
          estimatedDays: project.estimatedDays,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// PUT /api/admin/projects/:projectId/tasks/bulk-assignments - Bulk update assignments for multiple tasks
// IMPORTANT: This route must be defined BEFORE /:projectId/tasks/:id to avoid matching :id as "bulk-assignments"
// =============================================
router.put(
  '/:projectId/tasks/bulk-assignments',
  adminAuth,
  [
    param('projectId').isUUID(),
    body('taskIds').isArray({ min: 1 }),
    body('taskIds.*').isUUID(),
    body('userIds').isArray(),
    body('userIds.*').optional().isUUID(),  // Optional to allow empty array
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { taskIds, userIds } = req.body;

      // Verify all tasks exist and belong to this project
      const tasks = await prisma.projectTask.findMany({
        where: {
          id: { in: taskIds },
          projectId,
        },
      });

      if (tasks.length !== taskIds.length) {
        throw new AppError('Uma ou mais tarefas nao encontradas', 404, 'TASKS_NOT_FOUND');
      }

      // Delete existing assignments for all tasks
      await prisma.taskAssignment.deleteMany({
        where: { projectTaskId: { in: taskIds } },
      });

      // Create new assignments for all tasks
      if (userIds && userIds.length > 0) {
        const assignmentsToCreate: { projectTaskId: string; userId: string }[] = [];
        for (const taskId of taskIds) {
          for (const userId of userIds) {
            assignmentsToCreate.push({
              projectTaskId: taskId,
              userId,
            });
          }
        }
        await prisma.taskAssignment.createMany({
          data: assignmentsToCreate,
        });
      }

      // Update inputPeople for all tasks
      await prisma.projectTask.updateMany({
        where: { id: { in: taskIds } },
        data: { inputPeople: userIds?.length || 0 },
      });

      res.json({
        success: true,
        data: {
          updatedTasks: taskIds.length,
          assignedUsers: userIds?.length || 0,
        },
        message: `${userIds?.length || 0} pessoa(s) atribuida(s) a ${taskIds.length} tarefa(s)`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/projects/:projectId/tasks/:id - Get single task
// =============================================
router.get(
  '/:projectId/tasks/:id',
  adminAuth,
  [param('projectId').isUUID(), param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, id } = req.params;

      const task = await prisma.projectTask.findFirst({
        where: { id, projectId },
        include: {
          dependsOn: {
            select: { id: true, title: true, status: true },
          },
          dependentTasks: {
            select: { id: true, title: true, status: true },
          },
        },
      });

      if (!task) {
        throw new AppError('Tarefa nao encontrada', 404, 'TASK_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          ...task,
          durationHours: Number(task.durationHours),
          estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null,
          taskTypeLabel: TASK_TYPE_LABELS[task.taskType],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// POST /api/admin/projects/:projectId/tasks - Create task
// =============================================
router.post(
  '/:projectId/tasks',
  adminAuth,
  [
    param('projectId').isUUID(),
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('taskType').optional().isIn(Object.keys(TaskType)),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('durationHours').optional().isFloat({ min: 0 }),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('dependsOnId').optional().isUUID(),
    body('color').optional().isString(),
    // Novos campos para input simplificado
    body('inputDays').optional().isInt({ min: 1 }),
    body('inputPeople').optional().isInt({ min: 0 }),
    body('groupWithNext').optional().isBoolean(),
    body('consumesResources').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        throw new AppError('Projeto nao encontrado', 404, 'PROJECT_NOT_FOUND');
      }

      // Get max sortOrder
      const maxOrder = await prisma.projectTask.aggregate({
        where: { projectId },
        _max: { sortOrder: true },
      });

      const taskType = (req.body.taskType as TaskType) || 'CUSTOM';

      const task = await prisma.projectTask.create({
        data: {
          projectId,
          title: req.body.title,
          description: req.body.description || null,
          taskType,
          startDate: req.body.startDate ? new Date(req.body.startDate) : null,
          endDate: req.body.endDate ? new Date(req.body.endDate) : null,
          durationHours: req.body.durationHours || 0,
          estimatedHours: req.body.estimatedHours || null,
          status: req.body.status || 'PENDING',
          progress: req.body.progress || 0,
          dependsOnId: req.body.dependsOnId || null,
          color: req.body.color || TASK_TYPE_COLORS[taskType],
          sortOrder: (maxOrder._max.sortOrder || 0) + 1,
          // Novos campos
          inputDays: req.body.inputDays || null,
          inputPeople: req.body.inputPeople || null,
          groupWithNext: req.body.groupWithNext || false,
          consumesResources: req.body.consumesResources !== undefined ? req.body.consumesResources : true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'CREATE_TASK',
          entityType: 'ProjectTask',
          entityId: task.id,
          newValues: { title: task.title, projectId },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...task,
          durationHours: Number(task.durationHours),
          estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null,
          taskTypeLabel: TASK_TYPE_LABELS[task.taskType],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// PUT /api/admin/projects/:projectId/tasks/:id - Update task
// =============================================
router.put(
  '/:projectId/tasks/:id',
  adminAuth,
  [
    param('projectId').isUUID(),
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional({ nullable: true }).trim(),
    body('taskType').optional().isIn(Object.keys(TaskType)),
    body('startDate').optional({ nullable: true }).isISO8601(),
    body('endDate').optional({ nullable: true }).isISO8601(),
    body('durationHours').optional().isFloat({ min: 0 }),
    body('estimatedHours').optional({ nullable: true }).isFloat({ min: 0 }),
    body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('dependsOnId').optional({ nullable: true }).isUUID(),
    body('color').optional({ nullable: true }).isString(),
    // Novos campos para input simplificado
    body('inputDays').optional({ nullable: true }).isInt({ min: 1 }),
    body('inputPeople').optional({ nullable: true }).isInt({ min: 0 }),
    body('groupWithNext').optional().isBoolean(),
    body('consumesResources').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, id } = req.params;

      const task = await prisma.projectTask.findFirst({
        where: { id, projectId },
      });

      if (!task) {
        throw new AppError('Tarefa nao encontrada', 404, 'TASK_NOT_FOUND');
      }

      const updateData: any = {};
      const allowedFields = [
        'title', 'description', 'taskType', 'startDate', 'endDate',
        'durationHours', 'estimatedHours', 'status', 'progress',
        'dependsOnId', 'color',
        // Novos campos
        'inputDays', 'inputPeople', 'groupWithNext', 'consumesResources',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === 'startDate' || field === 'endDate') {
            updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
          } else {
            updateData[field] = req.body[field];
          }
        }
      }

      const updatedTask = await prisma.projectTask.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          ...updatedTask,
          durationHours: Number(updatedTask.durationHours),
          estimatedHours: updatedTask.estimatedHours ? Number(updatedTask.estimatedHours) : null,
          taskTypeLabel: TASK_TYPE_LABELS[updatedTask.taskType],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// DELETE /api/admin/projects/:projectId/tasks/:id - Delete task
// =============================================
router.delete(
  '/:projectId/tasks/:id',
  adminAuth,
  [param('projectId').isUUID(), param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, id } = req.params;

      const task = await prisma.projectTask.findFirst({
        where: { id, projectId },
      });

      if (!task) {
        throw new AppError('Tarefa nao encontrada', 404, 'TASK_NOT_FOUND');
      }

      // Remove dependency references from other tasks
      await prisma.projectTask.updateMany({
        where: { dependsOnId: id },
        data: { dependsOnId: null },
      });

      await prisma.projectTask.delete({
        where: { id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminUserId: req.user!.sub,
          action: 'DELETE_TASK',
          entityType: 'ProjectTask',
          entityId: id,
          oldValues: { title: task.title, projectId },
        },
      });

      res.json({
        success: true,
        message: 'Tarefa deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// GET /api/admin/projects/:projectId/tasks/:taskId/assignments - Get task assignments
// =============================================
router.get(
  '/:projectId/tasks/:taskId/assignments',
  adminAuth,
  [param('projectId').isUUID(), param('taskId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, taskId } = req.params;

      const task = await prisma.projectTask.findFirst({
        where: { id: taskId, projectId },
        include: {
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  photoUrl: true,
                  role: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!task) {
        throw new AppError('Tarefa nao encontrada', 404, 'TASK_NOT_FOUND');
      }

      res.json({
        success: true,
        data: task.assignedUsers.map(a => ({
          id: a.user.id,
          name: a.user.name,
          photoUrl: a.user.photoUrl,
          role: a.user.role,
          email: a.user.email,
          assignedAt: a.assignedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// PUT /api/admin/projects/:projectId/tasks/:taskId/assignments - Update task assignments
// =============================================
router.put(
  '/:projectId/tasks/:taskId/assignments',
  adminAuth,
  [
    param('projectId').isUUID(),
    param('taskId').isUUID(),
    body('userIds').isArray(),
    body('userIds.*').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, taskId } = req.params;
      const { userIds } = req.body;

      // Verify task exists
      const task = await prisma.projectTask.findFirst({
        where: { id: taskId, projectId },
      });

      if (!task) {
        throw new AppError('Tarefa nao encontrada', 404, 'TASK_NOT_FOUND');
      }

      // Delete existing assignments
      await prisma.taskAssignment.deleteMany({
        where: { projectTaskId: taskId },
      });

      // Create new assignments
      if (userIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: userIds.map((userId: string) => ({
            projectTaskId: taskId,
            userId,
          })),
        });
      }

      // Also update inputPeople to match the number of assigned users
      await prisma.projectTask.update({
        where: { id: taskId },
        data: { inputPeople: userIds.length },
      });

      // Fetch updated task with assignments
      const updatedTask = await prisma.projectTask.findUnique({
        where: { id: taskId },
        include: {
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  photoUrl: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          taskId,
          assignedUsers: updatedTask?.assignedUsers.map(a => ({
            id: a.user.id,
            name: a.user.name,
            photoUrl: a.user.photoUrl,
            role: a.user.role,
            assignedAt: a.assignedAt,
          })) || [],
          inputPeople: userIds.length,
        },
        message: `${userIds.length} pessoa(s) atribuida(s) a tarefa`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as tasksRoutes };
