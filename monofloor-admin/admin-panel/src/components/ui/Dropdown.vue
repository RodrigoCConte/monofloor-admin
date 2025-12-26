<template>
  <div
    ref="dropdownRef"
    :class="[
      'ui-dropdown',
      { 'ui-dropdown--open': isOpen }
    ]"
  >
    <!-- Trigger -->
    <div
      class="ui-dropdown__trigger"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
      @keydown.escape="close"
      @keydown.down.prevent="isOpen ? focusNext() : open()"
      @keydown.up.prevent="isOpen ? focusPrev() : open()"
    >
      <slot name="trigger" :is-open="isOpen">
        <button
          type="button"
          :class="[
            'ui-dropdown__button',
            `ui-dropdown__button--${size}`
          ]"
          :disabled="disabled"
          aria-haspopup="listbox"
          :aria-expanded="isOpen"
        >
          <span class="ui-dropdown__button-content">
            <slot name="selected" :value="modelValue">
              {{ displayValue || placeholder }}
            </slot>
          </span>
          <svg
            class="ui-dropdown__chevron"
            :class="{ 'ui-dropdown__chevron--rotated': isOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </slot>
    </div>

    <!-- Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="ui-dropdown__menu"
        :class="`ui-dropdown__menu--${position}`"
        role="listbox"
        :aria-multiselectable="multiple"
      >
        <!-- Search -->
        <div v-if="searchable" class="ui-dropdown__search">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="ui-dropdown__search-input"
            :placeholder="searchPlaceholder"
            @keydown.down.prevent="focusNext"
            @keydown.up.prevent="focusPrev"
            @keydown.enter.prevent="selectFocused"
            @keydown.escape="close"
          />
          <svg class="ui-dropdown__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        <!-- Options -->
        <div class="ui-dropdown__options" @keydown.escape="close">
          <div v-if="filteredOptions.length === 0" class="ui-dropdown__empty">
            {{ emptyMessage }}
          </div>

          <template v-for="(option, index) in filteredOptions" :key="getOptionValue(option)">
            <!-- Group header -->
            <div
              v-if="option.group && (index === 0 || option.group !== filteredOptions[index - 1]?.group)"
              class="ui-dropdown__group"
            >
              {{ option.group }}
            </div>

            <!-- Option -->
            <div
              :class="[
                'ui-dropdown__option',
                {
                  'ui-dropdown__option--selected': isSelected(option),
                  'ui-dropdown__option--focused': focusedIndex === index,
                  'ui-dropdown__option--disabled': option.disabled
                }
              ]"
              :tabindex="option.disabled ? -1 : 0"
              role="option"
              :aria-selected="isSelected(option)"
              :aria-disabled="option.disabled"
              @click="!option.disabled && selectOption(option)"
              @keydown.enter.prevent="!option.disabled && selectOption(option)"
              @keydown.space.prevent="!option.disabled && selectOption(option)"
              @mouseenter="focusedIndex = index"
            >
              <span v-if="multiple" class="ui-dropdown__checkbox">
                <svg v-if="isSelected(option)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>

              <span v-if="option.icon" class="ui-dropdown__option-icon">
                <component :is="option.icon" />
              </span>

              <span class="ui-dropdown__option-content">
                <span class="ui-dropdown__option-label">
                  {{ getOptionLabel(option) }}
                </span>
                <span v-if="option.description" class="ui-dropdown__option-description">
                  {{ option.description }}
                </span>
              </span>

              <svg
                v-if="!multiple && isSelected(option)"
                class="ui-dropdown__check"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, type Component } from 'vue';

interface DropdownOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: Component;
  group?: string;
  disabled?: boolean;
}

interface Props {
  modelValue?: string | number | (string | number)[] | null;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom' | 'top';
  closeOnSelect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Selecione...',
  disabled: false,
  multiple: false,
  searchable: false,
  searchPlaceholder: 'Buscar...',
  emptyMessage: 'Nenhum resultado encontrado',
  size: 'md',
  position: 'bottom',
  closeOnSelect: true
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[] | null];
  open: [];
  close: [];
  change: [value: string | number | (string | number)[] | null];
}>();

const dropdownRef = ref<HTMLDivElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const isOpen = ref(false);
const searchQuery = ref('');
const focusedIndex = ref(-1);

const getOptionValue = (option: DropdownOption) => option.value;
const getOptionLabel = (option: DropdownOption) => option.label;

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;

  const query = searchQuery.value.toLowerCase();
  return props.options.filter(option =>
    option.label.toLowerCase().includes(query) ||
    option.description?.toLowerCase().includes(query)
  );
});

