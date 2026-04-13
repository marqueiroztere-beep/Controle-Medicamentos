import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error:   'border-danger/30 bg-danger/10 text-danger',
  info:    'border-purple/30 bg-purple/10 text-purple',
  warning: 'border-amber/30 bg-amber/10 text-amber',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'i',
  warning: '!',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={[
                'flex items-center gap-3 px-4 py-3 rounded-xl border',
                'shadow-xl backdrop-blur-sm font-medium text-sm',
                'animate-[slide-up_0.2s_ease-out]',
                typeStyles[toast.type],
              ].join(' ')}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                {typeIcons[toast.type]}
              </span>
              <span className="flex-1 text-text-primary">{toast.message}</span>
              <button onClick={() => remove(toast.id)} className="text-text-muted hover:text-text-primary">
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
