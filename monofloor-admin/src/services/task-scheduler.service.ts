/**
 * Task Scheduler Service
 * Handles automatic task generation based on project scope and deadline
 */

// Project scope types
export type ProjectScope = 'PISO' | 'PAREDE_TETO' | 'COMBINADO';

// Task phase/block types
export type TaskPhase = 'PREPARO' | 'APLICACAO' | 'ACABAMENTO';

// Surface types
export type TaskSurface = 'PISO' | 'PAREDE' | 'GERAL';

// Task template definition
export interface TaskTemplate {
  title: string;
  color: string;
  isCura?: boolean; // Cura tasks have 0 work hours but take time
  phase: TaskPhase; // Block: PREPARO, APLICACAO, or ACABAMENTO
  surface: TaskSurface; // Which surface: PISO, PAREDE, or GERAL (both)
}

// =============================================
// HELPERS - Conversão Dias → Horas
// =============================================

const WORK_HOURS_PER_DAY = 8;   // 8 horas de trabalho
const LUNCH_BREAK_HOURS = 1;    // 1 hora de almoço

/**
 * Converte dias + pessoas em horas-pessoa totais
 * Exemplo: 1 dia, 4 pessoas = 4 × (8h - 1h) = 28 horas-pessoa
 */
export function convertDaysToHours(days: number, people: number): number {
  const effectiveHoursPerPerson = WORK_HOURS_PER_DAY - LUNCH_BREAK_HOURS;
  return days * people * effectiveHoursPerPerson;
}

/**
 * Calcula duração em dias corridos (para timeline do Gantt)
 * Leva em conta que com mais pessoas, a tarefa termina mais rápido
 */
export function calculateElapsedDays(totalHoursPeople: number, teamSize: number): number {
  if (teamSize === 0) return 0;
  const effectiveHoursPerPerson = WORK_HOURS_PER_DAY - LUNCH_BREAK_HOURS;
  const hoursPerDay = teamSize * effectiveHoursPerPerson;
  return Math.ceil(totalHoursPeople / hoursPerDay);
}

/**
 * Retorna descrição legível do cálculo
 */
