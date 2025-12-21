<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { projectsApi, applicatorsApi } from '../api';
import html2canvas from 'html2canvas';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const project = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const activeTab = ref('info');
const editMode = ref(false);

// Form data for editing
const formData = ref({
  title: '',
  cliente: '',
  endereco: '',
  status: '',
  estimatedHours: null as number | null,
  consultor: '',
  material: '',
  cor: '',
  isNightShift: false,
  // Metragens
  m2Total: null as number | null,
  m2Piso: null as number | null,
  m2Parede: null as number | null,
  m2Teto: null as number | null,
  mRodape: null as number | null,
  // Telefones do responsável
  responsiblePhones: [] as string[],
  // Cronograma / Horarios
  workStartTime: '' as string,
  workEndTime: '' as string,
  deadlineDate: '' as string,
  estimatedDays: null as number | null,
  teamSize: null as number | null,
  allowSaturday: false,
  allowSunday: false,
  allowNightWork: false,
  isTravelMode: false,
});

// Inline edit state for individual fields
const editingField = ref<string | null>(null);

// Work hours options for dropdown
const workHoursOptions = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

// Entry request (liberação na portaria)
const showEntryRequestModal = ref(false);
const selectedForEntry = ref<string[]>([]);
const sendingEntryRequest = ref(false);
const newResponsiblePhone = ref('');

// Team management
const team = ref<any[]>([]);
const loadingTeam = ref(false);
const showTeamModal = ref(false);
const availableApplicators = ref<any[]>([]);
const loadingApplicators = ref(false);
const teamSearchQuery = ref('');
const selectedApplicatorsToAdd = ref<string[]>([]);
const selectedRoleForAdd = ref('APLICADOR_I');
const addingMembers = ref(false);
const removingMember = ref<string | null>(null);

// Check-ins and Reports
const checkins = ref<any[]>([]);
const reports = ref<any[]>([]);
const loadingCheckins = ref(false);
const loadingReports = ref(false);

// Night Shift
const nightShiftInvites = ref<any[]>([]);
const loadingInvites = ref(false);
const showInviteModal = ref(false);
const selectedInvitees = ref<string[]>([]);
const sendingInvites = ref(false);
const nightShiftConfig = ref({
  slots: 10,
  startDate: '',
  endDate: '',
});
const inviteCounts = ref({
  pending: 0,
  accepted: 0,
  declined: 0,
  expired: 0,
});

// Tasks / Schedule (Programacao)
const tasks = ref<any[]>([]);
const loadingTasks = ref(false);
const taskStats = ref<any>(null);
const showTaskModal = ref(false);
const editingTask = ref<any>(null);
const savingTask = ref(false);
const generatingTasks = ref(false);

// Gantt uses real tasks from backend
const selectedTask = ref<any>(null);
const showTaskEditor = ref(false);

// Available task types with colors for dropdown
const availableTaskTypes = [
  { value: 'PREPARACAO', label: 'Preparacao', color: '#64748b' },
  { value: 'LIMPEZA_INICIAL', label: 'Limpeza Inicial', color: '#475569' },
  { value: 'NIVELAMENTO', label: 'Nivelamento', color: '#6b7280' },
  { value: 'APLICACAO_PISO', label: 'Aplicacao Piso', color: '#c9a962' },
  { value: 'APLICACAO_PAREDE', label: 'Aplicacao Parede', color: '#d4af37' },
  { value: 'APLICACAO_TETO', label: 'Aplicacao Teto', color: '#b8860b' },
  { value: 'RODAPE', label: 'Rodape', color: '#daa520' },
  { value: 'LIXAMENTO', label: 'Lixamento', color: '#3b82f6' },
  { value: 'SELADOR', label: 'Selador', color: '#8b5cf6' },
  { value: 'CURA', label: 'Cura', color: '#22c55e' },
  { value: 'ACABAMENTO_FINAL', label: 'Acabamento Final', color: '#10b981' },
  { value: 'INSPECAO', label: 'Inspecao', color: '#f97316' },
  { value: 'RETRABALHO', label: 'Retrabalho', color: '#ef4444' },
  { value: 'CUSTOM', label: 'Personalizado', color: '#9ca3af' },
];

// Check if project has measurements for auto-generation
const hasMeasurements = computed(() => {
  if (!project.value) return false;
  const m2Piso = Number(project.value.m2Piso) || 0;
  const m2Parede = Number(project.value.m2Parede) || 0;
  const m2Teto = Number(project.value.m2Teto) || 0;
  return m2Piso > 0 || m2Parede > 0 || m2Teto > 0;
});

// Calculated m2Total (sum of all areas)
const calculatedM2Total = computed(() => {
  const piso = Number(formData.value.m2Piso) || 0;
  const parede = Number(formData.value.m2Parede) || 0;
  const teto = Number(formData.value.m2Teto) || 0;
  return piso + parede + teto;
});

// Calculated m2Total from project (for display mode)
const projectM2Total = computed(() => {
  if (!project.value) return 0;
  const piso = Number(project.value.m2Piso) || 0;
  const parede = Number(project.value.m2Parede) || 0;
  const teto = Number(project.value.m2Teto) || 0;
  return piso + parede + teto;
});

// Determine project scope from measurements
const projectScope = computed(() => {
  if (!project.value) return 'COMBINADO';
  const m2Piso = Number(project.value.m2Piso) || 0;
  const m2Parede = Number(project.value.m2Parede) || 0;
  const m2Teto = Number(project.value.m2Teto) || 0;

  const hasPiso = m2Piso > 0;
  const hasParede = m2Parede > 0;
  const hasTeto = m2Teto > 0;

  if (hasPiso && !hasParede && !hasTeto) {
    return 'PISO';
  } else if (!hasPiso && (hasParede || hasTeto)) {
    return 'PAREDE_TETO';
  } else {
    return 'COMBINADO';
  }
});

const scopeLabels: Record<string, string> = {
  'PISO': 'Piso',
  'PAREDE_TETO': 'Parede/Teto',
  'COMBINADO': 'Combinado'
};

const taskForm = ref({
  title: '',
  description: '',
  taskType: 'CUSTOM',
  startDate: '',
  endDate: '',
  estimatedHours: null as number | null,
  status: 'PENDING',
  color: '#c9a962',
});

const taskTypeLabels: Record<string, string> = {
  PREPARACAO: 'Preparacao',
  LIMPEZA_INICIAL: 'Limpeza Inicial',
  NIVELAMENTO: 'Nivelamento',
  APLICACAO_PISO: 'Aplicacao Piso',
  APLICACAO_PAREDE: 'Aplicacao Parede',
  APLICACAO_TETO: 'Aplicacao Teto',
  RODAPE: 'Rodape',
  LIXAMENTO: 'Lixamento',
  SELADOR: 'Selador',
  CURA: 'Cura',
  ACABAMENTO_FINAL: 'Acabamento Final',
  INSPECAO: 'Inspecao',
  RETRABALHO: 'Retrabalho',
  CUSTOM: 'Personalizado',
};

const taskStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  BLOCKED: 'Bloqueado',
  CANCELLED: 'Cancelado',
};

const taskStatusColors: Record<string, string> = {
  PENDING: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
  BLOCKED: '#f97316',
  CANCELLED: '#ef4444',
};

// Gantt start date (from project startedAt or first task or today)
const ganttStartDate = computed(() => {
  if (project.value?.startedAt) {
    return new Date(project.value.startedAt);
  }
  // Check first task
  if (tasks.value.length > 0 && tasks.value[0].startDate) {
    return new Date(tasks.value[0].startDate);
  }
  return new Date();
});

// Gantt end date (from deadline or last task)
const ganttEndDate = computed(() => {
  if (project.value?.deadlineDate) {
    return new Date(project.value.deadlineDate);
  }
  // Check last task
  if (tasks.value.length > 0) {
    const lastTask = tasks.value[tasks.value.length - 1];
    if (lastTask.endDate) {
      return new Date(lastTask.endDate);
    }
  }
  // Default: 14 days from start
  const end = new Date(ganttStartDate.value);
  end.setDate(end.getDate() + 14);
  return end;
});

// Calculate total WORK DAYS (sum of inputDays from all blocks)
// This represents actual working days, not calendar days
const totalGanttDays = computed(() => {
  let totalDays = 0;
  let i = 0;

  while (i < tasks.value.length) {
    const task = tasks.value[i];

    // Get the inputDays for this block (group or single task)
    const blockDays = Number(task.inputDays) || 1;
    totalDays += blockDays;

    // Skip grouped tasks (they share the same days)
    if (isGroupedRow(i)) {
      const groupSize = getGroupFromStart(i).length;
      i += groupSize;
    } else {
      i++;
    }
  }

  return totalDays;
});

// Calculate total number of BLOCKS (grouped tasks count as 1)
const totalGanttBlocks = computed(() => {
  let blockCount = 0;
  let i = 0;
  while (i < tasks.value.length) {
    blockCount++;
    // Skip grouped tasks
    while (i < tasks.value.length && tasks.value[i].groupWithNext) {
      i++;
    }
    i++;
  }
  return blockCount;
});

// Calculate total HOURS (sum of all task hours)
const totalGanttHours = computed(() => {
  let totalHours = 0;
  let i = 0;
  while (i < tasks.value.length) {
    const task = tasks.value[i];

    // Check if this is a grouped block
    if (isGroupedRow(i)) {
      totalHours += getTotalGroupHours(i);
      // Skip all tasks in this group
      const groupSize = getGroupFromStart(i).length;
      i += groupSize;
    } else {
      // Single task
      totalHours += calculateTaskHours(task);
      i++;
    }
  }
  return totalHours;
});

// Generate array of days for timeline header (SEPARATED Sat and Sun)
const ganttDaysArray = computed(() => {
  const days: {
    date: Date;
    label: string;
    dayNum: number;
    isSaturday: boolean;
    isSunday: boolean;
    isWorkDay: boolean;
  }[] = [];

  const start = new Date(ganttStartDate.value);
  start.setHours(0, 0, 0, 0);

  const allowSaturday = project.value?.allowSaturday || false;
  const allowSunday = project.value?.allowSunday || false;

  // Calculate end date by adding totalGanttDays work days to start
  // This accounts for weekends properly
  const totalWorkDaysNeeded = totalGanttDays.value;
  let endDate = new Date(start);
  let workDaysAdded = 0;

  while (workDaysAdded < totalWorkDaysNeeded) {
    const dayOfWeek = endDate.getDay();
    const isSat = dayOfWeek === 6;
    const isSun = dayOfWeek === 0;
    const isWork = (!isSat && !isSun) || (isSat && allowSaturday) || (isSun && allowSunday);

    if (isWork) {
      workDaysAdded++;
    }

    if (workDaysAdded < totalWorkDaysNeeded) {
      endDate.setDate(endDate.getDate() + 1);
    }
  }

  // Now generate ALL calendar days from start to end
  const current = new Date(start);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'] as const;

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    // Determine if this is a work day based on project settings
    const isWorkDay = (!isSaturday && !isSunday) ||
                      (isSaturday && allowSaturday) ||
                      (isSunday && allowSunday);

    days.push({
      date: new Date(current),
      label: dayNames[dayOfWeek] || 'Seg',
      dayNum: current.getDate(),
      isSaturday,
      isSunday,
      isWorkDay,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
});

// Calculate task offset (days from start) based on startDate
const getTaskOffset = (task: any) => {
  if (!task.startDate) return 0;
  const start = new Date(ganttStartDate.value);
  start.setHours(0, 0, 0, 0);
  const taskStart = new Date(task.startDate);
  taskStart.setHours(0, 0, 0, 0);
  const diffTime = taskStart.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Calculate task duration in days
const getTaskDuration = (task: any) => {
  if (!task.startDate || !task.endDate) return 1;
  const start = new Date(task.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(task.endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
};

// Calculate current day position for "today" indicator
const todayIndicator = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(ganttStartDate.value);
  start.setHours(0, 0, 0, 0);

  // Calculate days from start to today
  const diffTime = today.getTime() - start.getTime();
  const dayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Check if today is within the visible timeline
  const isVisible = dayOffset >= 0 && dayOffset < ganttDaysArray.value.length;

  // Calculate position (40px per day, aligned with day cell)
  const position = dayOffset * 40;

  return {
    isVisible,
    position,
    dayOffset,
  };
});

// Calculate task bar width in pixels
const getTaskWidth = (task: any) => {
  const duration = getTaskDuration(task);
  const dayWidth = 40; // pixels per day
  return Math.max(60, duration * dayWidth);
};

// Calculate task bar left offset in pixels
const getTaskLeft = (task: any) => {
  const offset = getTaskOffset(task);
  const dayWidth = 40;
  return offset * dayWidth;
};

// Group tasks visually - tasks with groupWithNext will be rendered as a single block
const groupedTasks = computed(() => {
  const groups: Array<{ tasks: any[]; isGroup: boolean; id: string }> = [];
  let currentGroup: any[] = [];

  for (let i = 0; i < tasks.value.length; i++) {
    const task = tasks.value[i];
    currentGroup.push(task);

    // If this task doesn't group with next, close the group
    if (!task.groupWithNext || i === tasks.value.length - 1) {
      groups.push({
        tasks: [...currentGroup],
        isGroup: currentGroup.length > 1,
        id: currentGroup[0].id + '-group',
      });
      currentGroup = [];
    }
  }

  return groups;
});

// Delete task from Gantt
const deleteTaskFromGantt = async (taskId: string) => {
  if (!confirm('Remover esta etapa?')) return;
  try {
    await projectsApi.deleteTask(route.params.id as string, taskId);
    await loadTasks();
  } catch (error: any) {
    console.error('Error deleting task:', error);
    alert('Erro ao remover tarefa');
  }
};

// Legacy function placeholder - sync removed
const syncGanttToTasks = async () => {
  // No longer needed - tasks come from backend
};

/**
 * Check if a task is a "cura" (curing) process
 * Cura tasks are passive and should not be grouped with other tasks
 */
const isCuraTask = (task: any): boolean => {
  if (task.isCura === true) return true;
  if (task.consumesResources === false) return true;
  const title = (task.title || '').toLowerCase();
  return title.includes('cura');
};

/**
 * Add work days to a date, respecting weekends
 */
const addWorkDays = (date: Date, days: number, allowSaturday: boolean, allowSunday: boolean): Date => {
  const result = new Date(date);
  let daysAdded = 0;

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    // Only count work days
    if (
      (!isSaturday && !isSunday) ||
      (isSaturday && allowSaturday) ||
      (isSunday && allowSunday)
    ) {
      daysAdded++;
    }
  }

  return result;
};

/**
 * Reorganize Gantt timeline: redistribute dates sequentially
 * Each task/group gets its own time block on the timeline
 * EXCEPT: Tasks with groupWithNext=true share dates with the next task
 */
const autoGrouping = ref(false);
const initializeBlocksFromTasks = async () => {
  if (tasks.value.length === 0 || autoGrouping.value || !project.value) return;

  let needsUpdate = false;
  const updates: Promise<any>[] = [];

  // Get project settings
  const allowSaturday = project.value.allowSaturday || false;
  const allowSunday = project.value.allowSunday || false;

  // Start from project start date or today
  let currentDate = project.value.startedAt ? new Date(project.value.startedAt) : new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < tasks.value.length; i++) {
    const task = tasks.value[i];
    const isCura = isCuraTask(task);

    // Ensure cura tasks are ungrouped and have 0 people
    if (isCura) {
      if (task.groupWithNext) {
        task.groupWithNext = false;
        needsUpdate = true;
        updates.push(
          projectsApi.updateTask(route.params.id as string, task.id, {
            groupWithNext: false,
          })
        );
      }
      if (task.inputPeople !== 0) {
        task.inputPeople = 0;
        needsUpdate = true;
        updates.push(
          projectsApi.updateTask(route.params.id as string, task.id, {
            inputPeople: 0,
            estimatedHours: 0,
          })
        );
      }
    }

    // Calculate duration for this task
    const taskDays = Number(task.inputDays) || 1;

    // Set task dates
    const taskStart = new Date(currentDate);
    const taskEnd = addWorkDays(taskStart, taskDays - 1, allowSaturday, allowSunday);

    // Check if dates need updating
    const currentStart = new Date(task.startDate).getTime();
    const currentEnd = new Date(task.endDate).getTime();
    const newStart = taskStart.getTime();
    const newEnd = taskEnd.getTime();

    if (currentStart !== newStart || currentEnd !== newEnd) {
      needsUpdate = true;
      updates.push(
        projectsApi.updateTask(route.params.id as string, task.id, {
          startDate: taskStart,
          endDate: taskEnd,
        })
      );
      task.startDate = taskStart;
      task.endDate = taskEnd;
    }

    // Move to next date block ONLY if not grouped with next
    if (!task.groupWithNext) {
      // Move currentDate forward by task duration
      currentDate = addWorkDays(taskEnd, 1, allowSaturday, allowSunday);
    }
    // If grouped with next, keep currentDate the same so next task overlaps
  }

  if (needsUpdate) {
    try {
      autoGrouping.value = true;
      await Promise.all(updates);
      // Reload tasks
      const [tasksResponse, statsResponse] = await Promise.all([
        projectsApi.getTasks(route.params.id as string),
        projectsApi.getTasksStats(route.params.id as string),
      ]);
      tasks.value = tasksResponse.data.data || [];
      taskStats.value = statsResponse.data.data || null;
    } catch (error) {
      console.error('Error reorganizing Gantt timeline:', error);
    } finally {
      autoGrouping.value = false;
    }
  }
};

// Delete task helper (old reference)
const deleteBlock = async (taskId: string) => {
  await deleteTaskFromGantt(taskId);
};

// Days dropdown options (1-30 days)
const availableDays = Array.from({ length: 30 }, (_, i) => i + 1);

// Selected task for editing in panel
const selectedBlock = ref<any>(null);
const showBlockEditor = ref(false);

// Open task editor panel
const openBlockEditor = (task: any) => {
  selectedBlock.value = {
    ...task,
    taskType: task.taskType || 'CUSTOM',
    days: getTaskDuration(task),
    label: task.title,
  };
  showBlockEditor.value = true;
};

// Add task dropdown
const showAddTaskDropdown = ref<string | null>(null); // taskId do dropdown aberto

// Task templates available for insertion
const taskTemplates = [
  { id: 'custom', title: 'Tarefa personalizada', color: '#c9a962' },
  { id: 'protecao', title: 'Proteção/Fitamento', color: '#64748b' },
  { id: 'limpeza', title: 'Limpeza', color: '#94a3b8' },
  { id: 'primer', title: 'Primer', color: '#8b5cf6' },
  { id: 'lilit', title: 'LILIT', color: '#3b82f6' },
  { id: 'leona', title: 'Leona', color: '#c9a962' },
  { id: 'stelion', title: 'Stelion', color: '#d4af37' },
  { id: 'lixamento', title: 'Lixamento', color: '#6366f1' },
  { id: 'cura', title: 'Cura', color: '#22c55e', isCura: true },
  { id: 'verniz', title: 'Verniz', color: '#14b8a6' },
  { id: 'selador', title: 'Selador', color: '#a855f7' },
  { id: 'verificacao', title: 'Verificação', color: '#f97316' },
];

// Toggle add task dropdown
const toggleAddTaskDropdown = (taskId: string) => {
  if (showAddTaskDropdown.value === taskId) {
    showAddTaskDropdown.value = null;
  } else {
    showAddTaskDropdown.value = taskId;
  }
};

// Insert task at position
const insertTaskAt = async (position: 'above' | 'below', referenceTaskId: string, template: any) => {
  try {
    if (!project.value?.id) return;

    const referenceIndex = tasks.value.findIndex(t => t.id === referenceTaskId);
    if (referenceIndex === -1) return;

    const insertIndex = position === 'above' ? referenceIndex : referenceIndex + 1;

    // Create new task with template or custom
    const newTaskData: any = {
      title: template.title,
      color: template.color,
      inputDays: 1,
      inputPeople: 0,
      sortOrder: insertIndex + 1,
      consumesResources: !template.isCura,
    };

    if (template.isCura) {
      newTaskData.consumesResources = false;
    }

    const response = await fetch(`/api/admin/projects/${project.value.id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify(newTaskData),
    });

    if (!response.ok) throw new Error('Failed to create task');

    await response.json();

    // Update sort order for tasks after insertion point
    const updatePromises = tasks.value
      .slice(insertIndex)
      .map(async (task, idx) => {
        await fetch(`/api/admin/projects/${project.value?.id}/tasks/${task.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({ sortOrder: insertIndex + idx + 2 }),
        });
      });

    await Promise.all(updatePromises);

    // Reload tasks
    await loadTasks();
    showAddTaskDropdown.value = null;
  } catch (error) {
    console.error('Error inserting task:', error);
  }
};

