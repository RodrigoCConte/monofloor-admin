<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="ui-drawer-overlay"
        @click.self="handleOverlayClick"
        @keydown.esc="handleEscape"
      >
        <div
          ref="drawerRef"
          :class="[
            'ui-drawer',
            `ui-drawer--${position}`,
            `ui-drawer--${size}`
          ]"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <!-- Header -->
          <div v-if="$slots.header || title || showClose" class="ui-drawer__header">
            <slot name="header">
              <div class="ui-drawer__header-content">
                <h2 v-if="title" :id="titleId" class="ui-drawer__title">{{ title }}</h2>
                <p v-if="subtitle" class="ui-drawer__subtitle">{{ subtitle }}</p>
              </div>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="ui-drawer__close"
              aria-label="Fechar"
              @click="close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="ui-drawer__body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="ui-drawer__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  subtitle?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'right',
  size: 'md',
  showClose: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  preventScroll: true
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
  open: [];
}>();

const drawerRef = ref<HTMLDivElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);

const titleId = computed(() => `drawer-title-${Math.random().toString(36).slice(2, 9)}`);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (props.closeOnEscape && event.key === 'Escape') {
    close();
  }
};

// Focus trap
const focusableSelectors = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

const trapFocus = (event: KeyboardEvent) => {
  if (!drawerRef.value || event.key !== 'Tab') return;

  const focusableElements = drawerRef.value.querySelectorAll(focusableSelectors);
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
};

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    previousActiveElement.value = document.activeElement as HTMLElement;

    if (props.preventScroll) {
      document.body.style.overflow = 'hidden';
    }

    await nextTick();
    drawerRef.value?.focus();
    document.addEventListener('keydown', trapFocus);

    emit('open');
  } else {
    if (props.preventScroll) {
      document.body.style.overflow = '';
    }

    document.removeEventListener('keydown', trapFocus);
    previousActiveElement.value?.focus();
  }
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', trapFocus);
});

defineExpose({ close });
</script>

<style scoped>
.ui-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
}

.ui-drawer {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  box-shadow: var(--shadow-2xl);
  outline: none;
  overflow: hidden;
}

/* Positions */
.ui-drawer--right {
  top: 0;
  right: 0;
  bottom: 0;
  border-left: 1px solid var(--border-default);
  border-top-left-radius: var(--radius-xl);
  border-bottom-left-radius: var(--radius-xl);
}

.ui-drawer--left {
  top: 0;
  left: 0;
  bottom: 0;
  border-right: 1px solid var(--border-default);
  border-top-right-radius: var(--radius-xl);
  border-bottom-right-radius: var(--radius-xl);
}

.ui-drawer--top {
  top: 0;
  left: 0;
  right: 0;
  border-bottom: 1px solid var(--border-default);
  border-bottom-left-radius: var(--radius-xl);
  border-bottom-right-radius: var(--radius-xl);
}

.ui-drawer--bottom {
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid var(--border-default);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
}

/* Sizes - Horizontal */
.ui-drawer--right.ui-drawer--sm,
.ui-drawer--left.ui-drawer--sm {
  width: 320px;
}

.ui-drawer--right.ui-drawer--md,
.ui-drawer--left.ui-drawer--md {
  width: 480px;
}

.ui-drawer--right.ui-drawer--lg,
.ui-drawer--left.ui-drawer--lg {
  width: 640px;
}

.ui-drawer--right.ui-drawer--xl,
.ui-drawer--left.ui-drawer--xl {
  width: 800px;
}

.ui-drawer--right.ui-drawer--full,
.ui-drawer--left.ui-drawer--full {
  width: 100%;
}

/* Sizes - Vertical */
.ui-drawer--top.ui-drawer--sm,
.ui-drawer--bottom.ui-drawer--sm {
  height: 200px;
}

.ui-drawer--top.ui-drawer--md,
.ui-drawer--bottom.ui-drawer--md {
  height: 320px;
}

.ui-drawer--top.ui-drawer--lg,
.ui-drawer--bottom.ui-drawer--lg {
  height: 480px;
}

.ui-drawer--top.ui-drawer--xl,
.ui-drawer--bottom.ui-drawer--xl {
  height: 640px;
}

.ui-drawer--top.ui-drawer--full,
.ui-drawer--bottom.ui-drawer--full {
  height: 100%;
}

/* Header */
.ui-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.ui-drawer__header-content {
  flex: 1;
  min-width: 0;
}

.ui-drawer__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.ui-drawer__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
}

.ui-drawer__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.ui-drawer__close:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.ui-drawer__close svg {
  width: var(--icon-md);
  height: var(--icon-md);
}

/* Body */
.ui-drawer__body {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

/* Footer */
.ui-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-6);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

/* Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}

.drawer-enter-active .ui-drawer,
.drawer-leave-active .ui-drawer {
  transition: transform var(--duration-normal) var(--ease-out);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

/* Right */
.drawer-enter-from .ui-drawer--right,
.drawer-leave-to .ui-drawer--right {
  transform: translateX(100%);
}

/* Left */
.drawer-enter-from .ui-drawer--left,
.drawer-leave-to .ui-drawer--left {
  transform: translateX(-100%);
}

/* Top */
.drawer-enter-from .ui-drawer--top,
.drawer-leave-to .ui-drawer--top {
  transform: translateY(-100%);
}

/* Bottom */
.drawer-enter-from .ui-drawer--bottom,
.drawer-leave-to .ui-drawer--bottom {
  transform: translateY(100%);
}

/* Responsive */
@media (max-width: 640px) {
  .ui-drawer--right,
  .ui-drawer--left {
    width: 100% !important;
    border-radius: 0;
  }

  .ui-drawer--right {
    border-left: none;
  }

  .ui-drawer--left {
    border-right: none;
  }
}
</style>