export function getCalculationSummary(days: number, people: number): string {
  const effectiveHours = WORK_HOURS_PER_DAY - LUNCH_BREAK_HOURS;
  const total = convertDaysToHours(days, people);
  return `${days} dia(s) × ${people} pessoa(s) × ${effectiveHours}h = ${total}h-pessoa`;
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

// APENAS PISO - 13 steps
// PREPARO: Até antes do Stelion (7 etapas)
// APLICACAO: Stelion + Cura (4 etapas)
// ACABAMENTO: Verniz (2 etapas)
const PISO_SEQUENCE: TaskTemplate[] = [
  // === BLOCO PREPARO (PISO) ===
  { title: 'Proteção/Fitamento', color: COLORS.PROTECAO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Limpeza', color: COLORS.LIMPEZA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Primer Texturizado', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  // === BLOCO APLICAÇÃO (PISO) ===
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  // === BLOCO ACABAMENTO (PISO) ===
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PISO' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PISO' },
];

// APENAS PAREDE/TETO - 13 steps
// PREPARO: Até o último Lixamento girafa (7 etapas)
// APLICACAO: LILIT + Calafetes até Verificação (3 etapas)
// ACABAMENTO: Selador + Verniz (3 etapas)
const PAREDE_TETO_SEQUENCE: TaskTemplate[] = [
  // === BLOCO PREPARO (PAREDE) ===
  { title: 'Proteção/Fitamento', color: COLORS.PROTECAO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Limpeza', color: COLORS.LIMPEZA, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Primer Base Água', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  // === BLOCO APLICAÇÃO (PAREDE) ===
  { title: 'LILIT + Calafetes 100%', color: COLORS.LILIT, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Lixamento Fino', color: COLORS.LIXAMENTO, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Verificação Calafetes', color: COLORS.VERIFICACAO, phase: 'APLICACAO', surface: 'PAREDE' },
  // === BLOCO ACABAMENTO (PAREDE) ===
  { title: 'Selador', color: COLORS.SELADOR, phase: 'ACABAMENTO', surface: 'PAREDE' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PAREDE' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PAREDE' },
];

// PISO + PAREDE/TETO (COMBINADO) - 22 steps
// Sequência: Preparo Geral → Preparo Parede → Preparo Piso → Aplicação Piso → Acabamento Geral
const COMBINADO_SEQUENCE: TaskTemplate[] = [
  // === BLOCO PREPARO GERAL ===
  { title: 'Proteção/Fitamento', color: COLORS.PROTECAO, phase: 'PREPARO', surface: 'GERAL' },
  { title: 'Limpeza', color: COLORS.LIMPEZA, phase: 'PREPARO', surface: 'GERAL' },
  // === BLOCO PREPARO PAREDE (LILIT) ===
  { title: 'Primer Base Água', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  // === BLOCO APLICAÇÃO PAREDE ===
  { title: 'LILIT + Calafetes 100%', color: COLORS.LILIT, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Lixamento Fino (parede)', color: COLORS.LIXAMENTO, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Verificação Calafetes', color: COLORS.VERIFICACAO, phase: 'APLICACAO', surface: 'PAREDE' },
  // === BLOCO PREPARO PISO (LEONA) ===
  { title: 'Primer Texturizado', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento (piso)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento (piso)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  // === BLOCO APLICAÇÃO PISO (STELION) ===
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  // === BLOCO ACABAMENTO GERAL ===
  { title: 'Selador', color: COLORS.SELADOR, phase: 'ACABAMENTO', surface: 'GERAL' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'GERAL' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'GERAL' },
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
  phase: TaskPhase;
  surface: TaskSurface;
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
        phase: template.phase,
        surface: template.surface,
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
        phase: template.phase,
        surface: template.surface,
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

// =============================================
// RESOURCE CAPACITY VALIDATION
// =============================================

/**
 * Calculate daily capacity in hours based on team size
 * Capacidade diária = teamSize × (8h - 1h almoço) = teamSize × 7h
 */
export function calculateDailyCapacity(teamSize: number): number {
  const effectiveHoursPerPerson = WORK_HOURS_PER_DAY - LUNCH_BREAK_HOURS;
  return teamSize * effectiveHoursPerPerson;
}

/**
 * Validate if tasks grouped on the same day fit within team capacity
 * @param tasksOnSameDay Array of tasks that will run on the same day
 * @param teamSize Number of people in the team
 * @returns { valid: boolean, usedHours: number, availableHours: number }
 */
export function validateDayCapacity(
  tasksOnSameDay: Array<{ inputDays?: number | null; inputPeople?: number | null; consumesResources?: boolean }>,
  teamSize: number
): { valid: boolean; usedHours: number; availableHours: number; exceedsBy: number } {
  const dailyCapacity = calculateDailyCapacity(teamSize);

  // Calculate total hours needed for tasks that consume resources
  let usedHours = 0;
  for (const task of tasksOnSameDay) {
    // Skip tasks that don't consume resources (cura, secagem, etc.)
    if (task.consumesResources === false) {
      continue;
    }

    const days = task.inputDays ?? 0;
    const people = task.inputPeople ?? 0;

    // For same-day tasks, we only count the people, not the days
    // (all tasks happen in parallel with the available people)
    usedHours += people * (WORK_HOURS_PER_DAY - LUNCH_BREAK_HOURS);
  }

  const exceedsBy = Math.max(0, usedHours - dailyCapacity);

  return {
    valid: usedHours <= dailyCapacity,
    usedHours,
    availableHours: dailyCapacity,
    exceedsBy,
  };
}

/**
 * Group tasks by day considering the groupWithNext flag
 * Returns an array of arrays, where each sub-array contains tasks on the same day
 */
export function groupTasksByDay(
  tasks: Array<{ id: string; groupWithNext: boolean; [key: string]: any }>
): Array<Array<{ id: string; groupWithNext: boolean; [key: string]: any }>> {
  const grouped: Array<Array<{ id: string; groupWithNext: boolean; [key: string]: any }>> = [];
  let currentGroup: Array<{ id: string; groupWithNext: boolean; [key: string]: any }> = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    currentGroup.push(task);

    // If this task doesn't group with next, close the group
    if (!task.groupWithNext || i === tasks.length - 1) {
      grouped.push([...currentGroup]);
      currentGroup = [];
    }
  }

  return grouped;
}