// Save task changes from editor
const saveBlockChanges = async () => {
  if (!selectedBlock.value) return;
  try {
    const taskType = availableTaskTypes.find(t => t.value === selectedBlock.value.taskType);
    await projectsApi.updateTask(route.params.id as string, selectedBlock.value.id, {
      title: taskType?.label || selectedBlock.value.title,
      taskType: selectedBlock.value.taskType,
      color: taskType?.color || selectedBlock.value.color,
    });
    await loadTasks();
    showBlockEditor.value = false;
    selectedBlock.value = null;
  } catch (error) {
    console.error('Error updating task:', error);
  }
};

// Task type change handler
const onTaskTypeChange = () => {
  if (!selectedBlock.value) return;
  const taskType = availableTaskTypes.find(t => t.value === selectedBlock.value.taskType);
  if (taskType) {
    selectedBlock.value.color = taskType.color;
    selectedBlock.value.label = taskType.label;
  }
};

// Placeholder for inline task type change
const onInlineTaskTypeChange = async (task: any, newTaskType: string) => {
  const taskType = availableTaskTypes.find(t => t.value === newTaskType);
  if (!taskType) return;
  try {
    await projectsApi.updateTask(route.params.id as string, task.id, {
      title: taskType.label,
      taskType: newTaskType,
      color: taskType.color,
    });
    await loadTasks();
  } catch (error) {
    console.error('Error updating task type:', error);
  }
};

// ===== INLINE EDITING FUNCTIONS =====

// Calcula horas totais baseado em dias + pessoas
const calculateTaskHours = (task: any): number => {
  // Use defaults: 1 day if not specified, 0 people means no calculation
  const days = Number(task.inputDays) || 1;
  const people = Number(task.inputPeople) || 0;

  // If no people assigned, return 0
  if (people === 0) return 0;

  const WORK_HOURS_PER_DAY = 8;
  const LUNCH_BREAK_HOURS = 1;
  const effectiveHoursPerPerson = WORK_HOURS_PER_DAY - LUNCH_BREAK_HOURS;

  return days * people * effectiveHoursPerPerson;
};

// Atualiza um campo específico da task
const updateTaskField = async (taskId: string, field: string, value: any) => {
  try {
    const updateData: any = { [field]: value };
    await projectsApi.updateTask(route.params.id as string, taskId, updateData);
    await loadTasks();
  } catch (error) {
    console.error(`Error updating task ${field}:`, error);
  }
};

// Quando muda dias ou pessoas, recalcula estimatedHours
// Se a task faz parte de um grupo, sincroniza valores para todas as tasks do grupo
const onInputChange = async (task: any) => {
  const hours = calculateTaskHours(task);

  try {
    // Find the index of this task
    const taskIndex = tasks.value.findIndex(t => t.id === task.id);

    // Check if this is the first task of a group
    if (taskIndex !== -1 && isGroupedRow(taskIndex)) {
      // Sync values to ALL tasks in the group
      const group = getGroupFromStart(taskIndex);
      const updatePromises = group.map(groupTask =>
        projectsApi.updateTask(route.params.id as string, groupTask.id, {
          inputDays: task.inputDays || null,
          inputPeople: task.inputPeople || null,
          estimatedHours: hours,
        })
      );
      await Promise.all(updatePromises);
    } else {
      // Single task, just update it
      await projectsApi.updateTask(route.params.id as string, task.id, {
        inputDays: task.inputDays || null,
        inputPeople: task.inputPeople || null,
        estimatedHours: hours,
      });
    }

    await loadTasks();
  } catch (error) {
    console.error('Error updating task hours:', error);
  }
};

// Toggle groupWithNext
const toggleGroupWithNext = async (task: any) => {
  const newValue = !task.groupWithNext;
  task.groupWithNext = newValue;
  await updateTaskField(task.id, 'groupWithNext', newValue);
};

// Check if a task is part of a group (has groupWithNext or previous task has groupWithNext)
const isTaskInGroup = (taskIndex: number): boolean => {
  if (taskIndex === 0) return false;

  // Check if any previous task groups with this one
  for (let i = taskIndex - 1; i >= 0; i--) {
    if (tasks.value[i].groupWithNext) return true;
    // Stop if we find a task that doesn't group
    if (i > 0 && !tasks.value[i - 1].groupWithNext) break;
  }
  return false;
};

// Get all tasks in the same group
const getGroupedTasksForIndex = (taskIndex: number): any[] => {
  const grouped: any[] = [];

  // Go back to find the start of the group
  let startIndex = taskIndex;
  while (startIndex > 0 && tasks.value[startIndex - 1].groupWithNext) {
    startIndex--;
  }

  // Collect all tasks in the group
  for (let i = startIndex; i <= taskIndex; i++) {
    grouped.push(tasks.value[i]);
  }

  return grouped;
};

// Calculate height for grouped timeline bar
const getGroupHeight = (taskIndex: number): number => {
  const groupedTasks = getGroupedTasksForIndex(taskIndex);
  if (groupedTasks.length <= 1) return 24; // Default single task height

  // 20px per task + 4px spacing
  return groupedTasks.length * 20 + (groupedTasks.length - 1) * 4;
};

// =============================================
// ROW GROUPING - Make multiple tasks appear as ONE row
// =============================================

/**
 * Determines if we should render a row for this task
 * Only render if:
 * 1. Task is standalone (not grouped)
 * 2. Task is the FIRST in a group
 * Skip rendering if task is in the middle/end of a group
 */
const shouldRenderRow = (taskIndex: number): boolean => {
  if (taskIndex === 0) return true; // First task always renders

  // Check if previous task groups with this one
  // If yes, this task is part of a group and should NOT render its own row
  if (tasks.value[taskIndex - 1].groupWithNext) {
    return false;
  }

  return true;
};

/**
 * Get all tasks in a group starting from the current task
 * Used when rendering a grouped row to show all tasks in that group
 */
const getGroupFromStart = (startIndex: number): any[] => {
  const group: any[] = [tasks.value[startIndex]];

  // Keep adding tasks while current task has groupWithNext = true
  let currentIndex = startIndex;
  while (currentIndex < tasks.value.length && tasks.value[currentIndex].groupWithNext) {
    currentIndex++;
    if (currentIndex < tasks.value.length) {
      group.push(tasks.value[currentIndex]);
    }
  }

  return group;
};

/**
 * Calculate total hours for all tasks in a group
 * Grouped tasks = SAME people doing multiple steps in the SAME period
 * - Duration = Use from first task (they share the same period)
 * - People = Use from first task (SAME people, not summed)
 * - Hours = days × people × 7h
 */
const getTotalGroupHours = (startIndex: number): number => {
  const group = getGroupFromStart(startIndex);

  // Use values from FIRST task - they all share the same resources
  const firstTask = group[0];
  const days = Number(firstTask.inputDays) || 1;
  const people = Number(firstTask.inputPeople) || 0;

  if (people === 0) return 0;

  const WORK_HOURS_PER_DAY = 8;
  const LUNCH_BREAK_HOURS = 1;
  const effectiveHoursPerPerson = WORK_HOURS_PER_DAY - LUNCH_BREAK_HOURS;

  return days * people * effectiveHoursPerPerson;
};

/**
 * Calculate total duration in days for all tasks in a group
 * Grouped tasks share the SAME period, so use the first task's duration
 */
const getTotalGroupDuration = (startIndex: number): number => {
  const group = getGroupFromStart(startIndex);
  const firstTask = group[0];
  // Use inputDays directly since all tasks in group now share the same value
  return Number(firstTask.inputDays) || 1;
};

/**
 * Check if a task is part of a multi-task group (more than 1 task)
 */
const isGroupedRow = (taskIndex: number): boolean => {
  const group = getGroupFromStart(taskIndex);
  return group.length > 1;
};

/**
 * Determine if the timeline bar should be shown on this specific row within a group
 * For grouped blocks, show the bar on the MIDDLE row to center it vertically
 */
const shouldShowTimelineBar = (groupIdx: number, groupLength: number): boolean => {
  if (groupLength === 1) return true; // Single task, always show
  // Show on middle row (for 3 tasks, show on index 1 = 2nd row)
  const middleIndex = Math.floor(groupLength / 2);
  return groupIdx === middleIndex;
};

/**
 * Calcula o número de ordem do bloco (grupos e tarefas standalone)
 * Grupos contam como 1 bloco, independente do número de tarefas
 * Exemplo: [tarefa1, grupo(3 tarefas), tarefa2] = 1, 2, 3
 */
const getBlockNumber = (taskIndex: number): number => {
  let blockCount = 0;
  let i = 0;

  while (i < taskIndex) {
    // Se esta tarefa começa um grupo ou é standalone, conta como 1 bloco
    if (shouldRenderRow(i)) {
      blockCount++;
      // Pula todas as tarefas do grupo
      const groupSize = getGroupFromStart(i).length;
      i += groupSize;
    } else {
      i++;
    }
  }

  // Retorna o número do bloco atual (1-indexed)
  return blockCount + 1;
};

/**
 * Determina se deve mostrar o número de ordem nesta linha específica
 * Para grupos: apenas na linha do MEIO
 * Para standalone: sempre
 */
const shouldShowOrderNumber = (groupIdx: number, groupLength: number): boolean => {
  if (groupLength === 1) return true; // Standalone, sempre mostra
  const middleIndex = Math.floor(groupLength / 2);
  return groupIdx === middleIndex; // Apenas na linha do meio do grupo
};

// Distribute teamSize to all tasks automatically
const distributeTeamSize = async () => {
  if (!project.value?.teamSize) {
    alert('Defina o número de pessoas na equipe no card Cronograma primeiro');
    return;
  }

  if (!confirm(`Distribuir ${project.value.teamSize} pessoa(s) para todas as tarefas que consomem recursos?`)) {
    return;
  }

  try {
    // Update all tasks that consume resources
    const updates = tasks.value
      .filter((task: any) => task.consumesResources !== false)
      .map(async (task: any) => {
        const inputDays = task.inputDays || 1;
        const inputPeople = project.value!.teamSize!;
        const hours = inputDays * inputPeople * 7; // 7h effective per person per day

        return projectsApi.updateTask(route.params.id as string, task.id, {
          inputDays,
          inputPeople,
          estimatedHours: hours,
        });
      });

    await Promise.all(updates);
    await loadTasks();
    alert(`Distribuição concluída! ${updates.length} tarefa(s) atualizada(s).`);
  } catch (error) {
    console.error('Error distributing team size:', error);
    alert('Erro ao distribuir equipe');
  }
};

// Send schedule to app agenda - publishes tasks to mobile app
const publishingTasks = ref(false);
const sendToAppAgenda = async () => {
  if (!confirm('Publicar cronograma para a agenda dos aplicadores no app mobile?\n\nAs tarefas ficarão visíveis para todos os aplicadores atribuídos ao projeto.')) {
    return;
  }

  publishingTasks.value = true;
  try {
    const response = await projectsApi.publishTasks(route.params.id as string);
    if (response.data.success) {
      const { publishedCount, projectName } = response.data.data;
      alert(`✅ ${publishedCount} tarefas publicadas com sucesso!\n\nO cronograma agora está disponível na agenda do app mobile para o projeto "${projectName}".`);
      // Reload tasks to update published status
      await loadTasks();
    }
  } catch (error: any) {
    console.error('Error publishing tasks:', error);
    const message = error.response?.data?.error?.message || 'Erro ao publicar tarefas';
    alert('Erro: ' + message);
  } finally {
    publishingTasks.value = false;
  }
};

// Drag and drop placeholders (disabled for now - dates controlled by deadline)
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
const onDragStart = (index: number, event: DragEvent) => {};
const onDragOver = (index: number, event: DragEvent) => { event.preventDefault(); };
const onDragLeave = () => {};
const onDrop = (targetIndex: number) => {};
const onDragEnd = () => {};

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadProject = async () => {
  loading.value = true;
  try {
    const response = await projectsApi.getById(route.params.id as string);
    project.value = response.data.data;

    // Populate form data
    formData.value = {
      title: project.value.title || '',
      cliente: project.value.cliente || '',
      endereco: project.value.endereco || '',
      status: project.value.status || 'EM_EXECUCAO',
      estimatedHours: project.value.estimatedHours,
      consultor: project.value.consultor || '',
      material: project.value.material || '',
      cor: project.value.cor || '',
      isNightShift: project.value.isNightShift || false,
      // Metragens
      m2Total: project.value.m2Total,
      m2Piso: project.value.m2Piso,
      m2Parede: project.value.m2Parede,
      m2Teto: project.value.m2Teto,
      mRodape: project.value.mRodape,
      // Telefones do responsavel
      responsiblePhones: project.value.responsiblePhones || [],
      // Cronograma / Horarios
      workStartTime: project.value.workStartTime || '08:00',
      workEndTime: project.value.workEndTime || '17:00',
      deadlineDate: project.value.deadlineDate ? project.value.deadlineDate.split('T')[0] : '',
      estimatedDays: project.value.estimatedDays,
      teamSize: project.value.teamSize,
      allowSaturday: project.value.allowSaturday || false,
      allowSunday: project.value.allowSunday || false,
      allowNightWork: project.value.allowNightWork || false,
      isTravelMode: project.value.isTravelMode || false,
    };

    // Load checkins for days in progress calculation
    await loadCheckins();

    // Set team from response
    team.value = project.value.team || [];

    // Set night shift config
    nightShiftConfig.value = {
      slots: project.value.nightShiftSlots || 10,
      startDate: project.value.nightShiftStart ? project.value.nightShiftStart.split('T')[0] : '',
      endDate: project.value.nightShiftEnd ? project.value.nightShiftEnd.split('T')[0] : '',
    };
  } catch (error) {
    console.error('Error loading project:', error);
    router.push('/projects');
  } finally {
    loading.value = false;
  }
};

