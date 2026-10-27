import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Database, Sparkles, BookOpen } from 'lucide-react';
import { getSystemHealth } from '../services/dashboardApi';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const res = await getSystemHealth();
        if (mounted) setHealth(res);
      } catch (err) {
        if (mounted) setHealth({ status: 'UNHEALTHY', error: err.message });
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isHealthy = health?.status === 'HEALTHY';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">RolloutGuard</span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">Deployment Safety & Release Monitoring</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Simulation Mode Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Simulated Release Engine</span>
        </div>

        {/* Database Status */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-50 text-slate-700 border border-slate-200">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>{health?.database?.isInMemory ? 'MongoDB (In-Memory)' : health?.database?.databaseName || 'MongoDB'}</span>
        </div>

        {/* System Health Pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
            isHealthy ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
          title={isHealthy ? 'API and MongoDB connected' : 'System or Database disconnected'}
        >
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
          <span>{isHealthy ? 'System Operational' : 'Degraded'}</span>
        </div>

        <Link
          to="/docs"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Docs</span>
        </Link>
      </div>
    </header>
  );
}
