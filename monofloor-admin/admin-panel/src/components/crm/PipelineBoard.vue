<template>
  <div class="pipeline-board">
    <!-- Stage Groups -->
    <template v-for="(group, groupIndex) in stageGroups" :key="group.name">
      <!-- Group Header -->
      <div
        v-if="showGroups"
        class="pipeline-board__group-header"
        :class="{ 'pipeline-board__group-header--collapsed': collapsedGroups.includes(group.name) }"
        @click="toggleGroup(group.name)"
      >
        <div class="pipeline-board__group-indicator" :style="{ backgroundColor: group.color }" />
        <span class="pipeline-board__group-name">{{ group.name }}</span>
        <span class="pipeline-board__group-count">
          {{ getGroupDealCount(group.stages) }} deals
        </span>
        <span class="pipeline-board__group-value">
          {{ formatCurrency(getGroupTotalValue(group.stages)) }}
        </span>
        <svg
          class="pipeline-board__group-chevron"
          :class="{ 'pipeline-board__group-chevron--collapsed': collapsedGroups.includes(group.name) }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <!-- Stages in Group -->
      <div
        v-show="!collapsedGroups.includes(group.name)"
        class="pipeline-board__stages"
      >
        <PipelineColumn
          v-for="stage in group.stages"
          :key="stage.id"
          :stage="stage"
          :deals="getDealsByStage(stage.id)"
          :selected-deals="selectedDeals"
          :selectable="bulkMode"
          :collapsed="collapsedStages.includes(stage.id)"
          @add="$emit('add-deal', stage.id)"
          @deal-click="$emit('deal-click', $event)"
          @deal-select="handleDealSelect"
          @deal-whatsapp="$emit('deal-whatsapp', $event)"
          @deal-schedule="$emit('deal-schedule', $event)"
          @deal-menu="(d, e) => $emit('deal-menu', d, e)"
          @deal-drop="handleDealDrop"
          @collapse="(collapsed) => handleStageCollapse(stage.id, collapsed)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import PipelineColumn from './PipelineColumn.vue';

interface Stage {
  id: string;
  name: string;
  color: string;
  probability?: number;
  groupName?: string;
  sortOrder?: number;
}

interface StageGroup {
  name: string;
  color: string;
  stages: Stage[];
}

interface Deal {
  id: string;
  status?: string;
  clientName?: string;
  value: number;
  [key: string]: any;
}

interface Props {
  stages: Stage[];
  deals: Deal[];
  showGroups?: boolean;
  bulkMode?: boolean;
  selectedDeals?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  showGroups: true,
  bulkMode: false,
  selectedDeals: () => []
});

const emit = defineEmits<{
  'add-deal': [stageId: string];
  'deal-click': [deal: Deal];
  'deal-select': [dealId: string];
  'deal-whatsapp': [deal: Deal];
  'deal-schedule': [deal: Deal];
  'deal-menu': [deal: Deal, event: MouseEvent];
  'deal-move': [dealId: string, fromStage: string, toStage: string];
  'update:selectedDeals': [deals: string[]];
}>();

const collapsedGroups = ref<string[]>([]);
const collapsedStages = ref<string[]>([]);

// Group stages by groupName
const stageGroups = computed<StageGroup[]>(() => {
  const groups = new Map<string, Stage[]>();
  const groupColors = new Map<string, string>();

  // Sort stages by sortOrder
  const sortedStages = [...props.stages].sort((a, b) =>
    (a.sortOrder || 0) - (b.sortOrder || 0)
  );

  sortedStages.forEach(stage => {
    const groupName = stage.groupName || 'Outros';
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
      groupColors.set(groupName, stage.color);
    }
    groups.get(groupName)!.push(stage);
  });

  return Array.from(groups.entries()).map(([name, stages]) => ({
    name,
    color: groupColors.get(name) || '#666',
    stages
  }));
});

const getDealsByStage = (stageId: string): Deal[] => {
  return props.deals.filter(deal => deal.status === stageId);
};

const getGroupDealCount = (stages: Stage[]): number => {
  return stages.reduce((sum, stage) =>
    sum + getDealsByStage(stage.id).length, 0
  );
};

