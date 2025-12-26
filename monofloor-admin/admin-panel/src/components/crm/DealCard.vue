<template>
  <div
    :class="[
      'deal-card',
      {
        'deal-card--selected': selected,
        'deal-card--dragging': isDragging,
        'deal-card--overdue': hasOverdueFollowup
      }
    ]"
    :draggable="!disabled"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="$emit('click', deal)"
  >
    <!-- Header -->
    <div class="deal-card__header">
      <div class="deal-card__client">
        <span class="deal-card__client-name">{{ deal.clientName }}</span>
        <span v-if="deal.projectType" class="deal-card__project-type">{{ deal.projectType }}</span>
      </div>

      <!-- Lead Score Gauge -->
      <div v-if="deal.leadScore !== undefined" class="deal-card__score" :title="`Lead Score: ${deal.leadScore}`">
        <svg viewBox="0 0 36 36" class="deal-card__score-ring">
          <path
            class="deal-card__score-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="deal-card__score-fill"
            :stroke="scoreColor"
            :stroke-dasharray="`${deal.leadScore}, 100`"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span class="deal-card__score-value">{{ deal.leadScore }}</span>
      </div>
    </div>

    <!-- Value -->
    <div class="deal-card__value">
      <span class="deal-card__value-amount">{{ formatCurrency(deal.value) }}</span>
      <span v-if="deal.m2" class="deal-card__m2">{{ deal.m2 }} m²</span>
    </div>

    <!-- Info Row -->
    <div class="deal-card__info">
      <!-- Consultor -->
      <div v-if="deal.consultant" class="deal-card__consultant" :title="deal.consultant.name">
        <img
          v-if="deal.consultant.avatar"
          :src="deal.consultant.avatar"
          :alt="deal.consultant.name"
          class="deal-card__consultant-avatar"
        />
        <span v-else class="deal-card__consultant-initials">
          {{ getInitials(deal.consultant.name) }}
        </span>
      </div>

      <!-- Days in Stage -->
      <div
        v-if="deal.daysInStage !== undefined"
        class="deal-card__days"
        :class="{ 'deal-card__days--warning': deal.daysInStage > 7 }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        {{ deal.daysInStage }}d
      </div>

      <!-- Follow-up Indicator -->
      <div
        v-if="nextFollowup"
        class="deal-card__followup"
        :class="followupClass"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{{ formatFollowupDate(nextFollowup.date) }}</span>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="deal.tags && deal.tags.length > 0" class="deal-card__tags">
      <span
        v-for="tag in deal.tags.slice(0, 3)"
        :key="tag.id"
        class="deal-card__tag"
        :style="{ backgroundColor: tag.color + '20', color: tag.color }"
      >
        {{ tag.name }}
      </span>
      <span v-if="deal.tags.length > 3" class="deal-card__tag deal-card__tag--more">
        +{{ deal.tags.length - 3 }}
      </span>
    </div>

    <!-- Quick Actions -->
    <div class="deal-card__actions" @click.stop>
      <button
        class="deal-card__action"
        title="WhatsApp"
        @click="$emit('whatsapp', deal)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>
      <button
        class="deal-card__action"
        title="Agendar Follow-up"
        @click="$emit('schedule', deal)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="12" y1="14" x2="12" y2="18"/>
          <line x1="10" y1="16" x2="14" y2="16"/>
        </svg>
      </button>
      <button
        class="deal-card__action"
        title="Mais opções"
        @click="$emit('menu', deal, $event)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    </div>

    <!-- Selection Checkbox -->
    <div v-if="selectable" class="deal-card__checkbox" @click.stop="$emit('select', deal)">
      <div :class="['deal-card__checkbox-box', { 'deal-card__checkbox-box--checked': selected }]">
        <svg v-if="selected" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Consultant {
  id: string;
  name: string;
  avatar?: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Followup {
  id: string;
  date: string;
  type: string;
}

interface Deal {
  id: string;
  status?: string;
  clientName?: string;
  projectType?: string;
  value: number;
  m2?: number;
  leadScore?: number;
  daysInStage?: number;
  consultant?: Consultant;
  tags?: Tag[];
  nextFollowup?: Followup;
  phone?: string;
  [key: string]: any;
}

interface Props {
  deal: Deal;
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectable: false,
  disabled: false
});

