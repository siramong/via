import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastStore = {
  toasts: Toast[];
  show: (message: string, variant?: ToastVariant) => void;
  hide: (id: string) => void;
};

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, variant = 'info') => {
    const id = `toast_${++counter}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  hide: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
  info: (message: string) => useToastStore.getState().show(message, 'info'),
};
