<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="ui-modal-overlay"
        @click.self="handleOverlayClick"
        @keydown.esc="handleEscape"
      >
        <div
          ref="modalRef"
          :class="[
            'ui-modal',
            `ui-modal--${size}`,
            { 'ui-modal--centered': centered }
          ]"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <!-- Header -->
          <div v-if="$slots.header || title || showClose" class="ui-modal__header">
            <slot name="header">
              <h2 v-if="title" :id="titleId" class="ui-modal__title">{{ title }}</h2>
              <p v-if="subtitle" class="ui-modal__subtitle">{{ subtitle }}</p>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="ui-modal__close"
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
          <div class="ui-modal__body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="ui-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  showClose?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  centered: true,
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

const modalRef = ref<HTMLDivElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);

const titleId = computed(() => `modal-title-${Math.random().toString(36).slice(2, 9)}`);

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
  if (!modalRef.value || event.key !== 'Tab') return;

  const focusableElements = modalRef.value.querySelectorAll(focusableSelectors);
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
    modalRef.value?.focus();
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
.ui-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-8);
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  overflow-y: auto;
}

.ui-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-height: calc(100vh - var(--space-16));
  outline: none;
}

.ui-modal--centered {
  margin: auto;
}

/* Sizes */
.ui-modal--sm {
  width: 100%;
  max-width: 400px;
}

.ui-modal--md {
  width: 100%;
  max-width: 500px;
}

.ui-modal--lg {
  width: 100%;
  max-width: 700px;
}

.ui-modal--xl {
  width: 100%;
  max-width: 900px;
}

.ui-modal--full {
  width: calc(100vw - var(--space-8));
  max-width: none;
  height: calc(100vh - var(--space-16));
}

/* Header */
.ui-modal__header {
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  padding-bottom: 0;
  position: relative;
}

.ui-modal__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  padding-right: var(--space-8);
}

.ui-modal__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
}

.ui-modal__close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
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
}

.ui-modal__close:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.ui-modal__close svg {
  width: var(--icon-md);
  height: var(--icon-md);
}

/* Body */
.ui-modal__body {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

/* Footer */
.ui-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-6);
  padding-top: 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}

.modal-enter-active .ui-modal,
.modal-leave-active .ui-modal {
  transition: transform var(--duration-normal) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .ui-modal,
.modal-leave-to .ui-modal {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* Responsive */
@media (max-width: 640px) {
  .ui-modal-overlay {
    padding: var(--space-4);
    align-items: flex-end;
  }

  .ui-modal {
    max-height: calc(100vh - var(--space-8));
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    margin-bottom: 0;
  }

  .ui-modal--sm,
  .ui-modal--md,
  .ui-modal--lg,
  .ui-modal--xl {
    max-width: none;
  }
}
</style>
