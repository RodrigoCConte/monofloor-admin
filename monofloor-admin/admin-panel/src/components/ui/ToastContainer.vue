<template>
  <Teleport to="body">
    <TransitionGroup
      name="toast"
      tag="div"
      class="ui-toast-container"
      :class="`ui-toast-container--${position}`"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'ui-toast',
          `ui-toast--${toast.type}`
        ]"
        role="alert"
        :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="ui-toast__icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>

        <div class="ui-toast__content">
          <p v-if="toast.title" class="ui-toast__title">{{ toast.title }}</p>
          <p class="ui-toast__message">{{ toast.message }}</p>
        </div>

        <button
          v-if="toast.dismissible"
          type="button"
          class="ui-toast__close"
          aria-label="Fechar"
          @click="removeToast(toast.id)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div
          v-if="toast.duration && toast.duration > 0"
          class="ui-toast__progress"
          :style="{ animationDuration: `${toast.duration}ms` }"
        />
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';

interface Props {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

withDefaults(defineProps<Props>(), {
  position: 'top-right'
});

const { toasts, removeToast } = useToast();
</script>

<style scoped>
.ui-toast-container {
  position: fixed;
  z-index: var(--z-toast, 800);
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

.ui-toast-container--top-right {
  top: var(--space-6, 24px);
  right: var(--space-6, 24px);
}

.ui-toast-container--top-left {
  top: var(--space-6, 24px);
  left: var(--space-6, 24px);
}

.ui-toast-container--top-center {
  top: var(--space-6, 24px);
  left: 50%;
  transform: translateX(-50%);
}

.ui-toast-container--bottom-right {
  bottom: var(--space-6, 24px);
  right: var(--space-6, 24px);
  flex-direction: column-reverse;
}

.ui-toast-container--bottom-left {
  bottom: var(--space-6, 24px);
  left: var(--space-6, 24px);
  flex-direction: column-reverse;
}

.ui-toast-container--bottom-center {
  bottom: var(--space-6, 24px);
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column-reverse;
}

.ui-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 12px);
  padding: var(--space-4, 16px);
  background: var(--bg-card, #141414);
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-lg, 0 8px 16px rgba(0, 0, 0, 0.3));
  pointer-events: auto;
  overflow: hidden;
}

.ui-toast--success {
  border-color: var(--color-success, #22c55e);
  background: linear-gradient(135deg, var(--bg-card, #141414) 0%, rgba(34, 197, 94, 0.05) 100%);
}

.ui-toast--success .ui-toast__icon {
  color: var(--color-success, #22c55e);
}

.ui-toast--error {
  border-color: var(--color-error, #ef4444);
  background: linear-gradient(135deg, var(--bg-card, #141414) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.ui-toast--error .ui-toast__icon {
  color: var(--color-error, #ef4444);
}

.ui-toast--warning {
  border-color: var(--color-warning, #f97316);
  background: linear-gradient(135deg, var(--bg-card, #141414) 0%, rgba(249, 115, 22, 0.05) 100%);
}

.ui-toast--warning .ui-toast__icon {
  color: var(--color-warning, #f97316);
}

.ui-toast--info {
  border-color: var(--color-info, #3b82f6);
  background: linear-gradient(135deg, var(--bg-card, #141414) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.ui-toast--info .ui-toast__icon {
  color: var(--color-info, #3b82f6);
}

.ui-toast__icon {
  flex-shrink: 0;
  width: var(--icon-lg, 24px);
  height: var(--icon-lg, 24px);
}

.ui-toast__icon svg {
  width: 100%;
  height: 100%;
}

.ui-toast__content {
  flex: 1;
  min-width: 0;
}

.ui-toast__title {
  font-size: var(--text-base, 0.875rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #ffffff);
  margin: 0 0 var(--space-1, 4px);
}

.ui-toast__message {
  font-size: var(--text-sm, 0.8125rem);
  color: var(--text-secondary, #a1a1a1);
  margin: 0;
  line-height: var(--leading-relaxed, 1.625);
}

.ui-toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: var(--radius-sm, 6px);
  color: var(--text-tertiary, #666666);
  cursor: pointer;
  transition: all 150ms ease;
}

.ui-toast__close:hover {
  background: var(--bg-elevated, #1f1f1f);
  color: var(--text-primary, #ffffff);
}

.ui-toast__close svg {
  width: var(--icon-sm, 16px);
  height: var(--icon-sm, 16px);
}

.ui-toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: toast-progress linear forwards;
}

@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Transitions */
.toast-enter-active {
  animation: toast-in 250ms ease-out;
}

.toast-leave-active {
  animation: toast-out 150ms ease-in;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .ui-toast-container {
    left: var(--space-4, 16px) !important;
    right: var(--space-4, 16px) !important;
    max-width: none;
    transform: none !important;
  }
}
</style>
