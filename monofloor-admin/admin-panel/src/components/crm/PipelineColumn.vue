<template>
  <div
    :class="[
      'pipeline-column',
      {
        'pipeline-column--collapsed': isCollapsed,
        'pipeline-column--drag-over': isDragOver
      }
    ]"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Header -->
    <div class="pipeline-column__header" @click="toggleCollapse">
      <div
        class="pipeline-column__indicator"
        :style="{ backgroundColor: stage.color }"
      />

      <div class="pipeline-column__title-wrapper">
        <h3 class="pipeline-column__title">{{ stage.name }}</h3>
        <span class="pipeline-column__count">{{ deals.length }}</span>
      </div>

      <div class="pipeline-column__value">
        {{ formatCurrency(totalValue) }}
      </div>

      <button
        v-if="!isCollapsed"
        class="pipeline-column__add"
        title="Adicionar deal"
        @click.stop="$emit('add')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <button
        class="pipeline-column__toggle"
        :title="isCollapsed ? 'Expandir' : 'Recolher'"
        @click.stop="toggleCollapse"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :class="{ 'pipeline-column__toggle-icon--rotated': !isCollapsed }"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

    <!-- Probability Bar -->
    <div v-if="!isCollapsed && stage.probability !== undefined" class="pipeline-column__probability">
      <div
        class="pipeline-column__probability-fill"
        :style="{ width: `${stage.probability}%` }"
      />
      <span class="pipeline-column__probability-label">{{ stage.probability }}% probabilidade</span>
    </div>

    <!-- Deals List -->
    <div
      v-show="!isCollapsed"
      ref="dealsContainer"
      class="pipeline-column__deals"
    >
      <TransitionGroup name="deal-list" tag="div">
        <DealCard
          v-for="deal in visibleDeals"
          :key="deal.id"
          :deal="deal"
          :selected="selectedDeals.includes(deal.id)"
          :selectable="selectable"
          @click="$emit('deal-click', deal)"
          @select="$emit('deal-select', deal)"
          @whatsapp="$emit('deal-whatsapp', deal)"
          @schedule="$emit('deal-schedule', deal)"
          @menu="(d, e) => $emit('deal-menu', d, e)"
          @dragstart="handleDealDragStart"
          @dragend="handleDealDragEnd"
        />
      </TransitionGroup>

      <!-- Load More -->
      <div
        v-if="hasMoreDeals"
        ref="loadMoreTrigger"
        class="pipeline-column__load-more"
      >
        <span>Carregar mais ({{ deals.length - visibleDeals.length }})</span>
      </div>

      <!-- Empty State -->
      <div v-if="deals.length === 0" class="pipeline-column__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <p>Nenhum deal neste estágio</p>
      </div>
    </div>

    <!-- Collapsed Preview -->
    <div v-if="isCollapsed" class="pipeline-column__collapsed-preview">
      <span class="pipeline-column__collapsed-count">{{ deals.length }}</span>
      <span class="pipeline-column__collapsed-value">{{ formatCurrency(totalValue) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import DealCard from './DealCard.vue';

interface Stage {
  id: string;
  name: string;
  color: string;
  probability?: number;
}

interface Deal {
  id: string;
  status?: string;
  clientName?: string;
  value: number;
  [key: string]: any;
}

interface Props {
  stage: Stage;
  deals: Deal[];
  selectedDeals?: string[];
  selectable?: boolean;
  initialPageSize?: number;
  collapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedDeals: () => [],
  selectable: false,
  initialPageSize: 10,
  collapsed: false
});

const emit = defineEmits<{
  'add': [];
  'deal-click': [deal: Deal];
  'deal-select': [deal: Deal];
  'deal-whatsapp': [deal: Deal];
  'deal-schedule': [deal: Deal];
  'deal-menu': [deal: Deal, event: MouseEvent];
  'deal-drop': [dealId: string, stageId: string];
  'collapse': [collapsed: boolean];
}>();

const dealsContainer = ref<HTMLDivElement | null>(null);
const loadMoreTrigger = ref<HTMLDivElement | null>(null);

const isCollapsed = ref(props.collapsed);
const isDragOver = ref(false);
const pageSize = ref(props.initialPageSize);

let intersectionObserver: IntersectionObserver | null = null;

const totalValue = computed(() =>
  props.deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
);

const visibleDeals = computed(() =>
  props.deals.slice(0, pageSize.value)
);

const hasMoreDeals = computed(() =>
  props.deals.length > pageSize.value
);

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

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('collapse', isCollapsed.value);
};

const loadMore = () => {
  pageSize.value += props.initialPageSize;
};

