/**
 * Task Scheduler Service
 * Handles automatic task generation based on project scope and deadline
 */

// Project scope types
export type ProjectScope = 'PISO' | 'PAREDE_TETO' | 'COMBINADO';

// Task template definition
export interface TaskTemplate {
  title: string;
  color: string;
  isCura?: boolean; // Cura tasks have 0 work hours but take time
}

// Colors for different task categories
const COLORS = {
  PROTECAO: '#64748b',     // Slate - Preparation
  LIMPEZA: '#94a3b8',      // Lighter slate
  PRIMER: '#8b5cf6',       // Purple
  LILIT: '#3b82f6',        // Blue
  LEONA: '#c9a962',        // Gold (primary)
  STELION: '#d4af37',      // Darker gold
  LIXAMENTO: '#6366f1',    // Indigo
  CURA: '#22c55e',         // Green
  VERNIZ: '#14b8a6',       // Teal
  SELADOR: '#a855f7',      // Lighter purple
  VERIFICACAO: '#f97316',  // Orange
};

// =============================================
// TASK SEQUENCES BY PROJECT SCOPE
// =============================================

// APENAS PISO - 14 steps
const PISO_SEQUENCE: TaskTemplate[] = [
  { title: 'Protecao/Fitamento', color: COLORS.PROTECAO },
  { title: 'Limpeza', color: COLORS.LIMPEZA },
  { title: 'Primer Texturizado', color: COLORS.PRIMER },
  { title: 'Leona', color: COLORS.LEONA },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'Leona', color: COLORS.LEONA },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'Stelion', color: COLORS.STELION },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true },
  { title: 'Stelion', color: COLORS.STELION },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true },
  { title: 'Verniz', color: COLORS.VERNIZ },
  { title: 'Verniz', color: COLORS.VERNIZ },
];

// APENAS PAREDE/TETO - 13 steps
const PAREDE_TETO_SEQUENCE: TaskTemplate[] = [
  { title: 'Protecao/Fitamento', color: COLORS.PROTECAO },
  { title: 'Limpeza', color: COLORS.LIMPEZA },
  { title: 'Primer Base Agua', color: COLORS.PRIMER },
  { title: 'LILIT', color: COLORS.LILIT },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO },
  { title: 'LILIT', color: COLORS.LILIT },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO },
  { title: 'LILIT + Calafetes 100%', color: COLORS.LILIT },
  { title: 'Lixamento Fino', color: COLORS.LIXAMENTO },
  { title: 'Verificacao Calafetes', color: COLORS.VERIFICACAO },
  { title: 'Selador', color: COLORS.SELADOR },
  { title: 'Verniz', color: COLORS.VERNIZ },
  { title: 'Verniz', color: COLORS.VERNIZ },
];

// PISO + PAREDE/TETO (COMBINADO) - 22 steps
const COMBINADO_SEQUENCE: TaskTemplate[] = [
  { title: 'Protecao/Fitamento', color: COLORS.PROTECAO },
  { title: 'Limpeza', color: COLORS.LIMPEZA },
  { title: 'Primer Regular', color: COLORS.PRIMER },
  { title: 'LILIT', color: COLORS.LILIT },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'LILIT', color: COLORS.LILIT },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'LILIT', color: COLORS.LILIT },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'Primer Texturizado', color: COLORS.PRIMER },
  { title: 'Leona', color: COLORS.LEONA },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'Leona', color: COLORS.LEONA },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'Stelion', color: COLORS.STELION },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'Stelion', color: COLORS.STELION },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true },
  { title: 'Lixamento', color: COLORS.LIXAMENTO },
  { title: 'Verniz', color: COLORS.VERNIZ },
  { title: 'Verniz', color: COLORS.VERNIZ },
];

/**
 * Get task sequence based on project scope
 */
export function getTaskSequence(scope: ProjectScope): TaskTemplate[] {
  switch (scope) {
    case 'PISO':
      return PISO_SEQUENCE;
    case 'PAREDE_TETO':
      return PAREDE_TETO_SEQUENCE;
    case 'COMBINADO':
      return COMBINADO_SEQUENCE;
    default:
      return COMBINADO_SEQUENCE;
  }
}

