import React, { useState } from 'react';
import { X, Rocket, Sparkles } from 'lucide-react';
import { SCENARIO_DESCRIPTIONS } from '../utils/statusStyles';

export default function CreateReleaseModal({ isOpen, onClose, onCreated }) {
  const [appName, setAppName] = useState('checkout-service');
  const [previousStableVersion, setPreviousStableVersion] = useState('v2.4.0');
  const [candidateVersion, setCandidateVersion] = useState('v2.5.0');
  const [scenario, setScenario] = useState('healthy');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onCreated({
        appName,
        previousStableVersion,
        candidateVersion,
        version: candidateVersion,
        scenario,
        description
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create release');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Create New Software Release</h3>
              <p className="text-xs text-slate-500">Configure deployment parameters and simulation profile</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Application Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. checkout-service"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Previous Stable Version
              </label>
              <input
                type="text"
                value={previousStableVersion}
                onChange={(e) => setPreviousStableVersion(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g. v2.4.0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Candidate Version
              </label>
              <input
                type="text"
                value={candidateVersion}
                onChange={(e) => setCandidateVersion(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g. v2.5.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Simulation Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {Object.entries(SCENARIO_DESCRIPTIONS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.title}
                </option>
              ))}
            </select>
            {SCENARIO_DESCRIPTIONS[scenario] && (
              <p className="mt-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-medium text-slate-700">Profile:</span> {SCENARIO_DESCRIPTIONS[scenario].description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Release Notes / Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. Database index optimization and updated caching layers..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? 'Creating...' : 'Create Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
