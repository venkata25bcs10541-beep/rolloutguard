import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Play,
  Pause,
  PlusCircle,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/formatters';

export default function TimelineView({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
        No lifecycle events recorded yet.
      </div>
    );
  }

  const getEventIcon = (type, severity) => {
    switch (type) {
      case 'RELEASE_CREATED':
        return { icon: PlusCircle, bg: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'ROLLOUT_STARTED':
      case 'ROLLOUT_RESUMED':
        return { icon: Play, bg: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      case 'ROLLOUT_PAUSED':
        return { icon: Pause, bg: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'STAGE_ADVANCED':
      case 'HEALTH_CHECK_PASSED':
        return { icon: CheckCircle, bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'THRESHOLD_BREACHED':
      case 'HEALTH_CHECK_FAILED':
        return { icon: AlertCircle, bg: 'bg-rose-100 text-rose-700 border-rose-200' };
      case 'ROLLBACK_RECOMMENDED':
        return { icon: AlertTriangle, bg: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'ROLLBACK_EXECUTED':
        return { icon: RotateCcw, bg: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'RELEASE_COMPLETED':
        return { icon: CheckCircle2, bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'RELEASE_CANCELLED':
        return { icon: XCircle, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { icon: CheckCircle, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Release Event Timeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">Chronological audit log of automated and operator actions</p>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((event, index) => {
          const { icon: Icon, bg } = getEventIcon(event.eventType, event.severity);

          return (
            <div key={event._id || index} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${bg}`}
              >
                <Icon className="w-3 h-3" />
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5 hover:bg-slate-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{event.title || event.eventType}</span>
                    {event.rolloutPercentage !== undefined && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                        {event.rolloutPercentage}% Traffic
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatDate(event.timestamp)} ({formatRelativeTime(event.timestamp)})
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{event.message}</p>

                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-2 text-[11px] font-mono text-slate-500">
                    {Object.entries(event.metadata).map(([k, v]) => {
                      if (typeof v === 'object') return null;
                      return (
                        <span key={k} className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          {k}: <span className="text-slate-800 font-medium">{String(v)}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
