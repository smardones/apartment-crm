import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-rose-500/20';
  const iconColor = type === 'success' ? 'text-emerald-400' : 'text-rose-400';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${bgColor}`}>
        <Icon size={20} className={iconColor} />
        <p className="text-sm font-medium text-slate-200">{message}</p>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-800/50 rounded-lg transition-colors ml-2"
        >
          <X size={14} className="text-slate-400 hover:text-slate-200" />
        </button>
      </div>
    </div>
  );
}
