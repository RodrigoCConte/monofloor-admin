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
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface ToastOptions {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

interface Toast extends Required<Omit<ToastOptions, 'title'>> {
  title?: string;
}

interface Props {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  maxToasts?: number;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-right',
  maxToasts: 5
});

const toasts = ref<Toast[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const addToast = (options: ToastOptions) => {
  const toast: Toast = {
    id: options.id || generateId(),
    type: options.type || 'info',
    title: options.title,
    message: options.message,
    duration: options.duration ?? 5000,
    dismissible: options.dismissible ?? true
  };

  // Remove oldest if max reached
  if (toasts.value.length >= props.maxToasts) {
    const oldest = toasts.value[0];
    if (oldest) {
      removeToast(oldest.id);
    }
  }

  toasts.value.push(toast);

  if (toast.duration > 0) {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);
    timers.set(toast.id, timer);
  }

  return toast.id;
};

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }

  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
};

const clearAll = () => {
  toasts.value = [];
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
};

// Convenience methods
const success = (message: string, options?: Partial<ToastOptions>) =>
  addToast({ ...options, message, type: 'success' });

const error = (message: string, options?: Partial<ToastOptions>) =>
  addToast({ ...options, message, type: 'error' });

const warning = (message: string, options?: Partial<ToastOptions>) =>
  addToast({ ...options, message, type: 'warning' });

const info = (message: string, options?: Partial<ToastOptions>) =>
  addToast({ ...options, message, type: 'info' });

onBeforeUnmount(() => {
  clearAll();
});

defineExpose({
  addToast,
  removeToast,
  clearAll,
  success,
  error,
  warning,
  info,
  toasts
});
</script>

<style scoped>
.ui-toast-container {
  position: fixed;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

.ui-toast-container--top-right {
  top: var(--space-6);
  right: var(--space-6);
}

.ui-toast-container--top-left {
  top: var(--space-6);
  left: var(--space-6);
}

.ui-toast-container--top-center {
  top: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
}

.ui-toast-container--bottom-right {
  bottom: var(--space-6);
  right: var(--space-6);
  flex-direction: column-reverse;
}

.ui-toast-container--bottom-left {
  bottom: var(--space-6);
  left: var(--space-6);
  flex-direction: column-reverse;
}

.ui-toast-container--bottom-center {
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column-reverse;
}

.ui-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  overflow: hidden;
}

.ui-toast--success {
  border-color: var(--color-success);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.05) 100%);
}

.ui-toast--success .ui-toast__icon {
  color: var(--color-success);
}

.ui-toast--error {
  border-color: var(--color-error);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.ui-toast--error .ui-toast__icon {
  color: var(--color-error);
}

.ui-toast--warning {
  border-color: var(--color-warning);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(249, 115, 22, 0.05) 100%);
}

.ui-toast--warning .ui-toast__icon {
  color: var(--color-warning);
}

.ui-toast--info {
  border-color: var(--color-info);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.ui-toast--info .ui-toast__icon {
  color: var(--color-info);
}

.ui-toast__icon {
  flex-shrink: 0;
  width: var(--icon-lg);
  height: var(--icon-lg);
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
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.ui-toast__message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
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
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ui-toast__close:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.ui-toast__close svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
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
  animation: toast-in var(--duration-normal) var(--ease-out);
}

.toast-leave-active {
  animation: toast-out var(--duration-fast) var(--ease-in);
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

/* Position-based animations */
.ui-toast-container--top-left .toast-enter-active,
.ui-toast-container--bottom-left .toast-enter-active {
  animation-name: toast-in-left;
}

.ui-toast-container--top-left .toast-leave-active,
.ui-toast-container--bottom-left .toast-leave-active {
  animation-name: toast-out-left;
}

@keyframes toast-in-left {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-out-left {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

.ui-toast-container--top-center .toast-enter-active,
.ui-toast-container--bottom-center .toast-enter-active {
  animation-name: toast-in-center;
}

.ui-toast-container--top-center .toast-leave-active,
.ui-toast-container--bottom-center .toast-leave-active {
  animation-name: toast-out-center;
}

@keyframes toast-in-center {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-out-center {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .ui-toast-container {
    left: var(--space-4) !important;
    right: var(--space-4) !important;
    max-width: none;
    transform: none !important;
  }
}
</style>
