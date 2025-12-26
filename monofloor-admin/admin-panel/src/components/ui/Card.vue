<template>
  <component
    :is="as"
    :class="[
      'ui-card',
      `ui-card--${variant}`,
      {
        'ui-card--hoverable': hoverable,
        'ui-card--clickable': clickable,
        'ui-card--selected': selected,
        'ui-card--loading': loading,
        'ui-card--bordered': bordered,
        'ui-card--compact': compact
      }
    ]"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Loading overlay -->
    <div v-if="loading" class="ui-card__loading">
      <div class="ui-card__spinner" />
    </div>

    <!-- Header -->
    <div v-if="$slots.header || title" class="ui-card__header">
      <slot name="header">
        <div class="ui-card__header-content">
          <h3 v-if="title" class="ui-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="ui-card__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="ui-card__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Media -->
    <div v-if="$slots.media || image" class="ui-card__media">
      <slot name="media">
        <img v-if="image" :src="image" :alt="imageAlt" class="ui-card__image" />
      </slot>
    </div>

    <!-- Body -->
    <div class="ui-card__body">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="ui-card__footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<script setup lang="ts">
interface Props {
  as?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  title?: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  hoverable?: boolean;
  clickable?: boolean;
  selected?: boolean;
  loading?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  variant: 'default',
  imageAlt: '',
  hoverable: false,
  clickable: false,
  selected: false,
  loading: false,
  bordered: true,
  compact: false
});

const emit = defineEmits<{
  click: [event: MouseEvent | KeyboardEvent];
}>();

const handleClick = (event: MouseEvent | KeyboardEvent) => {
  if (props.clickable && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.ui-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  overflow: hidden;
}

/* Variants */
.ui-card--default {
  background: var(--bg-card);
}

.ui-card--default.ui-card--bordered {
  border: 1px solid var(--border-default);
}

.ui-card--elevated {
  background: var(--bg-elevated);
  box-shadow: var(--shadow-md);
}

.ui-card--outlined {
  background: transparent;
  border: 1px solid var(--border-strong);
}

.ui-card--ghost {
  background: transparent;
}

/* States */
.ui-card--hoverable:hover {
  background: var(--bg-card-hover);
}

.ui-card--clickable {
  cursor: pointer;
}

.ui-card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.ui-card--clickable:active {
  transform: translateY(0);
}

.ui-card--clickable:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--color-primary);
}

.ui-card--selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-sm);
}

.ui-card--loading {
  pointer-events: none;
}

.ui-card--compact .ui-card__body {
  padding: var(--space-3);
}

.ui-card--compact .ui-card__header {
  padding: var(--space-3);
  padding-bottom: 0;
}

.ui-card--compact .ui-card__footer {
  padding: var(--space-3);
  padding-top: 0;
}

/* Loading */
.ui-card__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(2px);
  z-index: 10;
}

.ui-card__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-default);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Header */
.ui-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  padding-bottom: 0;
}

.ui-card__header-content {
  flex: 1;
  min-width: 0;
}

.ui-card__title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-tight);
}

.ui-card__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
  line-height: var(--leading-normal);
}

.ui-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* Media */
.ui-card__media {
  position: relative;
  overflow: hidden;
}

.ui-card__image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* Body */
.ui-card__body {
  flex: 1;
  padding: var(--space-4);
}

.ui-card__header + .ui-card__body {
  padding-top: var(--space-3);
}

/* Footer */
.ui-card__footer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  padding-top: 0;
  margin-top: auto;
}

.ui-card__header + .ui-card__footer,
.ui-card__body + .ui-card__footer {
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--space-4);
  margin-top: var(--space-2);
}
</style>
