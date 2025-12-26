<template>
  <component
    :is="as"
    :class="[
      'ui-badge',
      `ui-badge--${variant}`,
      `ui-badge--${size}`,
      {
        'ui-badge--pill': pill,
        'ui-badge--dot': dot,
        'ui-badge--outline': outline,
        'ui-badge--interactive': interactive
      }
    ]"
    :tabindex="interactive ? 0 : undefined"
    @click="handleClick"
  >
    <span v-if="dot" class="ui-badge__dot" />
    <span v-if="$slots.icon && !dot" class="ui-badge__icon">
      <slot name="icon" />
    </span>
    <span v-if="!dot" class="ui-badge__content">
      <slot>{{ label }}</slot>
    </span>
    <button
      v-if="removable"
      type="button"
      class="ui-badge__remove"
      aria-label="Remover"
      @click.stop="$emit('remove')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </component>
</template>

<script setup lang="ts">
interface Props {
  as?: string;
  label?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  dot?: boolean;
  outline?: boolean;
  interactive?: boolean;
  removable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'span',
  variant: 'default',
  size: 'md',
  pill: false,
  dot: false,
  outline: false,
  interactive: false,
  removable: false
});

const emit = defineEmits<{
  click: [event: MouseEvent];
  remove: [];
}>();

const handleClick = (event: MouseEvent) => {
  if (props.interactive) {
    emit('click', event);
  }
};
</script>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-family);
  font-weight: var(--font-medium);
  white-space: nowrap;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

/* Sizes */
.ui-badge--sm {
  height: 20px;
  padding: 0 var(--space-2);
  font-size: var(--text-xs);
}

.ui-badge--md {
  height: 24px;
  padding: 0 var(--space-2);
  font-size: var(--text-sm);
}

.ui-badge--lg {
  height: 28px;
  padding: 0 var(--space-3);
  font-size: var(--text-base);
}

/* Pill */
.ui-badge--pill {
  border-radius: var(--radius-full);
}

/* Dot only */
.ui-badge--dot {
  width: auto;
  height: auto;
  padding: 0;
  background: transparent !important;
  border: none !important;
}

.ui-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.ui-badge--sm .ui-badge__dot {
  width: 6px;
  height: 6px;
}

.ui-badge--lg .ui-badge__dot {
  width: 10px;
  height: 10px;
}

/* Variants - Filled */
.ui-badge--default {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.ui-badge--primary {
  background: var(--color-primary-alpha-20);
  color: var(--color-primary);
  border: 1px solid transparent;
}

.ui-badge--success {
  background: var(--color-success-alpha-10);
  color: var(--color-success);
  border: 1px solid transparent;
}

.ui-badge--warning {
  background: var(--color-warning-alpha-10);
  color: var(--color-warning);
  border: 1px solid transparent;
}

.ui-badge--error {
  background: var(--color-error-alpha-10);
  color: var(--color-error);
  border: 1px solid transparent;
}

.ui-badge--info {
  background: var(--color-info-alpha-10);
  color: var(--color-info);
  border: 1px solid transparent;
}

/* Variants - Outline */
.ui-badge--outline.ui-badge--default {
  background: transparent;
  border-color: var(--border-strong);
}

.ui-badge--outline.ui-badge--primary {
  background: transparent;
  border-color: var(--color-primary);
}

.ui-badge--outline.ui-badge--success {
  background: transparent;
  border-color: var(--color-success);
}

.ui-badge--outline.ui-badge--warning {
  background: transparent;
  border-color: var(--color-warning);
}

.ui-badge--outline.ui-badge--error {
  background: transparent;
  border-color: var(--color-error);
}

.ui-badge--outline.ui-badge--info {
  background: transparent;
  border-color: var(--color-info);
}

/* Interactive */
.ui-badge--interactive {
  cursor: pointer;
}

.ui-badge--interactive:hover {
  filter: brightness(1.1);
}

.ui-badge--interactive:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--color-primary);
}

/* Icon */
.ui-badge__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-badge__icon svg {
  width: 12px;
  height: 12px;
}

.ui-badge--lg .ui-badge__icon svg {
  width: 14px;
  height: 14px;
}

/* Content */
.ui-badge__content {
  line-height: 1;
}

/* Remove button */
.ui-badge__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: var(--space-1);
  margin-right: calc(var(--space-1) * -1);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: currentColor;
  opacity: 0.6;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ui-badge__remove:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.2);
}

.ui-badge__remove svg {
  width: 10px;
  height: 10px;
}
</style>
