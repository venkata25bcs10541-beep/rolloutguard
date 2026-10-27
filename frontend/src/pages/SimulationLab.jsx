import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Clock,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { SCENARIO_DESCRIPTIONS } from '../utils/statusStyles';
import { createRelease, startRollout, rollbackRelease, getReleaseById } from '../services/releaseApi';
import MetricComparisonTable from '../components/MetricComparisonTable';
import { ErrorRateChart, LatencyChart } from '../components/MetricCharts';
import RollbackModal from '../components/RollbackModal';
import AlertBanner from '../components/AlertBanner';

export default function SimulationLab() {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState('healthy');
  const [appName, setAppName] = useState('checkout-service');
  const [previousVersion, setPreviousVersion] = useState('v2.4.0');
  const [candidateVersion, setCandidateVersion] = useState('v2.5.0-canary');
  const [currentRelease, setCurrentRelease] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);

  const scenarioList = [
    {
      id: 'healthy',
      title: 'Healthy Release',
      icon: CheckCircle2,
      color: 'emerald',
      desc: 'API error rate stays < 1% and latencies stay low (~110ms). Expected to reach 100% and promote smoothly.'
    },
    {
      id: 'error_spike',
      title: 'Error Spike',
      icon: Zap,
      color: 'rose',
      desc: 'Candidate API errors jump to 18.5%, violating the 5% error ceiling. Engine halts rollout and urges rollback.'
    },
    {
      id: 'slow_api',
      title: 'Slow API Latency',
      icon: Clock,
      color: 'amber',
      desc: 'Response times shoot up to 680ms avg, p95 hits ~1,580ms (>1,000ms max). Triggers latency threshold breach.'
    },
    {
      id: 'service_failure',
      title: 'Service Failure',
      icon: AlertTriangle,
      color: 'rose',
      desc: 'Synthetic health check probe (/healthz) returns HTTP 503, triggering consecutive probe failure rules.'
    },
    {
      id: 'gradual_degradation',
      title: 'Gradual Degradation',
      icon: TrendingDown,
      color: 'amber',
      desc: 'Metrics appear fine at 5% canary, begin warning at 25%, and cross critical error thresholds at 50% traffic.'
    },
    {
      id: 'recovery_after_rollback',
      title: 'Recovery After Rollback',
      icon: RotateCcw,
      color: 'purple',
      desc: 'Tests safety recovery sequence: candidate traffic severed to 0%, 100% routed back to stable baseline.'
    }
  ];

  const logMessage = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSimLogs((prev) => [{ msg, type, timestamp }, ...prev]);
  };

  const handleLaunchSimulation = async () => {
    try {
      setIsSimulating(true);
      setSimLogs([]);
      logMessage(`Initiating simulation run for scenario: '${selectedScenario}'...`);

      // 1. Create release in MongoDB
      const created = await createRelease({
        appName,
        previousStableVersion: previousVersion,
        candidateVersion,
        version: candidateVersion,
        scenario: selectedScenario,
        description: `Automated test run in Simulation Lab (${selectedScenario})`
      });

      const releaseId = created.data._id;
      setCurrentRelease(created.data);
      logMessage(`Release record created: ID ${releaseId} in 'Draft' state.`, 'info');

      // 2. Advance first stage (5%)
      logMessage(`Advancing candidate traffic to Stage 1 (5%)...`);
      const step1 = await startRollout(releaseId);
      setCurrentRelease(step1.data);

      if (step1.halted) {
        logMessage(`⚠️ Stage 1 halted: ${step1.data.failingRuleExplanation}`, 'critical');
        setIsSimulating(false);
        return;
      }

      logMessage(`✅ Stage 1 (5%) passed health checks (Error rate: ${step1.snapshot?.candidate?.errorRate}%, p95: ${step1.snapshot?.candidate?.p95ResponseTimeMs}ms).`, 'success');

      // If user selected recovery scenario or healthy, allow staged progression
      // Let user observe or advance next stages
    } catch (err) {
      logMessage(`Simulation error: ${err.message}`, 'critical');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAdvanceNextStage = async () => {
    if (!currentRelease) return;
    try {
      setIsSimulating(true);
      logMessage(`Advancing to next progressive stage...`);
      const step = await startRollout(currentRelease._id);
      setCurrentRelease(step.data);

      if (step.halted) {
        logMessage(`🚨 HEALTH BREACH: ${step.data.failingRuleExplanation}`, 'critical');
      } else if (step.data.status === 'Completed') {
        logMessage(`🎉 Rollout reached 100% safely and was promoted to stable!`, 'success');
      } else {
        logMessage(`✅ Stage advanced to ${step.data.rolloutPercentage}% healthy.`, 'success');
      }
    } catch (err) {
      logMessage(`Failed to advance stage: ${err.message}`, 'critical');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRollbackConfirm = async (reason) => {
    if (!currentRelease) return;
    try {
      setIsSimulating(true);
      logMessage(`Executing simulated rollback...`);
      const res = await rollbackRelease(currentRelease._id, reason);
      setCurrentRelease(res.data);
      setIsRollbackOpen(false);
      logMessage(`🔄 Rollback completed! Simulated traffic 100% restored to ${currentRelease.previousStableVersion}.`, 'success');
    } catch (err) {
      logMessage(`Rollback failed: ${err.message}`, 'critical');
    } finally {
      setIsSimulating(false);
    }
  };

  const latestSnapshot = currentRelease?.latestSnapshot || currentRelease?.latestMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Release Simulation Lab</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
              Interactive Testbed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test automated detection, threshold evaluation, and rollback sequences against 6 reproducible release scenarios.
          </p>
        </div>
      </div>

      {/* Scenario Selector Grid */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          1. Select Release Scenario
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {scenarioList.map((sc) => {
            const Icon = sc.icon;
            const isSelected = selectedScenario === sc.id;

            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`p-4 rounded-xl border cursor-pointer transition relative ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg border shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-slate-900">{sc.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{sc.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration & Launch Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          2. Target Application & Version Parameters
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">Application Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">Baseline Stable Version</label>
            <input
              type="text"
              value={previousVersion}
              onChange={(e) => setPreviousVersion(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">Candidate Release Version</label>
            <input
              type="text"
              value={candidateVersion}
              onChange={(e) => setCandidateVersion(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Selected scenario:{' '}
            <span className="font-semibold text-slate-800 capitalize">
              {selectedScenario.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunchSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentRelease ? 'Restart Simulation' : 'Launch Simulation Run'}</span>
            </button>

            {currentRelease && !['Completed', 'Rolled Back', 'Cancelled'].includes(currentRelease.status) && (
              <>
                {currentRelease.status === 'Degraded' ? (
                  <button
                    onClick={() => setIsRollbackOpen(true)}
                    disabled={isSimulating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Execute Rollback</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAdvanceNextStage}
                    disabled={isSimulating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Advance Next Stage</span>
                  </button>
                )}
              </>
            )}

            {currentRelease && (
              <button
                onClick={() => navigate(`/releases/${currentRelease._id}`)}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium hover:underline px-2 py-1"
              >
                Inspect Release Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Failure Banner if active run degraded */}
      {currentRelease && currentRelease.status === 'Degraded' && (
        <AlertBanner
          type="critical"
          title={`Health Rule Breached: Rollback Recommended`}
          message={currentRelease.failingRuleExplanation}
          actionText="Execute Rollback"
          onAction={() => setIsRollbackOpen(true)}
        />
      )}

      {/* Live Simulation Output and Comparison Table */}
      {currentRelease && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <MetricComparisonTable
            baseline={latestSnapshot?.baseline}
            candidate={latestSnapshot?.candidate}
            rolloutPercentage={currentRelease.rolloutPercentage}
          />

          {latestSnapshot && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ErrorRateChart
                baselineError={latestSnapshot.baseline?.errorRate || 1.2}
                candidateError={latestSnapshot.candidate?.errorRate || 0}
                threshold={currentRelease.thresholds?.maxErrorRatePercent || 5.0}
                warning={currentRelease.thresholds?.warningErrorRatePercent || 2.5}
              />
              <LatencyChart
                baselineP95={latestSnapshot.baseline?.p95ResponseTimeMs || 220}
                candidateP95={latestSnapshot.candidate?.p95ResponseTimeMs || 0}
                baselineAvg={latestSnapshot.baseline?.avgResponseTimeMs || 110}
                candidateAvg={latestSnapshot.candidate?.avgResponseTimeMs || 0}
                threshold={currentRelease.thresholds?.maxP95LatencyMs || 1000}
              />
            </div>
          )}
        </div>
      )}

      {/* Live Simulation Execution Logs */}
      {simLogs.length > 0 && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Simulation Live Feed</span>
            <span className="text-[10px]">{simLogs.length} events logged</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
            {simLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span
                  className={
                    log.type === 'critical'
                      ? 'text-rose-400 font-semibold'
                      : log.type === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-200'
                  }
                >
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rollback confirmation modal */}
      <RollbackModal
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
        release={currentRelease}
        onConfirm={handleRollbackConfirm}
        isSubmitting={isSimulating}
      />
    </div>
  );
}
