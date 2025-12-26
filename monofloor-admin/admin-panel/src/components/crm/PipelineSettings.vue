<template>
  <div class="pipeline-settings">
    <div class="pipeline-settings__header">
      <h2 class="pipeline-settings__title">Configurar Pipeline</h2>
      <p class="pipeline-settings__subtitle">
        Personalize os estágios do seu funil de vendas
      </p>
    </div>

    <!-- Stage Groups -->
    <div class="pipeline-settings__groups">
      <div
        v-for="(group, groupIndex) in groupedStages"
        :key="group.name"
        class="pipeline-settings__group"
      >
        <div class="pipeline-settings__group-header">
          <input
            v-model="group.name"
            class="pipeline-settings__group-name-input"
            placeholder="Nome do grupo"
            @blur="updateGroupName(groupIndex)"
          />
          <input
            type="color"
            v-model="group.color"
            class="pipeline-settings__color-picker"
            @change="updateGroupColor(groupIndex)"
          />
        </div>

        <!-- Draggable Stages -->
        <div class="pipeline-settings__stages">
          <div
            v-for="(stage, stageIndex) in group.stages"
            :key="stage.id"
            class="pipeline-settings__stage"
            :class="{ 'pipeline-settings__stage--dragging': draggedStage?.id === stage.id }"
            draggable="true"
            @dragstart="handleDragStart($event, stage, groupIndex, stageIndex)"
            @dragend="handleDragEnd"
            @dragover.prevent="handleDragOver($event, groupIndex, stageIndex)"
            @drop="handleDrop($event, groupIndex, stageIndex)"
          >
            <div class="pipeline-settings__stage-handle">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5"/>
                <circle cx="15" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/>
                <circle cx="15" cy="12" r="1.5"/>
                <circle cx="9" cy="18" r="1.5"/>
                <circle cx="15" cy="18" r="1.5"/>
              </svg>
            </div>

            <input
              type="color"
              v-model="stage.color"
              class="pipeline-settings__stage-color"
            />

            <input
              v-model="stage.name"
              class="pipeline-settings__stage-name"
              placeholder="Nome do estágio"
            />

            <div class="pipeline-settings__stage-probability">
              <input
                type="number"
                v-model.number="stage.probability"
                min="0"
                max="100"
                class="pipeline-settings__probability-input"
              />
              <span class="pipeline-settings__probability-label">%</span>
            </div>

            <button
              class="pipeline-settings__stage-delete"
              title="Remover estágio"
              :disabled="stage.isDefault"
              @click="removeStage(groupIndex, stageIndex)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>

          <!-- Add Stage Button -->
          <button
            class="pipeline-settings__add-stage"
            @click="addStage(groupIndex)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Adicionar estágio
          </button>
        </div>
      </div>

      <!-- Add Group Button -->
      <button class="pipeline-settings__add-group" @click="addGroup">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Adicionar grupo
      </button>
    </div>

    <!-- Preview -->
    <div class="pipeline-settings__preview">
      <h3 class="pipeline-settings__preview-title">Preview do Pipeline</h3>
      <div class="pipeline-settings__preview-stages">
        <div
          v-for="stage in allStages"
          :key="stage.id"
          class="pipeline-settings__preview-stage"
          :style="{ borderColor: stage.color }"
        >
          <div
            class="pipeline-settings__preview-indicator"
            :style="{ backgroundColor: stage.color }"
          />
          <span class="pipeline-settings__preview-name">{{ stage.name }}</span>
          <span class="pipeline-settings__preview-probability">{{ stage.probability ?? 50 }}%</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="pipeline-settings__actions">
      <button class="pipeline-settings__btn pipeline-settings__btn--secondary" @click="reset">
        Restaurar padrão
      </button>
      <button class="pipeline-settings__btn pipeline-settings__btn--primary" @click="save">
        Salvar alterações
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Stage {
  id: string;
  name: string;
  color: string;
  probability?: number;
  groupName?: string;
  sortOrder?: number;
  isDefault?: boolean;
}

interface StageGroup {
  name: string;
  color: string;
  stages: Stage[];
}

