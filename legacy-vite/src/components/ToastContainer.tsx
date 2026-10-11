import React from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-black text-white hairline-all p-3 sm:p-3.5 shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-xs"
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-[#dec400] shrink-0" />}

            <div className="flex-1 min-w-0 font-sans">
              {toast.title && <h5 className="font-bold text-xs uppercase font-mono">{toast.title}</h5>}
              <p className="text-xs text-neutral-200 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white p-1 shrink-0 transition-colors"
              aria-label="Закрити"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
