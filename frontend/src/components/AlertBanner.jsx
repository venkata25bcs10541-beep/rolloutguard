import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info, ArrowRight } from 'lucide-react';

export default function AlertBanner({ type = 'warning', title, message, actionText, onAction }) {
  const configs = {
    critical: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const config = configs[type] || configs.warning;
  const Icon = config.icon;

  return (
    <div className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
        <div>
          {title && <h4 className="font-semibold text-sm leading-tight mb-0.5">{title}</h4>}
          <p className="text-xs leading-relaxed opacity-90">{message}</p>
        </div>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-xs ${config.btn}`}
        >
          {actionText}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
