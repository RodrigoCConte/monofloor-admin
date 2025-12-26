<template>
  <div
    :class="[
      'ui-skeleton',
      `ui-skeleton--${variant}`,
      { 'ui-skeleton--animated': animated }
    ]"
    :style="computedStyle"
    :aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  animated: true
});

const computedStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }

  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }

  return style;
});
</script>

<style scoped>
.ui-skeleton {
  background: var(--bg-elevated);
  display: block;
}

/* Variants */
.ui-skeleton--text {
  height: 1em;
  width: 100%;
  border-radius: var(--radius-sm);
  transform-origin: 0 55%;
  transform: scale(1, 0.6);
}

.ui-skeleton--circular {
  border-radius: 50%;
}

.ui-skeleton--rectangular {
  border-radius: 0;
}

.ui-skeleton--rounded {
  border-radius: var(--radius-md);
}

/* Animation */
.ui-skeleton--animated {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 0%,
    var(--bg-card-hover) 50%,
    var(--bg-elevated) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
