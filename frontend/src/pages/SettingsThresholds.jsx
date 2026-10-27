import React, { useEffect, useState } from 'react';
import { Sliders, Save, RotateCcw, CheckCircle2, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { getSettings, updateThresholds, resetThresholds } from '../services/settingsApi';

export default function SettingsThresholds() {
  const [thresholds, setThresholds] = useState({
    maxErrorRatePercent: 5.0,
    warningErrorRatePercent: 2.5,
    maxP95LatencyMs: 1000,
    warningP95LatencyMs: 500,
    maxAvgLatencyMs: 400,
    maxConsecutiveHealthCheckFailures: 1,
    minRequestsForEvaluation: 30
  });
  const [defaults, setDefaults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSettings();
      setThresholds(res.data.thresholds);
      setDefaults(res.data.defaults);
    } catch (err) {
      setError(err.message || 'Failed to load health thresholds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setThresholds((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);

    try {
      const res = await updateThresholds(thresholds);
      setMessage('Thresholds successfully saved and applied to upcoming releases.');
    } catch (err) {
      setError(err.message || 'Failed to update thresholds');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all threshold values to factory defaults?')) return;
    try {
      setSaving(true);
      const res = await resetThresholds();
      setThresholds(res.data);
      setMessage('Thresholds reset to factory defaults.');
    } catch (err) {
      setError(err.message || 'Failed to reset thresholds');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !defaults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Health Thresholds & Safety Rules</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            Configurable
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Define automated safety gates. If a release breaches critical thresholds, RolloutGuard halts the rollout and recommends rollback.
        </p>
      </div>

      {/* Alert Notices */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">API Error Rate Gates</h3>
          <p className="text-xs text-slate-500 mb-4">
            Percentage of failed HTTP requests out of total traffic: <code className="font-mono">(Failed ÷ Total) × 100</code>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Critical Error Rate Ceiling (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={thresholds.maxErrorRatePercent}
                onChange={(e) => handleChange('maxErrorRatePercent', e.target.value)}
                required
                className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default: 5.0%. Exceeding this halts progressive rollout immediately.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Warning Error Rate Threshold (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={thresholds.warningErrorRatePercent}
                onChange={(e) => handleChange('warningErrorRatePercent', e.target.value)}
                required
                className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default: 2.5%. Triggers a Warning badge and pause recommendation.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Response Time (Latency) Gates</h3>
          <p className="text-xs text-slate-500 mb-4">
            Tail latency thresholds to protect against regressions in candidate code performance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Critical p95 Latency (ms)
              </label>
              <input
                type="number"
                step="10"
                min="10"
                value={thresholds.maxP95LatencyMs}
                onChange={(e) => handleChange('maxP95LatencyMs', e.target.value)}
                required
                className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 1,000 ms</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Warning p95 Latency (ms)
              </label>
              <input
                type="number"
                step="10"
                min="10"
                value={thresholds.warningP95LatencyMs}
                onChange={(e) => handleChange('warningP95LatencyMs', e.target.value)}
                required
                className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 500 ms</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Average Latency (ms)
              </label>
              <input
                type="number"
                step="10"
                min="10"
                value={thresholds.maxAvgLatencyMs}
                onChange={(e) => handleChange('maxAvgLatencyMs', e.target.value)}
                required
                className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 400 ms</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Health Probing & Sample Constraints</h3>
          <p className="text-xs text-slate-500 mb-4">
            Probe failure tolerance and minimum sample sizes to prevent false positives on cold-start traffic.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consecutive Health Probe Failures Allowed
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={thresholds.maxConsecutiveHealthCheckFailures}
                onChange={(e) => handleChange('maxConsecutiveHealthCheckFailures', e.target.value)}
                required
                className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 1 failure triggers halt</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Min Requests Required for Rate Rules
              </label>
              <input
                type="number"
                min="1"
                value={thresholds.minRequestsForEvaluation}
                onChange={(e) => handleChange('minRequestsForEvaluation', e.target.value)}
                required
                className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 30 requests</span>
            </div>
          </div>
        </div>

        {/* Documentation Note */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-800">Threshold Disclaimer:</span> These factory values serve as sensible baseline defaults. Production services should fine-tune these numbers based on historical SLAs, API error budgets, and service dependencies.
          </p>
        </div>

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Health Thresholds'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
