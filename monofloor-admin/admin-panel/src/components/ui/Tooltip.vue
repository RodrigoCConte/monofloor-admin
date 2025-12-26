<template>
  <div
    ref="triggerRef"
    class="ui-tooltip-wrapper"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
  >
    <slot />

    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="isVisible && (content || $slots.content)"
          ref="tooltipRef"
          :class="[
            'ui-tooltip',
            `ui-tooltip--${actualPosition}`
          ]"
          :style="tooltipStyle"
          role="tooltip"
          :aria-hidden="!isVisible"
        >
          <div class="ui-tooltip__content">
            <slot name="content">
              {{ content }}
            </slot>
          </div>
          <div class="ui-tooltip__arrow" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

interface Props {
  content?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  maxWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  delay: 200,
  disabled: false,
  maxWidth: 300
});

const triggerRef = ref<HTMLDivElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

const isVisible = ref(false);
const actualPosition = ref(props.position);
const tooltipStyle = ref<Record<string, string>>({});

let showTimeout: ReturnType<typeof setTimeout> | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

const calculatePosition = async () => {
  await nextTick();

  if (!triggerRef.value || !tooltipRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();

  const gap = 8;
  const viewportPadding = 8;

  let top = 0;
  let left = 0;
  let position = props.position;

  // Calculate initial position
  switch (position) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - gap;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'bottom':
      top = triggerRect.bottom + gap;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.left - tooltipRect.width - gap;
      break;
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.right + gap;
      break;
  }

  // Flip if out of viewport
  if (position === 'top' && top < viewportPadding) {
    position = 'bottom';
    top = triggerRect.bottom + gap;
  } else if (position === 'bottom' && top + tooltipRect.height > window.innerHeight - viewportPadding) {
    position = 'top';
    top = triggerRect.top - tooltipRect.height - gap;
  } else if (position === 'left' && left < viewportPadding) {
    position = 'right';
    left = triggerRect.right + gap;
  } else if (position === 'right' && left + tooltipRect.width > window.innerWidth - viewportPadding) {
    position = 'left';
    left = triggerRect.left - tooltipRect.width - gap;
  }

  // Constrain to viewport
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));
  top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));

  actualPosition.value = position;
  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    maxWidth: `${props.maxWidth}px`
  };
};

const showTooltip = () => {
  if (props.disabled) return;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  showTimeout = setTimeout(() => {
    isVisible.value = true;
    calculatePosition();
  }, props.delay);
};

const hideTooltip = () => {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }

  hideTimeout = setTimeout(() => {
    isVisible.value = false;
  }, 100);
};

watch(() => props.position, () => {
  if (isVisible.value) {
    calculatePosition();
  }
});

onMounted(() => {
  window.addEventListener('scroll', calculatePosition, true);
  window.addEventListener('resize', calculatePosition);
});

onBeforeUnmount(() => {
  if (showTimeout) clearTimeout(showTimeout);
  if (hideTimeout) clearTimeout(hideTimeout);
  window.removeEventListener('scroll', calculatePosition, true);
  window.removeEventListener('resize', calculatePosition);
});
</script>

<style scoped>
.ui-tooltip-wrapper {
  display: inline-block;
}

.ui-tooltip {
  position: fixed;
  z-index: var(--z-tooltip);
  pointer-events: none;
}

.ui-tooltip__content {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: var(--leading-normal);
}

.ui-tooltip__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  transform: rotate(45deg);
}

/* Arrow positions */
.ui-tooltip--top .ui-tooltip__arrow {
  bottom: -5px;
  left: 50%;
  margin-left: -4px;
  border-top: none;
  border-left: none;
}

.ui-tooltip--bottom .ui-tooltip__arrow {
  top: -5px;
  left: 50%;
  margin-left: -4px;
  border-bottom: none;
  border-right: none;
}

.ui-tooltip--left .ui-tooltip__arrow {
  right: -5px;
  top: 50%;
  margin-top: -4px;
  border-bottom: none;
  border-left: none;
}

.ui-tooltip--right .ui-tooltip__arrow {
  left: -5px;
  top: 50%;
  margin-top: -4px;
  border-top: none;
  border-right: none;
}

/* Transitions */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

.ui-tooltip--top.tooltip-enter-from,
.ui-tooltip--top.tooltip-leave-to {
  transform: translateY(4px);
}

.ui-tooltip--bottom.tooltip-enter-from,
.ui-tooltip--bottom.tooltip-leave-to {
  transform: translateY(-4px);
}

.ui-tooltip--left.tooltip-enter-from,
.ui-tooltip--left.tooltip-leave-to {
  transform: translateX(4px);
}

.ui-tooltip--right.tooltip-enter-from,
.ui-tooltip--right.tooltip-leave-to {
  transform: translateX(-4px);
}
</style>
