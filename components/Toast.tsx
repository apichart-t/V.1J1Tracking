
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div 
          key={t.id}
          className={`min-w-[300px] p-4 rounded-lg shadow-lg flex items-start gap-3 text-white transform transition-all animate-fade-in ${
            t.type === 'success' ? 'bg-green-600' : 
            t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {t.type === 'success' && <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />}
          {t.type === 'error' && <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />}
          {t.type === 'info' && <Info size={20} className="mt-0.5 flex-shrink-0" />}
          
          <div className="flex-grow text-sm font-medium">{t.message}</div>
          
          <button onClick={() => onDismiss(t.id)} className="text-white/70 hover:text-white">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
