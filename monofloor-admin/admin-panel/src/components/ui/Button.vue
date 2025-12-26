<template>
  <button
    :class="[
      'ui-button',
      `ui-button--${variant}`,
      `ui-button--${size}`,
      {
        'ui-button--loading': loading,
        'ui-button--disabled': disabled,
        'ui-button--icon-only': iconOnly,
        'ui-button--full-width': fullWidth
      }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <span v-if="loading" class="ui-button__spinner">
      <svg class="animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </span>
    <span v-if="$slots.icon && !loading" class="ui-button__icon ui-button__icon--left">
      <slot name="icon" />
    </span>
    <span v-if="!iconOnly" class="ui-button__content">
      <slot />
    </span>
    <span v-if="$slots.iconRight && !loading" class="ui-button__icon ui-button__icon--right">
      <slot name="iconRight" />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  iconOnly: false,
  fullWidth: false
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.ui-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-family);
  font-weight: var(--font-semibold);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  text-decoration: none;
  outline: none;
}

.ui-button:focus-visible {
  box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--color-primary);
}

/* Sizes */
.ui-button--sm {
  height: var(--btn-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.ui-button--md {
  height: var(--btn-height-md);
  padding: 0 var(--space-4);
  font-size: var(--text-base);
}

.ui-button--lg {
  height: var(--btn-height-lg);
  padding: 0 var(--space-6);
  font-size: var(--text-md);
}

/* Icon only adjustments */
.ui-button--icon-only.ui-button--sm {
  width: var(--btn-height-sm);
  padding: 0;
}

.ui-button--icon-only.ui-button--md {
  width: var(--btn-height-md);
  padding: 0;
}

.ui-button--icon-only.ui-button--lg {
  width: var(--btn-height-lg);
  padding: 0;
}

/* Variants */
.ui-button--primary {
  background: var(--gradient-primary);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.ui-button--primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  box-shadow: var(--shadow-md), var(--glow-primary);
  transform: translateY(-1px);
}

.ui-button--primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-xs);
}

.ui-button--secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.ui-button--secondary:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.ui-button--ghost {
  background: transparent;
  color: var(--text-secondary);
}

.ui-button--ghost:hover:not(:disabled) {
  background: var(--color-primary-alpha-10);
  color: var(--color-primary);
}

.ui-button--danger {
  background: var(--color-error);
  color: white;
}

.ui-button--danger:hover:not(:disabled) {
  background: var(--color-error-light);
  box-shadow: var(--shadow-md), var(--glow-error);
  transform: translateY(-1px);
}

.ui-button--success {
  background: var(--color-success);
  color: white;
}

.ui-button--success:hover:not(:disabled) {
  background: var(--color-success-light);
  box-shadow: var(--shadow-md), var(--glow-success);
  transform: translateY(-1px);
}

.ui-button--outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--border-primary);
}

.ui-button--outline:hover:not(:disabled) {
  background: var(--color-primary-alpha-10);
  border-color: var(--color-primary);
}

/* States */
.ui-button--disabled,
.ui-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.ui-button--loading {
  cursor: wait;
}

.ui-button--full-width {
  width: 100%;
}

/* Elements */
.ui-button__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-button__spinner svg {
  width: var(--icon-md);
  height: var(--icon-md);
}

.ui-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-button__icon svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.ui-button--lg .ui-button__icon svg {
  width: var(--icon-md);
  height: var(--icon-md);
}

.ui-button__content {
  display: flex;
  align-items: center;
}

/* Animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