const saveProject = async () => {
  saving.value = true;
  try {
    // Clean data - remove null/undefined values and convert empty strings
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(formData.value)) {
      // Skip m2Total as it will be calculated
      if (key === 'm2Total') continue;

      // Always include arrays (even empty ones like responsiblePhones: [])
      if (Array.isArray(value)) {
        cleanData[key] = value;
      } else if (value !== null && value !== undefined && value !== '') {
        // Convert numeric fields to numbers
        if (['m2Piso', 'm2Parede', 'm2Teto', 'mRodape', 'latitude', 'longitude', 'geofenceRadius', 'estimatedHours'].includes(key)) {
          cleanData[key] = Number(value);
        } else {
          cleanData[key] = value;
        }
      }
    }

    // Add calculated m2Total
    cleanData.m2Total = calculatedM2Total.value;

    console.log('Saving project with data:', JSON.stringify(cleanData, null, 2));
    await projectsApi.update(route.params.id as string, cleanData);
    await loadProject();
    editMode.value = false;
  } catch (error: any) {
    console.error('Save error:', error.response?.data);
    const errData = error.response?.data?.error;
    let errMsg = typeof errData === 'object' ? errData?.message : errData;
    // Add validation details if available
    if (errData?.details?.length > 0) {
      const fields = errData.details.map((d: any) => `${d.path}: ${d.msg}`).join(', ');
      errMsg += ` (${fields})`;
    }
    alert('Erro ao salvar: ' + (errMsg || error.message || 'Erro desconhecido'));
  } finally {
    saving.value = false;
  }
};

const cancelEdit = () => {
  editMode.value = false;
  editingField.value = null;
  // Reset form data
  if (project.value) {
    formData.value = {
      title: project.value.title || '',
      cliente: project.value.cliente || '',
      endereco: project.value.endereco || '',
      status: project.value.status || 'EM_EXECUCAO',
      estimatedHours: project.value.estimatedHours,
      consultor: project.value.consultor || '',
      material: project.value.material || '',
      cor: project.value.cor || '',
      isNightShift: project.value.isNightShift || false,
      // Metragens
      m2Total: project.value.m2Total,
      m2Piso: project.value.m2Piso,
      m2Parede: project.value.m2Parede,
      m2Teto: project.value.m2Teto,
      mRodape: project.value.mRodape,
      // Telefones do responsavel
      responsiblePhones: project.value.responsiblePhones || [],
      // Cronograma / Horarios
      workStartTime: project.value.workStartTime || '',
      workEndTime: project.value.workEndTime || '',
      deadlineDate: project.value.deadlineDate ? project.value.deadlineDate.split('T')[0] : '',
      estimatedDays: project.value.estimatedDays,
      teamSize: project.value.teamSize,
      allowSaturday: project.value.allowSaturday || false,
      allowSunday: project.value.allowSunday || false,
      allowNightWork: project.value.allowNightWork || false,
      isTravelMode: project.value.isTravelMode || false,
    };
  }
};

// Start inline editing for a single field
const startFieldEdit = (fieldName: string) => {
  // Initialize formData with current project value before entering edit mode
  if (project.value) {
    if (fieldName === 'workStartTime') {
      formData.value.workStartTime = project.value.workStartTime || '08:00';
    } else if (fieldName === 'workEndTime') {
      formData.value.workEndTime = project.value.workEndTime || '17:00';
    } else if (fieldName === 'deadlineDate') {
      formData.value.deadlineDate = project.value.deadlineDate ? project.value.deadlineDate.split('T')[0] : '';
    } else if (fieldName === 'estimatedDays') {
      formData.value.estimatedDays = project.value.estimatedDays;
    } else if (fieldName === 'teamSize') {
      formData.value.teamSize = project.value.teamSize;
    }
  }
  editingField.value = fieldName;
};

// Save single field inline
const saveFieldInline = async (fieldName: string, event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (saving.value) return; // Prevent double-click

  saving.value = true;
  try {
    const value = formData.value[fieldName as keyof typeof formData.value];
    const updateData: Record<string, any> = {};

    // Convert numeric fields
    if (['estimatedDays', 'teamSize'].includes(fieldName)) {
      updateData[fieldName] = value ? Number(value) : null;
    } else {
      updateData[fieldName] = value;
    }

    await projectsApi.update(route.params.id as string, updateData);

    // Update local project value instead of full reload
    if (project.value) {
      (project.value as any)[fieldName] = updateData[fieldName];
    }

    // Sync tasks when deadline or estimated days changes
    if (fieldName === 'deadlineDate' || fieldName === 'estimatedDays') {
      try {
        const syncData: { deadlineDate?: string; estimatedDays?: number } = {};
        if (fieldName === 'deadlineDate' && value) {
          syncData.deadlineDate = value as string;
        } else if (fieldName === 'estimatedDays' && value) {
          syncData.estimatedDays = Number(value);
        }

        if (Object.keys(syncData).length > 0) {
          const response = await projectsApi.syncDeadline(route.params.id as string, syncData);
          // Update local estimatedDays if it was calculated
          if (response.data.data?.estimatedDays && project.value) {
            project.value.estimatedDays = response.data.data.estimatedDays;
            formData.value.estimatedDays = response.data.data.estimatedDays;
          }
          // Update local deadlineDate if it was calculated
          if (response.data.data?.deadlineDate && project.value) {
            project.value.deadlineDate = response.data.data.deadlineDate;
            formData.value.deadlineDate = response.data.data.deadlineDate.split('T')[0];
          }
          // Reload tasks to reflect changes
          await loadTasks();
        }
      } catch (syncError: any) {
        console.error('Sync deadline error:', syncError);
        // Don't show alert for sync errors, just log them
      }
    }

    editingField.value = null;
  } catch (error: any) {
    console.error('Save field error:', error);
    // Revert the value on error
    if (project.value) {
      (formData.value as any)[fieldName] = (project.value as any)[fieldName];
    }
    alert('Erro ao salvar: ' + (error.response?.data?.error?.message || error.message));
  } finally {
    saving.value = false;
  }
};

// Toggle boolean field and save
const toggleAndSave = async (fieldName: 'allowSaturday' | 'allowSunday' | 'allowNightWork' | 'isTravelMode', event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  // Toggle the value
  formData.value[fieldName] = !formData.value[fieldName];

  // Save
  await saveFieldInline(fieldName);
};

// Cancel inline field edit
const cancelFieldEdit = () => {
  editingField.value = null;
  // Reset the specific field from project value
  if (project.value) {
    formData.value.workStartTime = project.value.workStartTime || '08:00';
    formData.value.workEndTime = project.value.workEndTime || '17:00';
    formData.value.deadlineDate = project.value.deadlineDate ? project.value.deadlineDate.split('T')[0] : '';
    formData.value.estimatedDays = project.value.estimatedDays;
    formData.value.teamSize = project.value.teamSize;
    formData.value.allowSaturday = project.value.allowSaturday || false;
    formData.value.allowSunday = project.value.allowSunday || false;
    formData.value.allowNightWork = project.value.allowNightWork || false;
    formData.value.isTravelMode = project.value.isTravelMode || false;
  }
};

// Responsible phones functions
const addResponsiblePhone = () => {
  const phone = newResponsiblePhone.value.trim().replace(/\D/g, '');
  if (phone && phone.length >= 10 && !formData.value.responsiblePhones.includes(phone)) {
    formData.value.responsiblePhones.push(phone);
    newResponsiblePhone.value = '';
  }
};

const removeResponsiblePhone = (phone: string) => {
  const index = formData.value.responsiblePhones.indexOf(phone);
  if (index > -1) {
    formData.value.responsiblePhones.splice(index, 1);
  }
};

const formatPhoneDisplay = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Entry request functions
const openEntryRequestModal = async () => {
  if (team.value.length === 0) {
    await loadTeam();
  }
  selectedForEntry.value = team.value.map((m: any) => m.id); // Pre-select all team members
  showEntryRequestModal.value = true;
};

const toggleEntryApplicator = (userId: string) => {
  const index = selectedForEntry.value.indexOf(userId);
  if (index === -1) {
    selectedForEntry.value.push(userId);
  } else {
    selectedForEntry.value.splice(index, 1);
  }
};

const sendEntryRequest = async () => {
  if (selectedForEntry.value.length === 0) {
    alert('Selecione pelo menos um aplicador');
    return;
  }

  if (!formData.value.responsiblePhones || formData.value.responsiblePhones.length === 0) {
    alert('Adicione pelo menos um telefone de responsavel no projeto');
    return;
  }

  sendingEntryRequest.value = true;
  try {
    const response = await projectsApi.requestEntry(route.params.id as string, selectedForEntry.value);
    const result = response.data?.data?.results;

    if (result?.sentTo && result.sentTo.length > 0) {
      alert(`Solicitacao enviada com sucesso para ${result.sentTo.length} telefone(s)!`);
    } else if (response.data?.success) {
      alert('Solicitacao enviada com sucesso!');
    } else {
      alert('Erro ao enviar solicitacao: nenhum telefone recebeu a mensagem');
    }

    showEntryRequestModal.value = false;
    selectedForEntry.value = [];
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao enviar solicitacao: ' + (errMsg || error.message || 'Erro desconhecido'));
  } finally {
    sendingEntryRequest.value = false;
  }
};

const loadTeam = async () => {
  loadingTeam.value = true;
  try {
    const response = await projectsApi.getTeam(route.params.id as string);
    team.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading team:', error);
  } finally {
    loadingTeam.value = false;
  }
};

const loadAvailableApplicators = async () => {
  loadingApplicators.value = true;
  try {
    const response = await applicatorsApi.getAll({ status: 'APPROVED' });
    // Filter out already assigned members
    const assignedIds = team.value.map((m: any) => m.id);
    availableApplicators.value = (response.data.data || []).filter(
      (a: any) => !assignedIds.includes(a.id)
    );
  } catch (error) {
    console.error('Error loading applicators:', error);
  } finally {
    loadingApplicators.value = false;
  }
};

const openTeamModal = async () => {
  showTeamModal.value = true;
  teamSearchQuery.value = '';
  selectedApplicatorsToAdd.value = [];
  selectedRoleForAdd.value = 'APLICADOR_I';
  // Load team if not loaded
  if (team.value.length === 0) {
    await loadTeam();
  }
  await loadAvailableApplicators();
};

const toggleApplicatorSelection = (userId: string) => {
  const index = selectedApplicatorsToAdd.value.indexOf(userId);
  if (index === -1) {
    selectedApplicatorsToAdd.value.push(userId);
  } else {
    selectedApplicatorsToAdd.value.splice(index, 1);
  }
};

const selectAllFiltered = () => {
  const filteredIds = filteredApplicators.value.map((a: any) => a.id);
  // Add all filtered that are not already selected
  filteredIds.forEach((id: string) => {
    if (!selectedApplicatorsToAdd.value.includes(id)) {
      selectedApplicatorsToAdd.value.push(id);
    }
  });
};

const clearSelection = () => {
  selectedApplicatorsToAdd.value = [];
};

const addTeamMembers = async () => {
  if (selectedApplicatorsToAdd.value.length === 0) return;

  addingMembers.value = true;
  try {
    // Add each selected applicator
    for (const userId of selectedApplicatorsToAdd.value) {
      await projectsApi.addTeamMember(
        route.params.id as string,
        userId,
        selectedRoleForAdd.value
      );
    }
    await loadTeam();
    await loadAvailableApplicators(); // Refresh available list
    selectedApplicatorsToAdd.value = [];
    teamSearchQuery.value = '';
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao adicionar: ' + (errMsg || error.message || 'Erro desconhecido'));
  } finally {
    addingMembers.value = false;
  }
};

const removeTeamMember = async (userId: string) => {
  if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return;

  removingMember.value = userId;
  try {
    await projectsApi.removeTeamMember(route.params.id as string, userId);
    await loadTeam();
    // Refresh available applicators list if modal is open
    if (showTeamModal.value) {
      await loadAvailableApplicators();
    }
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao remover: ' + (errMsg || error.message || 'Erro desconhecido'));
  } finally {
    removingMember.value = null;
  }
};

const loadCheckins = async () => {
  loadingCheckins.value = true;
  try {
    const response = await projectsApi.getCheckins(route.params.id as string);
    checkins.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading checkins:', error);
  } finally {
    loadingCheckins.value = false;
  }
};

const loadReports = async () => {
  loadingReports.value = true;
  try {
    const response = await projectsApi.getReports(route.params.id as string);
    reports.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading reports:', error);
  } finally {
    loadingReports.value = false;
  }
};

// Night Shift Functions
const loadNightShiftInvites = async () => {
  loadingInvites.value = true;
  try {
    const response = await projectsApi.getNightShiftInvites(route.params.id as string);
    nightShiftInvites.value = response.data.data || [];
    inviteCounts.value = {
      pending: response.data.meta?.pending || 0,
      accepted: response.data.meta?.accepted || 0,
      declined: response.data.meta?.declined || 0,
      expired: response.data.meta?.expired || 0,
    };
  } catch (error) {
    console.error('Error loading invites:', error);
  } finally {
    loadingInvites.value = false;
  }
};

const saveNightShiftConfig = async () => {
  try {
    await projectsApi.configureNightShift(route.params.id as string, {
      slots: nightShiftConfig.value.slots,
      startDate: nightShiftConfig.value.startDate || undefined,
      endDate: nightShiftConfig.value.endDate || undefined,
    });
    await loadProject();
    alert('Configuracao de turno noturno salva!');
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao salvar: ' + (errMsg || error.message || 'Erro desconhecido'));
  }
};

const openInviteModal = async () => {
  showInviteModal.value = true;
  selectedInvitees.value = [];
  await loadAvailableApplicators();
  // Filter out users who already have invites
  const invitedIds = nightShiftInvites.value.map((i: any) => i.userId);
  availableApplicators.value = availableApplicators.value.filter(
    (a: any) => !invitedIds.includes(a.id)
  );
};

const toggleInvitee = (userId: string) => {
  const index = selectedInvitees.value.indexOf(userId);
  if (index === -1) {
    selectedInvitees.value.push(userId);
  } else {
    selectedInvitees.value.splice(index, 1);
  }
};

const sendInvites = async () => {
  if (selectedInvitees.value.length === 0) return;

  sendingInvites.value = true;
  try {
    await projectsApi.sendNightShiftInvites(route.params.id as string, selectedInvitees.value);
    await loadNightShiftInvites();
    showInviteModal.value = false;
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao enviar convites: ' + (errMsg || error.message || 'Erro desconhecido'));
  } finally {
    sendingInvites.value = false;
  }
};

const cancelInvite = async (inviteId: string) => {
  if (!confirm('Cancelar este convite?')) return;

  try {
    await projectsApi.cancelNightShiftInvite(route.params.id as string, inviteId);
    await loadNightShiftInvites();
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao cancelar: ' + (errMsg || error.message || 'Erro desconhecido'));
  }
};

// Task Functions
const loadTasks = async () => {
  loadingTasks.value = true;
  try {
    const [tasksResponse, statsResponse] = await Promise.all([
      projectsApi.getTasks(route.params.id as string),
      projectsApi.getTasksStats(route.params.id as string),
    ]);
    tasks.value = tasksResponse.data.data || [];
    taskStats.value = statsResponse.data.data || null;
    // Auto-group tasks that share the same dates
    await initializeBlocksFromTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
  } finally {
    loadingTasks.value = false;
  }
};

const openTaskModal = (task?: any) => {
  if (task) {
    editingTask.value = task;
    taskForm.value = {
      title: task.title || '',
      description: task.description || '',
      taskType: task.taskType || 'CUSTOM',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      endDate: task.endDate ? task.endDate.split('T')[0] : '',
      estimatedHours: task.estimatedHours,
      status: task.status || 'PENDING',
      color: task.color || '#c9a962',
    };
  } else {
    editingTask.value = null;
    taskForm.value = {
      title: '',
      description: '',
      taskType: 'CUSTOM',
      startDate: '',
      endDate: '',
      estimatedHours: null,
      status: 'PENDING',
      color: '#c9a962',
    };
  }
  showTaskModal.value = true;
};

