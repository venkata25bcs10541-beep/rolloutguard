import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import HealthBadge from '../components/HealthBadge';
import MetricComparisonTable from '../components/MetricComparisonTable';
import { ErrorRateChart, LatencyChart } from '../components/MetricCharts';
import TimelineView from '../components/TimelineView';
import AlertBanner from '../components/AlertBanner';
import RollbackModal from '../components/RollbackModal';
import {
  getReleaseById,
  startRollout,
  pauseRollout,
  resumeRollout,
  cancelRollout,
  rollbackRelease,
  getReleaseEvents,
  getReleaseMetrics
} from '../services/releaseApi';
import { formatDate, formatPercentage, formatLatency } from '../utils/formatters';

export default function ReleaseDetails() {
  const { id } = useParams();
  const [release, setRelease] = useState(null);
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [relRes, evRes, metRes] = await Promise.all([
        getReleaseById(id),
        getReleaseEvents(id),
        getReleaseMetrics(id)
      ]);
      setRelease(relRes.data);
      setEvents(evRes.data || []);
      setMetrics(metRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load release details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStartOrAdvance = async () => {
    try {
      setActionLoading(true);
      await startRollout(id);
      await fetchDetails();
    } catch (err) {
      alert(`Rollout action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setActionLoading(true);
      await pauseRollout(id);
      await fetchDetails();
    } catch (err) {
      alert(`Pause failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      await resumeRollout(id);
      await fetchDetails();
    } catch (err) {
      alert(`Resume failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this rollout?')) return;
    try {
      setActionLoading(true);
      await cancelRollout(id, 'Operator cancelled release rollout from details view');
      await fetchDetails();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollbackConfirm = async (reason) => {
    try {
      setActionLoading(true);
      await rollbackRelease(id, reason);
      setIsRollbackOpen(false);
      await fetchDetails();
    } catch (err) {
      alert(`Rollback execution failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !release) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading release details...</span>
      </div>
    );
  }

  if (error && !release) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-rose-900">Failed to Load Release</h3>
        <p className="text-xs text-rose-700 mt-1">{error}</p>
        <Link
          to="/releases"
          className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg"
        >
          Back to Releases
        </Link>
      </div>
    );
  }

  const latestSnapshot = release.latestSnapshot || release.latestMetrics;
  const isTerminal = ['Completed', 'Rolled Back', 'Cancelled'].includes(release.status);
  const isDegraded = release.status === 'Degraded';
  const isPaused = release.isPaused;

  return (
    <div className="space-y-6">
      {/* Back and Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/releases"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Releases</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDetails}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{release.appName}</h1>
              <HealthBadge status={release.status} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>
                Baseline Version: <span className="font-mono font-medium text-slate-800">{release.previousStableVersion}</span>
              </span>
              <span>•</span>
              <span>
                Candidate Version: <span className="font-mono font-medium text-slate-800">{release.candidateVersion}</span>
              </span>
              <span>•</span>
              <span>
                Scenario: <span className="font-medium capitalize text-slate-800">{release.scenario?.replace('_', ' ')}</span>
              </span>
              <span>•</span>
              <span>Created {formatDate(release.createdAt)}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isTerminal && (
              <>
                {isPaused ? (
                  <button
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Rollout</span>
                  </button>
                ) : isDegraded ? (
                  <button
                    onClick={() => setIsRollbackOpen(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Execute Rollback</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleStartOrAdvance}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{release.status === 'Draft' ? 'Start Rollout (5%)' : `Advance Stage (+25%)`}</span>
                    </button>
                    <button
                      onClick={handlePause}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                    <button
                      onClick={() => setIsRollbackOpen(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </>
            )}
            {release.status === 'Rolled Back' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                <RotateCcw className="w-3.5 h-3.5" />
                Rollback Completed (Traffic Reverted)
              </span>
            )}
            {release.status === 'Completed' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Promoted to Stable Version
              </span>
            )}
          </div>
        </div>

        {/* Staged Rollout Progress Visualizer */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Progressive Deployment Pipeline
            </span>
            <span className="font-mono font-medium text-slate-900">
              {release.rolloutPercentage}% Traffic Allocated
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[5, 25, 50, 100].map((stagePct, idx) => {
              const isPast = release.rolloutPercentage >= stagePct && release.status !== 'Draft';
              const isCurrent = release.rolloutPercentage === stagePct && release.status !== 'Draft';
              const isFailed = isCurrent && release.status === 'Degraded';

              return (
                <div
                  key={stagePct}
                  className={`p-3 rounded-xl border text-center transition ${
                    isFailed
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : isPast
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider">Stage {idx + 1}</div>
                  <div className="text-base font-bold font-mono mt-0.5">{stagePct}%</div>
                  <div className="text-[10px] mt-1">
                    {isFailed
                      ? 'Threshold Breached'
                      : isPast
                      ? 'Healthy'
                      : 'Pending'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Critical Rollback Banner if Degraded */}
      {isDegraded && (
        <AlertBanner
          type="critical"
          title="Rollback Recommended"
          message={`Automated safety evaluator halted progressive rollout: ${release.failingRuleExplanation}`}
          actionText="Execute Rollback"
          onAction={() => setIsRollbackOpen(true)}
        />
      )}

      {/* Post-Rollback Recovery Metrics Notice */}
      {release.status === 'Rolled Back' && release.postRollbackRecoveryMetrics && (
        <AlertBanner
          type="success"
          title="Recovery Metrics Verified"
          message={`Candidate traffic cut to 0%. Baseline traffic returned 100% to stable version ${release.previousStableVersion}. Error rates returned to normal bounds (${release.postRollbackRecoveryMetrics.baseline?.errorRate}%).`}
        />
      )}

      {/* Baseline vs Candidate Comparison Table */}
      <MetricComparisonTable
        baseline={latestSnapshot?.baseline}
        candidate={latestSnapshot?.candidate}
        rolloutPercentage={release.rolloutPercentage}
      />

      {/* Charts */}
      {latestSnapshot && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorRateChart
            baselineError={latestSnapshot.baseline?.errorRate || 1.2}
            candidateError={latestSnapshot.candidate?.errorRate || 0}
            threshold={release.thresholds?.maxErrorRatePercent || 5.0}
            warning={release.thresholds?.warningErrorRatePercent || 2.5}
          />
          <LatencyChart
            baselineP95={latestSnapshot.baseline?.p95ResponseTimeMs || 220}
            candidateP95={latestSnapshot.candidate?.p95ResponseTimeMs || 0}
            baselineAvg={latestSnapshot.baseline?.avgResponseTimeMs || 110}
            candidateAvg={latestSnapshot.candidate?.avgResponseTimeMs || 0}
            threshold={release.thresholds?.maxP95LatencyMs || 1000}
          />
        </div>
      )}

      {/* Evaluation & Rule Failure Evidence */}
      {latestSnapshot?.evaluation && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Health Evaluation & Rules Engine</h3>
              <p className="text-xs text-slate-500">Evaluated candidate metrics against configured safety thresholds</p>
            </div>
            <HealthBadge status={latestSnapshot.evaluation.status} />
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700">
              <span className="font-semibold text-slate-900 block mb-1">Evaluator Verdict:</span>
              <p>{latestSnapshot.evaluation.summary}</p>
            </div>

            {latestSnapshot.evaluation.failedRules && latestSnapshot.evaluation.failedRules.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-rose-700 tracking-wider mb-2">
                  Violated Health Rules:
                </h4>
                <div className="space-y-2">
                  {latestSnapshot.evaluation.failedRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-rose-200 bg-rose-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono font-bold text-rose-900">{rule.rule}</span>
                        <p className="text-rose-700 mt-0.5">{rule.message}</p>
                      </div>
                      <div className="text-right font-mono text-[11px] text-rose-800 shrink-0">
                        <div>Actual: <span className="font-bold">{rule.actual}</span></div>
                        <div>Allowed: <span>{rule.threshold}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Timeline */}
      <TimelineView events={events} />

      {/* Rollback Confirmation Modal */}
      <RollbackModal
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
        release={release}
        onConfirm={handleRollbackConfirm}
        isSubmitting={actionLoading}
      />
    </div>
  );
}
