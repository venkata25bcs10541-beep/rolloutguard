import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import StatCard from '../components/StatCard';
import HealthBadge from '../components/HealthBadge';
import { ErrorRateChart, LatencyChart, TrendHistoryChart } from '../components/MetricCharts';
import AlertBanner from '../components/AlertBanner';
import CreateReleaseModal from '../components/CreateReleaseModal';
import { getDashboardData } from '../services/dashboardApi';
import { createRelease } from '../services/releaseApi';
import { formatDate, formatRelativeTime, formatPercentage, formatLatency } from '../utils/formatters';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardData();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateRelease = async (payload) => {
    await createRelease(payload);
    await fetchDashboard();
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading release dashboard...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-rose-900">Failed to Load Dashboard</h3>
        <p className="text-xs text-rose-700 mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary = {}, recentReleases = [], recentEvents = [], activeRelease, metricTrends = [], isEmpty } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Release Health & Safety Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time canary monitoring, progressive traffic analysis, and automated rollback controls.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/simulation"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Simulation Lab</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Release</span>
          </button>
        </div>
      </div>

      {/* Critical Rollback Alert Banner if active release is degraded */}
      {activeRelease && activeRelease.status === 'Degraded' && (
        <AlertBanner
          type="critical"
          title={`Release Health Critical: ${activeRelease.appName} (${activeRelease.candidateVersion})`}
          message={activeRelease.failingRuleExplanation || 'A critical deployment health threshold has been breached. Immediate rollback is recommended.'}
          actionText="Inspect & Roll Back"
          onAction={() => window.location.href = `/releases/${activeRelease._id}`}
        />
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Releases"
          value={summary.totalReleases || 0}
          subtitle="All managed deployment cycles"
          icon={Layers}
          color="slate"
        />
        <StatCard
          title="Healthy / Promoted"
          value={summary.healthyReleases || 0}
          subtitle="100% rollout verified"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Degraded / Unhealthy"
          value={summary.unhealthyReleases || 0}
          subtitle="Halted by threshold breach"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Rollbacks Triggered"
          value={summary.rollbacksTriggered || 0}
          subtitle="Traffic restored to stable"
          icon={RotateCcw}
          color="purple"
        />
      </div>

      {/* Active Release Focus Card */}
      {activeRelease ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{activeRelease.appName}</h3>
                  <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {activeRelease.candidateVersion}
                  </span>
                  <HealthBadge status={activeRelease.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Previous stable: <span className="font-mono">{activeRelease.previousStableVersion}</span> · Scenario:{' '}
                  <span className="capitalize font-medium">{activeRelease.scenario?.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
            <Link
              to={`/releases/${activeRelease._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
            >
              <span>Manage Rollout Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Rollout Progress</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-slate-900">{activeRelease.rolloutPercentage}%</span>
                <span className="text-xs text-slate-500">Stage {activeRelease.currentStageIndex + 1} of 4</span>
              </div>
              <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${activeRelease.rolloutPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Candidate Error Rate</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {formatPercentage(activeRelease.latestMetrics?.candidate?.errorRate || 0)}
                </span>
                <span className="text-xs text-slate-500">Threshold: ≤ 5.0%</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Baseline:{' '}
                <span className="font-mono font-medium">
                  {formatPercentage(activeRelease.latestMetrics?.baseline?.errorRate || 1.2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Candidate p95 Latency</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {formatLatency(activeRelease.latestMetrics?.candidate?.p95ResponseTimeMs || 0)}
                </span>
                <span className="text-xs text-slate-500">Ceiling: ≤ 1000ms</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Baseline:{' '}
                <span className="font-mono font-medium">
                  {formatLatency(activeRelease.latestMetrics?.baseline?.p95ResponseTimeMs || 220)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Health Probe</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span
                  className={`text-sm font-semibold ${
                    activeRelease.latestMetrics?.candidate?.healthCheckStatus === 'FAILING'
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {activeRelease.latestMetrics?.candidate?.healthCheckStatus || 'PASSING'}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  HTTP {activeRelease.latestMetrics?.candidate?.healthCheckStatusCode || 200}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Decision: <span className="font-semibold text-slate-700">{activeRelease.finalDecision}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Trend & Comparison Charts */}
      {metricTrends && metricTrends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorRateChart
            baselineError={activeRelease?.latestMetrics?.baseline?.errorRate || 1.2}
            candidateError={activeRelease?.latestMetrics?.candidate?.errorRate || 1.0}
            threshold={5.0}
            warning={2.5}
          />
          <LatencyChart
            baselineP95={activeRelease?.latestMetrics?.baseline?.p95ResponseTimeMs || 220}
            candidateP95={activeRelease?.latestMetrics?.candidate?.p95ResponseTimeMs || 230}
            baselineAvg={activeRelease?.latestMetrics?.baseline?.avgResponseTimeMs || 110}
            candidateAvg={activeRelease?.latestMetrics?.candidate?.avgResponseTimeMs || 115}
            threshold={1000}
          />
        </div>
      )}

      {/* Historical Trend */}
      {metricTrends && metricTrends.length > 0 && (
        <TrendHistoryChart trends={metricTrends} />
      )}

      {/* Empty State when no releases exist */}
      {isEmpty && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No Releases Detected</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Create your first deployment release or open the Simulation Lab to test canary rollouts and automated rollback rules.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition shadow-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Release
            </button>
            <Link
              to="/simulation"
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition"
            >
              Open Simulation Lab
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity & Table */}
      {!isEmpty && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Releases</h3>
              <p className="text-xs text-slate-500">Latest deployment candidates evaluated by RolloutGuard</p>
            </div>
            <Link
              to="/releases"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              <span>View all releases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Application</th>
                  <th className="py-3 px-5">Version Range</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Rollout</th>
                  <th className="py-3 px-5">Scenario</th>
                  <th className="py-3 px-5">Created</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReleases.map((release) => (
                  <tr key={release._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      <Link to={`/releases/${release._id}`} className="hover:underline">
                        {release.appName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">
                      <span>{release.previousStableVersion}</span>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="font-semibold text-slate-800">{release.candidateVersion}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <HealthBadge status={release.status} />
                    </td>
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-800">
                      {release.rolloutPercentage}%
                    </td>
                    <td className="py-3.5 px-5 capitalize text-slate-600">
                      {release.scenario?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {formatRelativeTime(release.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/releases/${release._id}`}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 font-medium"
                      >
                        Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <CreateReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreateRelease}
      />
    </div>
  );
}
