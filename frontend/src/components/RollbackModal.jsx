import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, X, ShieldAlert } from 'lucide-react';

export default function RollbackModal({ isOpen, onClose, release, onConfirm, isSubmitting = false }) {
  const [reason, setReason] = useState(
    release?.failingRuleExplanation
      ? `Automated health check failure: ${release.failingRuleExplanation}`
      : 'Operator initiated rollback due to metric degradation'
  );

  if (!isOpen || !release) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-4">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-rose-950">Confirm Simulated Rollback</h3>
            <p className="text-xs text-rose-800 mt-1">
              Roll back candidate <span className="font-mono font-semibold">{release.candidateVersion}</span> to previous stable release{' '}
              <span className="font-mono font-semibold">{release.previousStableVersion}</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-rose-400 hover:text-rose-700 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {release.failingRuleExplanation && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
              <span className="font-semibold text-rose-700 block mb-1">Triggering Health Violation:</span>
              <p className="font-mono text-slate-800">{release.failingRuleExplanation}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Rollback Audit Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-sans"
              placeholder="State rationale for initiating rollback..."
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="font-semibold text-amber-800">Simulated Scope:</span> This action updates the simulation
            state, routes 100% of simulated traffic to stable version ({release.previousStableVersion}), and generates
            recovery metrics in MongoDB. It does not alter actual cloud production infrastructure.
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
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? 'Executing Rollback...' : 'Execute Rollback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