/**
 * Determine project scope based on m2 values
 */
export function determineProjectScope(
  m2Piso: number | null,
  m2Parede: number | null,
  m2Teto: number | null
): ProjectScope {
  const hasPiso = (m2Piso ?? 0) > 0;
  const hasParede = (m2Parede ?? 0) > 0;
  const hasTeto = (m2Teto ?? 0) > 0;

  if (hasPiso && !hasParede && !hasTeto) {
    return 'PISO';
  } else if (!hasPiso && (hasParede || hasTeto)) {
    return 'PAREDE_TETO';
  } else {
    return 'COMBINADO';
  }
}

/**
 * Generate task schedule with dates based on deadline
 */
export interface GeneratedTask {
  title: string;
  color: string;
  startDate: Date;
  endDate: Date;
  sortOrder: number;
  isCura: boolean;
}

/**
 * Distribute tasks across available days
 * @param sequence Task sequence to distribute
 * @param startDate Project start date (or today if not started)
 * @param deadlineDate Project deadline
 * @param allowSaturday Whether Saturday work is allowed
 * @param allowSunday Whether Sunday work is allowed
 */
export function distributeTasks(
  sequence: TaskTemplate[],
  startDate: Date,
  deadlineDate: Date,
  allowSaturday: boolean = false,
  allowSunday: boolean = false
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  // Calculate available work days
  const workDays = getWorkDays(startDate, deadlineDate, allowSaturday, allowSunday);

  if (workDays.length === 0) {
    // If no work days, just return empty
    return [];
  }

  const totalTasks = sequence.length;

  // If fewer days than tasks, we need to group multiple tasks per day
  // If more days than tasks, we need to spread tasks across multiple days

  if (workDays.length >= totalTasks) {
    // More days than tasks - spread tasks across days
    // Each task gets approximately (workDays.length / totalTasks) days
    const daysPerTask = workDays.length / totalTasks;

    sequence.forEach((template, index) => {
      const startDayIndex = Math.floor(index * daysPerTask);
      const endDayIndex = Math.min(Math.floor((index + 1) * daysPerTask) - 1, workDays.length - 1);

      tasks.push({
        title: template.title,
        color: template.color,
        startDate: workDays[startDayIndex],
        endDate: workDays[Math.max(startDayIndex, endDayIndex)],
        sortOrder: index + 1,
        isCura: template.isCura || false,
      });
    });
  } else {
    // Fewer days than tasks - group multiple tasks per day
    const tasksPerDay = Math.ceil(totalTasks / workDays.length);

    sequence.forEach((template, index) => {
      const dayIndex = Math.min(Math.floor(index / tasksPerDay), workDays.length - 1);

      tasks.push({
        title: template.title,
        color: template.color,
        startDate: workDays[dayIndex],
        endDate: workDays[dayIndex],
        sortOrder: index + 1,
        isCura: template.isCura || false,
      });
    });
  }

  return tasks;
}

/**
 * Get array of work days between two dates
 */
function getWorkDays(
  startDate: Date,
  endDate: Date,
  allowSaturday: boolean,
  allowSunday: boolean
): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    // Include day if it's a weekday, or if weekend work is allowed
    if (
      (!isSaturday && !isSunday) ||
      (isSaturday && allowSaturday) ||
      (isSunday && allowSunday)
    ) {
      days.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Calculate deadline from tasks
 * Returns the end date of the last task
 */
export function calculateDeadlineFromTasks(tasks: { endDate: Date | null }[]): Date | null {
  if (tasks.length === 0) return null;

  let maxDate: Date | null = null;

  for (const task of tasks) {
    if (task.endDate) {
      if (!maxDate || task.endDate > maxDate) {
        maxDate = new Date(task.endDate);
      }
    }
  }

  return maxDate;
}

/**
 * Calculate estimated days from start to deadline
 */
export function calculateEstimatedDays(
  startDate: Date,
  deadlineDate: Date,
  allowSaturday: boolean,
  allowSunday: boolean
): number {
  const workDays = getWorkDays(startDate, deadlineDate, allowSaturday, allowSunday);
  return workDays.length;
}
