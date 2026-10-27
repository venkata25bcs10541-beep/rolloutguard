import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  FlaskConical,
  AlertOctagon,
  Sliders,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/releases', label: 'Releases', icon: Layers },
    { to: '/simulation', label: 'Simulation Lab', icon: FlaskConical },
    { to: '/incidents', label: 'Metrics & Incidents', icon: AlertOctagon },
    { to: '/settings', label: 'Health Thresholds', icon: Sliders },
    { to: '/docs', label: 'Documentation', icon: BookOpen }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Release Safety
        </div>
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Deployment Guard</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Automated canary health evaluation with bounded progressive rollout controls.
          </p>
        </div>
      </div>
    </aside>
  );
}
