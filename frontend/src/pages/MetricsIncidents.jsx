import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import HealthBadge from '../components/HealthBadge';
import { getReleases } from '../services/releaseApi';
import { formatDate, formatRelativeTime } from '../utils/formatters';

export default function MetricsIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch degraded, rolled back, and warning releases
      const res = await getReleases({ limit: 50 });
      const filtered = (res.data || []).filter((rel) =>
        ['Degraded', 'Rolled Back', 'Cancelled'].includes(rel.status) || rel.failingRuleExplanation
      );
      setIncidents(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load incident history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const displayedIncidents = incidents.filter((item) => {
    if (filterType === 'degraded') return item.status === 'Degraded';
    if (filterType === 'rollback') return item.status === 'Rolled Back';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Metrics & Incident History</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200">
              Safety Audits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of canary health breaches, threshold violations, and rollbacks triggered during releases.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchIncidents}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilterType('all')}
          className={`pb-2.5 px-3 text-xs font-medium transition border-b-2 ${
            filterType === 'all'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Incidents ({incidents.length})
        </button>
        <button
          onClick={() => setFilterType('degraded')}
          className={`pb-2.5 px-3 text-xs font-medium transition border-b-2 ${
            filterType === 'degraded'
              ? 'border-rose-600 text-rose-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Degraded ({incidents.filter((i) => i.status === 'Degraded').length})
        </button>
        <button
          onClick={() => setFilterType('rollback')}
          className={`pb-2.5 px-3 text-xs font-medium transition border-b-2 ${
            filterType === 'rollback'
              ? 'border-purple-600 text-purple-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rolled Back ({incidents.filter((i) => i.status === 'Rolled Back').length})
        </button>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          Loading safety incident records...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">{error}</div>
      ) : displayedIncidents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          No degraded incidents or threshold breaches found.
        </div>
      ) : (
        <div className="space-y-4">
          {displayedIncidents.map((incident) => (
            <div
              key={incident._id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      incident.status === 'Degraded'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {incident.status === 'Degraded' ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : (
                      <RotateCcw className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{incident.appName}</span>
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {incident.candidateVersion}
                      </span>
                      <HealthBadge status={incident.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Target stage: {incident.rolloutPercentage}% · Scenario:{' '}
                      <span className="capitalize">{incident.scenario?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/releases/${incident._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
                >
                  <span>Review Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-3.5 bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-800 border border-slate-200/80">
                <span className="font-sans font-semibold text-rose-700 block mb-1">Root Cause Health Rule:</span>
                {incident.failingRuleExplanation || 'Threshold limit breached during progressive rollout.'}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Recorded {formatDate(incident.updatedAt || incident.createdAt)}</span>
                <span>Audit Decision: {incident.finalDecision}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