const handleDragOver = (event: DragEvent) => {
  isDragOver.value = true;
  event.dataTransfer!.dropEffect = 'move';
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const dealId = event.dataTransfer?.getData('text/plain');
  if (dealId) {
    emit('deal-drop', dealId, props.stage.id);
  }
};

const handleDealDragStart = (deal: Deal) => {
  // Parent handles this
};

const handleDealDragEnd = (deal: Deal) => {
  // Parent handles this
};

// Setup intersection observer for infinite scroll
onMounted(() => {
  if (loadMoreTrigger.value) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && hasMoreDeals.value) {
          loadMore();
        }
      },
      { root: dealsContainer.value, threshold: 0.1 }
    );
    intersectionObserver.observe(loadMoreTrigger.value);
  }
});

onBeforeUnmount(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
});

watch(() => props.collapsed, (newVal) => {
  isCollapsed.value = newVal;
});
</script>

<style scoped>
.pipeline-column {
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  height: 100%;
  max-height: 380px;
  background: linear-gradient(180deg, var(--bg-card) 0%, rgba(15, 15, 15, 0.98) 50%, var(--bg-secondary) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.pipeline-column:hover {
  border-color: rgba(201, 169, 98, 0.25);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(201, 169, 98, 0.08);
  transform: translateY(-3px);
}

.pipeline-column--collapsed {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
}

.pipeline-column--drag-over {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 98, 0.08) 100%);
  box-shadow: 0 0 20px rgba(201, 169, 98, 0.2);
}

/* Header */
.pipeline-column__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(145deg, var(--bg-elevated) 0%, rgba(25, 25, 25, 0.95) 50%, var(--bg-card) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.pipeline-column__header:hover {
  background: linear-gradient(145deg, rgba(201, 169, 98, 0.08) 0%, var(--bg-elevated) 50%, var(--bg-card) 100%);
}

.pipeline-column--collapsed .pipeline-column__header {
  flex-direction: column;
  padding: var(--space-2);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
}

.pipeline-column__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pipeline-column__title-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pipeline-column--collapsed .pipeline-column__title-wrapper {
  flex-direction: row;
}

.pipeline-column__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pipeline-column__count {
  background: rgba(201, 169, 98, 0.15);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.pipeline-column__value {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(201, 169, 98, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.pipeline-column--collapsed .pipeline-column__value {
  display: none;
}

.pipeline-column__add,
.pipeline-column__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pipeline-column__add:hover,
.pipeline-column__toggle:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.pipeline-column__add svg,
.pipeline-column__toggle svg {
  width: 16px;
  height: 16px;
}

.pipeline-column__toggle-icon--rotated {
  transform: rotate(90deg);
}

.pipeline-column--collapsed .pipeline-column__add,
.pipeline-column--collapsed .pipeline-column__toggle {
  display: none;
}

/* Probability Bar */
.pipeline-column__probability {
  position: relative;
  height: 4px;
  background: var(--bg-elevated);
}

.pipeline-column__probability-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width var(--transition-normal);
}

.pipeline-column__probability-label {
  position: absolute;
  top: 8px;
  left: var(--space-3);
  font-size: 10px;
  color: var(--text-tertiary);
}

/* Deals List */
.pipeline-column__deals {
  flex: 1;
  padding: var(--space-3);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
  background: rgba(0, 0, 0, 0.1);
}

/* Custom scrollbar for deals */
.pipeline-column__deals::-webkit-scrollbar {
  width: 4px;
}

.pipeline-column__deals::-webkit-scrollbar-track {
  background: transparent;
}

.pipeline-column__deals::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: var(--radius-full);
}

.pipeline-column__deals::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-alpha-50);
}

.pipeline-column__load-more {
  padding: var(--space-2);
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.pipeline-column__load-more:hover {
  color: var(--color-primary);
}

.pipeline-column__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  color: var(--text-tertiary);
  flex: 1;
}

.pipeline-column__empty svg {
  width: 32px;
  height: 32px;
  margin-bottom: var(--space-2);
  opacity: 0.3;
}

.pipeline-column__empty p {
  font-size: 0.75rem;
  margin: 0;
  text-align: center;
}

/* Collapsed Preview */
.pipeline-column__collapsed-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  gap: var(--space-2);
  writing-mode: horizontal-tb;
}

.pipeline-column__collapsed-count {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.pipeline-column__collapsed-value {
  font-size: var(--text-xs);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
}

/* Deal list transitions */
.deal-list-enter-active,
.deal-list-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.deal-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.deal-list-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.deal-list-move {
  transition: transform var(--duration-normal) var(--ease-out);
}
</style>