const getGroupTotalValue = (stages: Stage[]): number => {
  return stages.reduce((sum, stage) => {
    const stageDeals = getDealsByStage(stage.id);
    return sum + stageDeals.reduce((s, d) => s + (d.value || 0), 0);
  }, 0);
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

const toggleGroup = (groupName: string) => {
  const index = collapsedGroups.value.indexOf(groupName);
  if (index > -1) {
    collapsedGroups.value.splice(index, 1);
  } else {
    collapsedGroups.value.push(groupName);
  }
};

const handleStageCollapse = (stageId: string, collapsed: boolean) => {
  const index = collapsedStages.value.indexOf(stageId);
  if (collapsed && index === -1) {
    collapsedStages.value.push(stageId);
  } else if (!collapsed && index > -1) {
    collapsedStages.value.splice(index, 1);
  }
};

const handleDealSelect = (deal: Deal) => {
  const selected = [...props.selectedDeals];
  const index = selected.indexOf(deal.id);
  if (index > -1) {
    selected.splice(index, 1);
  } else {
    selected.push(deal.id);
  }
  emit('update:selectedDeals', selected);
  emit('deal-select', deal.id);
};

const handleDealDrop = (dealId: string, toStageId: string) => {
  const deal = props.deals.find(d => d.id === dealId);
  if (deal && deal.status && deal.status !== toStageId) {
    emit('deal-move', dealId, deal.status, toStageId);
  }
};

// Expand all groups/stages
const expandAll = () => {
  collapsedGroups.value = [];
  collapsedStages.value = [];
};

// Collapse all groups/stages
const collapseAll = () => {
  collapsedGroups.value = stageGroups.value.map(g => g.name);
};

defineExpose({ expandAll, collapseAll });
</script>

<style scoped>
.pipeline-board {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
  flex: 1;
}

/* Group Header */
.pipeline-board__group-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.12) 0%, var(--bg-card) 40%, var(--bg-elevated) 100%);
  border: 1px solid rgba(201, 169, 98, 0.15);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: sticky;
  top: 0;
  z-index: 5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(201, 169, 98, 0.05);
  backdrop-filter: blur(8px);
}

.pipeline-board__group-header:hover {
  border-color: rgba(201, 169, 98, 0.35);
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.15) 0%, var(--bg-elevated) 50%, var(--bg-card-hover) 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(201, 169, 98, 0.1);
}

.pipeline-board__group-header--collapsed {
  margin-bottom: 0;
  opacity: 0.8;
}

.pipeline-board__group-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
}

.pipeline-board__group-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.pipeline-board__group-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  font-weight: 500;
}

.pipeline-board__group-value {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-left: auto;
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.2) 0%, rgba(201, 169, 98, 0.1) 100%);
  padding: 6px 16px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(201, 169, 98, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.01em;
}

.pipeline-board__group-chevron {
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.pipeline-board__group-chevron--collapsed {
  transform: rotate(-90deg);
}

/* Stages Container - Horizontal Scroll */
.pipeline-board__stages {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--space-4) var(--space-3);
  min-height: 360px;
  max-height: 420px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 100%);
  border-radius: var(--radius-lg);
  margin-top: var(--space-3);
  border: 1px solid rgba(255, 255, 255, 0.02);
}

/* Ensure columns don't shrink */
.pipeline-board__stages > * {
  flex-shrink: 0;
}

/* Scrollbar styling */
.pipeline-board__stages::-webkit-scrollbar {
  height: 6px;
}

.pipeline-board__stages::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  margin: 0 var(--space-2);
}

.pipeline-board__stages::-webkit-scrollbar-thumb {
  background: var(--color-primary-alpha-30);
  border-radius: var(--radius-full);
  transition: background 0.2s;
}

.pipeline-board__stages::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-alpha-50);
}

/* Firefox scrollbar */
.pipeline-board__stages {
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary-alpha-30) var(--bg-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .pipeline-board__stages {
    min-height: 280px;
    max-height: 350px;
  }

  .pipeline-board__group-header {
    padding: var(--space-2) var(--space-3);
  }

  .pipeline-board__group-name {
    font-size: 0.85rem;
  }
}
</style>
