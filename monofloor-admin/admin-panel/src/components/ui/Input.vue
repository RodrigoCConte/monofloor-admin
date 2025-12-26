<template>
  <div
    :class="[
      'ui-input-wrapper',
      `ui-input-wrapper--${size}`,
      {
        'ui-input-wrapper--error': error,
        'ui-input-wrapper--disabled': disabled,
        'ui-input-wrapper--focused': isFocused
      }
    ]"
  >
    <label v-if="label" :for="inputId" class="ui-input__label">
      {{ label }}
      <span v-if="required" class="ui-input__required">*</span>
    </label>

    <div class="ui-input__container">
      <span v-if="$slots.prefix || prefixIcon" class="ui-input__prefix">
        <slot name="prefix">
          <component v-if="prefixIcon" :is="prefixIcon" />
        </slot>
      </span>

      <input
        v-if="type !== 'textarea'"
        :id="inputId"
        ref="inputRef"
        v-model="modelValue"
        :type="computedType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        class="ui-input"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown.enter="$emit('enter', $event)"
      />

      <textarea
        v-else
        :id="inputId"
        ref="inputRef"
        v-model="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :maxlength="maxlength"
        class="ui-input ui-input--textarea"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
      />

      <span v-if="$slots.suffix || suffixIcon || showPasswordToggle || showClearButton" class="ui-input__suffix">
        <button
          v-if="showClearButton && modelValue"
          type="button"
          class="ui-input__clear"
          @click="clearInput"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <button
          v-if="showPasswordToggle && type === 'password'"
          type="button"
          class="ui-input__toggle-password"
          @click="togglePasswordVisibility"
        >
          <svg v-if="!passwordVisible" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>

        <slot name="suffix">
          <component v-if="suffixIcon" :is="suffixIcon" />
        </slot>
      </span>
    </div>

    <div v-if="error || hint || (maxlength && showCount)" class="ui-input__footer">
      <span v-if="error" class="ui-input__error">{{ error }}</span>
      <span v-else-if="hint" class="ui-input__hint">{{ hint }}</span>
      <span v-if="maxlength && showCount" class="ui-input__count">
        {{ String(modelValue || '').length }}/{{ maxlength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue';

interface Props {
  modelValue?: string | number;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'textarea';
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  autocomplete?: string;
  maxlength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
  showPasswordToggle?: boolean;
  showClearButton?: boolean;
  showCount?: boolean;
  prefixIcon?: Component;
  suffixIcon?: Component;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  rows: 3,
  showPasswordToggle: true,
  showClearButton: false,
  showCount: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  input: [event: Event];
  enter: [event: KeyboardEvent];
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value as string | number)
});

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const isFocused = ref(false);
const passwordVisible = ref(false);

const inputId = computed(() => `input-${Math.random().toString(36).slice(2, 9)}`);

const computedType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text';
  }
  return props.type;
});

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  emit('blur', event);
};

const handleInput = (event: Event) => {
  emit('input', event);
};

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};

const clearInput = () => {
  emit('update:modelValue', '');
  inputRef.value?.focus();
};

const focus = () => {
  inputRef.value?.focus();
};

const blur = () => {
  inputRef.value?.blur();
};

defineExpose({ focus, blur, inputRef });
</script>

<style scoped>
.ui-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

.ui-input__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.ui-input__required {
  color: var(--color-error);
  margin-left: 2px;
}

.ui-input__container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.ui-input-wrapper--focused .ui-input__container {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha-20);
}

.ui-input-wrapper--error .ui-input__container {
  border-color: var(--color-error);
}

.ui-input-wrapper--error.ui-input-wrapper--focused .ui-input__container {
  box-shadow: 0 0 0 3px var(--color-error-alpha-10);
}

.ui-input-wrapper--disabled .ui-input__container {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-input {
  flex: 1;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-family);
  color: var(--text-primary);
}

.ui-input::placeholder {
  color: var(--text-tertiary);
}

.ui-input:disabled {
  cursor: not-allowed;
}

.ui-input--textarea {
  resize: vertical;
  min-height: 80px;
}

/* Sizes */
.ui-input-wrapper--sm .ui-input__container {
  height: var(--input-height-sm);
}

.ui-input-wrapper--sm .ui-input {
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.ui-input-wrapper--md .ui-input__container {
  height: var(--input-height-md);
}

.ui-input-wrapper--md .ui-input {
  padding: 0 var(--space-3);
  font-size: var(--text-base);
}

.ui-input-wrapper--lg .ui-input__container {
  height: var(--input-height-lg);
}

.ui-input-wrapper--lg .ui-input {
  padding: 0 var(--space-4);
  font-size: var(--text-md);
}

/* Textarea doesn't use fixed height */
.ui-input-wrapper .ui-input__container:has(.ui-input--textarea) {
  height: auto;
}

.ui-input--textarea {
  padding: var(--space-3);
}

/* Prefix/Suffix */
.ui-input__prefix,
.ui-input__suffix {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-tertiary);
  padding: 0 var(--space-3);
}

.ui-input__prefix {
  padding-right: 0;
}

.ui-input__suffix {
  padding-left: 0;
}

.ui-input__prefix svg,
.ui-input__suffix svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.ui-input__clear,
.ui-input__toggle-password {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.ui-input__clear:hover,
.ui-input__toggle-password:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.ui-input__clear svg,
.ui-input__toggle-password svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

/* Footer */
.ui-input__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  min-height: 18px;
}

.ui-input__error {
  font-size: var(--text-xs);
  color: var(--color-error);
}

.ui-input__hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.ui-input__count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-left: auto;
}

/* Number input arrows */
.ui-input[type="number"]::-webkit-inner-spin-button,
.ui-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.ui-input[type="number"] {
  -moz-appearance: textfield;
}
</style>