const saveTask = async () => {
  if (!taskForm.value.title) {
    alert('Titulo e obrigatorio');
    return;
  }

  savingTask.value = true;
  try {
    const data: any = {
      title: taskForm.value.title,
      description: taskForm.value.description || undefined,
      taskType: taskForm.value.taskType,
      status: taskForm.value.status,
      color: taskForm.value.color,
    };

    if (taskForm.value.startDate) {
      data.startDate = taskForm.value.startDate;
    }
    if (taskForm.value.endDate) {
      data.endDate = taskForm.value.endDate;
    }
    if (taskForm.value.estimatedHours) {
      data.estimatedHours = taskForm.value.estimatedHours;
    }

    if (editingTask.value) {
      await projectsApi.updateTask(route.params.id as string, editingTask.value.id, data);
    } else {
      await projectsApi.createTask(route.params.id as string, data);
    }

    await loadTasks();
    showTaskModal.value = false;
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao salvar: ' + (errMsg || error.message || 'Erro desconhecido'));
  } finally {
    savingTask.value = false;
  }
};

const deleteTask = async (taskId: string) => {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

  try {
    await projectsApi.deleteTask(route.params.id as string, taskId);
    await loadTasks();
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao excluir: ' + (errMsg || error.message || 'Erro desconhecido'));
  }
};

const generateTasks = async () => {
  if (!confirm('Gerar tarefas automaticamente baseado nas metragens e prazo do projeto?')) return;

  generatingTasks.value = true;
  try {
    const response = await projectsApi.generateTasks(route.params.id as string);

    // Update local project values from response
    if (response.data.data) {
      const { scope, estimatedDays, deadlineDate, count } = response.data.data;
      if (project.value) {
        if (estimatedDays) {
          project.value.estimatedDays = estimatedDays;
          formData.value.estimatedDays = estimatedDays;
        }
        if (deadlineDate) {
          project.value.deadlineDate = deadlineDate;
          formData.value.deadlineDate = deadlineDate.split('T')[0];
        }
      }

      const scopeLabels: Record<string, string> = {
        'PISO': 'Piso',
        'PAREDE_TETO': 'Parede/Teto',
        'COMBINADO': 'Combinado'
      };
      alert(`${count} tarefas geradas para escopo "${scopeLabels[scope] || scope}"!`);
    } else {
      alert('Tarefas geradas com sucesso!');
    }

    await loadTasks();
  } catch (error: any) {
    const errData = error.response?.data?.error;
    const errMsg = typeof errData === 'object' ? errData?.message : errData;
    alert('Erro ao gerar tarefas: ' + (errMsg || error.message || 'Erro desconhecido'));
  } finally {
    generatingTasks.value = false;
  }
};

// Export Gantt as JPEG
const exportGanttAsImage = async () => {
  try {
    const ganttElement = document.querySelector('.gantt-traditional') as HTMLElement;
    if (!ganttElement) {
      alert('Gantt chart não encontrado');
      return;
    }

    // Capture the element
    const canvas = await html2canvas(ganttElement, {
      backgroundColor: '#0a0a0a',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });

    // Convert to JPEG and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const projectName = project.value?.title || 'cronograma';
        const fileName = `${projectName.replace(/\s+/g, '-').toLowerCase()}-gantt.jpg`;
        link.download = fileName;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.95);
  } catch (error) {
    console.error('Error exporting Gantt:', error);
    alert('Erro ao exportar cronograma');
  }
};

const updateTaskStatus = async (task: any, newStatus: string) => {
  try {
    await projectsApi.updateTask(route.params.id as string, task.id, { status: newStatus });
    await loadTasks();
  } catch (error: any) {
    console.error('Error updating task status:', error);
  }
};

const getGanttWidth = (task: any) => {
  if (!task.startDate || !task.endDate) return 100;
  const start = new Date(task.startDate).getTime();
  const end = new Date(task.endDate).getTime();
  const diff = (end - start) / (1000 * 60 * 60 * 24); // days
  return Math.max(50, Math.min(diff * 30, 400)); // 30px per day, min 50, max 400
};

const getGanttOffset = (task: any, allTasks: any[]) => {
  if (!task.startDate || allTasks.length === 0) return 0;
  const taskStart = new Date(task.startDate).getTime();

  // Find earliest start date
  let earliest = Infinity;
  for (const t of allTasks) {
    if (t.startDate) {
      const ts = new Date(t.startDate).getTime();
      if (ts < earliest) earliest = ts;
    }
  }

  if (earliest === Infinity) return 0;
  const diff = (taskStart - earliest) / (1000 * 60 * 60 * 24); // days
  return Math.max(0, diff * 30); // 30px per day
};

const getInviteStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'var(--accent-orange)';
    case 'ACCEPTED': return 'var(--accent-green)';
    case 'DECLINED': return 'var(--accent-red)';
    case 'EXPIRED': return 'var(--text-tertiary)';
    default: return 'var(--text-tertiary)';
  }
};

const getInviteStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Pendente';
    case 'ACCEPTED': return 'Aceito';
    case 'DECLINED': return 'Recusado';
    case 'EXPIRED': return 'Expirado';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'EM_EXECUCAO': return 'var(--accent-green)';
    case 'AGUARDANDO_INICIO': return 'var(--accent-blue)';
    case 'PAUSADO': return 'var(--accent-orange)';
    case 'CONCLUIDO': return 'var(--text-tertiary)';
    case 'CANCELADO': return 'var(--accent-red)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'EM_EXECUCAO': return 'Em Execucao';
    case 'AGUARDANDO_INICIO': return 'Aguardando';
    case 'PAUSADO': return 'Pausado';
    case 'CONCLUIDO': return 'Concluido';
    case 'CANCELADO': return 'Cancelado';
    default: return status;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'LIDER': return 'Lider';
    case 'APLICADOR_III': return 'Aplicador III';
    case 'APLICADOR_II': return 'Aplicador II';
    case 'APLICADOR_I': return 'Aplicador I';
    case 'LIDER_PREPARACAO': return 'Lider da Preparacao';
    case 'PREPARADOR': return 'Preparador';
    case 'AUXILIAR': return 'Auxiliar';
    default: return role;
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'https://devoted-wholeness-production.up.railway.app';

const getPhotoUrl = (photoUrl: string | null | undefined): string | undefined => {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_URL}${photoUrl}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatHours = (hours: number) => {
  return hours?.toFixed(1) || '0';
};

const progressPercent = computed(() => {
  if (!project.value?.estimatedHours || project.value.estimatedHours === 0) return 0;
  return Math.min(100, (project.value.workedHours / project.value.estimatedHours) * 100);
});