const emit = defineEmits<{
  click: [deal: Deal];
  select: [deal: Deal];
  whatsapp: [deal: Deal];
  schedule: [deal: Deal];
  menu: [deal: Deal, event: MouseEvent];
  dragstart: [deal: Deal, event: DragEvent];
  dragend: [deal: Deal, event: DragEvent];
}>();

const isDragging = ref(false);

const nextFollowup = computed(() => props.deal.nextFollowup);

const hasOverdueFollowup = computed(() => {
  if (!nextFollowup.value) return false;
  return new Date(nextFollowup.value.date) < new Date();
});

const followupClass = computed(() => {
  if (!nextFollowup.value) return '';
  const date = new Date(nextFollowup.value.date);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'deal-card__followup--overdue';
  if (diffDays === 0) return 'deal-card__followup--today';
  if (diffDays <= 2) return 'deal-card__followup--soon';
  return '';
});

const scoreColor = computed(() => {
  const score = props.deal.leadScore || 0;
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-primary)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-error)';
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatFollowupDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`;
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true;
  event.dataTransfer?.setData('text/plain', props.deal.id);
  emit('dragstart', props.deal, event);
};

const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false;
  emit('dragend', props.deal, event);
};
</script>

<style scoped>
.deal-card {
  position: relative;
  background: linear-gradient(155deg, var(--bg-card) 0%, rgba(18, 18, 18, 0.98) 50%, var(--bg-elevated) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.deal-card:hover {
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(201, 169, 98, 0.08);
}

.deal-card:hover .deal-card__actions {
  opacity: 1;
}

.deal-card--selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 98, 0.05) 100%);
}

.deal-card--dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.deal-card--overdue {
  border-left: 3px solid var(--color-error);
}

/* Header */
.deal-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.deal-card__client {
  flex: 1;
  min-width: 0;
}

.deal-card__client-name {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deal-card__project-type {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

/* Lead Score */
.deal-card__score {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.deal-card__score-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.deal-card__score-bg {
  fill: none;
  stroke: var(--bg-elevated);
  stroke-width: 3;
}

.deal-card__score-fill {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray var(--transition-normal);
}

.deal-card__score-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

/* Value */
.deal-card__value {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.deal-card__value-amount {
  font-size: var(--text-md);
  font-weight: var(--font-bold);
  color: var(--color-primary);
}

.deal-card__m2 {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* Info Row */
.deal-card__info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.deal-card__consultant {
  display: flex;
  align-items: center;
}

.deal-card__consultant-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.deal-card__consultant-initials {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
}

.deal-card__days {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.deal-card__days svg {
  width: 12px;
  height: 12px;
}

.deal-card__days--warning {
  color: var(--color-warning);
}

.deal-card__followup {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-left: auto;
}

.deal-card__followup svg {
  width: 12px;
  height: 12px;
}

.deal-card__followup--today {
  color: var(--color-info);
}

.deal-card__followup--soon {
  color: var(--color-warning);
}

.deal-card__followup--overdue {
  color: var(--color-error);
}

/* Tags */
.deal-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.deal-card__tag {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: var(--font-medium);
}

.deal-card__tag--more {
  background: var(--bg-elevated);
  color: var(--text-tertiary);
}

/* Actions */
.deal-card__actions {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.deal-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.deal-card__action:hover {
  background: var(--color-primary-alpha-10);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.deal-card__action svg {
  width: 14px;
  height: 14px;
}

/* Checkbox */
.deal-card__checkbox {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
}

.deal-card__checkbox-box {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-strong);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.deal-card__checkbox-box:hover {
  border-color: var(--color-primary);
}

.deal-card__checkbox-box--checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.deal-card__checkbox-box svg {
  width: 12px;
  height: 12px;
  color: var(--text-inverse);
}
</style>