const displayValue = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    const values = props.modelValue as (string | number)[];
    if (values.length === 0) return '';
    if (values.length === 1) {
      const option = props.options.find(o => o.value === values[0]);
      return option?.label || '';
    }
    return `${values.length} selecionados`;
  }

  const option = props.options.find(o => o.value === props.modelValue);
  return option?.label || '';
});

const isSelected = (option: DropdownOption) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(option.value);
  }
  return props.modelValue === option.value;
};

const open = async () => {
  if (props.disabled) return;
  isOpen.value = true;
  emit('open');

  await nextTick();
  if (props.searchable) {
    searchInputRef.value?.focus();
  }
};

const close = () => {
  isOpen.value = false;
  searchQuery.value = '';
  focusedIndex.value = -1;
  emit('close');
};

const toggle = () => {
  if (isOpen.value) {
    close();
  } else {
    open();
  }
};

const selectOption = (option: DropdownOption) => {
  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValue.indexOf(option.value);

    if (index > -1) {
      currentValue.splice(index, 1);
    } else {
      currentValue.push(option.value);
    }

    emit('update:modelValue', currentValue);
    emit('change', currentValue);
  } else {
    emit('update:modelValue', option.value);
    emit('change', option.value);

    if (props.closeOnSelect) {
      close();
    }
  }
};

const focusNext = () => {
  const nextIndex = focusedIndex.value + 1;
  if (nextIndex < filteredOptions.value.length) {
    focusedIndex.value = nextIndex;
  }
};

const focusPrev = () => {
  const prevIndex = focusedIndex.value - 1;
  if (prevIndex >= 0) {
    focusedIndex.value = prevIndex;
  }
};

const selectFocused = () => {
  if (focusedIndex.value >= 0 && focusedIndex.value < filteredOptions.value.length) {
    const option = filteredOptions.value[focusedIndex.value];
    if (option && !option.disabled) {
      selectOption(option);
    }
  }
};

// Click outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

defineExpose({ open, close, toggle });
</script>

<style scoped>
.ui-dropdown {
  position: relative;
  display: inline-block;
}

/* Trigger Button */
.ui-dropdown__button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ui-dropdown__button:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.ui-dropdown__button:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha-20);
}

.ui-dropdown__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-dropdown--open .ui-dropdown__button {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha-20);
}

/* Button sizes */
.ui-dropdown__button--sm {
  height: var(--input-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.ui-dropdown__button--md {
  height: var(--input-height-md);
  padding: 0 var(--space-3);
  font-size: var(--text-base);
}

.ui-dropdown__button--lg {
  height: var(--input-height-lg);
  padding: 0 var(--space-4);
  font-size: var(--text-md);
}

.ui-dropdown__button-content {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-dropdown__chevron {
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.ui-dropdown__chevron--rotated {
  transform: rotate(180deg);
}

/* Menu */
.ui-dropdown__menu {
  position: absolute;
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.ui-dropdown__menu--bottom {
  top: calc(100% + var(--space-1));
}

.ui-dropdown__menu--top {
  bottom: calc(100% + var(--space-1));
}

/* Search */
.ui-dropdown__search {
  position: relative;
  padding: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.ui-dropdown__search-input {
  width: 100%;
  height: 32px;
  padding: 0 var(--space-3) 0 var(--space-8);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--text-sm);
  color: var(--text-primary);
  outline: none;
}

.ui-dropdown__search-input:focus {
  border-color: var(--color-primary);
}

.ui-dropdown__search-input::placeholder {
  color: var(--text-tertiary);
}

.ui-dropdown__search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--text-tertiary);
  pointer-events: none;
}

/* Options */
.ui-dropdown__options {
  max-height: 280px;
  overflow-y: auto;
  padding: var(--space-1);
}

.ui-dropdown__empty {
  padding: var(--space-4);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.ui-dropdown__group {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ui-dropdown__option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ui-dropdown__option:hover,
.ui-dropdown__option--focused {
  background: var(--bg-elevated);
}

.ui-dropdown__option--selected {
  background: var(--color-primary-alpha-10);
}

.ui-dropdown__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-dropdown__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-strong);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.ui-dropdown__option--selected .ui-dropdown__checkbox {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.ui-dropdown__checkbox svg {
  width: 12px;
  height: 12px;
  color: var(--text-inverse);
}

.ui-dropdown__option-icon {
  display: flex;
  flex-shrink: 0;
}

.ui-dropdown__option-icon svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.ui-dropdown__option-content {
  flex: 1;
  min-width: 0;
}

.ui-dropdown__option-label {
  display: block;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.ui-dropdown__option-description {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.ui-dropdown__check {
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--color-primary);
  flex-shrink: 0;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.ui-dropdown__menu--top.dropdown-enter-from,
.ui-dropdown__menu--top.dropdown-leave-to {
  transform: translateY(8px);
}
</style>