interface Props {
  stages: Stage[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [stages: Stage[]];
  reset: [];
}>();

const draggedStage = ref<Stage | null>(null);
const draggedFrom = ref<{ groupIndex: number; stageIndex: number } | null>(null);

// Create a deep copy of stages grouped by groupName
const groupedStages = ref<StageGroup[]>([]);

const initializeGroups = () => {
  const groups = new Map<string, Stage[]>();
  const groupColors = new Map<string, string>();

  const sortedStages = [...props.stages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  sortedStages.forEach(stage => {
    const groupName = stage.groupName || 'Outros';
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
      groupColors.set(groupName, stage.color);
    }
    groups.get(groupName)!.push({ ...stage });
  });

  groupedStages.value = Array.from(groups.entries()).map(([name, stages]) => ({
    name,
    color: groupColors.get(name) || '#666',
    stages
  }));
};

// Initialize on mount
initializeGroups();

// Watch for prop changes
watch(() => props.stages, initializeGroups, { deep: true });

const allStages = computed(() => {
  const stages: Stage[] = [];
  let sortOrder = 0;

  groupedStages.value.forEach(group => {
    group.stages.forEach(stage => {
      stages.push({
        ...stage,
        groupName: group.name,
        sortOrder: sortOrder++
      });
    });
  });

  return stages;
});

const generateId = () => `stage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const addStage = (groupIndex: number) => {
  const group = groupedStages.value[groupIndex];
  if (!group) return;
  const newStage: Stage = {
    id: generateId(),
    name: 'Novo estágio',
    color: group.color,
    probability: 50,
    groupName: group.name,
    sortOrder: group.stages.length
  };
  group.stages.push(newStage);
};

const removeStage = (groupIndex: number, stageIndex: number) => {
  const group = groupedStages.value[groupIndex];
  if (!group) return;
  const stage = group.stages[stageIndex];
  if (!stage || stage.isDefault) return;
  group.stages.splice(stageIndex, 1);
};

const addGroup = () => {
  groupedStages.value.push({
    name: 'Novo Grupo',
    color: '#666666',
    stages: []
  });
};

const updateGroupName = (groupIndex: number) => {
  const group = groupedStages.value[groupIndex];
  if (!group) return;
  group.stages.forEach(stage => {
    stage.groupName = group.name;
  });
};

const updateGroupColor = (groupIndex: number) => {
  // Color is automatically bound
};

// Drag and Drop
const handleDragStart = (event: DragEvent, stage: Stage, groupIndex: number, stageIndex: number) => {
  draggedStage.value = stage;
  draggedFrom.value = { groupIndex, stageIndex };
  event.dataTransfer!.effectAllowed = 'move';
};

const handleDragEnd = () => {
  draggedStage.value = null;
  draggedFrom.value = null;
};

const handleDragOver = (event: DragEvent, groupIndex: number, stageIndex: number) => {
  event.dataTransfer!.dropEffect = 'move';
};

const handleDrop = (event: DragEvent, toGroupIndex: number, toStageIndex: number) => {
  if (!draggedStage.value || !draggedFrom.value) return;

  const fromGroup = groupedStages.value[draggedFrom.value.groupIndex];
  const toGroup = groupedStages.value[toGroupIndex];

  if (!fromGroup || !toGroup) return;

  // Remove from original position
  fromGroup.stages.splice(draggedFrom.value.stageIndex, 1);

  // Update group name if moved to different group
  if (draggedFrom.value.groupIndex !== toGroupIndex) {
    draggedStage.value.groupName = toGroup.name;
  }

  // Insert at new position
  toGroup.stages.splice(toStageIndex, 0, draggedStage.value);

  draggedStage.value = null;
  draggedFrom.value = null;
};

const save = () => {
  emit('save', allStages.value);
};

const reset = () => {
  emit('reset');
};
</script>

<style scoped>
.pipeline-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.pipeline-settings__header {
  margin-bottom: var(--space-2);
}

.pipeline-settings__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.pipeline-settings__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Groups */
.pipeline-settings__groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pipeline-settings__group {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.pipeline-settings__group-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.pipeline-settings__group-name-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  outline: none;
}

.pipeline-settings__group-name-input::placeholder {
  color: var(--text-tertiary);
}

.pipeline-settings__color-picker {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
}

/* Stages */
.pipeline-settings__stages {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pipeline-settings__stage {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.pipeline-settings__stage:hover {
  border-color: var(--border-default);
}

.pipeline-settings__stage--dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.pipeline-settings__stage-handle {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  cursor: grab;
}

.pipeline-settings__stage-handle:active {
  cursor: grabbing;
}

.pipeline-settings__stage-handle svg {
  width: 100%;
  height: 100%;
}

.pipeline-settings__stage-color {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
}

.pipeline-settings__stage-name {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-primary);
  outline: none;
}

.pipeline-settings__stage-name:focus {
  border-color: var(--color-primary);
}

.pipeline-settings__stage-probability {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.pipeline-settings__probability-input {
  width: 50px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: center;
  outline: none;
}

.pipeline-settings__probability-input:focus {
  border-color: var(--color-primary);
}

.pipeline-settings__probability-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.pipeline-settings__stage-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pipeline-settings__stage-delete:hover:not(:disabled) {
  background: var(--color-error-alpha-10);
  color: var(--color-error);
}

.pipeline-settings__stage-delete:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pipeline-settings__stage-delete svg {
  width: 16px;
  height: 16px;
}

/* Add Buttons */
.pipeline-settings__add-stage,
.pipeline-settings__add-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: transparent;
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pipeline-settings__add-stage:hover,
.pipeline-settings__add-group:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-alpha-10);
}

.pipeline-settings__add-stage svg,
.pipeline-settings__add-group svg {
  width: 16px;
  height: 16px;
}

/* Preview */
.pipeline-settings__preview {
  padding: var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.pipeline-settings__preview-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pipeline-settings__preview-stages {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.pipeline-settings__preview-stage {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid;
  border-radius: var(--radius-md);
}

.pipeline-settings__preview-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pipeline-settings__preview-name {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.pipeline-settings__preview-probability {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* Actions */
.pipeline-settings__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.pipeline-settings__btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pipeline-settings__btn--secondary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
}

.pipeline-settings__btn--secondary:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.pipeline-settings__btn--primary {
  background: var(--gradient-primary);
  border: none;
  color: var(--text-inverse);
}

.pipeline-settings__btn--primary:hover {
  filter: brightness(1.1);
}
</style>
