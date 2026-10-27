import React from 'react';
import { CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatNumber, formatPercentage, formatLatency } from '../utils/formatters';

export default function MetricComparisonTable({ baseline, candidate, rolloutPercentage = 5 }) {
  if (!baseline || !candidate) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
        No metric comparison available. Advance rollout stage or start release simulation to collect metrics.
      </div>
    );
  }

  const errorRateDiff = candidate.errorRate - baseline.errorRate;
  const p95Diff = candidate.p95ResponseTimeMs - baseline.p95ResponseTimeMs;
  const avgDiff = candidate.avgResponseTimeMs - baseline.avgResponseTimeMs;

  const rows = [
    {
      metric: 'Traffic Allocation',
      baselineVal: `${100 - rolloutPercentage}%`,
      candidateVal: `${rolloutPercentage}%`,
      delta: null,
      description: 'Percentage of incoming user requests routed to this version'
    },
    {
      metric: 'Request Sample Size',
      baselineVal: formatNumber(baseline.requestCount),
      candidateVal: formatNumber(candidate.requestCount),
      delta: null,
      description: 'Simulated request count in the active monitoring window'
    },
    {
      metric: 'Successful Requests',
      baselineVal: formatNumber(baseline.successfulRequests),
      candidateVal: formatNumber(candidate.successfulRequests),
      delta: null,
      description: 'HTTP 2xx & 3xx status responses'
    },
    {
      metric: 'Failed Requests',
      baselineVal: formatNumber(baseline.failedRequests),
      candidateVal: formatNumber(candidate.failedRequests),
      delta: candidate.failedRequests - baseline.failedRequests,
      isHigherBad: true,
      description: 'HTTP 4xx & 5xx responses'
    },
    {
      metric: 'Error Rate',
      baselineVal: formatPercentage(baseline.errorRate),
      candidateVal: formatPercentage(candidate.errorRate),
      delta: errorRateDiff,
      formatDelta: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`,
      isHigherBad: true,
      description: 'Calculated as: (Failed Requests ÷ Total Requests) × 100'
    },
    {
      metric: 'Average Response Time',
      baselineVal: formatLatency(baseline.avgResponseTimeMs),
      candidateVal: formatLatency(candidate.avgResponseTimeMs),
      delta: avgDiff,
      formatDelta: (v) => `${v > 0 ? '+' : ''}${Math.round(v)} ms`,
      isHigherBad: true,
      description: 'Mean latency across all sampled responses'
    },
    {
      metric: 'p95 Response Time',
      baselineVal: formatLatency(baseline.p95ResponseTimeMs),
      candidateVal: formatLatency(candidate.p95ResponseTimeMs),
      delta: p95Diff,
      formatDelta: (v) => `${v > 0 ? '+' : ''}${Math.round(v)} ms`,
      isHigherBad: true,
      description: '95th percentile latency (critical threshold target)'
    },
    {
      metric: 'Health Check Endpoint',
      baselineVal: (
        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          HTTP {baseline.healthCheckStatusCode || 200} Passing
        </span>
      ),
      candidateVal: (
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            candidate.healthCheckStatus === 'PASSING' ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {candidate.healthCheckStatus === 'PASSING' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600" />
          )}
          HTTP {candidate.healthCheckStatusCode || (candidate.healthCheckStatus === 'PASSING' ? 200 : 503)}{' '}
          {candidate.healthCheckStatus === 'PASSING' ? 'Passing' : 'Failing'}
        </span>
      ),
      delta: null,
      description: 'Automated synthetic probe to candidate /healthz endpoint'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Baseline vs Candidate Comparison</h3>
          <p className="text-xs text-slate-500">
            Comparing stable baseline (<span className="font-mono text-slate-700">{baseline.version}</span>) against
            release candidate (<span className="font-mono text-slate-700">{candidate.version}</span>)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Simulated Traffic Window
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-5">Metric</th>
              <th className="py-3 px-5">Baseline ({baseline.version})</th>
              <th className="py-3 px-5">Candidate ({candidate.version})</th>
              <th className="py-3 px-5 text-right">Delta / Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const hasDelta = row.delta !== null && row.delta !== undefined;
              const isBad = row.isHigherBad && row.delta > 0;
              const isGood = row.isHigherBad && row.delta < 0;

              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-slate-900">{row.metric}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{row.description}</div>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-700">{row.baselineVal}</td>
                  <td className="py-3.5 px-5 font-mono font-medium text-slate-900">{row.candidateVal}</td>
                  <td className="py-3.5 px-5 text-right">
                    {hasDelta ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-medium text-xs ${
                          isBad
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isGood
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isBad ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                        ) : isGood ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {row.formatDelta ? row.formatDelta(row.delta) : row.delta}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