// Calculate days in progress (unique days with check-ins)
const daysInProgress = computed(() => {
  if (!checkins.value || checkins.value.length === 0) return 0;
  // Get unique dates from check-ins
  const uniqueDates = new Set(
    checkins.value.map((c: any) => {
      const date = new Date(c.checkInAt);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );
  return uniqueDates.size;
});

// Calculate remaining days to deadline
const daysToDeadline = computed(() => {
  if (!project.value?.deadlineDate) return null;
  const deadline = new Date(project.value.deadlineDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Filter available applicators by search query
const filteredApplicators = computed(() => {
  if (!teamSearchQuery.value.trim()) {
    return availableApplicators.value;
  }
  const query = teamSearchQuery.value.toLowerCase().trim();
  return availableApplicators.value.filter((app: any) =>
    app.name?.toLowerCase().includes(query) ||
    app.username?.toLowerCase().includes(query) ||
    app.email?.toLowerCase().includes(query)
  );
});

// Load data when tab changes
const changeTab = async (tab: string) => {
  activeTab.value = tab;
  if (tab === 'team' && team.value.length === 0) {
    await loadTeam();
  } else if (tab === 'checkins' && checkins.value.length === 0) {
    await loadCheckins();
  } else if (tab === 'reports' && reports.value.length === 0) {
    await loadReports();
  } else if (tab === 'nightshift' && nightShiftInvites.value.length === 0 && project.value?.isNightShift) {
    await loadNightShiftInvites();
  } else if (tab === 'schedule') {
    await loadTasks();
    // Tasks now only generated manually via "Gerar Etapas" button
    // User requested: keep initial setup saved, don't regenerate automatically
  }
};

// Watch for teamSize changes and auto-update all tasks
watch(() => project.value?.teamSize, async (newTeamSize, oldTeamSize) => {
  console.log(`[WATCHER] teamSize changed: ${oldTeamSize} → ${newTeamSize}`, {
    hasNewValue: !!newTeamSize,
    valuesAreDifferent: newTeamSize !== oldTeamSize,
    tasksCount: tasks.value.length,
    activeTab: activeTab.value
  });

  // Only run if value actually changed and is not the initial load (oldTeamSize is not undefined)
  if (newTeamSize && oldTeamSize !== undefined && newTeamSize !== oldTeamSize) {
    console.log(`[WATCHER] Conditions met, updating tasks...`);

    // Load tasks first if not loaded yet
    if (tasks.value.length === 0) {
      console.log('[WATCHER] Loading tasks first...');
      await loadTasks();
    }

    // If still no tasks, nothing to update
    if (tasks.value.length === 0) {
      console.log('[WATCHER] No tasks to update');
      return;
    }

    try {
      // Update all tasks that consume resources
      const tasksToUpdate = tasks.value.filter((task: any) => task.consumesResources !== false);
      console.log(`[WATCHER] Updating ${tasksToUpdate.length} tasks with teamSize=${newTeamSize}`);

      const updates = tasksToUpdate.map(async (task: any) => {
        const inputDays = task.inputDays || 1;
        const hours = inputDays * newTeamSize * 7; // 7h effective per person per day

        console.log(`[WATCHER] Task "${task.title}": ${task.inputPeople} → ${newTeamSize} people, ${task.estimatedHours}h → ${hours}h`);

        return projectsApi.updateTask(route.params.id as string, task.id, {
          inputPeople: newTeamSize,
          estimatedHours: hours,
        });
      });

      await Promise.all(updates);
      await loadTasks();
      console.log(`[WATCHER] ✓ ${updates.length} tarefa(s) atualizada(s) com teamSize=${newTeamSize}`);
    } catch (error) {
      console.error('[WATCHER] Error auto-updating tasks with teamSize:', error);
    }
  }
});

onMounted(async () => {
  await loadProject();
  // Auto-load night shift invites if project is night shift
  if (project.value?.isNightShift) {
    await loadNightShiftInvites();
  }
});
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <span class="logo-badge">ADMIN</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </router-link>
        <router-link to="/applicators" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Aplicadores
        </router-link>
        <router-link to="/projects" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Projetos
        </router-link>
        <router-link to="/contributions" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Solicitacoes
        </router-link>
        <router-link to="/campaigns" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Campanhas
        </router-link>
        <router-link to="/map" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Mapa
        </router-link>
      </nav>
      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">
            {{ authStore.user?.name?.charAt(0) || 'A' }}
          </div>
          <span class="user-name">{{ authStore.user?.name }}</span>
        </div>
        <button @click="logout" class="logout-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </header>

    <main class="main">
      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando projeto...</span>
      </div>

      <!-- Project Content -->
      <template v-else-if="project">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <router-link to="/projects" class="breadcrumb-link">Projetos</router-link>
          <svg class="breadcrumb-separator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span class="breadcrumb-current">{{ project.title }}</span>
        </div>

        <!-- Project Header -->
        <div class="project-header">
          <div class="project-info">
            <h1>{{ project.title }}</h1>
            <div class="project-meta">
              <span
                class="status-badge"
                :style="{
                  background: getStatusColor(project.status) + '20',
                  color: getStatusColor(project.status),
                  borderColor: getStatusColor(project.status) + '40'
                }"
              >
                {{ getStatusLabel(project.status) }}
              </span>
              <span v-if="project.isNightShift" class="night-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Noturno
              </span>
              <span v-if="project.isTravelMode" class="travel-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                </svg>
                Viagem +20%
              </span>
              <span v-if="project.cliente" class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {{ project.cliente }}
              </span>
            </div>
          </div>
          <div class="project-actions">
            <button v-if="!editMode" @click="openEntryRequestModal" class="btn btn-entry">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              Solicitar Liberacao
            </button>
            <button v-if="!editMode" @click="editMode = true" class="btn btn-primary">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <template v-else>
              <button @click="cancelEdit" class="btn btn-secondary">Cancelar</button>
              <button @click="saveProject" class="btn btn-primary" :disabled="saving">
                <div v-if="saving" class="btn-spinner"></div>
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </template>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'info' }"
            @click="changeTab('info')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Informacoes
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'team' }"
            @click="changeTab('team')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Equipe ({{ team.length }})
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'checkins' }"
            @click="changeTab('checkins')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Check-ins
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'reports' }"
            @click="changeTab('reports')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Relatorios
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'schedule' }"
            @click="changeTab('schedule')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Programacao
          </button>
          <button
            v-if="project.isNightShift"
            class="tab tab-nightshift"
            :class="{ active: activeTab === 'nightshift' }"
            @click="changeTab('nightshift')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Turno Noturno
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Info Tab -->
          <div v-if="activeTab === 'info'" class="info-tab">
            <div class="info-grid">
              <!-- Basic Data Card -->
              <div class="info-card">
                <h3>Dados Basicos</h3>
                <div class="info-fields">
                  <div class="field">
                    <label>Titulo</label>
                    <input
                      v-if="editMode"
                      v-model="formData.title"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.title }}</span>
                  </div>
                  <div class="field">
                    <label>Cliente</label>
                    <input
                      v-if="editMode"
                      v-model="formData.cliente"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.cliente || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Endereco</label>
                    <input
                      v-if="editMode"
                      v-model="formData.endereco"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.endereco || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Status</label>
                    <select
                      v-if="editMode"
                      v-model="formData.status"
                      class="input"
                    >
                      <option value="EM_EXECUCAO">Em Execucao</option>
                      <option value="PAUSADO">Pausado</option>
                      <option value="CONCLUIDO">Concluido</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                    <span v-else class="field-value">{{ getStatusLabel(project.status) }}</span>
                  </div>
                  <div class="field">
                    <label>Telefones do Responsavel</label>
                    <div v-if="editMode" class="phones-edit">
                      <div class="phones-list" v-if="formData.responsiblePhones.length > 0">
                        <div v-for="phone in formData.responsiblePhones" :key="phone" class="phone-tag">
                          <span>{{ formatPhoneDisplay(phone) }}</span>
                          <button type="button" @click="removeResponsiblePhone(phone)" class="phone-remove">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div class="phone-add">
                        <input
                          v-model="newResponsiblePhone"
                          type="tel"
                          class="input"
                          placeholder="Ex: 5541988888888"
                          @keyup.enter="addResponsiblePhone"
                        />
                        <button type="button" @click="addResponsiblePhone" class="btn btn-secondary btn-sm">
                          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Adicionar
                        </button>
                      </div>
                    </div>
                    <div v-else class="phones-display">
                      <div v-if="project.responsiblePhones?.length > 0" class="phones-clickable">
                        <a
                          v-for="phone in project.responsiblePhones"
                          :key="phone"
                          :href="'https://wa.me/' + phone"
                          target="_blank"
                          class="phone-whatsapp-link"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          {{ formatPhoneDisplay(phone) }}
                        </a>
                      </div>
                      <span v-else class="field-value">-</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Measurements Card -->
              <div class="info-card">
                <h3>Metragens</h3>
                <div v-if="editMode" class="info-fields measurements-edit">
                  <div class="field">
                    <label>m² Total (Calculado)</label>
                    <input
                      :value="calculatedM2Total"
                      type="number"
                      class="input calculated-field"
                      readonly
                      disabled
                    />
                  </div>
                  <div class="field">
                    <label>m² Piso</label>
                    <input
                      v-model.number="formData.m2Piso"
                      type="number"
                      step="0.01"
                      min="0"
                      class="input"
                      placeholder="0"
                    />
                  </div>
                  <div class="field">
                    <label>m² Parede</label>
                    <input
                      v-model.number="formData.m2Parede"
                      type="number"
                      step="0.01"
                      min="0"
                      class="input"
                      placeholder="0"
                    />
                  </div>
                  <div class="field">
                    <label>m² Teto</label>
                    <input
                      v-model.number="formData.m2Teto"
                      type="number"
                      step="0.01"
                      min="0"
                      class="input"
                      placeholder="0"
                    />
                  </div>
                  <div class="field">
                    <label>m Rodape</label>
                    <input
                      v-model.number="formData.mRodape"
                      type="number"
                      step="0.01"
                      min="0"
                      class="input"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div v-else class="measurements-grid">
                  <div class="measurement">
                    <div class="measurement-icon m2-piso">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.m2Piso?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Piso</span>
                    </div>
                  </div>
                  <div class="measurement">
                    <div class="measurement-icon m2-parede">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.m2Parede?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Parede</span>
                    </div>
                  </div>
                  <div class="measurement">
                    <div class="measurement-icon m2-teto">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.m2Teto?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Teto</span>
                    </div>
                  </div>
                  <div class="measurement">
                    <div class="measurement-icon m-rodape">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.mRodape?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m Rodape</span>
                    </div>
                  </div>
                  <!-- M² Total - Full Width -->
                  <div class="measurement measurement-total">
                    <div class="measurement-icon m2-total">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ projectM2Total?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Total (Σ)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Schedule Card (Cronograma) -->
              <div class="info-card schedule-card">
                <h3>Cronograma</h3>
                <div class="schedule-grid">
                  <!-- Horario de Entrada -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Entrada</label>
                    </div>
                    <select
                      v-model="formData.workStartTime"
                      class="time-dropdown"
                      @change="saveFieldInline('workStartTime', $event)"
                    >
                      <option v-for="time in workHoursOptions" :key="time" :value="time">{{ time }}</option>
                    </select>
                  </div>

                  <!-- Horario de Saida -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Saida</label>
                    </div>
                    <select
                      v-model="formData.workEndTime"
                      class="time-dropdown"
                      @change="saveFieldInline('workEndTime', $event)"
                    >
                      <option v-for="time in workHoursOptions" :key="time" :value="time">{{ time }}</option>
                    </select>
                  </div>

                  <!-- Prazo (Deadline) -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Prazo</label>
                    </div>
                    <div class="schedule-value-row">
                      <input
                        v-model="formData.deadlineDate"
                        type="date"
                        class="date-input-inline"
                        @change="saveFieldInline('deadlineDate', $event)"
                      />
                      <span v-if="daysToDeadline !== null" :class="['deadline-badge', daysToDeadline < 0 ? 'overdue' : daysToDeadline <= 3 ? 'warning' : 'ok']">
                        {{ daysToDeadline < 0 ? Math.abs(daysToDeadline) + 'd atraso' : daysToDeadline === 0 ? 'Hoje' : daysToDeadline + 'd' }}
                      </span>
                    </div>
                  </div>

                  <!-- Dias Estimados -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Dias Estimados</label>
                    </div>
                    <div class="schedule-value-row">
                      <input
                        v-model.number="formData.estimatedDays"
                        type="number"
                        min="1"
                        class="number-input-inline"
                        placeholder="-"
                        @change="saveFieldInline('estimatedDays', $event)"
                      />
                      <span class="input-suffix">dias</span>
                    </div>
                  </div>

                  <!-- Dias em Andamento (calculado) -->
                  <div class="schedule-field readonly">
                    <div class="schedule-field-header">
                      <label>Dias em Andamento</label>
                    </div>
                    <span class="schedule-value highlight">{{ daysInProgress }} dias</span>
                  </div>

                  <!-- Pessoas na Equipe -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Pessoas na Equipe</label>
                      <span class="field-hint">Define capacidade diária</span>
                    </div>
                    <div class="schedule-value-row">
                      <input
                        v-model.number="formData.teamSize"
                        type="number"
                        min="1"
                        max="50"
                        class="number-input-inline"
                        placeholder="4"
                        @change="saveFieldInline('teamSize', $event)"
                      />
                      <span class="input-suffix">pessoa(s)</span>
                    </div>
                  </div>

                  <!-- Sabado e Domingo -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Trabalho no Fim de Semana</label>
                    </div>
                    <div class="weekend-toggles">
                      <div class="weekend-toggle-item">
                        <span class="weekend-label">Sabado</span>
                        <button
                          type="button"
                          class="toggle-btn-compact"
                          :class="{ active: formData.allowSaturday }"
                          @click="toggleAndSave('allowSaturday', $event)"
                        >
                          {{ formData.allowSaturday ? 'Sim' : 'Nao' }}
                        </button>
                      </div>
                      <div class="weekend-toggle-item">
                        <span class="weekend-label">Domingo</span>
                        <button
                          type="button"
                          class="toggle-btn-compact"
                          :class="{ active: formData.allowSunday }"
                          @click="toggleAndSave('allowSunday', $event)"
                        >
                          {{ formData.allowSunday ? 'Sim' : 'Nao' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Noturno -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Noturno</label>
                    </div>
                    <button
                      type="button"
                      class="toggle-btn"
                      :class="{ active: formData.allowNightWork }"
                      @click="toggleAndSave('allowNightWork', $event)"
                    >
                      {{ formData.allowNightWork ? 'Sim' : 'Nao' }}
                    </button>
                  </div>

                  <!-- Modo Viagem (+20%, +40% se extra) -->
                  <div class="schedule-field">
                    <div class="schedule-field-header">
                      <label>Modo Viagem (+20%)</label>
                    </div>
                    <button
                      type="button"
                      class="toggle-btn travel-toggle"
                      :class="{ active: formData.isTravelMode }"
                      @click="toggleAndSave('isTravelMode', $event)"
                    >
                      {{ formData.isTravelMode ? 'Sim' : 'Nao' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Hours Card -->
              <div class="info-card">
                <h3>Horas</h3>
                <div class="hours-content">
                  <div class="hours-progress">
                    <div class="hours-bar">
                      <div
                        class="hours-bar-fill"
                        :style="{ width: progressPercent + '%' }"
                      ></div>
                    </div>
                    <div class="hours-numbers">
                      <span class="hours-worked">{{ formatHours(project.workedHours) }}h trabalhadas</span>
                      <span class="hours-estimated">
                        de {{ formData.estimatedHours || project.estimatedHours || '?' }}h estimadas
                      </span>
                    </div>
                  </div>
                  <div class="field" v-if="editMode">
                    <label>Horas Estimadas</label>
                    <input
                      v-model.number="formData.estimatedHours"
                      type="number"
                      step="0.5"
                      min="0"
                      class="input"
                      placeholder="Ex: 40"
                    />
                  </div>
                  <div class="progress-percent">
                    {{ progressPercent.toFixed(0) }}% concluido
                  </div>
                </div>
              </div>

              <!-- Other Info Card -->
              <div class="info-card">
                <h3>Outros</h3>
                <div class="info-fields">
                  <div class="field">
                    <label>Consultor</label>
                    <input
                      v-if="editMode"
                      v-model="formData.consultor"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.consultor || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Material</label>
                    <input
                      v-if="editMode"
                      v-model="formData.material"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.material || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Cor</label>
                    <input
                      v-if="editMode"
                      v-model="formData.cor"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.cor || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Team Tab -->
          <div v-if="activeTab === 'team'" class="team-tab">
            <div class="team-header">
              <h3>Equipe do Projeto</h3>
              <div class="team-actions">
                <button @click="openEntryRequestModal" class="btn btn-entry">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                  </svg>
                  Solicitar Liberacao na Portaria
                </button>
                <button @click="openTeamModal" class="btn btn-primary">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Gerenciar Equipe
                </button>
              </div>
            </div>

            <div v-if="loadingTeam" class="loading-inline">
              <div class="loading-spinner-small"></div>
              <span>Carregando equipe...</span>
            </div>

            <div v-else-if="team.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>Nenhum membro na equipe</p>
              <span>Adicione aplicadores ao projeto</span>
            </div>

            <div v-else class="team-table">
              <table>
                <thead>
                  <tr>
                    <th>Aplicador</th>
                    <th>Cargo</th>
                    <th>Horas</th>
                    <th>Desde</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in team" :key="member.id">
                    <td>
                      <div class="member-info">
                        <div class="member-avatar">
                          {{ member.name?.charAt(0) || '?' }}
                        </div>
                        <div class="member-details">
                          <span class="member-name">{{ member.name }}</span>
                          <span class="member-username">@{{ member.username }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="role-badge" :class="member.projectRole?.toLowerCase()">
                        {{ getRoleLabel(member.projectRole) }}
                      </span>
                    </td>
                    <td>{{ formatHours(member.hoursOnProject) }}h</td>
                    <td>{{ formatDate(member.assignedAt) }}</td>
                    <td>
                      <button
                        class="remove-btn"
                        @click="removeTeamMember(member.id)"
                        :disabled="removingMember === member.id"
                        title="Remover da equipe"
                      >
                        <div v-if="removingMember === member.id" class="btn-spinner-small"></div>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Check-ins Tab -->
          <div v-if="activeTab === 'checkins'" class="checkins-tab">
            <h3>Historico de Check-ins</h3>

            <div v-if="loadingCheckins" class="loading-inline">
              <div class="loading-spinner-small"></div>
              <span>Carregando check-ins...</span>
            </div>

            <div v-else-if="checkins.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p>Nenhum check-in registrado</p>
            </div>

            <div v-else class="checkins-list">
              <div v-for="checkin in checkins" :key="checkin.id" class="checkin-card">
                <div class="checkin-user">
                  <div class="user-avatar-small">
                    {{ checkin.user?.name?.charAt(0) || '?' }}
                  </div>
                  <span class="user-name">{{ checkin.user?.name }}</span>
                </div>
                <div class="checkin-times">
                  <div class="checkin-time">
                    <span class="time-label">Entrada:</span>
                    <span class="time-value">{{ formatDate(checkin.checkinAt) }}</span>
                  </div>
                  <div v-if="checkin.checkoutAt" class="checkin-time">
                    <span class="time-label">Saida:</span>
                    <span class="time-value">{{ formatDate(checkin.checkoutAt) }}</span>
                  </div>
                  <div v-else class="checkin-active">
                    <span class="active-badge">Em andamento</span>
                  </div>
                </div>
                <div v-if="checkin.hoursWorked" class="checkin-hours">
                  {{ formatHours(checkin.hoursWorked) }}h
                </div>
              </div>
            </div>
          </div>

          <!-- Reports Tab -->
          <div v-if="activeTab === 'reports'" class="reports-tab">
            <h3>Relatorios do Projeto</h3>

            <div v-if="loadingReports" class="loading-inline">
              <div class="loading-spinner-small"></div>
              <span>Carregando relatorios...</span>
            </div>

            <div v-else-if="reports.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>Nenhum relatorio registrado</p>
            </div>

            <div v-else class="reports-list">
              <div v-for="report in reports" :key="report.id" class="report-card">
                <div class="report-header">
                  <div class="report-user">
                    <div class="user-avatar-small">
                      {{ report.user?.name?.charAt(0) || '?' }}
                    </div>
                    <span>{{ report.user?.name }}</span>
                  </div>
                  <span class="report-date">{{ formatDate(report.reportDate) }}</span>
                </div>
                <div v-if="report.aiSummary" class="report-summary">
                  {{ report.aiSummary }}
                </div>
                <div v-if="report.photos?.length" class="report-photos">
                  <span>{{ report.photos.length }} foto(s)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Schedule Tab (Programacao / Gantt) -->
          <div v-if="activeTab === 'schedule'" class="schedule-tab">
            <div class="schedule-header">
              <div class="schedule-header-left">
                <h3>Programacao de Tarefas</h3>
                <span v-if="hasMeasurements" class="scope-badge-compact" :class="'scope-' + projectScope.toLowerCase()">
                  {{ scopeLabels[projectScope] }}
                </span>
                <div class="gantt-summary-compact">
                  <span class="summary-compact-item">{{ totalGanttBlocks }} etapas</span>
                  <span class="summary-compact-separator">•</span>
                  <span class="summary-compact-item">{{ totalGanttDays }} dias</span>
                  <span class="summary-compact-separator">•</span>
                  <span class="summary-compact-item">{{ totalGanttHours }}h</span>
                </div>
              </div>
              <div class="schedule-actions">
                <button @click="generateTasks" class="btn btn-primary" :disabled="generatingTasks || !hasMeasurements">
                  <div v-if="generatingTasks" class="btn-spinner-small"></div>
                  <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  {{ generatingTasks ? 'Gerando...' : 'Gerar Etapas' }}
                </button>
                <button
                  v-if="tasks.length > 0"
                  @click="distributeTeamSize"
                  class="btn btn-secondary"
                  :disabled="!project?.teamSize"
                  title="Distribuir pessoas da equipe para todas as tarefas"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Distribuir Equipe
                </button>
                <button
                  v-if="tasks.length > 0"
                  @click="sendToAppAgenda"
                  :disabled="publishingTasks"
                  class="btn btn-accent"
                  title="Enviar cronograma para agenda dos aplicadores no app"
                >
                  <template v-if="publishingTasks">
                    <div class="loading-spinner-small"></div>
                    Publicando...
                  </template>
                  <template v-else>
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                    </svg>
                    Enviar para Agenda
                  </template>
                </button>
                <button
                  v-if="tasks.length > 0"
                  @click="exportGanttAsImage"
                  class="btn btn-secondary"
                  title="Exportar cronograma como imagem JPEG"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Exportar JPEG
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loadingTasks" class="loading-inline">
              <div class="loading-spinner-small"></div>
              <span>Carregando tarefas...</span>
            </div>

            <!-- Gantt Chart Wrapper with Today Label -->
            <div class="gantt-wrapper">
              <!-- Today Label - Outside the table -->
              <div
                v-if="todayIndicator.isVisible"
                class="today-label-floating"
                :style="{ left: `calc(${todayIndicator.position}px + var(--gantt-left-offset) + 1px)` }"
              >
                <span class="today-text">dia atual</span>
                <svg class="today-arrow" viewBox="0 0 12 8" fill="currentColor">
                  <path d="M6 8 L0 2 L2 0 L6 4 L10 0 L12 2 Z"/>
                </svg>
              </div>

              <!-- Traditional Gantt Chart -->
              <div class="gantt-traditional">
                <!-- Today Indicator Line -->
                <div
                  v-if="todayIndicator.isVisible"
                  class="gantt-today-indicator"
                  :style="{ left: `calc(${todayIndicator.position}px + var(--gantt-left-offset))` }"
                ></div>

                <!-- Timeline Header -->
              <div class="gantt-header">
                <div class="gantt-drag-column">#</div>
                <div class="gantt-task-column">ETAPA</div>
                <div class="gantt-input-column">DIAS</div>
                <div class="gantt-input-column">PESSOAS</div>
                <div class="gantt-calc-column">HORAS</div>
                <div class="gantt-timeline-header">
                  <div
                    v-for="(day, index) in ganttDaysArray"
                    :key="index"
                    class="gantt-day-cell"
                    :class="{
                      'gantt-day-weekend': day.isSaturday || day.isSunday,
                      'gantt-day-blocked': !day.isWorkDay && (day.isSaturday || day.isSunday)
                    }"
                  >
                    <span class="day-num">{{ day.dayNum }}</span>
                    <span class="day-label">{{ day.label }}</span>
                  </div>
                </div>
                <div class="gantt-add-column">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <div class="gantt-group-column">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                </div>
                <div class="gantt-action-column"></div>
              </div>

              <!-- Task Rows -->
              <div class="gantt-body">
                <!-- Empty state when no tasks -->
                <div v-if="tasks.length === 0" class="gantt-empty-state">
                  <p v-if="!hasMeasurements">
                    Adicione metragens (m² Piso, Parede ou Teto) para gerar etapas automaticamente.
                  </p>
                  <p v-else-if="!project?.deadlineDate && !project?.estimatedDays">
                    Defina um prazo para gerar as etapas automaticamente.
                  </p>
                  <p v-else>
                    Clique em "Gerar Etapas" para criar o cronograma baseado no escopo: <strong>{{ scopeLabels[projectScope] }}</strong>
                  </p>
                </div>

                <template v-for="(task, index) in tasks" :key="task.id">
                  <!-- Only render row if it's standalone or first in a group -->
                  <div
                    v-if="shouldRenderRow(index)"
                    class="gantt-row-inline"
                    :class="{ 'gantt-row-grouped-block': isGroupedRow(index) }"
                    :style="{ minHeight: (isGroupedRow(index) ? getGroupFromStart(index).length * 44 : 44) + 'px' }"
                  >
                    <!-- Order - Número do bloco centralizado -->
                    <div class="gantt-order-cell">
                      <span class="task-order">{{ getBlockNumber(index) }}.</span>
                    </div>

                    <!-- Task Names - Lista vertical para grupos -->
                    <div class="gantt-task-cell" :class="{ 'gantt-task-cell-grouped': isGroupedRow(index) }">
                      <div v-if="!isGroupedRow(index)" class="task-row-single">
                        <div class="task-color-dot" :style="{ backgroundColor: task.color || '#c9a962' }"></div>
                        <input
                          v-model="task.title"
                          type="text"
                          class="task-title-input"
                          @blur="updateTaskField(task.id, 'title', task.title)"
                        />
                        <span v-if="!task.consumesResources" class="no-resource-badge" title="Não consome recursos da equipe">⏳</span>
                      </div>
                      <div v-else class="grouped-tasks-list">
                        <div v-for="(gt, idx) in getGroupFromStart(index)" :key="gt.id" class="grouped-task-item">
                          <div class="task-color-dot" :style="{ backgroundColor: gt.color || '#c9a962' }"></div>
                          <input
                            v-model="gt.title"
                            type="text"
                            class="task-title-input"
                            @blur="updateTaskField(gt.id, 'title', gt.title)"
                          />
                          <span v-if="!gt.consumesResources" class="no-resource-badge" title="Não consome recursos da equipe">⏳</span>
                        </div>
                      </div>
                    </div>

                    <!-- Days Select - Único para todo o grupo -->
                    <div class="gantt-input-cell">
                      <select
                        :value="task.inputDays || 1"
                        @change="(e) => { task.inputDays = Number((e.target as HTMLSelectElement).value); onInputChange(task); }"
                        class="gantt-select-input"
                      >
                        <option v-for="d in 10" :key="d" :value="d">{{ d }}d</option>
                      </select>
                    </div>

                    <!-- People Select - Único para todo o grupo -->
                    <div class="gantt-input-cell">
                      <select
                        :value="task.inputPeople || 0"
                        @change="(e) => { task.inputPeople = Number((e.target as HTMLSelectElement).value); onInputChange(task); }"
                        class="gantt-select-input"
                        :class="{ 'input-disabled': !task.consumesResources }"
                        :disabled="!task.consumesResources"
                      >
                        <option v-for="p in 11" :key="p-1" :value="p-1">{{ p-1 }}p</option>
                      </select>
                    </div>

                    <!-- Calculated Hours - Total para grupos -->
                    <div class="gantt-calc-cell">
                      <span class="calc-hours" :class="{ 'calc-hours-total': isGroupedRow(index) }">
                        {{ isGroupedRow(index) ? getTotalGroupHours(index) : calculateTaskHours(task) }}h
                      </span>
                    </div>

                    <!-- Timeline Bar - Centralizada -->
                    <div class="gantt-timeline-cell">
                      <div class="timeline-track">
                        <div
                          class="timeline-bar"
                          :class="{ 'timeline-bar-grouped': isGroupedRow(index) }"
                          :style="{
                            backgroundColor: task.color || '#c9a962',
                            left: getTaskLeft(task) + 'px',
                            width: Math.max(getTaskWidth(task) - 4, 30) + 'px',
                            opacity: task.status === 'COMPLETED' ? 0.6 : 1,
                          }"
                        >
                          <div class="bar-content">
                            <span class="bar-label">
                              {{ isGroupedRow(index) ? getTotalGroupDuration(index) + 'd' : getTaskDuration(task) + 'd' }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Add Task Button Column -->
                    <div class="gantt-add-cell" :class="{ 'gantt-add-cell-grouped': isGroupedRow(index) }">
                      <button
                        v-if="!isGroupedRow(index)"
                        type="button"
                        class="gantt-action-btn has-tooltip"
                        data-tooltip="Adicionar tarefa"
                        @click="toggleAddTaskDropdown(task.id)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </button>

                      <!-- Dropdown para tarefa individual -->
                      <div
                        v-if="showAddTaskDropdown === task.id && !isGroupedRow(index)"
                        class="add-task-dropdown"
                        @click.stop
                      >
                        <div class="dropdown-header">Adicionar abaixo:</div>
                        <div class="dropdown-templates">
                          <button
                            v-for="template in taskTemplates"
                            :key="template.id"
                            class="template-item-btn"
                            @click="insertTaskAt('below', task.id, template)"
                          >
                            <div
                              class="template-color-dot"
                              :style="{ backgroundColor: template.color }"
                            ></div>
                            <span class="template-title">{{ template.title }}</span>
                          </button>
                        </div>
                      </div>

                      <!-- Botões para blocos agrupados -->
                      <div
                        v-for="gt in (isGroupedRow(index) ? getGroupFromStart(index) : [])"
                        :key="'add-wrapper-' + gt.id"
                        class="add-dropdown-wrapper"
                      >
                        <button
                          type="button"
                          class="gantt-action-btn gantt-action-btn-small has-tooltip"
                          data-tooltip="Adicionar tarefa"
                          @click="toggleAddTaskDropdown(gt.id)"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                        </button>

                        <!-- Dropdown para cada tarefa do grupo -->
                        <div
                          v-if="showAddTaskDropdown === gt.id"
                          class="add-task-dropdown"
                          @click.stop
                        >
                          <div class="dropdown-header">Adicionar abaixo:</div>
                          <div class="dropdown-templates">
                            <button
                              v-for="template in taskTemplates"
                              :key="template.id"
                              class="template-item-btn"
                              @click="insertTaskAt('below', gt.id, template)"
                            >
                              <div
                                class="template-color-dot"
                                :style="{ backgroundColor: template.color }"
                              ></div>
                              <span class="template-title">{{ template.title }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Group Button -->
                    <div class="gantt-group-cell">
                      <button
                        v-if="!isGroupedRow(index)"
                        type="button"
                        class="gantt-action-btn has-tooltip"
                        :class="{ 'active': task.groupWithNext }"
                        :data-tooltip="task.groupWithNext ? 'Etapa agrupada com a próxima' : 'Agrupar no mesmo dia com próxima tarefa'"
                        @click="toggleGroupWithNext(task)"
                      >
                        <svg v-if="task.groupWithNext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                      </button>
                      <div v-else class="grouped-actions-list">
                        <template v-for="(gt, idx) in getGroupFromStart(index)" :key="'group-' + gt.id">
                          <button
                            v-if="idx < getGroupFromStart(index).length - 1"
                            type="button"
                            class="gantt-action-btn gantt-action-btn-small has-tooltip"
                            :class="{ 'active': gt.groupWithNext }"
                            data-tooltip="Desagrupar esta etapa"
                            @click="toggleGroupWithNext(gt)"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                          </button>
                          <!-- Add group button for last task in group -->
                          <button
                            v-if="idx === getGroupFromStart(index).length - 1 && index + getGroupFromStart(index).length < tasks.length"
                            type="button"
                            class="gantt-action-btn gantt-action-btn-small has-tooltip group-toggle-add"
                            :class="{ 'active': gt.groupWithNext }"
                            :data-tooltip="gt.groupWithNext ? 'Bloco agrupado com próximo' : 'Agrupar bloco com próxima tarefa'"
                            @click="toggleGroupWithNext(gt)"
                          >
                            <svg v-if="gt.groupWithNext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                            </svg>
                          </button>
                        </template>
                      </div>
                    </div>

                    <!-- Delete button -->
                    <div class="gantt-action-cell" :class="{ 'gantt-action-cell-grouped': isGroupedRow(index) }">
                      <button
                        v-if="!isGroupedRow(index)"
                        class="gantt-action-btn has-tooltip"
                        @click.stop="deleteBlock(task.id)"
                        data-tooltip="Remover etapa"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                      <div v-else class="grouped-delete-list">
                        <button
                          v-for="gt in getGroupFromStart(index)"
                          :key="'delete-' + gt.id"
                          class="gantt-action-btn gantt-action-btn-small has-tooltip"
                          @click.stop="deleteBlock(gt.id)"
                          data-tooltip="Remover etapa"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              </div>
              <!-- End of Gantt traditional -->
            </div>
            <!-- End of Gantt Wrapper -->

            <!-- Block Editor Panel -->
            <div v-if="showBlockEditor && selectedBlock" class="block-editor-panel">
              <div class="editor-header">
                <h4>Editar Etapa</h4>
                <button class="close-btn" @click="showBlockEditor = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div class="editor-content">
                <!-- Etapa Dropdown -->
                <div class="editor-field">
                  <label>Tipo de Etapa</label>
                  <select
                    v-model="selectedBlock.taskType"
                    class="editor-select"
                    @change="onTaskTypeChange"
                  >
                    <option
                      v-for="type in availableTaskTypes"
                      :key="type.value"
                      :value="type.value"
                    >
                      {{ type.label }}
                    </option>
                  </select>
                </div>

                <!-- Dias Dropdown -->
                <div class="editor-field">
                  <label>Dias de Trabalho</label>
                  <select v-model.number="selectedBlock.days" class="editor-select">
                    <option
                      v-for="day in availableDays"
                      :key="day"
                      :value="day"
                    >
                      {{ day }} {{ day === 1 ? 'dia' : 'dias' }}
                    </option>
                  </select>
                </div>

                <!-- Preview -->
                <div class="editor-preview">
                  <div class="preview-label">Preview:</div>
                  <div class="preview-row">
                    <div class="preview-color" :style="{ backgroundColor: selectedBlock.color }"></div>
                    <span class="preview-name">{{ selectedBlock.label }}</span>
                    <span class="preview-days">{{ selectedBlock.days }}d = {{ selectedBlock.days * 8 }}h</span>
                  </div>
                  <div
                    v-if="selectedBlock.days > 0"
                    class="preview-bar"
                    :style="{
                      backgroundColor: selectedBlock.color,
                      width: Math.min(selectedBlock.days * 40, 300) + 'px'
                    }"
                  ></div>
                </div>
                <!-- Action Buttons -->
                <div class="editor-actions">
                  <button class="btn btn-danger" @click="deleteBlock(selectedBlock.id)">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                    </svg>
                    Eliminar
                  </button>
                  <div class="editor-actions-right">
                    <button class="btn btn-secondary" @click="showBlockEditor = false">
                      Cancelar
                    </button>
                    <button class="btn btn-primary" @click="saveBlockChanges">
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Night Shift Tab -->
          <div v-if="activeTab === 'nightshift'" class="nightshift-tab">
            <!-- Night Shift Config -->
            <div class="nightshift-config">
              <h3>Configuracao do Turno Noturno</h3>
              <div class="config-grid">
                <div class="field">
                  <label>Vagas</label>
                  <input
                    v-model.number="nightShiftConfig.slots"
                    type="number"
                    min="1"
                    class="input"
                  />
                </div>
                <div class="field">
                  <label>Data Inicio</label>
                  <input
                    v-model="nightShiftConfig.startDate"
                    type="date"
                    class="input"
                  />
                </div>
                <div class="field">
                  <label>Data Fim</label>
                  <input
                    v-model="nightShiftConfig.endDate"
                    type="date"
                    class="input"
                  />
                </div>
                <div class="config-action">
                  <button @click="saveNightShiftConfig" class="btn btn-primary">
                    Salvar Configuracao
                  </button>
                </div>
              </div>
            </div>

            <!-- Status Summary -->
            <div class="invite-summary">
              <div class="summary-card">
                <span class="summary-value summary-accepted">{{ inviteCounts.accepted }}</span>
                <span class="summary-label">Aceitos</span>
              </div>
              <div class="summary-card">
                <span class="summary-value summary-pending">{{ inviteCounts.pending }}</span>
                <span class="summary-label">Pendentes</span>
              </div>
              <div class="summary-card">
                <span class="summary-value summary-declined">{{ inviteCounts.declined }}</span>
                <span class="summary-label">Recusados</span>
              </div>
              <div class="summary-card">
                <span class="summary-value summary-slots">{{ nightShiftConfig.slots || 0 }}</span>
                <span class="summary-label">Vagas Total</span>
              </div>
            </div>

            <!-- Invites Section -->
            <div class="invites-section">
              <div class="invites-header">
                <h3>Convites Enviados</h3>
                <button @click="openInviteModal" class="btn btn-primary">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Convidar Aplicadores
                </button>
              </div>

              <div v-if="loadingInvites" class="loading-inline">
                <div class="loading-spinner-small"></div>
                <span>Carregando convites...</span>
              </div>

              <div v-else-if="nightShiftInvites.length === 0" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <p>Nenhum convite enviado</p>
                <span>Convide aplicadores para o turno noturno</span>
              </div>

              <div v-else class="invites-table">
                <table>
                  <thead>
                    <tr>
                      <th>Aplicador</th>
                      <th>Status</th>
                      <th>Convidado em</th>
                      <th>Respondido em</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="invite in nightShiftInvites" :key="invite.id">
                      <td>
                        <div class="member-info">
                          <div class="member-avatar">
                            {{ invite.user?.name?.charAt(0) || '?' }}
                          </div>
                          <div class="member-details">
                            <span class="member-name">{{ invite.user?.name }}</span>
                            <span class="member-username">@{{ invite.user?.username }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          class="invite-status-badge"
                          :style="{
                            background: getInviteStatusColor(invite.status) + '20',
                            color: getInviteStatusColor(invite.status),
                            borderColor: getInviteStatusColor(invite.status) + '40'
                          }"
                        >
                          {{ getInviteStatusLabel(invite.status) }}
                        </span>
                      </td>
                      <td>{{ formatDate(invite.invitedAt) }}</td>
                      <td>{{ invite.respondedAt ? formatDate(invite.respondedAt) : '-' }}</td>
                      <td>
                        <button
                          v-if="invite.status === 'PENDING'"
                          class="remove-btn"
                          @click="cancelInvite(invite.id)"
                          title="Cancelar convite"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Task Modal -->
    <div v-if="showTaskModal" class="modal-overlay" @click="showTaskModal = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTask ? 'Editar Tarefa' : 'Nova Tarefa' }}</h3>
          <button class="modal-close" @click="showTaskModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field field-full">
              <label>Titulo *</label>
              <input
                v-model="taskForm.title"
                type="text"
                class="input"
                placeholder="Nome da tarefa"
              />
            </div>
            <div class="field">
              <label>Tipo de Tarefa</label>
              <select v-model="taskForm.taskType" class="input">
                <option v-for="(label, key) in taskTypeLabels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>Status</label>
              <select v-model="taskForm.status" class="input">
                <option v-for="(label, key) in taskStatusLabels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>Data Inicio</label>
              <input
                v-model="taskForm.startDate"
                type="date"
                class="input"
              />
            </div>
            <div class="field">
              <label>Data Fim</label>
              <input
                v-model="taskForm.endDate"
                type="date"
                class="input"
              />
            </div>
            <div class="field">
              <label>Horas Estimadas</label>
              <input
                v-model.number="taskForm.estimatedHours"
                type="number"
                step="0.5"
                min="0"
                class="input"
                placeholder="Ex: 8"
              />
            </div>
            <div class="field">
              <label>Cor</label>
              <input
                v-model="taskForm.color"
                type="color"
                class="input input-color"
              />
            </div>
            <div class="field field-full">
              <label>Descricao</label>
              <textarea
                v-model="taskForm.description"
                class="input textarea"
                rows="3"
                placeholder="Descricao da tarefa (opcional)"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showTaskModal = false">
            Cancelar
          </button>
          <button class="btn btn-primary" @click="saveTask" :disabled="savingTask">
            <div v-if="savingTask" class="btn-spinner-small"></div>
            {{ savingTask ? 'Salvando...' : (editingTask ? 'Salvar' : 'Criar') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Team Management Modal -->
    <div v-if="showTeamModal" class="modal-overlay" @click="showTeamModal = false">
      <div class="modal modal-xl" @click.stop>
        <div class="modal-header">
          <h3>Gerenciar Equipe</h3>
          <button class="modal-close" @click="showTeamModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body team-modal-body">
          <!-- Two columns layout -->
          <div class="team-modal-grid">
            <!-- Left: Available Applicators -->
            <div class="team-modal-column">
              <div class="column-header">
                <h4>Aplicadores Disponiveis</h4>
                <span class="count-badge">{{ availableApplicators.length }}</span>
              </div>

              <!-- Search bar -->
              <div class="search-bar">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  v-model="teamSearchQuery"
                  placeholder="Buscar por nome, usuario ou email..."
                  class="search-input"
                />
                <button
                  v-if="teamSearchQuery"
                  class="clear-search"
                  @click="teamSearchQuery = ''"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <!-- Role selector -->
              <div class="role-selector">
                <label>Cargo ao adicionar:</label>
                <select v-model="selectedRoleForAdd" class="input input-sm">
                  <option value="AUXILIAR">Auxiliar</option>
                  <option value="PREPARADOR">Preparador</option>
                  <option value="LIDER_PREPARACAO">Lider da Preparacao</option>
                  <option value="APLICADOR_I">Aplicador I</option>
                  <option value="APLICADOR_II">Aplicador II</option>
                  <option value="APLICADOR_III">Aplicador III</option>
                  <option value="LIDER">Lider</option>
                </select>
              </div>

              <!-- Selection actions -->
              <div class="selection-actions" v-if="filteredApplicators.length > 0">
                <button class="btn-link" @click="selectAllFiltered">
                  Selecionar todos ({{ filteredApplicators.length }})
                </button>
                <button
                  v-if="selectedApplicatorsToAdd.length > 0"
                  class="btn-link danger"
                  @click="clearSelection"
                >
                  Limpar selecao
                </button>
              </div>

              <div v-if="loadingApplicators" class="loading-inline">
                <div class="loading-spinner-small"></div>
                <span>Carregando...</span>
              </div>

              <div v-else-if="filteredApplicators.length === 0" class="empty-state-small">
                <p v-if="teamSearchQuery">Nenhum resultado para "{{ teamSearchQuery }}"</p>
                <p v-else>Todos os aplicadores ja estao na equipe</p>
              </div>

              <div v-else class="applicator-list">
                <div
                  v-for="app in filteredApplicators"
                  :key="app.id"
                  class="applicator-item"
                  :class="{ selected: selectedApplicatorsToAdd.includes(app.id) }"
                  @click="toggleApplicatorSelection(app.id)"
                >
                  <div class="applicator-checkbox">
                    <svg v-if="selectedApplicatorsToAdd.includes(app.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div class="applicator-avatar">
                    <img v-if="app.photoUrl" :src="getPhotoUrl(app.photoUrl)" :alt="app.name" />
                    <span v-else>{{ app.name?.charAt(0) || '?' }}</span>
                  </div>
                  <div class="applicator-details">
                    <span class="applicator-name">{{ app.name }}</span>
                    <span class="applicator-username">@{{ app.username }}</span>
                  </div>
                  <span class="role-badge small" :class="app.role?.toLowerCase()">
                    {{ getRoleLabel(app.role) }}
                  </span>
                </div>
              </div>

              <!-- Add button -->
              <div v-if="selectedApplicatorsToAdd.length > 0" class="add-action">
                <button
                  class="btn btn-primary btn-block"
                  @click="addTeamMembers"
                  :disabled="addingMembers"
                >
                  <div v-if="addingMembers" class="btn-spinner"></div>
                  {{ addingMembers ? 'Adicionando...' : `Adicionar ${selectedApplicatorsToAdd.length} selecionado(s)` }}
                </button>
              </div>
            </div>

            <!-- Right: Current Team -->
            <div class="team-modal-column">
              <div class="column-header">
                <h4>Equipe Atual</h4>
                <span class="count-badge success">{{ team.length }}</span>
              </div>

              <div v-if="loadingTeam" class="loading-inline">
                <div class="loading-spinner-small"></div>
                <span>Carregando equipe...</span>
              </div>

              <div v-else-if="team.length === 0" class="empty-state-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <p>Nenhum membro na equipe</p>
              </div>

              <div v-else class="team-member-list">
                <div
                  v-for="member in team"
                  :key="member.id"
                  class="team-member-item"
                >
                  <div class="member-avatar">
                    <img v-if="member.photoUrl" :src="getPhotoUrl(member.photoUrl)" :alt="member.name" />
                    <span v-else>{{ member.name?.charAt(0) || '?' }}</span>
                  </div>
                  <div class="member-details">
                    <span class="member-name">{{ member.name }}</span>
                    <span class="member-role">{{ getRoleLabel(member.projectRole) }}</span>
                  </div>
                  <button
                    class="remove-member-btn"
                    @click="removeTeamMember(member.id)"
                    :disabled="removingMember === member.id"
                    title="Remover da equipe"
                  >
                    <div v-if="removingMember === member.id" class="btn-spinner-small"></div>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showTeamModal = false">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Night Shift Invite Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="showInviteModal = false">
      <div class="modal modal-lg" @click.stop>
        <div class="modal-header">
          <h3>Convidar Aplicadores</h3>
          <button class="modal-close" @click="showInviteModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Selecione os aplicadores que receberao o convite para o turno noturno:</p>

          <div v-if="loadingApplicators" class="loading-inline">
            <div class="loading-spinner-small"></div>
            <span>Carregando aplicadores...</span>
          </div>

          <div v-else-if="availableApplicators.length === 0" class="empty-state-small">
            <p>Nenhum aplicador disponivel para convite</p>
          </div>

          <div v-else class="invitee-list">
            <div
              v-for="app in availableApplicators"
              :key="app.id"
              class="invitee-item"
              :class="{ selected: selectedInvitees.includes(app.id) }"
              @click="toggleInvitee(app.id)"
            >
              <div class="invitee-checkbox">
                <svg v-if="selectedInvitees.includes(app.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="invitee-avatar">
                {{ app.name?.charAt(0) || '?' }}
              </div>
              <div class="invitee-details">
                <span class="invitee-name">{{ app.name }}</span>
                <span class="invitee-username">@{{ app.username }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedInvitees.length > 0" class="selected-count">
            {{ selectedInvitees.length }} aplicador(es) selecionado(s)
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showInviteModal = false">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="sendInvites"
            :disabled="selectedInvitees.length === 0 || sendingInvites"
          >
            <div v-if="sendingInvites" class="btn-spinner"></div>
            {{ sendingInvites ? 'Enviando...' : 'Enviar Convites' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Entry Request Modal -->
    <div v-if="showEntryRequestModal" class="modal-overlay" @click="showEntryRequestModal = false">
      <div class="modal modal-lg" @click.stop>
        <div class="modal-header">
          <h3>Solicitar Liberacao na Portaria</h3>
          <button class="modal-close" @click="showEntryRequestModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="entry-info">
            <div class="entry-info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ project?.title }}</span>
            </div>
            <div class="entry-info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{{ project?.endereco || 'Endereco nao informado' }}</span>
            </div>
            <div class="entry-info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span v-if="formData.responsiblePhones?.length > 0">
                {{ formData.responsiblePhones.length }} telefone(s) do responsavel
              </span>
              <span v-else class="warning-text">Nenhum telefone cadastrado</span>
            </div>
          </div>

          <p class="modal-hint">Selecione os aplicadores que terao acesso liberado:</p>

          <div v-if="team.length === 0" class="empty-state-small">
            <p>Nenhum membro na equipe</p>
          </div>

          <div v-else class="invitee-list">
            <div
              v-for="member in team"
              :key="member.id"
              class="invitee-item"
              :class="{ selected: selectedForEntry.includes(member.id) }"
              @click="toggleEntryApplicator(member.id)"
            >
              <div class="invitee-checkbox">
                <svg v-if="selectedForEntry.includes(member.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="invitee-avatar">
                {{ member.name?.charAt(0) || '?' }}
              </div>
              <div class="invitee-details">
                <span class="invitee-name">{{ member.name }}</span>
                <span class="invitee-role">{{ getRoleLabel(member.projectRole) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedForEntry.length > 0" class="selected-count entry-count">
            {{ selectedForEntry.length }} aplicador(es) selecionado(s)
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEntryRequestModal = false">Cancelar</button>
          <button
            class="btn btn-entry"
            @click="sendEntryRequest"
            :disabled="selectedForEntry.length === 0 || sendingEntryRequest || !formData.responsiblePhones?.length"
          >
            <div v-if="sendingEntryRequest" class="btn-spinner"></div>
            {{ sendingEntryRequest ? 'Enviando...' : 'Enviar Solicitacao' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Header styles - same as Projects.vue */
.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  height: 32px;
  width: auto;
}

.logo-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.nav-link.router-link-active {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-primary);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

.user-name {
  color: var(--text-secondary);
  font-size: 14px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Main Content */
.main {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 14px;
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--accent-primary);
}

.breadcrumb-separator {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 500;
}

/* Project Header */
.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 24px;
}

.project-info h1 {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.night-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.night-badge svg {
  width: 14px;
  height: 14px;
}

.travel-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.travel-badge svg {
  width: 14px;
  height: 14px;
}

.travel-toggle.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #f59e0b;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.meta-item svg {
  width: 16px;
  height: 16px;
}

.project-actions {
  display: flex;
  gap: 12px;
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
}

.btn-accent {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  border: none;
}

.btn-accent:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-accent:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab svg {
  width: 18px;
  height: 18px;
}

.tab:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Info Tab */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.info-card h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Schedule Card (Cronograma) */
.schedule-card {
  grid-column: span 2;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.schedule-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.schedule-field.readonly {
  background: rgba(201, 169, 98, 0.05);
  border-color: rgba(201, 169, 98, 0.2);
}

.time-dropdown {
  /* Parece texto, mas é dropdown */
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-color);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: center;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.time-dropdown:hover {
  background: rgba(201, 169, 98, 0.1);
  border-radius: 4px;
}

.time-dropdown:focus {
  outline: none;
}

.time-dropdown option {
  background: var(--bg-card);
  color: var(--text-primary);
}

/* Date Input Inline - mesma aparência do time-dropdown */
.date-input-inline {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-color);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

.date-input-inline:hover {
  background: rgba(201, 169, 98, 0.1);
  border-radius: 4px;
}

.date-input-inline:focus {
  outline: none;
}

/* Number Input Inline */
.number-input-inline {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-color);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 50px;
  text-align: center;
}

.number-input-inline:hover {
  background: rgba(201, 169, 98, 0.1);
  border-radius: 4px;
}

.number-input-inline:focus {
  outline: none;
}

.number-input-inline::placeholder {
  color: var(--text-tertiary);
}

/* Remover setas do input number */
.number-input-inline::-webkit-outer-spin-button,
.number-input-inline::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input-inline[type=number] {
  -moz-appearance: textfield;
}

/* Schedule Value Row - para input + badge/suffix na mesma linha */
.schedule-value-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.input-suffix {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* Toggle Button - mesma estética dos outros valores */
.toggle-btn {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  text-align: left;
}

.toggle-btn:hover {
  background: rgba(201, 169, 98, 0.1);
}

.toggle-btn.active {
  color: var(--accent-color);
}

/* Weekend Toggles - Sábado e Domingo agrupados */
.weekend-toggles {
  display: flex;
  gap: 12px;
  align-items: center;
}

.weekend-toggle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.weekend-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 60px;
}

.toggle-btn-compact {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 6px;
  transition: all 0.2s;
  text-align: center;
  min-width: 60px;
}

.toggle-btn-compact:hover {
  background: rgba(201, 169, 98, 0.1);
}

.toggle-btn-compact.active {
  color: var(--accent-color);
  background: rgba(201, 169, 98, 0.15);
}

.schedule-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.schedule-field-header label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-hint {
  font-size: 9px;
  font-weight: 400;
  color: var(--text-tertiary);
  opacity: 0.7;
  white-space: nowrap;
}

.edit-field-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s;
  opacity: 0.6;
}

.edit-field-btn:hover {
  opacity: 1;
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-color);
}

.edit-field-btn svg {
  width: 14px;
  height: 14px;
}

.schedule-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  display: block;
  width: 100%;
}

.schedule-value.highlight {
  color: var(--accent-color);
}

.schedule-value-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.deadline-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.deadline-badge.ok {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.deadline-badge.warning {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.deadline-badge.overdue {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.schedule-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
}

.schedule-badge.allowed {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.schedule-badge.not-allowed {
  background: rgba(107, 114, 128, 0.15);
  color: var(--text-tertiary);
}

/* Inline Edit Group */
.inline-edit-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-sm {
  padding: 6px 10px;
  font-size: 13px;
  height: 32px;
}

.btn-inline-save,
.btn-inline-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-inline-save {
  background: var(--accent-color);
  color: #000;
}

.btn-inline-save:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.btn-inline-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-inline-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-inline-cancel:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.btn-inline-save svg,
.btn-inline-cancel svg {
  width: 14px;
  height: 14px;
}

@media (max-width: 1200px) {
  .schedule-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .schedule-card {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .schedule-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }
  .schedule-card {
    grid-column: span 1;
  }
}

.info-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-value {
  font-size: 14px;
  color: var(--text-primary);
}

.input {
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: var(--bg-card);
}

.input::placeholder {
  color: var(--text-tertiary);
}

/* Toggle Switch */
.field-toggle {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  transition: all 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background: var(--text-tertiary);
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle input:checked + .toggle-slider {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background: #000;
}

/* Measurements */
.measurements-edit {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 600px) {
  .measurements-edit {
    grid-template-columns: 1fr;
  }
}

.measurements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.measurement {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.measurement-total {
  grid-column: 1 / -1;
  background: rgba(201, 169, 98, 0.08);
  border: 1px solid rgba(201, 169, 98, 0.2);
}

.measurement-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.measurement-icon svg {
  width: 20px;
  height: 20px;
}

.m2-total { background: rgba(201, 169, 98, 0.1); color: var(--accent-primary); }
.m2-piso { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); }
.m2-parede { background: rgba(34, 197, 94, 0.1); color: var(--accent-green); }
.m2-teto { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.m-rodape { background: rgba(249, 115, 22, 0.1); color: var(--accent-orange); }

.measurement-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.measurement-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.measurement-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

/* Hours */
.hours-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hours-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hours-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.hours-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.hours-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.hours-worked {
  color: var(--text-primary);
  font-weight: 500;
}

.hours-estimated {
  color: var(--text-tertiary);
}

.progress-percent {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-primary);
}

/* Team Tab */
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.team-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  color: var(--text-secondary);
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  color: var(--text-secondary);
}

.empty-state svg {
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.empty-state span {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* Team Table */
.team-table {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.team-table table {
  width: 100%;
  border-collapse: collapse;
}

.team-table th {
  text-align: left;
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.team-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.team-table tr:last-child td {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-weight: 500;
  color: var(--text-primary);
}

.member-username {
  font-size: 12px;
  color: var(--text-tertiary);
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.role-badge.lider {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-primary);
}

.role-badge.aplicador {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
}

.remove-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--accent-red);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
}

.btn-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(239, 68, 68, 0.2);
  border-top-color: var(--accent-red);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Checkins Tab */
.checkins-tab h3,
.reports-tab h3 {
  margin: 0 0 24px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.checkins-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkin-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}

.checkin-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #000;
}

.checkin-times {
  display: flex;
  gap: 24px;
  flex: 1;
}

.checkin-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.time-value {
  font-size: 13px;
  color: var(--text-primary);
}

.active-badge {
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.checkin-hours {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-primary);
}

/* Reports Tab */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-card {
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.report-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.report-summary {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.report-photos {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-close svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

/* Night Shift Tab */
.tab-nightshift {
  color: #8b5cf6;
}

.tab-nightshift:hover {
  color: #a78bfa;
}

.tab-nightshift.active {
  color: #8b5cf6;
  border-bottom-color: #8b5cf6;
}

.nightshift-config {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  margin-bottom: 24px;
}

.nightshift-config h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: end;
}

@media (max-width: 800px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.config-action {
  display: flex;
  align-items: end;
}

.invite-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 600px) {
  .invite-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
}

.summary-label {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-accepted { color: var(--accent-green); }
.summary-pending { color: var(--accent-orange); }
.summary-declined { color: var(--accent-red); }
.summary-slots { color: #8b5cf6; }

.invites-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.invites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.invites-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.invites-table table {
  width: 100%;
  border-collapse: collapse;
}

.invites-table th {
  text-align: left;
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.invites-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.invites-table tr:last-child td {
  border-bottom: none;
}

.invite-status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
}

/* Invite Modal */
.modal-lg {
  max-width: 560px;
}

/* Team Management Modal */
.modal-xl {
  max-width: 900px;
  width: 90%;
}

.team-modal-body {
  padding: 0 !important;
}

.team-modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 500px;
}

.team-modal-column {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.team-modal-column:first-child {
  border-right: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.team-modal-column:last-child {
  background: var(--bg-card);
}

.column-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.column-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.count-badge {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.count-badge.success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

/* Search Bar */
.search-bar {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 36px 10px 40px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-tertiary);
  display: flex;
}

.clear-search:hover {
  color: var(--text-secondary);
}

.clear-search svg {
  width: 16px;
  height: 16px;
}

/* Role Selector */
.role-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.role-selector label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.role-selector select {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--text-primary);
}

/* Selection Actions */
.selection-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-link.danger {
  color: #ef4444;
}

/* Applicator List */
.applicator-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
}

.applicator-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.15s;
}

.applicator-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--text-tertiary);
}

.applicator-item.selected {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.applicator-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.applicator-item.selected .applicator-checkbox {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.applicator-checkbox svg {
  width: 12px;
  height: 12px;
  color: white;
}

.applicator-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.applicator-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.applicator-details {
  flex: 1;
  min-width: 0;
}

.applicator-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.applicator-username {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
}

.role-badge.small {
  font-size: 10px;
  padding: 3px 8px;
}

/* Add Action */
.add-action {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.btn-block {
  width: 100%;
}

/* Team Member List */
.team-member-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 420px;
}

.team-member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-details {
  flex: 1;
}

.member-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.member-role {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
}

.remove-member-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.remove-member-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.remove-member-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-member-btn svg {
  width: 14px;
  height: 14px;
  color: #ef4444;
}

.empty-state-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state-small svg {
  width: 40px;
  height: 40px;
}

.empty-state-small p {
  margin: 0;
  font-size: 14px;
}

.modal-hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.invitee-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invitee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.invitee-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--text-tertiary);
}

.invitee-item.selected {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.invitee-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invitee-item.selected .invitee-checkbox {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.invitee-checkbox svg {
  width: 12px;
  height: 12px;
  color: #fff;
}

.invitee-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

.invitee-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.invitee-name {
  font-weight: 500;
  color: var(--text-primary);
}

.invitee-username {
  font-size: 12px;
  color: var(--text-tertiary);
}

.selected-count {
  text-align: center;
  color: #8b5cf6;
  font-size: 14px;
  font-weight: 500;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: var(--border-radius);
}

.empty-state-small {
  padding: 24px;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-state-small p {
  margin: 0;
}

/* Phone management styles */
.phones-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phones-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.phone-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-primary);
}

.phone-tag.readonly {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: var(--accent-green);
}

.phone-remove {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.phone-remove:hover {
  background: rgba(239, 68, 68, 0.2);
}

.phone-remove svg {
  width: 12px;
  height: 12px;
}

.phone-add {
  display: flex;
  gap: 8px;
}

.phone-add .input {
  flex: 1;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 13px;
}

.phones-display {
  min-height: 24px;
}

/* Clickable WhatsApp phones */
.phones-clickable {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.phone-whatsapp-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(37, 211, 102, 0.1);
  border: 1px solid rgba(37, 211, 102, 0.3);
  border-radius: 20px;
  font-size: 13px;
  color: #25d366;
  text-decoration: none;
  transition: all 0.2s;
}

.phone-whatsapp-link:hover {
  background: rgba(37, 211, 102, 0.2);
  border-color: rgba(37, 211, 102, 0.5);
  transform: translateY(-1px);
}

.phone-whatsapp-link svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Team actions */
.team-actions {
  display: flex;
  gap: 12px;
}

/* Entry request button */
.btn-entry {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

.btn-entry:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-entry:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Entry info in modal */
.entry-info {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}

.entry-info-item svg {
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.entry-info-item .warning-text {
  color: var(--accent-orange);
}

.entry-count {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
}

.invitee-role {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

/* Schedule Tab / Gantt Styles */
.schedule-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.schedule-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.schedule-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.schedule-actions {
  display: flex;
  gap: 8px;
}

/* Compact scope badge */
.scope-badge-compact {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.scope-badge-compact.scope-piso {
  background: rgba(201, 169, 98, 0.15);
  color: #c9a962;
  border: 1px solid rgba(201, 169, 98, 0.3);
}

.scope-badge-compact.scope-parede_teto {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.scope-badge-compact.scope-combinado {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

/* Compact summary inline */
.gantt-summary-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.summary-compact-item {
  font-weight: 500;
}

.summary-compact-separator {
  color: var(--text-tertiary);
  font-weight: 300;
}

.task-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-pending .stat-value {
  color: #6b7280;
}

.stat-progress .stat-value {
  color: #3b82f6;
}

.stat-completed .stat-value {
  color: #22c55e;
}

.gantt-container {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: visible;
}

.gantt-chart {
  min-width: 100%;
  overflow-x: visible;
}

.gantt-row {
  display: grid;
  grid-template-columns: 200px 1fr 120px;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.gantt-row:last-child {
  border-bottom: none;
}

.gantt-row:hover {
  background: rgba(201, 169, 98, 0.05);
}

.gantt-task-info {
  min-width: 0;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-title {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.task-type {
  color: var(--accent-color);
}

/* Gantt Empty State */
.gantt-empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border-radius: 8px;
  margin: 16px 0;
}

.gantt-empty-state p {
  margin: 0;
  font-size: 14px;
}

.gantt-empty-state strong {
  color: var(--accent-color);
}

/* Scope Badge */
.scope-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.scope-badge.scope-piso {
  background: rgba(201, 169, 98, 0.2);
  color: #c9a962;
}

.scope-badge.scope-parede_teto {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.scope-badge.scope-combinado {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

/* Task Order Number */
.task-order {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

/* Scope Value in Summary */
.scope-value {
  color: var(--accent-color);
  font-weight: 600;
}

.gantt-bar-container {
  min-width: 300px;
  height: 28px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.gantt-bar {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  transition: opacity 0.2s;
  min-width: 50px;
}

.gantt-bar:hover {
  filter: brightness(1.1);
}

.gantt-bar-label {
  font-size: 11px;
  font-weight: 500;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-task-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status-select {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  padding: 4px 8px;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.edit-btn,
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

/* Gantt Summary Styles */
.gantt-summary {
  display: flex;
  gap: 24px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px 24px;
  border: 1px solid var(--border-color);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.summary-value {
  font-weight: 600;
  color: var(--accent-color);
  font-size: 16px;
}

/* Generate Button Style */
.btn-generate {
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Gantt Wrapper - Contains label and table */
.gantt-wrapper {
  --gantt-left-offset: 558px; /* padding(8) + col1(40+8) + col2(220+8) + col3(70+8) + col4(90+8) + col5(90+8) = 558px */
  position: relative;
  padding-top: 35px;
}

/* Today Label - Floating above table */
.today-label-floating {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  z-index: 20;
}

.today-label-floating .today-text {
  font-size: 9px;
  font-weight: 600;
  color: #22c55e;
  text-transform: lowercase;
  letter-spacing: 0.2px;
}

.today-label-floating .today-arrow {
  width: 12px;
  height: 6px;
  color: #22c55e;
}

/* Traditional Gantt Chart Styles */
.gantt-traditional {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: visible;
  position: relative;
}

/* Today Indicator - Green vertical bar showing current day */
.gantt-today-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(180deg,
    rgba(34, 197, 94, 0.15) 0%,
    rgba(34, 197, 94, 0.1) 50%,
    rgba(34, 197, 94, 0.15) 100%
  );
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.15);
}

.gantt-header {
  display: grid;
  grid-template-columns: 40px 220px 70px 90px 90px auto 40px 50px 40px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid var(--border-color);
  gap: 8px;
  padding: 0 8px;
}

.gantt-drag-column,
.gantt-task-column,
.gantt-input-column,
.gantt-calc-column,
.gantt-add-column,
.gantt-group-column,
.gantt-action-column {
  padding: 8px 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gantt-task-column {
  justify-content: flex-start;
}

.gantt-days-column {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-left: 1px solid var(--border-color);
}

.gantt-timeline-header {
  display: flex;
  overflow-x: visible;
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
}

.gantt-day-cell {
  min-width: 40px;
  max-width: 40px;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s ease;
}

.gantt-day-cell:hover {
  background: rgba(201, 169, 98, 0.1);
}

.gantt-day-cell:last-child {
  border-right: none;
}

.gantt-day-weekend {
  background: rgba(239, 68, 68, 0.08);
}

.gantt-day-weekend:hover {
  background: rgba(239, 68, 68, 0.15);
}

/* Blocked weekends - red overlay for non-work days */
.gantt-day-blocked {
  position: relative;
  background: transparent !important;
}

.gantt-day-blocked::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(220, 38, 38, 0.2);
  pointer-events: none;
  z-index: 1;
}

.gantt-day-blocked .day-num,
.gantt-day-blocked .day-label {
  position: relative;
  z-index: 2;
  opacity: 0.6;
}

.day-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.day-label {
  font-size: 9px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Gantt Body */
.gantt-body {
  /* Removed max-height and overflow to integrate with page scroll */
  overflow-y: visible;
}

/* INLINE GANTT ROW */
.gantt-row-inline {
  display: grid;
  grid-template-columns: 40px 220px 70px 90px 90px auto 40px 50px 40px;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
  padding: 0 8px;
  transition: all 0.2s ease;
  align-items: center;
  min-height: 44px;
  overflow: visible; /* Allow tooltips and prevent scrollbar */
}

.gantt-row-inline:hover {
  background: rgba(201, 169, 98, 0.08);
  transform: translateX(2px);
}

.gantt-row-grouped {
  border-left: 3px solid var(--accent-color);
  background: rgba(201, 169, 98, 0.08);
}

/* =============================================
   GROUPED BLOCK - UMA ÚNICA LINHA COM ALTURA EXPANDIDA
   ============================================= */

.gantt-row-grouped-block {
  border: 2px solid var(--accent-color) !important;
  border-radius: 8px;
  background: rgba(201, 169, 98, 0.05) !important;
  margin: 4px 0;
  box-shadow: 0 2px 8px rgba(201, 169, 98, 0.2);
}

/* Células agrupadas - display flex vertical apenas para task names e actions */
.gantt-task-cell-grouped,
.gantt-action-cell-grouped {
  display: flex !important;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-evenly;
  gap: 4px;
  padding: 8px 4px !important;
  overflow: visible; /* Prevent scrollbar */
}

/* Lista de tarefas agrupadas */
.grouped-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.grouped-task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 2px 0;
}

/* Lista de ações agrupadas */
.grouped-actions-list,
.grouped-delete-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  align-items: center;
  overflow: visible; /* Prevent scrollbar */
}


.group-toggle-add {
  background: rgba(34, 197, 94, 0.2) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
  color: #22c55e !important;
}

.group-toggle-add:hover {
  background: rgba(34, 197, 94, 0.3) !important;
  border-color: #22c55e !important;
}

/* Total hours styling for grouped blocks */
.calc-hours-total {
  font-weight: 700;
  color: var(--accent-color);
  font-size: 15px;
  background: rgba(201, 169, 98, 0.15);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--accent-color);
}

/* Inline Cells */
.gantt-order-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-order {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.task-title-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 4px;
  outline: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.task-title-input:hover {
  border-bottom-color: rgba(201, 169, 98, 0.4);
  background: rgba(201, 169, 98, 0.05);
}

.task-title-input:focus {
  border-bottom-color: var(--accent-color);
  background: rgba(201, 169, 98, 0.08);
  padding-left: 8px;
}

.gantt-input-cell,
.gantt-calc-cell,
.gantt-group-cell,
.gantt-action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible; /* Prevent scrollbar and allow tooltips */
}

.gantt-number-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 6px 10px;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  font-variant-numeric: tabular-nums;
  -webkit-appearance: none;
  -moz-appearance: textfield;
}

/* Hide spinner arrows */
.gantt-number-input::-webkit-inner-spin-button,
.gantt-number-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.gantt-number-input:hover {
  background: rgba(201, 169, 98, 0.08);
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateY(-1px);
}

.gantt-number-input:focus {
  background: rgba(201, 169, 98, 0.12);
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.gantt-number-input.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.15);
  transform: none !important;
}

/* Select Dropdown Styles */
.gantt-select-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 6px 10px;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c9a962' d='M6 9L2 5h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}

.gantt-select-input:hover {
  background-color: rgba(201, 169, 98, 0.08);
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateY(-1px);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c9a962' d='M6 9L2 5h8z'/%3E%3C/svg%3E");
}

.gantt-select-input:focus {
  background-color: rgba(201, 169, 98, 0.12);
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c9a962' d='M6 3L2 7h8z'/%3E%3C/svg%3E");
}

.gantt-select-input.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(0, 0, 0, 0.15);
  transform: none !important;
}

.gantt-select-input option {
  background: #1a1a1a;
  color: var(--text-primary);
  padding: 8px;
  font-weight: 600;
}

.no-resource-badge {
  font-size: 14px;
  margin-left: 6px;
  opacity: 0.7;
  flex-shrink: 0;
}

.calc-hours {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-color);
  padding: 4px 8px;
  background: rgba(201, 169, 98, 0.15);
  border-radius: 6px;
}

.gantt-action-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #fff;
}

/* Instant Tooltip */
.has-tooltip {
  position: relative;
}

.has-tooltip::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: rgba(0, 0, 0, 0.95);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(201, 169, 98, 0.3);
}

.has-tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-2px);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.95);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 1001;
}

.has-tooltip:hover::before,
.has-tooltip:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}

.has-tooltip:hover::after {
  transform: translateX(-50%) translateY(0);
}


.gantt-row-traditional {
  display: grid;
  grid-template-columns: 32px 180px 1fr 70px 36px;
  border-bottom: 1px solid var(--border-color);
  cursor: default;
  transition: background 0.2s, transform 0.15s, box-shadow 0.15s;
}

/* Drag Handle */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: var(--text-secondary);
  opacity: 0.4;
  transition: opacity 0.2s, color 0.2s;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle svg {
  width: 16px;
  height: 16px;
}

.gantt-row-traditional:hover .drag-handle {
  opacity: 1;
  color: var(--accent-color);
}

/* Drag States */
.gantt-row-dragging {
  opacity: 0.5;
  background: rgba(201, 169, 98, 0.1);
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.gantt-row-drag-over {
  background: rgba(201, 169, 98, 0.15);
  border-top: 2px solid var(--accent-color);
}


.gantt-row-traditional:last-child {
  border-bottom: none;
}

.gantt-row-traditional:hover {
  background: rgba(201, 169, 98, 0.05);
}

.gantt-row-selected {
  background: rgba(201, 169, 98, 0.1);
}

.gantt-task-cell {
  padding: 12px 16px 12px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-right: 1px solid var(--border-color);
}

.task-row-single {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.task-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
  opacity: 0.9;
}

.task-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-timeline-cell {
  padding: 8px 0;
  overflow-x: visible;
  border-right: 1px solid var(--border-color);
}

/* Action Cells (Add, Group, Delete) */
.gantt-add-cell,
.gantt-group-cell,
.gantt-action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.gantt-add-cell-grouped,
.gantt-action-cell-grouped {
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  gap: 2px;
  padding: 8px 4px !important;
}

.timeline-track {
  position: relative;
  height: 28px;
  background: repeating-linear-gradient(
    to right,
    transparent,
    transparent 39px,
    rgba(255, 255, 255, 0.03) 39px,
    rgba(255, 255, 255, 0.03) 40px
  );
  min-width: calc(var(--total-days, 14) * 40px);
}

.timeline-bar {
  position: absolute;
  top: 2px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.timeline-bar:hover {
  transform: scaleY(1.1);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.timeline-bar-grouped {
  align-items: flex-start;
  padding: 4px 8px;
}

.bar-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.grouped-tasks-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  font-size: 11px;
}

.grouped-task-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.grouped-task-label:last-child {
  border-bottom: none;
}

.bar-label {
  font-size: 11px;
  font-weight: 600;
  color: #000;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.3);
}

.gantt-days-cell {
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.days-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent-color);
}

/* Inline Select Dropdowns in Gantt */
.gantt-inline-select {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-primary);
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
  padding-right: 20px;
}

.gantt-inline-select:hover {
  background-color: rgba(201, 169, 98, 0.1);
  border-color: var(--border-color);
}

.gantt-inline-select:focus {
  outline: none;
  border-color: var(--accent-color);
  background-color: rgba(201, 169, 98, 0.15);
}

.gantt-inline-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 8px;
}

.task-select {
  flex: 1;
  min-width: 0;
}

.days-select {
  width: 100%;
  height: 100%;
  min-height: 36px;
  text-align: center;
  text-align-last: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--accent-color);
  background-position: right 6px center;
  padding: 6px 24px 6px 8px;
}

/* Delete button in Gantt row */
.gantt-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: auto;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.2s;
}

.gantt-delete-btn svg {
  width: 16px;
  height: 16px;
}

.gantt-row-traditional:hover .gantt-delete-btn {
  opacity: 1;
}

.gantt-delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* Block Editor Panel */
.block-editor-panel {
  background: var(--card-bg);
  border-radius: 12px;
  border: 2px solid var(--accent-color);
  overflow: hidden;
  margin-top: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(201, 169, 98, 0.1);
  border-bottom: 1px solid var(--border-color);
}

.editor-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-color);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.editor-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.days-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.days-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--accent-color);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.days-btn:hover {
  background: #d4af37;
  transform: scale(1.05);
}

.days-input {
  width: 80px;
  height: 40px;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  background: var(--input-bg);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
}

.days-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.status-select-full {
  width: 100%;
  padding: 10px 14px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.status-select-full:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* Editor Select Dropdown */
.editor-select {
  width: 100%;
  padding: 12px 14px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
}

.editor-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.editor-preview {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-label {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.preview-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.preview-days {
  font-size: 13px;
  color: var(--accent-color);
  font-weight: 600;
}

.preview-bar {
  height: 24px;
  border-radius: 4px;
  min-width: 40px;
  transition: width 0.3s ease;
}

.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.editor-actions-right {
  display: flex;
  gap: 12px;
}

/* Danger Button */
.btn-danger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.btn-danger .btn-icon {
  width: 14px;
  height: 14px;
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #3b82f6;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.edit-btn svg,
.delete-btn svg {
  width: 14px;
  height: 14px;
}

/* Modal large */
.modal-large {
  max-width: 600px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field-full {
  grid-column: 1 / -1;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.calculated-field {
  background: rgba(201, 169, 98, 0.1) !important;
  color: #c9a962 !important;
  font-weight: 600;
  cursor: not-allowed;
  border-color: rgba(201, 169, 98, 0.3) !important;
}

.input-color {
  height: 40px;
  padding: 4px;
  cursor: pointer;
}

/* Unified Action Buttons (Add, Group, Delete) */
.add-task-wrapper,
.grouped-add-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gantt-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-tertiary);
  position: relative;
  outline: none;
  padding: 0;
}

.gantt-action-btn:hover {
  background: rgba(201, 169, 98, 0.2);
  border-color: var(--accent-color);
}

.gantt-action-btn svg {
  width: 16px;
  height: 16px;
}

.gantt-action-btn-small {
  width: 28px;
  height: 28px;
}

.gantt-action-btn-small svg {
  width: 14px;
  height: 14px;
}

.add-dropdown-wrapper {
  position: relative;
}

.add-task-dropdown {
  position: fixed;
  background: rgba(20, 20, 20, 0.98);
  border: 1px solid rgba(201, 169, 98, 0.3);
  border-radius: 12px;
  padding: 12px;
  min-width: 240px;
  max-width: 300px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(201, 169, 98, 0.1);
  z-index: 9999;
  backdrop-filter: blur(10px);
}

.dropdown-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdown-templates {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 350px;
  overflow-y: auto;
}

/* Custom scrollbar for dropdown */
.dropdown-templates::-webkit-scrollbar {
  width: 6px;
}

.dropdown-templates::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dropdown-templates::-webkit-scrollbar-thumb {
  background: rgba(201, 169, 98, 0.3);
  border-radius: 3px;
}

.dropdown-templates::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 169, 98, 0.5);
}

.template-item-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 100%;
  text-align: left;
  outline: none;
}

.template-item-btn:hover {
  background: rgba(201, 169, 98, 0.15);
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateX(2px);
}

.template-item-btn:active {
  transform: translateX(2px) scale(0.98);
}

.template-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3);
}

.template-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
</style>
