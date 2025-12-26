import { ref, readonly } from 'vue';

export interface ToastOptions {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export interface Toast extends Required<Omit<ToastOptions, 'title'>> {
  title?: string;
}

const toasts = ref<Toast[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const addToast = (options: ToastOptions): string => {
  const toast: Toast = {
    id: options.id || generateId(),
    type: options.type || 'info',
    title: options.title,
    message: options.message,
    duration: options.duration ?? 5000,
    dismissible: options.dismissible ?? true
  };

  // Remove oldest if max reached (5)
  if (toasts.value.length >= 5) {
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

const removeToast = (id: string): void => {
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

const clearAll = (): void => {
  toasts.value = [];
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
};

// Convenience methods
const success = (message: string, options?: Partial<ToastOptions>): string =>
  addToast({ ...options, message, type: 'success' });

const error = (message: string, options?: Partial<ToastOptions>): string =>
  addToast({ ...options, message, type: 'error' });

const warning = (message: string, options?: Partial<ToastOptions>): string =>
  addToast({ ...options, message, type: 'warning' });

const info = (message: string, options?: Partial<ToastOptions>): string =>
  addToast({ ...options, message, type: 'info' });

// Global toast object for direct imports
export const toast = {
  success,
  error,
  warning,
  info,
  add: addToast,
  remove: removeToast,
  clear: clearAll
};

// Composable for reactive usage
export function useToast() {
  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    remove: removeToast, // Alias for backwards compatibility
    clearAll,
    success,
    error,
    warning,
    info
  };
}
